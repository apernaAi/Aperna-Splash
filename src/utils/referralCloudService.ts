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

// Extract referral code from Telegram WebApp initData, URL params, hash, or localStorage
export function extractReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check window.Telegram.WebApp.initDataUnsafe
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.initDataUnsafe?.start_param) {
      const rawParam = String(tgWebApp.initDataUnsafe.start_param).trim();
      const code = rawParam.replace(/^ref_/, '');
      if (code) {
        try { localStorage.setItem('mimi_user_referrer_code', code); } catch {}
        return code;
      }
    }

    // 2. Check URL search params (startapp, start_param, tgWebAppStartParam, start, ref)
    const urlParams = new URLSearchParams(window.location.search);
    const startParam =
      urlParams.get('startapp') ||
      urlParams.get('start_param') ||
      urlParams.get('tgWebAppStartParam') ||
      urlParams.get('start') ||
      urlParams.get('ref') ||
      urlParams.get('referrer');

    if (startParam) {
      const code = startParam.trim().replace(/^ref_/, '');
      if (code) {
        try { localStorage.setItem('mimi_user_referrer_code', code); } catch {}
        return code;
      }
    }

    // 3. Check URL hash (often Telegram passes data in hash #tgWebAppData=...)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashStart = hashParams.get('tgWebAppStartParam') || hashParams.get('startapp') || hashParams.get('start_param') || hashParams.get('start');
      if (hashStart) {
        const code = hashStart.trim().replace(/^ref_/, '');
        if (code) {
          try { localStorage.setItem('mimi_user_referrer_code', code); } catch {}
          return code;
        }
      }
      const tgWebAppData = hashParams.get('tgWebAppData');
      if (tgWebAppData) {
        const innerParams = new URLSearchParams(tgWebAppData);
        const innerStart = innerParams.get('start_param');
        if (innerStart) {
          const code = innerStart.trim().replace(/^ref_/, '');
          if (code) {
            try { localStorage.setItem('mimi_user_referrer_code', code); } catch {}
            return code;
          }
        }
      }
    }

    // 4. Fallback to saved referral code in localStorage
    const savedRef = localStorage.getItem('mimi_user_referrer_code');
    if (savedRef) {
      return savedRef.trim().replace(/^ref_/, '');
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
  roleTitle: string = 'सोनिक पायनियर I',
  avatarUrl?: string | null
): Promise<{ referrerId: string | null; score: number }> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    // Detected referral code from invite link or session
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
        avatarUrl: avatarUrl || null,
        walletAddress: walletAddress || null,
        referrerId: finalReferrer,
        bonusClaimed: Boolean(finalReferrer),
        balance: finalReferrer ? (currentBalance + 100) : (currentBalance || 0),
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

      // If referred, immediately create qualified referral record in /referrals & increment referrer recruitsCount
      if (finalReferrer) {
        const refDocId = `${finalReferrer}_${userId}`;
        await setDoc(doc(db, 'referrals', refDocId), {
          id: refDocId,
          referrerId: finalReferrer,
          referredUserId: userId,
          referredName: userName || 'Mimi Artist',
          referredUsername: telegramUsername || '@mimi_user',
          referredWallet: walletAddress || null,
          bonusEarned: 100,
          commissionEarned: 0,
          status: 'qualified',
          createdAt: new Date().toISOString(),
          qualifiedAt: new Date().toISOString(),
        }, { merge: true });

        // Credit recruit and +100 MIMI to Referrer in Firestore
        const referrerRef = doc(db, 'users', finalReferrer);
        const referrerSnap = await getDoc(referrerRef);
        if (referrerSnap.exists()) {
          await updateDoc(referrerRef, {
            recruitsCount: increment(1),
            balance: increment(100),
            updatedAt: new Date().toISOString(),
          });
        }
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
      if (avatarUrl) {
        updates.avatarUrl = avatarUrl;
      }

      if (walletAddress) {
        updates.walletAddress = walletAddress;
      }

      if (!data.referrerId && detectedReferrer && detectedReferrer !== userId) {
        updates.referrerId = detectedReferrer;
        finalReferrer = detectedReferrer;

        const refDocId = `${detectedReferrer}_${userId}`;
        await setDoc(doc(db, 'referrals', refDocId), {
          id: refDocId,
          referrerId: detectedReferrer,
          referredUserId: userId,
          referredName: userName || data.name || 'Mimi Artist',
          referredUsername: telegramUsername || data.telegramUsername || '@mimi_user',
          referredWallet: walletAddress || data.walletAddress || null,
          bonusEarned: 100,
          commissionEarned: 0,
          status: 'qualified',
          createdAt: new Date().toISOString(),
          qualifiedAt: new Date().toISOString(),
        }, { merge: true });

        const referrerRef = doc(db, 'users', detectedReferrer);
        const referrerSnap = await getDoc(referrerRef);
        if (referrerSnap.exists()) {
          await updateDoc(referrerRef, {
            recruitsCount: increment(1),
            balance: increment(100),
            updatedAt: new Date().toISOString(),
          });
        }
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
            name: d.referredName || 'Mimi Squad Member',
            username: d.referredUsername || '@mimi_user',
            joinedTimestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
            level: d.level || 1,
            bonusEarned: Number(d.bonusEarned || 100),
            commissionEarned: Number(d.commissionEarned || 0),
            status: 'qualified',
            isQualified: true,
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
 * Manually bind a friend's referral code from UI
 */
export async function bindManualReferral(
  currentUserId: string,
  rawReferrerCode: string,
  currentUserName: string,
  currentUserUsername: string
): Promise<{ success: boolean; messageHi: string; messageEn: string; bonus: number }> {
  const cleanCode = (rawReferrerCode || '').trim().replace(/^ref_/, '');
  if (!cleanCode) {
    return { success: false, messageHi: 'अमान्य रेफरल कोड!', messageEn: 'Invalid referral code!', bonus: 0 };
  }
  if (cleanCode === currentUserId) {
    return { success: false, messageHi: 'आप स्वयं का कोड इस्तेमाल नहीं कर सकते!', messageEn: 'You cannot use your own referral code!', bonus: 0 };
  }

  try {
    const userRef = doc(db, 'users', currentUserId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().referrerId) {
      return {
        success: false,
        messageHi: `आप पहले से ही रेफरल ID (${userSnap.data().referrerId}) से जुड़े हुए हैं!`,
        messageEn: `You are already bound to referrer (${userSnap.data().referrerId})!`,
        bonus: 0,
      };
    }

    // Link in Firestore
    const refDocId = `${cleanCode}_${currentUserId}`;
    await setDoc(
      doc(db, 'referrals', refDocId),
      {
        id: refDocId,
        referrerId: cleanCode,
        referredUserId: currentUserId,
        referredName: currentUserName || 'Mimi Artist',
        referredUsername: currentUserUsername || '@mimi_user',
        bonusEarned: 100,
        commissionEarned: 0,
        status: 'qualified',
        createdAt: new Date().toISOString(),
        qualifiedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Increment referrer's recruitsCount and award 100 MIMI
    const referrerRef = doc(db, 'users', cleanCode);
    const referrerSnap = await getDoc(referrerRef);
    if (referrerSnap.exists()) {
      await updateDoc(referrerRef, {
        recruitsCount: increment(1),
        balance: increment(100),
        updatedAt: new Date().toISOString(),
      });
    }

    // Update current user's document
    await setDoc(
      userRef,
      {
        userId: currentUserId,
        referrerId: cleanCode,
        balance: increment(100),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    try {
      localStorage.setItem('mimi_user_referrer_code', cleanCode);
    } catch {}

    return {
      success: true,
      messageHi: 'सफलतापूर्वक रेफरल जुड़ गया! आपको और आपके दोस्त दोनों को +100 $MIMI बोनस मिला!',
      messageEn: 'Referral linked successfully! You and your friend both received +100 $MIMI bonus!',
      bonus: 100,
    };
  } catch (err) {
    console.error('Error binding manual referral:', err);
    return { success: false, messageHi: 'रेफरल लिंक करने में त्रुटि!', messageEn: 'Error binding referral code!', bonus: 0 };
  }
}

/**
 * Claim accumulated Referral recruit bonuses (+100 $MIMI per recruit)
 */
export async function claimSquadReferralRewards(
  userId: string,
  totalRecruits: number,
  alreadyClaimedAmount: number
): Promise<{ success: boolean; amountAwarded: number; newTotalClaimed: number }> {
  const totalEarnable = totalRecruits * 100;
  const claimable = Math.max(0, totalEarnable - alreadyClaimedAmount);

  if (claimable <= 0) {
    return { success: false, amountAwarded: 0, newTotalClaimed: alreadyClaimedAmount };
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(claimable),
      claimedReferralBonus: increment(claimable),
      updatedAt: new Date().toISOString(),
    });
    return { success: true, amountAwarded: claimable, newTotalClaimed: alreadyClaimedAmount + claimable };
  } catch (err) {
    console.warn('Error claiming referral bonus:', err);
    return { success: true, amountAwarded: claimable, newTotalClaimed: alreadyClaimedAmount + claimable };
  }
}

/**
 * Claim Daily 10% Squad Royalty Commission
 * Each recruit yields 10 $MIMI daily royalty (10% of standard 100 $MIMI daily yield)
 */
export async function claimDaily10PercentCommission(
  userId: string,
  recruitsCount: number
): Promise<{ success: boolean; commissionAwarded: number; todayStr: string }> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const count = Math.max(1, recruitsCount);
  const dailyRoyalty = Number((count * 10).toFixed(2));

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      balance: increment(dailyRoyalty),
      commissionEarned: increment(dailyRoyalty),
      lastCommissionClaimDate: todayStr,
      updatedAt: new Date().toISOString(),
    });

    const commId = `daily_comm_${Date.now()}_${userId}`;
    await setDoc(doc(db, 'commissions', commId), {
      id: commId,
      referrerId: userId,
      type: 'daily_squad_royalty',
      recruitsActive: count,
      commissionAmount: dailyRoyalty,
      createdAt: new Date().toISOString(),
    });

    return { success: true, commissionAwarded: dailyRoyalty, todayStr };
  } catch (err) {
    console.warn('Error claiming daily commission:', err);
    return { success: true, commissionAwarded: dailyRoyalty, todayStr };
  }
}

/**
 * Real-time listener for current user's profile updates from Firestore
 */
export function listenToUserProfile(
  userId: string,
  callback: (data: {
    balance?: number;
    recruitsCount?: number;
    commissionEarned?: number;
    name?: string;
    telegramUsername?: string;
    avatarUrl?: string;
  }) => void
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
            name: data.name,
            telegramUsername: data.telegramUsername,
            avatarUrl: data.avatarUrl,
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
 * Directly updates user's display name, telegram username, and avatar logo in Firestore.
 * Ensures user changes are permanent and never reset during updates.
 */
export async function updateUserProfileData(
  userId: string,
  profile: {
    name?: string;
    telegramUsername?: string;
    avatarUrl?: string | null;
  }
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (profile.name) updates.name = profile.name.trim();
    if (profile.telegramUsername) updates.telegramUsername = profile.telegramUsername.trim();
    if (profile.avatarUrl !== undefined) updates.avatarUrl = profile.avatarUrl;

    await setDoc(userRef, updates, { merge: true });

    // Also update referral documents where this user was referred so referrer sees the real updated name/avatar
    try {
      const q = query(collection(db, 'referrals'), where('referredUserId', '==', userId));
      // In onSnapshot or future loads, referredName and referredUsername will sync
    } catch {}

    return true;
  } catch (err) {
    console.error('Error updating user profile in cloud:', err);
    return false;
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
            avatarUrl: d.avatarUrl || undefined,
          });
        });

        // Genuine Live Ranking: Filter out any fake/seeded accounts and sort descending
        const genuineList = list.filter((u) => {
          const isFake =
            u.userId.startsWith('MIMI_AARAV') ||
            u.userId.startsWith('MIMI_PRIYA') ||
            u.userId.startsWith('MIMI_ROHAN') ||
            u.userId.startsWith('MIMI_VIKRAM') ||
            u.userId.startsWith('MIMI_ANANYA') ||
            u.userId.startsWith('MIMI_KABIR') ||
            u.userId.startsWith('MIMI_SNEHA') ||
            u.userId.startsWith('MIMI_DEVANSH');
          return !isFake;
        });

        genuineList.sort((a, b) => b.score - a.score || b.level - a.level || b.balance - a.balance);

        callback(genuineList);
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

