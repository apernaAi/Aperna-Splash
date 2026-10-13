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
import { ApernaNftMintModal } from './components/ApernaNftMintModal.tsx';
import { ApernaNftPage } from './components/ApernaNftPage.tsx';
import { ZPlusSecurityModal } from './components/ZPlusSecurityModal.tsx';
import { setMuteState, playClaimRewardSound } from './utils/audioEngine.ts';
import { saveStatsWithIntegritySignature, verifyLocalStorageIntegrity, validateHumanTapVelocity } from './utils/securityEngine.ts';

function getTelegramUser() {
  if (typeof window !== 'undefined') {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { first_name?: string; username?: string; id?: number } } } } }).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg) {
      return {
        name: tg.first_name || 'Mimi Artist',
        username: tg.username ? `@${tg.username}` : '@mimi_user',
        id: tg.id ? `MIMI_${tg.id}` : `MIMI_${Math.floor(1000 + Math.random() * 9000)}`,
      };
    }
  }
  return {
    name: 'Mimi Producer',
    username: '@mimi_producer',
    id: `MIMI_${Math.floor(1000 + Math.random() * 9000)}`,
  };
}

// FRESH ZERO-BALANCE DEFAULT STATE
function createInitialStats(): UserStats {
  const tg = getTelegramUser();
  return {
    userId: tg.id,
    name: tg.name,
    telegramUsername: tg.username,
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
    id: "dolicash-task-offer",
    category: "partner",
    title: "Dolicash स्पेशल टास्क (+100 $MIMI)",
    titleEn: "Dolicash Special Offer (+100 $MIMI)",
    description: "Dolicash ऑफर पूरा करें और 100 $MIMI टोकन तुरंत प्राप्त करें।",
    descriptionEn: "Complete the Dolicash offer via tracking link to earn 100 $MIMI.",
    reward: 100,
    iconType: "flame",
    actionUrl: "https://www.fastrsrvr.com/view.php?id=5547102&pub=3366972",
    verificationType: "external_confirmed",
    isCompleted: false,
  },
  {
    id: "adsgram-lp-booster",
    category: "adsgram",
    title: "स्पॉन्सर वीडियो देखें (+15 $MIMI)",
    titleEn: "Watch Sponsor Video (+15 $MIMI)",
    description: "15-सेकंड का वीडियो देखकर तुरंत 15 $MIMI टोकन अर्जित करें।",
    descriptionEn: "Watch a 15-second sponsor video to earn 15 $MIMI instantly.",
    reward: 15,
    iconType: "adsgram",
    isAdsgramTask: true,
    verificationType: "ad_watched",
    lpBoostTon: 0.015,
    isCompleted: false,
  },
];

export default function App() {
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
  const [isNftMintModalOpen, setIsNftMintModalOpen] = useState(false);
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
      const saved = localStorage.getItem('music_mimi_stats_v7_real_lp');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify local storage tamper proofing
        if (verifyLocalStorageIntegrity(parsed)) {
          return parsed;
        } else {
          console.warn('Z+ Security Alert: LocalStorage tamper detected. Resetting to verified initial state.');
        }
      }
    } catch {}
    return createInitialStats();
  });

  const [tasks, setTasks] = useState<AirdropTask[]>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_tasks_v7_real_lp');
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
    localStorage.setItem('music_mimi_tasks_v7_real_lp', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('music_mimi_refs_v7_real_lp', JSON.stringify(referrals));
  }, [referrals]);

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
  };

  // Wallet Bind
  const handleConnectWallet = (address: string, provider: string) => {
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
        onOpenNftModal={() => setIsNftMintModalOpen(true)}
        onOpenNftPage={() => setActiveTab('nft')}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        activeTab={activeTab}
        onBack={() => setActiveTab('beats')}
      />

      {/* Main View Container - Clean without large banner pushing content down! */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col relative z-10">
        
        {/* CENTER TAB: Main Dashboard -> Mimi Making */}
        {activeTab === 'beats' && (
          <MimiMakingDashboard
            stats={stats}
            onUpdateStats={setStats}
            language={language}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenWallet={() => setIsWalletModalOpen(true)}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            onLevelUpCelebration={handleLevelUpCelebration}
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
            onOpenAdsgramModal={() => setIsAdsgramModalOpen(true)}
            language={language}
          />
        )}

        {/* Tab 2: Studio Gear */}
        {activeTab === 'studio' && (
          <MinerUpgradesView
            stats={stats}
            onUpdateStats={setStats}
            language={language}
            onOpenArcade={() => setIsArcadeModalOpen(true)}
          />
        )}

        {/* Tab 4: Vault & Wallet */}
        {activeTab === 'vault' && (
          <AirdropWalletView
            stats={stats}
            onUpdateStats={setStats}
            onOpenConnectWallet={() => setIsWalletModalOpen(true)}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            onOpenNftModal={() => setIsNftMintModalOpen(true)}
            language={language}
          />
        )}

        {/* Tab 5: Profile & Squad */}
        {activeTab === 'profile' && (
          <FrensView
            stats={stats}
            referrals={referrals}
            onUpdateStats={setStats}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            language={language}
          />
        )}

        {/* Tab 6: 👑 DEDICATED APERNA GENESIS NFT PAGE ($0.50) */}
        {activeTab === 'nft' && (
          <ApernaNftPage
            language={language}
            stats={stats}
            onOpenMintModal={() => setIsNftMintModalOpen(true)}
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

      {/* APERNA AI GENESIS MEMORIAL NFT MINT MODAL ($0.50 USD) */}
      <ApernaNftMintModal
        isOpen={isNftMintModalOpen}
        onClose={() => setIsNftMintModalOpen(false)}
        language={language}
        stats={stats}
        onUpdateStats={setStats}
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
