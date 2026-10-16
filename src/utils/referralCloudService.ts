/**
 * Real-Time Decentralized Cross-Device Referral & 10% Commission Engine
 * Backed by Cloud Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { RealReferral } from '../types/airdrop.ts';

// Extract referral code from Telegram WebApp initData or URL
export function extractReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check window.Telegram.WebApp.initDataUnsafe
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.initDataUnsafe?.start_param) {
      const rawParam = String(tgWebApp.initDataUnsafe.start_param).trim();
      return rawParam.replace(/^ref_/, '');
    }

    // 2. Check URL search params
    const urlParams = new URLSearchParams(window.location.search);
    const startParam =
      urlParams.get('startapp') ||
      urlParams.get('start_param') ||
      urlParams.get('tgWebAppStartParam') ||
      urlParams.get('ref');

    if (startParam) {
      return startParam.trim().replace(/^ref_/, '');
    }

    // 3. Check URL hash (often Telegram passes data in hash #tgWebAppData=...)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashStart = hashParams.get('tgWebAppStartParam') || hashParams.get('startapp');
      if (hashStart) {
        return hashStart.trim().replace(/^ref_/, '');
      }
    }
  } catch (err) {
    console.warn('Error reading start_param:', err);
  }

  return null;
}

/**
 * Register or update the current user in Firestore and link to referrer
 */
export async function syncUserWithCloud(
  userId: string,
  userName: string,
  telegramUsername: string,
  walletAddress: string | null,
  currentBalance: number
): Promise<{ referrerId: string | null }> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    // Detected referral code from invite link
    const detectedReferrer = extractReferralCode();
    let finalReferrer: string | null = null;

    if (!userSnap.exists()) {
      // First time user registered
      if (detectedReferrer && detectedReferrer !== userId) {
        finalReferrer = detectedReferrer;
      }

      await setDoc(userRef, {
        userId,
        name: userName || 'Mimi Artist',
        telegramUsername: telegramUsername || '@mimi_user',
        walletAddress: walletAddress || null,
        referrerId: finalReferrer,
        bonusClaimed: false,
        balance: currentBalance || 0,
        commissionEarned: 0,
        recruitsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // If referred, create pending referral record in /referrals
      if (finalReferrer) {
        const refDocId = `${finalReferrer}_${userId}`;
        await setDoc(doc(db, 'referrals', refDocId), {
          id: refDocId,
          referrerId: finalReferrer,
          referredUserId: userId,
          referredName: userName || 'Mimi Artist',
          referredUsername: telegramUsername || '@mimi_user',
          referredWallet: walletAddress || null,
          bonusEarned: 0,
          commissionEarned: 0,
          status: walletAddress ? 'qualified' : 'pending',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      const data = userSnap.data();
      finalReferrer = data.referrerId || null;

      // Update existing record if new info is available
      const updates: Record<string, any> = {
        name: userName || data.name,
        telegramUsername: telegramUsername || data.telegramUsername,
        updatedAt: new Date().toISOString(),
      };

      if (!data.referrerId && detectedReferrer && detectedReferrer !== userId) {
        updates.referrerId = detectedReferrer;
        finalReferrer = detectedReferrer;
      }

      await updateDoc(userRef, updates);
    }

    return { referrerId: finalReferrer };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    return { referrerId: null };
  }
}

/**
 * Triggers when a user connects their Tonkeeper or Telegram Wallet
 * Qualifies the referral and credits +100 $MIMI directly to Referrer!
 */
export async function handleCloudWalletConnect(
  userId: string,
  walletAddress: string,
  walletProvider: string = 'Tonkeeper'
): Promise<{ bonusAwarded: boolean; referrerId?: string }> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return { bonusAwarded: false };
    const userData = userSnap.data();
    const referrerId = userData.referrerId;
    const bonusAlreadyClaimed = Boolean(userData.bonusClaimed);

    // Save wallet to user document
    await updateDoc(userRef, {
      walletAddress,
      walletProvider,
      updatedAt: new Date().toISOString(),
    });

    // If user has a valid referrer and bonus was never claimed yet:
    if (referrerId && referrerId !== userId && !bonusAlreadyClaimed) {
      // 1. Award +100 $MIMI to the Referrer
      const referrerRef = doc(db, 'users', referrerId);
      const referrerSnap = await getDoc(referrerRef);

      if (referrerSnap.exists()) {
        await updateDoc(referrerRef, {
          balance: increment(100),
          recruitsCount: increment(1),
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Mark Referral as QUALIFIED with 100 $MIMI bonus
      const refDocId = `${referrerId}_${userId}`;
      await setDoc(
        doc(db, 'referrals', refDocId),
        {
          id: refDocId,
          referrerId,
          referredUserId: userId,
          referredName: userData.name || 'Mimi Artist',
          referredUsername: userData.telegramUsername || '@mimi_user',
          referredWallet: walletAddress,
          bonusEarned: 100,
          status: 'qualified',
          qualifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 3. Mark current user's bonus as claimed
      await updateDoc(userRef, {
        bonusClaimed: true,
      });

      console.log(`✅ [REFERRAL SUCCESS] Awarded 100 $MIMI to Referrer: ${referrerId} for Wallet: ${walletAddress}`);
      return { bonusAwarded: true, referrerId };
    }

    return { bonusAwarded: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    return { bonusAwarded: false };
  }
}

/**
 * 10% LIFETIME REFERRAL COMMISSION ENGINE
 * Whenever a recruit earns tokens (Mining, Daily, Quests),
 * 10% is calculated and credited to their Referrer in real-time!
 */
export async function creditReferralCommission(
  recruitUserId: string,
  earnedAmount: number,
  activityType: 'Mining Loop' | 'Quests' | 'Daily Bonus' | 'Arcade' | 'Adsgram' | 'Ecosystem Earnings' | string = 'Mining Loop'
): Promise<number> {
  if (earnedAmount <= 0) return 0;

  try {
    const recruitRef = doc(db, 'users', recruitUserId);
    const recruitSnap = await getDoc(recruitRef);
    if (!recruitSnap.exists()) return 0;

    const recruitData = recruitSnap.data();
    const referrerId = recruitData.referrerId;

    if (!referrerId || referrerId === recruitUserId) return 0;

    // Calculate exact 10% commission
    const commission = Number((earnedAmount * 0.10).toFixed(2));
    if (commission <= 0) return 0;

    // 1. Credit 10% to the Referrer's account
    const referrerRef = doc(db, 'users', referrerId);
    await updateDoc(referrerRef, {
      balance: increment(commission),
      commissionEarned: increment(commission),
      updatedAt: new Date().toISOString(),
    });

    // 2. Update the referral document
    const refDocId = `${referrerId}_${recruitUserId}`;
    await updateDoc(doc(db, 'referrals', refDocId), {
      commissionEarned: increment(commission),
      updatedAt: new Date().toISOString(),
    });

    // 3. Log commission history
    const commissionLogId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await setDoc(doc(db, 'commissions', commissionLogId), {
      id: commissionLogId,
      referrerId,
      fromUserId: recruitUserId,
      activity: activityType,
      recruitEarned: earnedAmount,
      commissionAmount: commission,
      createdAt: new Date().toISOString(),
    });

    console.log(`💰 [10% COMMISSION] Credited ${commission} $MIMI to Referrer: ${referrerId} from Recruit: ${recruitUserId}`);
    return commission;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `commissions`);
    return 0;
  }
}

/**
 * Real-time listener for a user's active recruits and referral commissions
 */
export function listenToUserReferrals(
  userId: string,
  callback: (referrals: RealReferral[], totalCommission: number) => void
) {
  try {
    const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        let totalComm = 0;
        const list: RealReferral[] = [];

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          totalComm += Number(d.commissionEarned || 0);

          list.push({
            id: d.id,
            userId: d.referredUserId,
            name: d.referredName || 'Mimi Producer',
            username: d.referredUsername || '@mimi_user',
            joinedTimestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
            level: 1,
            bonusEarned: Number(d.bonusEarned || 0),
            commissionEarned: Number(d.commissionEarned || 0),
            status: d.status || (d.bonusEarned > 0 ? 'qualified' : 'pending'),
            isQualified: Boolean(d.status === 'qualified' || d.bonusEarned > 0),
          });
        });

        callback(list, Number(totalComm.toFixed(2)));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'referrals');
      }
    );
  } catch (err) {
    console.warn('Could not establish referral listener:', err);
    return () => {};
  }
}

/**
 * Real-time listener for current user's profile updates from Firestore
 */
export function listenToUserProfile(
  userId: string,
  callback: (data: { balance?: number; recruitsCount?: number; commissionEarned?: number }) => void
) {
  try {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            balance: data.balance,
            recruitsCount: data.recruitsCount,
            commissionEarned: data.commissionEarned,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      }
    );
  } catch (err) {
    console.warn('Could not establish user profile listener:', err);
    return () => {};
  }
}
