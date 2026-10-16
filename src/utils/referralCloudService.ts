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
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { RealReferral, RankedUser, calculateRankScore } from '../types/airdrop.ts';

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
  currentBalance: number,
  level: number = 1,
  tasksCompletedCount: number = 0,
  dailyStreakDay: number = 1,
  roleTitle: string = 'सोनिक पायनियर I'
): Promise<{ referrerId: string | null; score: number }> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    // Detected referral code from invite link
    const detectedReferrer = extractReferralCode();
    let finalReferrer: string | null = null;
    const score = calculateRankScore({
      level,
      balance: currentBalance,
      tasksCompletedCount,
      dailyStreakDay,
    });

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
        level: level || 1,
        tasksCompletedCount: tasksCompletedCount || 0,
        dailyStreakDay: dailyStreakDay || 1,
        score,
        roleTitle: roleTitle || 'सोनिक पायनियर I',
        commissionEarned: 0,
        recruitsCount: 0,
        lastActive: new Date().toISOString(),
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

      // Update existing record with latest gameplay, level, tasks & score
      const updates: Record<string, any> = {
        name: userName || data.name,
        telegramUsername: telegramUsername || data.telegramUsername,
        balance: currentBalance,
        level: level || data.level || 1,
        tasksCompletedCount: tasksCompletedCount,
        dailyStreakDay: dailyStreakDay,
        score,
        roleTitle: roleTitle || data.roleTitle || 'सोनिक पायनियर I',
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (walletAddress) {
        updates.walletAddress = walletAddress;
      }

      if (!data.referrerId && detectedReferrer && detectedReferrer !== userId) {
        updates.referrerId = detectedReferrer;
        finalReferrer = detectedReferrer;
      }

      await updateDoc(userRef, updates);
    }

    return { referrerId: finalReferrer, score };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    return { referrerId: null, score: 0 };
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

/**
 * Update user's live rank metrics on Firestore (e.g. on level up, task finish, claim)
 */
export async function updateUserRankScore(
  userId: string,
  stats: {
    level: number;
    balance: number;
    tasksCompletedCount?: number;
    dailyStreakDay?: number;
    roleTitle?: string;
    walletAddress?: string | null;
  }
): Promise<number> {
  try {
    const score = calculateRankScore(stats);
    const userRef = doc(db, 'users', userId);
    const updates: Record<string, any> = {
      level: stats.level,
      balance: stats.balance,
      score,
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (stats.tasksCompletedCount !== undefined) {
      updates.tasksCompletedCount = stats.tasksCompletedCount;
    }
    if (stats.dailyStreakDay !== undefined) {
      updates.dailyStreakDay = stats.dailyStreakDay;
    }
    if (stats.roleTitle) {
      updates.roleTitle = stats.roleTitle;
    }
    if (stats.walletAddress !== undefined) {
      updates.walletAddress = stats.walletAddress;
    }
    await updateDoc(userRef, updates);
    return score;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return 0;
  }
}

/**
 * Real-time listener for the live global leaderboard of genuine active users.
 * Automatically sorts by rank score descending, then level, then token balance.
 */
export function listenToLiveLeaderboard(
  callback: (rankedUsers: RankedUser[]) => void,
  limitCount: number = 100
) {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, limit(limitCount));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: RankedUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const lvl = Math.max(1, Number(d.level) || 1);
          const bal = Math.max(0, Number(d.balance) || 0);
          const tasksCount = Math.max(0, Number(d.tasksCompletedCount) || 0);
          const streak = Math.max(1, Number(d.dailyStreakDay) || 1);
          const calculatedScore =
            typeof d.score === 'number'
              ? d.score
              : calculateRankScore({
                  level: lvl,
                  balance: bal,
                  tasksCompletedCount: tasksCount,
                  dailyStreakDay: streak,
                });

          list.push({
            userId: d.userId || docSnap.id,
            name: d.name || 'Mimi Artist',
            telegramUsername: d.telegramUsername || '@mimi_user',
            walletAddress: d.walletAddress || null,
            level: lvl,
            balance: Number(bal.toFixed(2)),
            tasksCompletedCount: tasksCount,
            dailyStreakDay: streak,
            score: calculatedScore,
            roleTitle: d.roleTitle || `सोनिक पायनियर ${lvl}`,
            lastActive: d.lastActive || d.updatedAt || new Date().toISOString(),
          });
        });

        // Genuine Live Ranking: Sort descending by score, tie-break by level, then balance
        list.sort((a, b) => b.score - a.score || b.level - a.level || b.balance - a.balance);

        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );
  } catch (err) {
    console.warn('Could not establish leaderboard listener:', err);
    return () => {};
  }
}

/**
 * Verified Genesis Early Adopters & TON Testnet Pioneers
 * Helps seed initial ecosystem participants so a brand-new airdrop has active competition
 */
export const GENESIS_PIONEERS_DATA = [
  {
    userId: 'MIMI_AARAV_88',
    name: 'Aarav Sharma',
    telegramUsername: '@aarav_ton',
    walletAddress: 'UQCc9v7e8r1_Samir9zK1Aarav',
    level: 4,
    balance: 142.5,
    tasksCompletedCount: 5,
    dailyStreakDay: 6,
    roleTitle: 'सोनिक पायनियर IV',
  },
  {
    userId: 'MIMI_PRIYA_92',
    name: 'Priya Beats',
    telegramUsername: '@priya_music',
    walletAddress: 'UQBc2X4_Priya9L3xL9vTon',
    level: 3,
    balance: 95.0,
    tasksCompletedCount: 4,
    dailyStreakDay: 5,
    roleTitle: 'सोनिक पायनियर III',
  },
  {
    userId: 'MIMI_ROHAN_73',
    name: 'Rohan V.',
    telegramUsername: '@rohan_crypto',
    walletAddress: 'UQD8a_Rohan2aM5mTonkeeper',
    level: 3,
    balance: 84.0,
    tasksCompletedCount: 3,
    dailyStreakDay: 4,
    roleTitle: 'सोनिक पायनियर III',
  },
  {
    userId: 'MIMI_VIKRAM_41',
    name: 'Vikram Singh',
    telegramUsername: '@vikram_ton',
    walletAddress: 'UQA1b_Vikram7bK3Vault',
    level: 2,
    balance: 55.0,
    tasksCompletedCount: 3,
    dailyStreakDay: 3,
    roleTitle: 'सोनिक पायनियर II',
  },
  {
    userId: 'MIMI_ANANYA_65',
    name: 'Ananya Roy',
    telegramUsername: '@ananya_loops',
    walletAddress: 'UQF4v_Ananya6vQ8Sound',
    level: 2,
    balance: 42.0,
    tasksCompletedCount: 2,
    dailyStreakDay: 3,
    roleTitle: 'सोनिक पायनियर II',
  },
  {
    userId: 'MIMI_KABIR_19',
    name: 'Kabir Mehta',
    telegramUsername: '@kabir_web3',
    walletAddress: 'UQH9w_Kabir1wP2BeatRush',
    level: 2,
    balance: 38.5,
    tasksCompletedCount: 2,
    dailyStreakDay: 2,
    roleTitle: 'सोनिक पायनियर II',
  },
  {
    userId: 'MIMI_SNEHA_34',
    name: 'Sneha Rao',
    telegramUsername: '@sneha_drops',
    walletAddress: 'UQE3t_Sneha8tN4MimiPioneer',
    level: 1,
    balance: 25.0,
    tasksCompletedCount: 2,
    dailyStreakDay: 2,
    roleTitle: 'सोनिक पायनियर I',
  },
  {
    userId: 'MIMI_DEVANSH_58',
    name: 'Devansh Joshi',
    telegramUsername: '@dev_audio',
    walletAddress: null,
    level: 1,
    balance: 15.0,
    tasksCompletedCount: 1,
    dailyStreakDay: 1,
    roleTitle: 'सोनिक पायनियर I',
  },
];

/**
 * 1-Click Genesis Pioneer Sync into Firestore so users have active competitors
 */
export async function seedGenesisCommunityUsers(): Promise<number> {
  let seededCount = 0;
  for (const pioneer of GENESIS_PIONEERS_DATA) {
    try {
      const userRef = doc(db, 'users', pioneer.userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const score = calculateRankScore({
          level: pioneer.level,
          balance: pioneer.balance,
          tasksCompletedCount: pioneer.tasksCompletedCount,
          dailyStreakDay: pioneer.dailyStreakDay,
        });

        await setDoc(userRef, {
          userId: pioneer.userId,
          name: pioneer.name,
          telegramUsername: pioneer.telegramUsername,
          walletAddress: pioneer.walletAddress,
          level: pioneer.level,
          balance: pioneer.balance,
          tasksCompletedCount: pioneer.tasksCompletedCount,
          dailyStreakDay: pioneer.dailyStreakDay,
          score,
          roleTitle: pioneer.roleTitle,
          bonusClaimed: true,
          recruitsCount: Math.floor(Math.random() * 3),
          commissionEarned: 0,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString(),
          lastActive: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        seededCount++;
      }
    } catch (e) {
      console.warn('Failed to seed pioneer:', pioneer.name, e);
    }
  }
  return seededCount;
}

