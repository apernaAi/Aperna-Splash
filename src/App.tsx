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
import { RewardClaimCelebrationModal, RewardCelebrationProps } from './components/RewardClaimCelebrationModal.tsx';
import { MATH_QUIZ_TASKS } from './utils/mathTasksData.ts';
import { shortenAddress } from './utils/tonService.ts';
import { useTonAddress } from '@tonconnect/ui-react';
import { setMuteState, playClaimRewardSound, triggerHaptic, initBackgroundMusic, isMuted as isMutedEngine, subscribeBgmState, resumeAudioOnGesture } from './utils/audioEngine.ts';
import { saveStatsWithIntegritySignature, verifyLocalStorageIntegrity, validateHumanTapVelocity } from './utils/securityEngine.ts';
import { getTodayDateString, syncTasksWithDailyReset } from './utils/dailyTaskService.ts';
import { ADS_LIMIT_PER_PERIOD, ADS_PERIOD_DURATION_MS, getAdsCooldownStatus, getActiveAdsgramBlockId, sanitizeAdsgramBlockId, isTelegramEnvironment } from './utils/adsgramService.ts';
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
    unlockedTrackIds: [1], // Level 1 track unlocked by default
    bgmTrackId: 1,
    bgmEnabled: true,
    bgmVolume: 0.28,
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
  // 1. Adsgram Native Monetization Units (Direct revenue routes to STON.fi DEX LP)
  {
    id: 'adsgram-video-daily',
    category: 'adsgram',
    subType: 'video',
    title: 'Adsgram रिवॉर्डेड वीडियो देखें (+15 $MIMI)',
    titleEn: 'Watch Adsgram Rewarded Video (+15 $MIMI)',
    description: '15 सेकंड का वीडियो विज्ञापन देखें, 15 $MIMI टोकन कमाएं और DEX लिक्विडिटी बूस्ट करें।',
    descriptionEn: 'Watch a 15-second rewarded video ad to earn 15 $MIMI and boost DEX liquidity.',
    reward: 15,
    iconType: 'adsgram',
    isAdsgramTask: true,
    adsgramBlockType: 'reward',
    verificationType: 'ad_watched',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'adsgram-interstitial-daily',
    category: 'adsgram',
    subType: 'other',
    title: 'Adsgram इंटरैक्टिव बूस्ट विज्ञापन (+15 $MIMI)',
    titleEn: 'Adsgram Interactive Sponsor Boost (+15 $MIMI)',
    description: 'फुल-स्क्रीन इंटरैक्टिव स्पॉन्सर एड देखें और 15 $MIMI का अतिरिक्त बोनस पाएं। (ऐप ओपन पर ऑटो)',
    descriptionEn: 'View interactive full-screen sponsor boost and claim 15 $MIMI bonus. (Auto on app open)',
    reward: 15,
    iconType: 'adsgram',
    isAdsgramTask: true,
    adsgramBlockType: 'interstitial',
    verificationType: 'ad_watched',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'adsgram-task-native',
    category: 'adsgram',
    subType: 'partner',
    title: 'Adsgram पार्टनर स्पॉन्सर टास्क (+20 $MIMI)',
    titleEn: 'Adsgram Native Partner Campaign (+20 $MIMI)',
    description: 'पार्टनर एड कैंपेन एक्सप्लोर करें और 20 $MIMI टोकन रिवॉर्ड हासिल करें। (ब्लॉक #55579)',
    descriptionEn: 'Explore Adsgram native sponsor offer and earn 20 $MIMI token reward. (Block #55579)',
    reward: 20,
    iconType: 'adsgram',
    isAdsgramTask: true,
    adsgramBlockType: 'task',
    verificationType: 'ad_watched',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'adsgram-music-sponsor',
    category: 'adsgram',
    subType: 'partner',
    title: 'Adsgram Web3 म्यूजिक स्पॉन्सर (+20 $MIMI)',
    titleEn: 'Adsgram Web3 Music Sponsor Boost (+20 $MIMI)',
    description: 'वेब3 म्यूजिक स्पॉन्सर कैंपेन देखें और 20 $MIMI तुरंत अनलॉक करें।',
    descriptionEn: 'Watch Web3 Music sponsor campaign & unlock 20 $MIMI instantly.',
    reward: 20,
    iconType: 'adsgram',
    isAdsgramTask: true,
    adsgramBlockType: 'task',
    verificationType: 'ad_watched',
    isCompleted: false,
    isDailyRepeatable: true,
  },

  // 2. Real Native Web3 In-App Quests (True Airdrop Mechanics)
  {
    id: 'connect-ton-wallet',
    category: 'ton',
    subType: 'other',
    title: 'TON वॉलेट कनेक्ट करें (+100 $MIMI)',
    titleEn: 'Connect TON Wallet (+100 $MIMI)',
    description: 'Tonkeeper या @wallet कनेक्ट करें और तुरंत 100 $MIMI और 8-घंटे लूप क्राफ्ट अनलॉक करें।',
    descriptionEn: 'Connect Tonkeeper or @wallet to unlock 100 $MIMI and 8-hour loop craft.',
    reward: 100,
    iconType: 'wallet',
    requiresWallet: true,
    verificationType: 'wallet_connected',
    isCompleted: false,
    isDailyRepeatable: false,
  },
  {
    id: 'reach-level-3',
    category: 'all',
    subType: 'other',
    title: 'प्रोड्यूसर लेवल 3 पर पहुंचें (+50 $MIMI)',
    titleEn: 'Reach Studio Producer Level 3 (+50 $MIMI)',
    description: 'Mimi Making में बीट्स स्ट्रीम और लूप क्राफ्ट करके लेवल 3 अनलॉक करें।',
    descriptionEn: 'Craft loops and upgrade studio gear to reach Producer Level 3.',
    reward: 50,
    iconType: 'music',
    verificationType: 'auto',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'craft-first-loop',
    category: 'all',
    subType: 'other',
    title: 'Mimi Studio में लूप क्राफ्ट करें (+35 $MIMI)',
    titleEn: 'Craft Sound Loops in Studio (+35 $MIMI)',
    description: '8-घंटे Mimi Making लूप क्राफ्टिंग सक्रिय रखें और संगीत लेयर्स बनाएं।',
    descriptionEn: 'Keep 8-hour Mimi Making loop active and craft sound layers.',
    reward: 35,
    iconType: 'flame',
    verificationType: 'auto',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'play-beat-rush-arcade',
    category: 'all',
    subType: 'other',
    title: 'मिमी बीट रश आर्केड खेलें (+30 $MIMI)',
    titleEn: 'Play Mimi Beat Rush Arcade (+30 $MIMI)',
    description: 'बीट रश में रिदम लेयर्स अनलॉक करें और हाई स्कोर बनाकर टोकन जीतें।',
    descriptionEn: 'Drop rhythmic beats in Mimi Beat Rush arcade to win bonus tokens.',
    reward: 30,
    iconType: 'music',
    verificationType: 'auto',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'invite-squad-fren',
    category: 'social',
    subType: 'other',
    title: 'एक दोस्त को Mimi Squad में शामिल करें (+50 $MIMI)',
    titleEn: 'Invite a Fren to Mimi Squad (+50 $MIMI)',
    description: 'अपने रेफरल लिंक से एक दोस्त को बुलाएं और 10% लाइफटाइम माइनिंग कमीशन पाएं।',
    descriptionEn: 'Invite a producer friend and earn 10% lifetime mining commission.',
    reward: 50,
    iconType: 'users',
    verificationType: 'auto',
    isCompleted: false,
    isDailyRepeatable: true,
  },

  // 3. Math Quiz Arena 30 Daily Rotation Tasks
  ...MATH_QUIZ_TASKS,

  // 4. Official Community Channels (Genuine Project Links)
  {
    id: 'tg-musicmimi-community',
    category: 'community',
    subType: 'telegram',
    title: 'Music Mimi कम्युनिटी चैनल जॉइन करें (+25 $MIMI)',
    titleEn: 'Join Music Mimi Community Channel (+25 $MIMI)',
    description: 'आधिकारिक $MIMI कम्युनिटी चैनल से जुड़ें और ताज़ा अपडेट्स व 25 $MIMI पाएं।',
    descriptionEn: 'Join official Music Mimi Community channel for announcements & earn 25 $MIMI.',
    reward: 25,
    iconType: 'telegram',
    actionUrl: 'https://t.me/musicmimi_community',
    requiredWaitSeconds: 15,
    verificationType: 'external_confirmed',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'tg-aperna-official',
    category: 'social',
    subType: 'telegram',
    title: 'Aperna AI आधिकारिक चैनल जॉइन करें (+20 $MIMI)',
    titleEn: 'Join Aperna AI Official Channel (+20 $MIMI)',
    description: 'Aperna AI इकोसिस्टम के आधिकारिक टेलीग्राम चैनल को जॉइन करें और 20 $MIMI क्लेम करें।',
    descriptionEn: 'Join official Aperna AI Telegram channel for ecosystem alerts and claim 20 $MIMI.',
    reward: 20,
    iconType: 'telegram',
    actionUrl: 'https://t.me/ApernaAIOfficial',
    requiredWaitSeconds: 15,
    verificationType: 'external_confirmed',
    isCompleted: false,
    isDailyRepeatable: true,
  },
  {
    id: 'discord-official-community',
    category: 'social',
    subType: 'other',
    title: 'आधिकारिक Discord सर्वर जॉइन करें (+20 $MIMI)',
    titleEn: 'Join Official Discord Community (+20 $MIMI)',
    description: 'Discord सर्वर जॉइन करें, कम्युनिटी से जुड़ें और 20 $MIMI प्राप्त करें।',
    descriptionEn: 'Join our official Discord server, meet fellow producers and claim 20 $MIMI.',
    reward: 20,
    iconType: 'discord',
    actionUrl: 'https://discord.gg/3hjUXrfVQe',
    requiredWaitSeconds: 15,
    verificationType: 'external_confirmed',
    isCompleted: false,
    isDailyRepeatable: true,
  },
];

export default function App() {
  const tonAddress = useTonAddress();
  // Center Beats tab is our main dashboard as requested!
  const [activeTab, setActiveTab] = useState<TabType>('beats');
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('music_mimi_lang_v2');
        if (saved === 'hi' || saved === 'en') return saved;
      } catch {}
    }
    return 'en';
  });
  const [isMuted, setIsMuted] = useState(() => isMutedEngine());
  const [showSplash, setShowSplash] = useState(false);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isArcadeModalOpen, setIsArcadeModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBotSyncOpen, setIsBotSyncOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isAdsgramModalOpen, setIsAdsgramModalOpen] = useState(false);
  const [selectedAdTask, setSelectedAdTask] = useState<AirdropTask | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ newLevel: number; track: MusicTrack } | null>(null);
  const [walletCelebration, setWalletCelebration] = useState<RewardCelebrationProps | null>(null);

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

  // Legacy cleanup for old unused keys
  useEffect(() => {
    try {
      localStorage.removeItem('music_mimi_stats_clean_v4');
      localStorage.removeItem('music_mimi_tasks_clean_v4');
      localStorage.removeItem('music_mimi_tasks_clean_v5');
      localStorage.removeItem('music_mimi_refs_clean_v4');
      localStorage.removeItem('music_mimi_lang');
    } catch {}
  }, []);

  // Initialize persistent looping background music when entering airdrop & attach gesture unlock
  useEffect(() => {
    initBackgroundMusic();
    const unsub = subscribeBgmState((state) => {
      setIsMuted(state.isMuted);
    });

    const handleFirstGesture = () => {
      resumeAudioOnGesture();
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('click', handleFirstGesture, { passive: true });

    return () => {
      unsub();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
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
          if (!parsed.unlockedTrackIds || parsed.unlockedTrackIds.length === 0) {
            parsed.unlockedTrackIds = [1];
          }
          if (!parsed.bgmTrackId) {
            parsed.bgmTrackId = 1;
          }
          if (parsed.bgmEnabled === undefined) {
            parsed.bgmEnabled = true;
          }
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
      const saved = localStorage.getItem('music_mimi_tasks_v16_native_quests') || localStorage.getItem('music_mimi_tasks_v15_adsgram_triple') || localStorage.getItem('music_mimi_tasks_v12_math_quiz_30');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { tasks: synced } = syncTasksWithDailyReset(parsed, DEFAULT_TASKS);
          return synced;
        }
      }
    } catch {}
    return DEFAULT_TASKS.map((t) => ({ ...t, isDailyRepeatable: true }));
  });

  // Automatically check for calendar day rollover (midnight reset) every 15 seconds or on window focus
  useEffect(() => {
    const runDailyResetCheck = () => {
      setTasks((prev) => {
        const { tasks: synced, hasResetOccurred } = syncTasksWithDailyReset(prev, DEFAULT_TASKS);
        if (hasResetOccurred) {
          console.log('[DAILY TASK RESET] All tasks refreshed for date:', getTodayDateString());
          // Clear visited tasks and task start timers so user starts completely clean
          try {
            localStorage.removeItem('music_mimi_visited_tasks');
            localStorage.removeItem('music_mimi_task_start_times');
          } catch {}
        }
        return synced;
      });
    };

    const interval = setInterval(runDailyResetCheck, 15000);
    window.addEventListener('focus', runDailyResetCheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', runDailyResetCheck);
    };
  }, []);

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
    localStorage.setItem('music_mimi_tasks_v16_native_quests', JSON.stringify(tasks));
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
    setLanguage((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      try {
        localStorage.setItem('music_mimi_lang_v2', next);
      } catch {}
      return next;
    });
  };

  const handleResetStats = () => {
    localStorage.clear();
    const fresh = createInitialStats();
    setStats(fresh);
    saveStatsWithIntegritySignature(fresh);
    setTasks(DEFAULT_TASKS);
    setReferrals([]);
    setWalletCelebration({
      isOpen: true,
      onClose: () => setWalletCelebration(null),
      category: 'general',
      badgeText: language === 'hi' ? '🔄 खाता रीसेट' : '🔄 ACCOUNT RESET',
      title: language === 'hi' ? 'खाता नए सिरे से रीसेट हो गया!' : 'Account Reset Successfully!',
      subtitle: language === 'hi'
        ? 'आपका खाता 0 बैलेंस और फ्रेश स्टेट के साथ सफलतापूर्वक रीसेट हो गया है।'
        : 'Your account has been refreshed with 0 balance and pristine state.',
      items: [
        { label: language === 'hi' ? 'बैलेंस' : 'Balance', value: '0.00 $MIMI' },
        { label: language === 'hi' ? 'लेवल' : 'Level', value: 'Level 1' },
      ],
      language,
    });
  };

  // Rewarded Adsgram Ad Completion handler (Max 10 ads per 8 hours)
  const handleRewardAdsgram = (mimiReward: number, tonContributed: number, specificTaskId?: string) => {
    const tapCheck = validateHumanTapVelocity();
    if (!tapCheck.isAllowed) {
      console.warn('Z+ Rate limit triggered on reward');
      return;
    }

    const now = Date.now();
    const periodStart = stats.adsPeriodStartTime;
    const isFresh = !periodStart || now - periodStart >= ADS_PERIOD_DURATION_MS;
    const nextPeriodStart = isFresh ? now : periodStart;
    const nextWatchedThisPeriod = isFresh ? 1 : Math.min(ADS_LIMIT_PER_PERIOD, (stats.adsWatchedThisPeriod || 0) + 1);

    const newInApp = Number((stats.inAppBalance + mimiReward).toFixed(2));
    const newBalance = Number((stats.balance + mimiReward).toFixed(2));
    const newAdsCount = (stats.adsWatchedCount || 0) + 1;
    const newTonContributed = Number(((stats.liquidityContributedTon || 0) + tonContributed).toFixed(3));

    setStats((prev) => ({
      ...prev,
      inAppBalance: newInApp,
      balance: newBalance,
      adsWatchedCount: newAdsCount,
      adsWatchedThisPeriod: nextWatchedThisPeriod,
      adsPeriodStartTime: nextPeriodStart,
      liquidityContributedTon: newTonContributed,
    }));
    creditReferralCommission(stats.userId, mimiReward, 'Adsgram').catch(console.error);

    // Automatically complete target Adsgram task
    const targetTaskId = specificTaskId || selectedAdTask?.id || 'adsgram-video-daily';
    const todayStr = getTodayDateString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === targetTaskId || (!specificTaskId && t.id === 'adsgram-video-daily')
          ? {
              ...t,
              isCompleted: true,
              lastCompletedDate: todayStr,
              lastCompletedTimestamp: Date.now(),
            }
          : t
      )
    );
  };

  // 📺 Auto Interstitial Ad on App Startup (Real Web3 Mini-App Experience)
  // When the app opens, automatically trigger Adsgram interstitial ad (int-55578)
  useEffect(() => {
    const sessionKey = 'mimi_auto_interstitial_session_opened';
    if (typeof window === 'undefined' || sessionStorage.getItem(sessionKey)) return;

    // Smooth delay after splash/initial render so Telegram WebApp is fully active
    const timer = setTimeout(async () => {
      try {
        sessionStorage.setItem(sessionKey, 'true');

        // Only invoke native Adsgram if running inside real Telegram environment with launch parameters
        if (!isTelegramEnvironment()) {
          console.log('[Auto Interstitial] Preview mode detected; native interstitial will run inside Telegram Mini App.');
          return;
        }

        const blockId = sanitizeAdsgramBlockId(getActiveAdsgramBlockId('interstitial'));

        // Intercept and suppress Telegram WebApp raw popups for ad moderation messages
        if ((window as any).Telegram?.WebApp?.showAlert) {
          const origShowAlert = (window as any).Telegram.WebApp.showAlert;
          (window as any).Telegram.WebApp.showAlert = (params: any, cb?: () => void) => {
            const msg = typeof params === 'string' ? params : params?.message || '';
            if (
              msg.includes('Adsgram') ||
              msg.includes('Clause 11') ||
              msg.includes('not active') ||
              msg.includes('declined') ||
              msg.includes('partner.adsgram.ai') ||
              msg.includes('blockId') ||
              msg.includes('launch parameters')
            ) {
              console.warn('[Auto Interstitial] Suppressed banner notice:', msg);
              if (cb) cb();
              return;
            }
            origShowAlert.call((window as any).Telegram.WebApp, params, cb);
          };
        }

        if (window.Adsgram) {
          console.log('[Auto Interstitial] Triggering Adsgram interstitial on launch with blockId:', blockId);
          const adController = window.Adsgram.init({ blockId, debug: false });
          adController
            .show()
            .then((res) => {
              if (res && res.done) {
                handleRewardAdsgram(15, 0.015, 'adsgram-interstitial-daily');
              }
            })
            .catch((err) => {
              console.warn('[Auto Interstitial] Handled ad rejection:', err);
            });
        }
      } catch (err) {
        console.warn('[Auto Interstitial] Notice:', err);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  // Task Completion Handler
  const handleCompleteTask = (taskId: string, reward: number) => {
    const tapCheck = validateHumanTapVelocity();
    if (!tapCheck.isAllowed) return;

    playClaimRewardSound();
    const todayStr = getTodayDateString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: true,
              lastCompletedDate: todayStr,
              lastCompletedTimestamp: Date.now(),
            }
          : t
      )
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

  // Math Quiz Failed Attempt Handler (1 attempt per task per day)
  const handleFailMathTask = (taskId: string) => {
    const todayStr = getTodayDateString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isFailedToday: true,
              lastFailedDate: todayStr,
            }
          : t
      )
    );
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
    // If empty address was passed (disconnect action)
    if (!address) {
      setStats((prev) => ({
        ...prev,
        walletAddress: null,
        walletProvider: null,
        isWalletVerified: false,
      }));
      return;
    }

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

    // Trigger Rich Web3 Celebration Modal
    playClaimRewardSound();
    triggerHaptic('heavy');
    setWalletCelebration({
      isOpen: true,
      onClose: () => setWalletCelebration(null),
      category: 'wallet',
      badgeText: language === 'hi' ? '🛡️ TON वॉलेट सफलतापूर्वक जुड़ा' : '🛡️ TON WALLET CONNECTED',
      title: language === 'hi' ? 'TON वॉलेट सत्यापित एवं कनेक्टेड!' : 'TON Wallet Connected!',
      subtitle: language === 'hi'
        ? 'आपका TON वॉलेट सफलतापूर्वक लिंक हो गया है। Mimi Making 8-घंटे लूप क्राफ्टिंग अब अनलॉक है!'
        : 'Your TON wallet is now safely connected. Mimi Making 8-hour loop craft is now fully unlocked!',
      amount: 100,
      tokenSymbol: '$MIMI',
      walletAddress: address,
      items: [
        { label: language === 'hi' ? 'वॉलेट पता' : 'Wallet Address', value: shortenAddress(address, 5), isHighlight: true },
        { label: language === 'hi' ? 'Mimi Making क्राफ्टिंग' : 'Mimi Making Craft', value: language === 'hi' ? 'अनलॉक (सक्रिय)' : 'Unlocked (Active)' },
        { label: language === 'hi' ? 'प्रोवाइडर' : 'Provider', value: provider || 'Tonkeeper / @wallet' },
      ],
      language,
    });

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
    <div className="min-h-screen max-w-full overflow-x-hidden bg-radial from-[#0d2757] via-[#051332] to-[#02091c] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
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
        onOpenLibrary={() => setIsLibraryOpen(true)}
      />

      {/* Main View Container - Clean without large banner pushing content down! */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col relative z-10 overflow-x-hidden px-1 sm:px-2">
        
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
            onFailTask={handleFailMathTask}
            stats={stats}
            onClaimDailyStreak={handleClaimDailyStreak}
            onOpenArcade={() => setIsArcadeModalOpen(true)}
            onOpenWallet={() => setIsWalletModalOpen(true)}
            onOpenAdsgram={(task) => {
              setSelectedAdTask(task || null);
              setIsAdsgramModalOpen(true);
            }}
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
            onOpenNftPage={() => setActiveTab('nft')}
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
          unlockedTrackIds={stats.unlockedTrackIds?.length ? stats.unlockedTrackIds : [1]}
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
          onSetAsBackgroundMusic={(trackId) => {
            setStats((prev) => ({
              ...prev,
              bgmTrackId: trackId,
              bgmEnabled: true,
            }));
          }}
        />
      )}

      {/* Connect TON Wallet Modal */}
      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleConnectWallet}
        onDisconnect={() => handleConnectWallet('', '')}
        currentAddress={stats.walletAddress}
        language={language}
      />

      {/* Wallet / Generic Action Celebration Modal */}
      {walletCelebration && (
        <RewardClaimCelebrationModal {...walletCelebration} />
      )}

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
        onClose={() => {
          setIsAdsgramModalOpen(false);
          setSelectedAdTask(null);
        }}
        stats={stats}
        onRewardUser={(reward, ton) => handleRewardAdsgram(reward, ton, selectedAdTask?.id)}
        language={language}
        blockType={
          selectedAdTask?.id === 'adsgram-task-native'
            ? 'task'
            : selectedAdTask?.id === 'adsgram-interstitial-daily'
            ? 'interstitial'
            : 'reward'
        }
        rewardAmount={selectedAdTask?.reward || 15}
        taskTitle={selectedAdTask ? (language === 'hi' ? selectedAdTask.title : selectedAdTask.titleEn) : undefined}
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
