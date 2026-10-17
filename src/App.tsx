/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabType, UserStats, AirdropTask, RealReferral, Language, MusicTrack, MUSIC_TRACKS_DATABASE } from './types/airdrop.ts';
import { TelegramHeader } from './components/TelegramHeader.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { MimiMakingDashboard } from './components/MimiMakingDashboard.tsx';
import { TasksView } from './components/TasksView.tsx';
import { FrensView } from './components/FrensView.tsx';
import { AirdropWalletView } from './components/AirdropWalletView.tsx';
import { MinerUpgradesView } from './components/MinerUpgradesView.tsx';
import { ConnectWalletModal } from './components/ConnectWalletModal.tsx';
import { MimiBeatRushModal } from './components/MimiBeatRushModal.tsx';
import { MusicLibraryModal } from './components/MusicLibraryModal.tsx';
import { LevelUpCelebrationModal } from './components/LevelUpCelebrationModal.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { TelegramBotSyncModal } from './components/TelegramBotSyncModal.tsx';
import { ClaimMimiModal } from './components/ClaimMimiModal.tsx';
import { AdsgramRewardModal } from './components/AdsgramRewardModal.tsx';
import { ApernaNftPage } from './components/ApernaNftPage.tsx';
import { ZPlusSecurityModal } from './components/ZPlusSecurityModal.tsx';
import { RankView } from './components/RankView.tsx';
import { useTonAddress } from '@tonconnect/ui-react';
import { setMuteState, playClaimRewardSound } from './utils/audioEngine.ts';
import { saveStatsWithIntegritySignature, verifyLocalStorageIntegrity, validateHumanTapVelocity } from './utils/securityEngine.ts';
import {
  syncUserWithCloud,
  handleCloudWalletConnect,
  creditReferralCommission,
  listenToUserReferrals,
  listenToUserProfile,
  lookupUserByWalletOrTelegram,
} from './utils/referralCloudService.ts';

function parseTelegramUserFromRawString(rawString: string) {
  if (!rawString) return null;
  try {
    const clean = rawString.replace(/^[#?]/, '');
    const params = new URLSearchParams(clean);
    let userParam = params.get('user');
    if (!userParam && params.get('tgWebAppData')) {
      const nested = new URLSearchParams(params.get('tgWebAppData') || '');
      userParam = nested.get('user');
    }
    if (userParam) {
      const parsed = typeof userParam === 'string' ? JSON.parse(userParam) : userParam;
      if (parsed && (parsed.id || parsed.username || parsed.first_name)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error parsing raw telegram user data:', err);
  }
  return null;
}

function getTelegramUser() {
  let permanentId = '';
  let savedName = '';
  let savedHandle = '';
  let savedAvatar = '';

  if (typeof window !== 'undefined') {
    try {
      permanentId = localStorage.getItem('mimi_permanent_user_id') || '';
      savedName = localStorage.getItem('mimi_permanent_user_name') || localStorage.getItem('music_mimi_tg_name') || '';
      savedHandle = localStorage.getItem('mimi_permanent_user_username') || localStorage.getItem('music_mimi_tg_username') || '';
      savedAvatar = localStorage.getItem('mimi_permanent_avatar_url') || '';
    } catch {}
  }

  // Check if saved identity is just a placeholder that should be overridden by real Telegram user
  const isPlaceholderName = !savedName || savedName === 'Mimi Producer' || savedName === 'Mimi Artist';
  const isPlaceholderHandle = !savedHandle || savedHandle === '@mimi_producer' || savedHandle === '@mimi_user';

  if (typeof window !== 'undefined') {
    try {
      // 1. Check window.Telegram.WebApp.initDataUnsafe
      const tg = (window as unknown as {
        Telegram?: {
          WebApp?: {
            ready?: () => void;
            expand?: () => void;
            initDataUnsafe?: {
              user?: { first_name?: string; last_name?: string; username?: string; id?: number; photo_url?: string };
            };
            initData?: string;
          };
        };
      }).Telegram?.WebApp;

      if (tg?.ready) tg.ready();
      if (tg?.expand) tg.expand();

      // Priority 1: Telegram WebApp object
      let tgUser = tg?.initDataUnsafe?.user;

      // Priority 2: Telegram initData raw query string
      if (!tgUser && tg?.initData) {
        tgUser = parseTelegramUserFromRawString(tg.initData);
      }

      // Priority 3: URL hash (#tgWebAppData=...)
      if (!tgUser && window.location.hash) {
        tgUser = parseTelegramUserFromRawString(window.location.hash);
      }

      // Priority 4: URL query parameters (?tgWebAppData=...)
      if (!tgUser && window.location.search) {
        tgUser = parseTelegramUserFromRawString(window.location.search);
      }

      if (tgUser && (tgUser.id || tgUser.username || tgUser.first_name)) {
        const tgFullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Mimi Artist';
        const formattedHandle = tgUser.username
          ? (tgUser.username.startsWith('@') ? tgUser.username : `@${tgUser.username}`)
          : (tgUser.first_name ? `@${tgUser.first_name.toLowerCase().replace(/[^a-z0-9_]/g, '')}` : `@user_${tgUser.id}`);

        const finalId = tgUser.id ? `MIMI_${tgUser.id}` : (permanentId || `MIMI_${Math.floor(1000 + Math.random() * 9000)}`);
        const finalName = (!isPlaceholderName && savedName) ? savedName : tgFullName;
        const finalHandle = (!isPlaceholderHandle && savedHandle) ? savedHandle : formattedHandle;
        const finalAvatar = savedAvatar || tgUser.photo_url || undefined;

        try {
          localStorage.setItem('mimi_permanent_user_id', finalId);
          localStorage.setItem('mimi_permanent_user_name', finalName);
          localStorage.setItem('mimi_permanent_user_username', finalHandle);
          if (finalAvatar) localStorage.setItem('mimi_permanent_avatar_url', finalAvatar);
        } catch {}

        return {
          name: finalName,
          username: finalHandle,
          avatarUrl: finalAvatar,
          id: finalId,
        };
      }

      // Direct URL query parameter fallback (e.g. ?username=myhandle)
      const urlParams = new URLSearchParams(window.location.search);
      const urlTgUser = urlParams.get('username') || urlParams.get('tg_username');
      if (urlTgUser) {
        const cleanHandle = urlTgUser.startsWith('@') ? urlTgUser : `@${urlTgUser}`;
        const finalId = permanentId || `MIMI_${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          name: (!isPlaceholderName && savedName) ? savedName : cleanHandle.replace('@', ''),
          username: cleanHandle,
          avatarUrl: savedAvatar || undefined,
          id: finalId,
        };
      }
    } catch (e) {
      console.warn('Error reading Telegram user info:', e);
    }

    if (!isPlaceholderName || !isPlaceholderHandle) {
      const finalId = permanentId || `MIMI_${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        name: savedName || 'Mimi Artist',
        username: savedHandle || '@mimi_user',
        avatarUrl: savedAvatar || undefined,
        id: finalId,
      };
    }
  }

  const fallbackId = permanentId || `MIMI_${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    name: savedName || 'Mimi Artist',
    username: savedHandle || '@mimi_user',
    avatarUrl: savedAvatar || undefined,
    id: fallbackId,
  };
}

// FRESH ZERO-BALANCE DEFAULT STATE WITH PERMANENT USER RECOVERY
function createInitialStats(): UserStats {
  const tg = getTelegramUser();
  return {
    userId: tg.id,
    name: tg.name,
    telegramUsername: tg.username,
    avatarUrl: tg.avatarUrl,
    protocolId: tg.id,
    level: 1,
    highestLevel: 1,
    roleTitle: 'सोनिक पायनियर I',
    traineeBadge: 'निर्माता',
    balance: 0.0,
    inAppBalance: 0.0,
    onChainBalance: 0.0,
    usdConversionRate: 0.005, // 1 $MIMI = $0.005 USD
    beatsStreamed: 0,
    recruitsCount: 0,
    claimedReferralBonus: 0,
    commissionEarned: 0.0,
    daysActive: 1,
    walletAddress: null,
    walletProvider: null,
    walletAgeDays: 0,
    isWalletVerified: false,
    dailyStreakDay: 1,
    lastDailyClaim: null,
    adsWatchedCount: 0,
    liquidityContributedTon: 0,
    claimStatus: 'unclaimed',
    claimTxHash: null,
    claimAmount: 0,
    claimTimestamp: null,
    // Core Loop Making Mechanics
    loopMakingActive: false,
    loopStartTime: null,
    loopDurationSec: 28800, // 8 hours = 28,800 sec
    currentLevelLoops: 0,
    totalLoopsCrafted: 0,
    unlockedTrackIds: [], // Empty initially
    energy: 1000,
    maxEnergy: 1000,
    hasClaimedWelcome: false,
    studioUpgrades: {
      headphonesLevel: 1,
      turntableLevel: 1,
      amplifierLevel: 1,
    },
  };
}

const DEFAULT_TASKS: AirdropTask[] = [
  {
    id: "tg-hashmi-crypto",
    category: "social",
    subType: "telegram",
    title: "Telegram @Hashmi_Crypto जॉइन करें (+15 $MIMI)",
    titleEn: "Join Telegram @Hashmi_Crypto (+15 $MIMI)",
    description: "Hashmi Crypto Telegram चैनल जॉइन करें। बिना फॉलो किए टोकन क्लेम नहीं होगा।",
    descriptionEn: "Join Hashmi Crypto Telegram channel. Genuine follow/join required to claim tokens.",
    reward: 15,
    iconType: "telegram",
    actionUrl: "https://t.me/Hashmi_Crypto",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "yt-subscribe-hashmi",
    category: "youtube",
    subType: "subscribe",
    title: "YouTube चैनल सब्सक्राइब करें (+20 $MIMI)",
    titleEn: "Subscribe to Hashmi Crypto YouTube (+20 $MIMI)",
    description: "@hashmicrypto1 चैनल को सब्सक्राइब करें, घंटी आइकन ऑन करें और 20 $MIMI प्राप्त करें।",
    descriptionEn: "Subscribe to @hashmicrypto1 channel, turn on bell icon and claim 20 $MIMI.",
    reward: 20,
    iconType: "youtube",
    actionUrl: "https://youtube.com/@hashmicrypto1?si=p8615mTtahK5bA_o",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "yt-video-1",
    category: "youtube",
    subType: "video",
    title: "YouTube वीडियो #1 देखें, Like & Comment (+15 $MIMI)",
    titleEn: "Watch, Like & Comment YouTube Video #1 (+15 $MIMI)",
    description: "वीडियो पूरा देखें, Like बटन दबाएं और कमेंट बॉक्स में अपनी राय लिखें!",
    descriptionEn: "Watch full video, hit Like and leave a comment to claim 15 $MIMI!",
    reward: 15,
    iconType: "youtube",
    actionUrl: "https://youtu.be/W3LP_nQUfU4?si=x5nz87wIQWL0g2UK",
    requiredWaitSeconds: 20,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "yt-video-2",
    category: "youtube",
    subType: "video",
    title: "क्रिप्टो वीडियो #2 देखें, Like & Comment (+15 $MIMI)",
    titleEn: "Watch, Like & Comment Crypto Video #2 (+15 $MIMI)",
    description: "वीडियो देखें, Like करें और Comment करें ताकि असली व्यू और एंगेजमेंट काउंट हो।",
    descriptionEn: "Watch video, Like and Comment to register genuine view and earn 15 $MIMI.",
    reward: 15,
    iconType: "youtube",
    actionUrl: "https://youtu.be/LD23gGEig5I?si=g4hAgs1j1TKpZ-gu",
    requiredWaitSeconds: 20,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "yt-video-3",
    category: "youtube",
    subType: "video",
    title: "लेटेस्ट वीडियो #3 देखें, Like & Comment (+15 $MIMI)",
    titleEn: "Watch, Like & Comment Latest Video #3 (+15 $MIMI)",
    description: "वीडियो देखें, Like और अच्छा सा Comment ड्रॉप करें और 15 $MIMI क्लेम करें।",
    descriptionEn: "Watch video, Like and drop a comment to claim 15 $MIMI reward.",
    reward: 15,
    iconType: "youtube",
    actionUrl: "https://youtu.be/5-nfzycuono?si=orUpcHmMNNLYkDX7",
    requiredWaitSeconds: 20,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "ig-hashmi-crypto",
    category: "social",
    subType: "instagram",
    title: "Instagram @hashmicrypto फॉलो करें (+12 $MIMI)",
    titleEn: "Follow @hashmicrypto on Instagram (+12 $MIMI)",
    description: "Instagram पर @hashmicrypto को फॉलो करें और 12 $MIMI टोकन प्राप्त करें।",
    descriptionEn: "Follow @hashmicrypto on Instagram and earn 12 $MIMI tokens.",
    reward: 12,
    iconType: "instagram",
    actionUrl: "https://www.instagram.com/hashmicrypto?igsh=NnV4aXA1YXA3bWRu&utm_source=qr",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "dolicash-task-offer",
    category: "partner",
    subType: "partner",
    title: "Dolicash स्पेशल टास्क (+15 $MIMI)",
    titleEn: "Dolicash Special Offer (+15 $MIMI)",
    description: "Dolicash ऑफर पूरा करें और 15 $MIMI टोकन प्राप्त करें।",
    descriptionEn: "Complete the Dolicash offer via tracking link to earn 15 $MIMI.",
    reward: 15,
    iconType: "flame",
    actionUrl: "https://www.fastrsrvr.com/view.php?id=5547102&pub=3366972",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "telegram-channel-aperna",
    category: "social",
    subType: "telegram",
    title: "Telegram चैनल Aperna AI (+10 $MIMI)",
    titleEn: "Join Aperna AI Telegram (+10 $MIMI)",
    description: "Aperna AI के ऑफिशियल Telegram चैनल को जॉइन करें और 10 $MIMI प्राप्त करें।",
    descriptionEn: "Join the official Aperna AI Telegram channel to claim 10 $MIMI.",
    reward: 10,
    iconType: "telegram",
    actionUrl: "https://t.me/ApernaAIOfficial",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "instagram-follow-aperna",
    category: "social",
    subType: "instagram",
    title: "Instagram Aperna AI फॉलो करें (+10 $MIMI)",
    titleEn: "Follow Aperna AI on Instagram (+10 $MIMI)",
    description: "@aperna_ai को Instagram पर फॉलो करें और 10 $MIMI टोकन प्राप्त करें।",
    descriptionEn: "Follow @aperna_ai on Instagram to earn 10 $MIMI tokens.",
    reward: 10,
    iconType: "instagram",
    actionUrl: "https://www.instagram.com/aperna_ai?stkn=MWdmM3RyanV5eWI3eQ==",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "twitter-follow-aperna",
    category: "social",
    subType: "other",
    title: "X (Twitter) पर फॉलो करें (+10 $MIMI)",
    titleEn: "Follow on X (Twitter) (+10 $MIMI)",
    description: "X पर @MohammadSl83128 को फॉलो करें और 10 $MIMI टोकन प्राप्त करें।",
    descriptionEn: "Follow @MohammadSl83128 on X (Twitter) to claim 10 $MIMI tokens.",
    reward: 10,
    iconType: "twitter",
    actionUrl: "https://x.com/MohammadSl83128",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "discord-join-aperna",
    category: "community",
    subType: "other",
    title: "Discord कम्युनिटी जॉइन करें (+10 $MIMI)",
    titleEn: "Join Discord Community (+10 $MIMI)",
    description: "Aperna AI Discord सर्वर से जुड़ें और 10 $MIMI टोकन प्राप्त करें।",
    descriptionEn: "Join the Aperna AI Discord server to claim 10 $MIMI tokens.",
    reward: 10,
    iconType: "discord",
    actionUrl: "https://discord.gg/3hjUXrfVQe",
    requiredWaitSeconds: 15,
    verificationType: "external_confirmed",
    isCompleted: false,
  },
];

export default function App() {
  const tonAddress = useTonAddress();
  // Center Beats tab is our main dashboard as requested!
  const [activeTab, setActiveTab] = useState<TabType>('beats');
  const [language, setLanguage] = useState<Language>('hi');
  const [isMuted, setIsMuted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isArcadeModalOpen, setIsArcadeModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBotSyncOpen, setIsBotSyncOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isAdsgramModalOpen, setIsAdsgramModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ newLevel: number; track: MusicTrack } | null>(null);

  // Handle URL query parameters from Telegram buttons (e.g. ?tab=wallet or ?tab=beats)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'wallet' || tabParam === 'vault') {
        setActiveTab('vault');
      } else if (tabParam === 'beats' || tabParam === 'dashboard') {
        setActiveTab('beats');
      } else if (tabParam === 'rank' || tabParam === 'leaderboard') {
        setActiveTab('rank');
      } else if (tabParam === 'tasks') {
        setActiveTab('tasks');
      } else if (tabParam === 'frens' || tabParam === 'profile') {
        setActiveTab('profile');
      } else if (tabParam === 'studio') {
        setActiveTab('studio');
      } else if (tabParam === 'nft') {
        setActiveTab('nft');
      }

      if (params.get('library') === '1') {
        setIsLibraryOpen(true);
      }
      if (params.get('bot') === 'sync') {
        setIsBotSyncOpen(true);
      }
      if (params.get('claim') === '1' || tabParam === 'claim') {
        setIsClaimModalOpen(true);
      }
      if (params.get('ad') === '1' || tabParam === 'adsgram') {
        setIsAdsgramModalOpen(true);
      }
      if (params.get('nft') === '1') {
        setActiveTab('nft');
      }
      if (params.get('security') === '1') {
        setIsSecurityModalOpen(true);
      }
    }
  }, []);

  // PURGE LEGACY FAKE TASK BALANCES SO USERS START CLEAN AT 0.00 $MIMI
  useEffect(() => {
    try {
      localStorage.removeItem('music_mimi_stats_clean_v4');
      localStorage.removeItem('music_mimi_tasks_clean_v4');
      localStorage.removeItem('music_mimi_tasks_clean_v5');
      localStorage.removeItem('music_mimi_refs_clean_v4');
    } catch {}
  }, []);

  // Fresh User Stats starting at 0 balance for all users with Z+ Integrity Verification
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_stats_v7_real_lp') || localStorage.getItem('music_mimi_stats_v6');
      const persistentName = localStorage.getItem('mimi_permanent_user_name') || localStorage.getItem('music_mimi_tg_name');
      const persistentHandle = localStorage.getItem('mimi_permanent_user_username') || localStorage.getItem('music_mimi_tg_username');
      const persistentAvatar = localStorage.getItem('mimi_permanent_avatar_url');

      if (saved) {
        const parsed = JSON.parse(saved);
        if (persistentName) parsed.name = persistentName;
        if (persistentHandle) parsed.telegramUsername = persistentHandle;
        if (persistentAvatar) parsed.avatarUrl = persistentAvatar;

        // Verify local storage tamper proofing
        if (verifyLocalStorageIntegrity(parsed)) {
          // Clear legacy 10 fake on-chain balance if not genuine claim
          if (parsed.onChainBalance === 10 && !parsed.claimTxHash) {
            parsed.onChainBalance = 0;
          }
          // Normalize balance to only real mined tokens
          const realMined = Number(((parsed.inAppBalance || 0) + (parsed.onChainBalance || 0)).toFixed(2));
          parsed.balance = realMined;
          parsed.recruitsCount = parsed.recruitsCount || 0;
          parsed.commissionEarned = parsed.commissionEarned || 0.0;
          return parsed;
        } else {
          console.warn('Z+ Security Alert: Balance check triggered. Preserving verified profile identity.');
          const initial = createInitialStats();
          if (persistentName) initial.name = persistentName;
          if (persistentHandle) initial.telegramUsername = persistentHandle;
          if (persistentAvatar) initial.avatarUrl = persistentAvatar;
          return initial;
        }
      }
    } catch {}
    return createInitialStats();
  });

  const [tasks, setTasks] = useState<AirdropTask[]>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_tasks_v9_hashmi_crypto') || localStorage.getItem('music_mimi_tasks_v8_real_social') || localStorage.getItem('music_mimi_tasks_v7_real_lp');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return DEFAULT_TASKS.map((dt) => {
            const found = parsed.find((t: AirdropTask) => t.id === dt.id);
            return found ? { ...dt, isCompleted: Boolean(found.isCompleted) } : dt;
          });
        }
      }
    } catch {}
    return DEFAULT_TASKS;
  });

  const [referrals, setReferrals] = useState<RealReferral[]>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_refs_v7_real_lp');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  // Save changes to localStorage with cryptographic Z+ signature
  useEffect(() => {
    localStorage.setItem('music_mimi_stats_v7_real_lp', JSON.stringify(stats));
    saveStatsWithIntegritySignature(stats);
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('music_mimi_tasks_v9_hashmi_crypto', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('music_mimi_refs_v7_real_lp', JSON.stringify(referrals));
  }, [referrals]);

  // Real-Time Cloud Firestore Sync for Cross-Device Referrals, Identity & 10% Commission
  useEffect(() => {
    const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
    syncUserWithCloud(
      stats.userId,
      stats.name,
      stats.telegramUsername,
      stats.walletAddress || tonAddress || null,
      stats.balance,
      stats.level,
      completedTasksCount,
      stats.dailyStreakDay || 1,
      stats.roleTitle,
      stats.avatarUrl || null
    ).catch(console.error);

    const unsubRefs = listenToUserReferrals(stats.userId, (cloudRefs, totalCommission) => {
      setReferrals(cloudRefs);
      setStats((prev) => ({
        ...prev,
        recruitsCount: cloudRefs.length,
        commissionEarned: Math.max(prev.commissionEarned || 0, totalCommission),
      }));
    });

    const unsubProfile = listenToUserProfile(stats.userId, (profile) => {
      setStats((prev) => {
        const nextName = (profile.name && profile.name !== 'Mimi Producer') ? profile.name : prev.name;
        const nextUsername = profile.telegramUsername || prev.telegramUsername;
        const nextAvatar = profile.avatarUrl !== undefined ? (profile.avatarUrl || undefined) : prev.avatarUrl;

        // Keep localStorage updated with confirmed cloud values so reloads never lose custom changes
        try {
          if (profile.name && profile.name !== 'Mimi Producer') {
            localStorage.setItem('mimi_permanent_user_name', profile.name);
            localStorage.setItem('music_mimi_tg_name', profile.name);
          }
          if (profile.telegramUsername) {
            localStorage.setItem('mimi_permanent_user_username', profile.telegramUsername);
            localStorage.setItem('music_mimi_tg_username', profile.telegramUsername);
          }
          if (profile.avatarUrl) {
            localStorage.setItem('mimi_permanent_avatar_url', profile.avatarUrl);
          }
        } catch {}

        return {
          ...prev,
          name: nextName,
          telegramUsername: nextUsername,
          avatarUrl: nextAvatar,
          balance: profile.balance !== undefined ? profile.balance : prev.balance,
          recruitsCount: profile.recruitsCount !== undefined ? profile.recruitsCount : prev.recruitsCount,
          commissionEarned: profile.commissionEarned !== undefined ? profile.commissionEarned : prev.commissionEarned,
        };
      });
    });

    return () => {
      unsubRefs();
      unsubProfile();
    };
  }, [stats.userId, stats.name, stats.telegramUsername, stats.avatarUrl]);

  // Account Restoration & Identity Sync: Automatically link to existing user by wallet or Telegram handle
  useEffect(() => {
    const activeWallet = stats.walletAddress || tonAddress;
    const isTempId = stats.userId.startsWith('MIMI_') && stats.userId.length <= 9;
    lookupUserByWalletOrTelegram({
      walletAddress: activeWallet,
      telegramUsername: stats.telegramUsername,
      telegramId: stats.userId.startsWith('MIMI_') ? stats.userId.replace('MIMI_', '') : undefined,
    }).then((existing) => {
      if (existing && existing.userId && existing.userId !== stats.userId) {
        console.log(`[IDENTITY RESTORE] Seamlessly restored account ${existing.userId} for ${existing.name} (${existing.telegramUsername})`);
        try {
          localStorage.setItem('mimi_permanent_user_id', existing.userId);
          localStorage.setItem('mimi_permanent_user_name', existing.name);
          localStorage.setItem('mimi_permanent_user_username', existing.telegramUsername);
          if (existing.avatarUrl) localStorage.setItem('mimi_permanent_avatar_url', existing.avatarUrl);
        } catch {}
        setStats((prev) => ({
          ...prev,
          userId: existing.userId,
          name: existing.name || prev.name,
          telegramUsername: existing.telegramUsername || prev.telegramUsername,
          balance: Math.max(prev.balance, existing.balance || 0),
          recruitsCount: Math.max(prev.recruitsCount || 0, existing.recruitsCount || 0),
          commissionEarned: Math.max(prev.commissionEarned || 0, existing.commissionEarned || 0),
          avatarUrl: existing.avatarUrl || prev.avatarUrl,
        }));
      }
    }).catch(console.warn);
  }, [tonAddress, stats.walletAddress, stats.telegramUsername]);

  // Auto-bind wallet when Tonkeeper or Telegram Wallet connects via TonConnect
  useEffect(() => {
    if (tonAddress && tonAddress !== stats.walletAddress) {
      handleConnectWallet(tonAddress, 'Tonkeeper / @wallet');
    }
  }, [tonAddress, stats.walletAddress]);

  // Smart updater with automatic 10% lifetime referral commission routing
  const handleUpdateStatsWithCommission = (newStats: UserStats) => {
    const earnedDiff = Number((newStats.balance - stats.balance).toFixed(2));
    if (earnedDiff > 0) {
      creditReferralCommission(stats.userId, earnedDiff, 'Mining Loop').catch(console.error);
    }
    setStats(newStats);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setMuteState(nextMuted);
  };

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const handleResetStats = () => {
    localStorage.clear();
    const fresh = createInitialStats();
    setStats(fresh);
    saveStatsWithIntegritySignature(fresh);
    setTasks(DEFAULT_TASKS);
    setReferrals([]);
    alert(language === 'hi' ? 'खाता नए सिरे से रीसेट हो गया (0 बैलेंस, असली टास्क)! ' : 'Reset to fresh account (0 balance, real tasks)!');
  };

  // Rewarded Adsgram Ad Completion handler
  const handleRewardAdsgram = (mimiReward: number, tonContributed: number) => {
    const tapCheck = validateHumanTapVelocity();
    if (!tapCheck.isAllowed) {
      console.warn('Z+ Rate limit triggered on reward');
      return;
    }
    const newInApp = Number((stats.inAppBalance + mimiReward).toFixed(2));
    const newBalance = Number((stats.balance + mimiReward).toFixed(2));
    const newAdsCount = (stats.adsWatchedCount || 0) + 1;
    const newTonContributed = Number(((stats.liquidityContributedTon || 0) + tonContributed).toFixed(3));

    setStats((prev) => ({
      ...prev,
      inAppBalance: newInApp,
      balance: newBalance,
      adsWatchedCount: newAdsCount,
      liquidityContributedTon: newTonContributed,
    }));
    creditReferralCommission(stats.userId, mimiReward, 'Adsgram').catch(console.error);
  };

  // Task Completion Handler
  const handleCompleteTask = (taskId: string, reward: number) => {
    const tapCheck = validateHumanTapVelocity();
    if (!tapCheck.isAllowed) return;

    playClaimRewardSound();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: true } : t))
    );
    const newInApp = Number((stats.inAppBalance + reward).toFixed(2));
    const newBalance = Number((stats.balance + reward).toFixed(2));
    setStats((prev) => ({
      ...prev,
      inAppBalance: newInApp,
      balance: newBalance,
    }));
    creditReferralCommission(stats.userId, reward, 'Quests').catch(console.error);
  };

  // Daily Streak Claim
  const handleClaimDailyStreak = (day: number, reward: number) => {
    playClaimRewardSound();
    const nextStreakDay = day >= 7 ? 1 : day + 1;
    const newInApp = Number((stats.inAppBalance + reward).toFixed(2));
    const newBalance = Number((stats.balance + reward).toFixed(2));
    setStats((prev) => ({
      ...prev,
      dailyStreakDay: nextStreakDay,
      lastDailyClaim: Date.now(),
      inAppBalance: newInApp,
      balance: newBalance,
      hasClaimedWelcome: true,
    }));
    creditReferralCommission(stats.userId, reward, 'Daily Bonus').catch(console.error);
  };

  // Wallet Bind: Real-Time Cross-Device Qualification & +100 $MIMI Award
  const handleConnectWallet = (address: string, provider: string) => {
    lookupUserByWalletOrTelegram({ walletAddress: address }).then((existing) => {
      if (existing && existing.userId && existing.userId !== stats.userId) {
        console.log(`[WALLET RESTORE] Restoring account ${existing.userId} for wallet ${address}`);
        setStats((prev) => ({
          ...prev,
          userId: existing.userId,
          name: existing.name || prev.name,
          telegramUsername: existing.telegramUsername || prev.telegramUsername,
          balance: Math.max(prev.balance, existing.balance || 0),
          recruitsCount: Math.max(prev.recruitsCount || 0, existing.recruitsCount || 0),
          commissionEarned: Math.max(prev.commissionEarned || 0, existing.commissionEarned || 0),
          walletAddress: address,
          walletProvider: provider,
          isWalletVerified: true,
        }));
        try {
          localStorage.setItem('mimi_permanent_user_id', existing.userId);
          localStorage.setItem('mimi_permanent_user_name', existing.name);
          localStorage.setItem('mimi_permanent_user_username', existing.telegramUsername);
        } catch {}
        handleCloudWalletConnect(existing.userId, address, provider).catch(console.error);
        return;
      }
      handleCloudWalletConnect(stats.userId, address, provider).catch(console.error);
    }).catch(() => {
      handleCloudWalletConnect(stats.userId, address, provider).catch(console.error);
    });

    setStats((prev) => ({
      ...prev,
      walletAddress: address,
      walletProvider: provider,
      isWalletVerified: true,
      walletAgeDays: prev.walletAgeDays || 14,
    }));
    const walletTask = tasks.find((t) => t.id === 'connect-ton-wallet');
    if (walletTask && !walletTask.isCompleted) {
      handleCompleteTask('connect-ton-wallet', walletTask.reward);
    }
  };

  // Arcade / Beat Rush Daily Play Limits (Protects token economy from infinite tapping)
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const hpLevel = stats.studioUpgrades?.headphonesLevel || 1;
  const arcadePlaysToday = stats.lastArcadePlayDate === todayDateStr ? (stats.arcadePlaysToday || 0) : 0;
  const maxArcadePlays = 3 + (hpLevel - 1);
  const arcadePlaysRemaining = Math.max(0, maxArcadePlays - arcadePlaysToday);

  const handleRecordArcadePlay = () => {
    setStats((prev) => {
      const currentPlays = prev.lastArcadePlayDate === todayDateStr ? (prev.arcadePlaysToday || 0) : 0;
      return {
        ...prev,
        lastArcadePlayDate: todayDateStr,
        arcadePlaysToday: currentPlays + 1,
      };
    });
  };

  // Arcade Win Tokens
  const handleWinArcadeTokens = (amount: number) => {
    const newInApp = Number((stats.inAppBalance + amount).toFixed(2));
    const newBalance = Number((stats.balance + amount).toFixed(2));
    setStats((prev) => ({
      ...prev,
      inAppBalance: newInApp,
      balance: newBalance,
      beatsStreamed: (prev.beatsStreamed || 0) + 15,
    }));
    creditReferralCommission(stats.userId, amount, 'Arcade').catch(console.error);
  };

  // Trigger Level Up Celebration Modal
  const handleLevelUpCelebration = (newLevel: number, unlockedTrackId: number) => {
    const track = MUSIC_TRACKS_DATABASE.find((t) => t.id === unlockedTrackId) || MUSIC_TRACKS_DATABASE[0];
    setCelebrationData({
      newLevel,
      track,
    });
  };

  const pendingTasksCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="min-h-screen bg-radial from-[#0d2757] via-[#051332] to-[#02091c] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Background ambient shine polish lines */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.25),rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* Optional Splash Screen on Demand */}
      {showSplash && (
        <SplashScreen
          language={language}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* Main Telegram Header with Back Button and Z+ Status */}
      <TelegramHeader
        language={language}
        onToggleLanguage={handleToggleLanguage}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onShowSplash={() => setShowSplash(true)}
        onResetStats={handleResetStats}
        onOpenBotSync={() => setIsBotSyncOpen(true)}
        onOpenNftPage={() => setActiveTab('nft')}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenRankPage={() => setActiveTab('rank')}
        onOpenProfile={() => setActiveTab('profile')}
        userAvatarUrl={stats.avatarUrl}
        userName={stats.name}
        activeTab={activeTab}
        onBack={() => setActiveTab('beats')}
      />

      {/* Main View Container - Clean without large banner pushing content down! */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col relative z-10">
        
        {/* CENTER TAB: Main Dashboard -> Mimi Making */}
        {activeTab === 'beats' && (
          <MimiMakingDashboard
            stats={stats}
            onUpdateStats={handleUpdateStatsWithCommission}
            language={language}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenWallet={() => setIsWalletModalOpen(true)}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            onLevelUpCelebration={handleLevelUpCelebration}
            onOpenRank={() => setActiveTab('rank')}
          />
        )}

        {/* Real Live Users Rank & Global Leaderboard */}
        {activeTab === 'rank' && (
          <RankView
            stats={stats}
            tasks={tasks}
            language={language}
            onOpenTasks={() => setActiveTab('tasks')}
            onOpenBeats={() => setActiveTab('beats')}
            onOpenConnectWallet={() => setIsWalletModalOpen(true)}
          />
        )}

        {/* Tab 1: Tasks / Quests */}
        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onCompleteTask={handleCompleteTask}
            stats={stats}
            onClaimDailyStreak={handleClaimDailyStreak}
            onOpenArcade={() => setIsArcadeModalOpen(true)}
            onOpenWallet={() => setIsWalletModalOpen(true)}
            language={language}
          />
        )}

        {/* Tab 2: Studio Gear */}
        {activeTab === 'studio' && (
          <MinerUpgradesView
            stats={stats}
            onUpdateStats={handleUpdateStatsWithCommission}
            language={language}
            onOpenArcade={() => setIsArcadeModalOpen(true)}
          />
        )}

        {/* Tab 4: Vault & Wallet */}
        {activeTab === 'vault' && (
          <AirdropWalletView
            stats={stats}
            onUpdateStats={handleUpdateStatsWithCommission}
            onOpenConnectWallet={() => setIsWalletModalOpen(true)}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            language={language}
          />
        )}

        {/* Tab 5: Profile & Squad */}
        {activeTab === 'profile' && (
          <FrensView
            stats={stats}
            referrals={referrals}
            onUpdateStats={handleUpdateStatsWithCommission}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            language={language}
          />
        )}

        {/* Tab: 🎟️ 1,000 Early Reserve Pool */}
        {activeTab === 'nft' && (
          <ApernaNftPage
            language={language}
            stats={stats}
            onBack={() => setActiveTab('beats')}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingTasksCount={pendingTasksCount}
        language={language}
      />

      {/* Dedicated Music Library Modal */}
      {isLibraryOpen && (
        <MusicLibraryModal
          language={language}
          onClose={() => setIsLibraryOpen(false)}
          unlockedTrackIds={stats.unlockedTrackIds || []}
          currentLevel={stats.level}
        />
      )}

      {/* Level Up Celebration Modal */}
      {celebrationData && (
        <LevelUpCelebrationModal
          language={language}
          newLevel={celebrationData.newLevel}
          unlockedTrack={celebrationData.track}
          onClose={() => setCelebrationData(null)}
          onOpenLibrary={() => {
            setCelebrationData(null);
            setIsLibraryOpen(true);
          }}
        />
      )}

      {/* Connect TON Wallet Modal */}
      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleConnectWallet}
        currentAddress={stats.walletAddress}
        language={language}
      />

      {/* Dedicated Claim $MIMI Workflow Modal */}
      <ClaimMimiModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        stats={stats}
        onUpdateStats={setStats}
        onOpenConnectWallet={() => {
          setIsClaimModalOpen(false);
          setIsWalletModalOpen(true);
        }}
        language={language}
      />

      {/* Adsgram Rewarded Video Ad & DEX LP Booster Modal */}
      <AdsgramRewardModal
        isOpen={isAdsgramModalOpen}
        onClose={() => setIsAdsgramModalOpen(false)}
        stats={stats}
        onRewardUser={handleRewardAdsgram}
        language={language}
      />

      {/* Arcade Beat Rush Modal */}
      {isArcadeModalOpen && (
        <MimiBeatRushModal
          language={language}
          onClose={() => setIsArcadeModalOpen(false)}
          onWinTokens={handleWinArcadeTokens}
          playsRemaining={arcadePlaysRemaining}
          maxPlays={maxArcadePlays}
          onRecordPlay={handleRecordArcadePlay}
          onGoToStudio={() => setActiveTab('studio')}
        />
      )}

      {/* Telegram Bot Sync Modal */}
      <TelegramBotSyncModal
        isOpen={isBotSyncOpen}
        onClose={() => setIsBotSyncOpen(false)}
        language={language}
      />

      {/* REAL Z+ MILITARY-GRADE PROTOCOL SECURITY AUDIT MODAL */}
      <ZPlusSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        language={language}
        stats={stats}
      />

    </div>
  );
}
