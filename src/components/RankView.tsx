/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, Zap, Sparkles, Info, CheckCircle2,
  Users, Share2, Wallet
} from 'lucide-react';
import { UserStats, AirdropTask, Language, RankedUser, calculateRankScore } from '../types/airdrop.ts';
import { listenToLiveLeaderboard, updateUserRankScore } from '../utils/referralCloudService.ts';
import { playTapSound, playClaimRewardSound } from '../utils/audioEngine.ts';
import { shortenAddress } from '../utils/tonService.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { TelegramIcon } from './TelegramIcon.tsx';

interface Props {
  stats: UserStats;
  tasks: AirdropTask[];
  language: Language;
  onOpenTasks: () => void;
  onOpenBeats: () => void;
  onOpenConnectWallet: () => void;
}

type SortFilter = 'score' | 'level' | 'balance' | 'tasks';

export const RankView: React.FC<Props> = ({
  stats,
  tasks,
  language,
  onOpenTasks,
  onOpenBeats,
  onOpenConnectWallet,
}) => {
  const [rankedUsers, setRankedUsers] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SortFilter>('score');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('अभी-अभी (Just now)');

  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const currentScore = calculateRankScore({
    level: stats.level,
    balance: stats.balance,
    tasksCompletedCount: completedTasksCount,
    dailyStreakDay: stats.dailyStreakDay || 1,
  });

  // Listen to live users in Cloud Firestore in real-time
  useEffect(() => {
    setIsLoading(true);
    const unsub = listenToLiveLeaderboard((users) => {
      setRankedUsers(users);
      setIsLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 100);

    return () => unsub();
  }, []);

  // Proactively ensure current user's latest stats are pushed to Firestore ranking
  useEffect(() => {
    updateUserRankScore(stats.userId, {
      level: stats.level,
      balance: stats.balance,
      tasksCompletedCount: completedTasksCount,
      dailyStreakDay: stats.dailyStreakDay || 1,
      roleTitle: stats.roleTitle,
      walletAddress: stats.walletAddress,
    }).catch(console.error);
  }, [stats.level, stats.balance, completedTasksCount, stats.dailyStreakDay, stats.walletAddress]);

  const shareCode = stats.userId.replace(/^MIMI_/, '');
  const telegramBotDeepLink = `https://t.me/Musicmimi_bot/app?startapp=ref_${shareCode}`;

  const handleShareTelegram = () => {
    playTapSound();
    const text = `🎵 म्यूजिक मिमी ($MIMI) ऑफिशियल एयरड्रॉप लाइव है! 🐱✨\nफ्री लूप्स बनाएं, लेवल बढ़ाएं और मेरे साथ लाइव लीडरबोर्ड में मुकाबला करें!\n\n👇 अभी शुरू करें और फ्री 100 $MIMI पाएं:\n${telegramBotDeepLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(telegramBotDeepLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Check if current user has connected Tonkeeper / TON wallet
  const isUserWalletConnected = Boolean(
    stats.walletAddress && typeof stats.walletAddress === 'string' && stats.walletAddress.trim() !== '' && stats.walletAddress !== 'null'
  );

  // Merge or ensure current user is represented in the list IF they have connected Tonkeeper
  const allUsersMap = new Map<string, RankedUser>();
  rankedUsers.forEach((u) => {
    // STRICT TONKEEPER ENFORCEMENT: Only users with a connected Tonkeeper / TON wallet are allowed
    if (u.walletAddress && typeof u.walletAddress === 'string' && u.walletAddress.trim() !== '' && u.walletAddress !== 'null') {
      allUsersMap.set(u.userId, u);
    }
  });

  // Current user's live representation (Only included in leaderboard if Tonkeeper is connected!)
  if (isUserWalletConnected) {
    allUsersMap.set(stats.userId, {
      userId: stats.userId,
      name: stats.name || 'Mimi Artist',
      telegramUsername: stats.telegramUsername || '@mimi_user',
      walletAddress: stats.walletAddress,
      level: stats.level,
      balance: Number(stats.balance.toFixed(2)),
      tasksCompletedCount: completedTasksCount,
      dailyStreakDay: stats.dailyStreakDay || 1,
      score: currentScore,
      roleTitle: stats.roleTitle || `सोनिक पायनियर ${stats.level}`,
      lastActive: new Date().toISOString(),
      avatarUrl: stats.avatarUrl,
    });
  }

  const mergedList = Array.from(allUsersMap.values());

  // Strictly filter: ONLY users who have connected Tonkeeper
  const realUsersList = mergedList.filter((u) => {
    // 1. Must have a real connected Tonkeeper / TON wallet address
    if (!u.walletAddress || typeof u.walletAddress !== 'string' || u.walletAddress.trim() === '' || u.walletAddress === 'null') {
      return false;
    }

    // 2. Filter out fake pioneer names
    const isFakePioneer =
      u.userId.startsWith('MIMI_AARAV') ||
      u.userId.startsWith('MIMI_PRIYA') ||
      u.userId.startsWith('MIMI_ROHAN') ||
      u.userId.startsWith('MIMI_VIKRAM') ||
      u.userId.startsWith('MIMI_ANANYA') ||
      u.userId.startsWith('MIMI_KABIR') ||
      u.userId.startsWith('MIMI_SNEHA') ||
      u.userId.startsWith('MIMI_DEVANSH');
    if (isFakePioneer) return false;

    return true;
  });

  // Apply sorting filter
  const sortedList = [...realUsersList].sort((a, b) => {
    if (filter === 'level') {
      return b.level - a.level || b.score - a.score || b.balance - a.balance;
    }
    if (filter === 'balance') {
      return b.balance - a.balance || b.score - a.score || b.level - a.level;
    }
    if (filter === 'tasks') {
      return b.tasksCompletedCount - a.tasksCompletedCount || b.score - a.score;
    }
    // Default: Overall rank score
    return b.score - a.score || b.level - a.level || b.balance - a.balance;
  });

  // Find user's current standing among verified Tonkeeper users
  const userRankIndex = isUserWalletConnected ? sortedList.findIndex((u) => u.userId === stats.userId) : -1;
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const userAhead = userRankIndex > 0 ? sortedList[userRankIndex - 1] : null;
  const pointsToOvertake = userAhead ? Math.max(1, userAhead.score - currentScore + 1) : 0;

  const top3 = sortedList.slice(0, 3);
  const remainingList = sortedList.slice(3);

  const getRankBadge = (rankNumber: number) => {
    if (rankNumber === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.7)] border border-yellow-200">
          👑
        </div>
      );
    }
    if (rankNumber === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-300 text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(226,232,240,0.6)] border border-white">
          🥈
        </div>
      );
    }
    if (rankNumber === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-orange-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(217,119,6,0.6)] border border-amber-300">
          🥉
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-mono font-black text-xs shadow-inner">
        #{rankNumber}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col px-3 sm:px-4 pt-3 pb-24 overflow-y-auto max-w-md mx-auto w-full select-none">
      
      {/* Top Live Status Bar */}
      <div className="flex items-center justify-between bg-[#07193f]/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-3 shadow-[0_6px_25px_rgba(0,10,35,0.7)] mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-300">
                {language === 'hi' ? 'लाइव रैंकिंग सिंक' : 'Live Cloud Ranking'}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-400/40">
                🛡️ केवल Tonkeeper वॉलेट धारक
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono">
              {language === 'hi' ? `सत्यापित Tonkeeper प्रोड्यूसर्स: ${sortedList.length}` : `Tonkeeper Verified Producers: ${sortedList.length}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Info Modal Button */}
          <button
            onClick={() => {
              playTapSound();
              setShowInfoModal(true);
            }}
            className="p-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs transition-all cursor-pointer"
            title="रैंक स्कोर कैसे बनता है?"
          >
            <Info className="w-4 h-4 text-cyan-300" />
          </button>
        </div>
      </div>

      {/* 100% Real Telegram Community Invitation Banner */}
      {sortedList.length <= 2 && (
        <div className="w-full rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-cyan-950/80 border border-cyan-400/40 p-3.5 mb-3 flex items-start gap-3 shadow-md">
          <div className="w-8 h-8 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
            <TelegramIcon className="w-4 h-4 text-[#24A1DE]" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-black text-cyan-300 block">
              {language === 'hi' ? '🌟 100% असली टेलीग्राम लीडरबोर्ड' : '100% Real Telegram Leaderboard'}
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              {language === 'hi'
                ? 'यहाँ केवल असली टेलीग्राम यूज़र्स ही अपनी रैंक देख सकते हैं। दोस्तों को अपना लिंक भेजें और उन्हें इस लीडरबोर्ड में लाइव मुकाबला करने के लिए बुलाएं!'
                : 'Only genuine Telegram users appear here. Share your invite link with friends to challenge them on this live board!'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleShareTelegram}
                className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-black text-[10.5px] shadow active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-950" />
                <span>{language === 'hi' ? '🚀 टेलीग्राम पर इनवाइट करें' : '🚀 Invite on Telegram'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero: User's Personal Live Standing Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a235c] via-[#091d4d] to-[#04102c] border border-cyan-400/50 p-4 shadow-[0_12px_35px_rgba(0,210,255,0.2)] mb-4">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Rank badge */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px] shadow-[0_0_20px_rgba(0,210,255,0.5)]">
                  <div className="w-full h-full bg-[#051336] rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-[9px] font-black uppercase text-cyan-300 tracking-wider">रैंक</span>
                    <span className="text-xl font-black text-white font-mono leading-none">#{userRank}</span>
                  </div>
                </div>
                {userRank === 1 && (
                  <span className="absolute -top-2 -right-2 text-base">👑</span>
                )}
              </div>
            </div>

            {/* Avatar Logo Thumbnail */}
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-sky-300 to-blue-500 flex-shrink-0 shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#05173e] flex items-center justify-center">
                {stats.avatarUrl ? (
                  <img src={stats.avatarUrl} alt={stats.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-white">{stats.name ? stats.name.slice(0, 2).toUpperCase() : 'MM'}</span>
                )}
              </div>
            </div>

            {/* User credentials */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base leading-tight">
                  {stats.name || 'Mimi Artist'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-400/30">
                  आप (You)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-200 font-mono">
                <TelegramIcon className="w-3.5 h-3.5 text-[#229ED9] flex-shrink-0" />
                <span className="font-semibold">{stats.telegramUsername || '@mimi_user'}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-sky-300 border border-blue-400/40 text-[10px] font-bold">
                  🎚️ लेवल {stats.level}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                  🪙 {stats.balance.toFixed(1)} $MIMI
                </span>
              </div>
            </div>
          </div>

          {/* User Score Ticker */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" />
              पावर स्कोर
            </span>
            <span className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300 drop-shadow-[0_0_12px_rgba(0,210,255,0.7)]">
              {currentScore.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">अंक (Points)</span>
          </div>
        </div>

        {/* Detailed Score Multipliers Breakdown */}
        <div className="mt-3 pt-3 border-t border-cyan-500/20 grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-[#061539]/80 rounded-xl p-1.5 border border-cyan-500/20">
            <span className="block text-[9px] text-slate-400 font-bold">लेवल ({stats.level})</span>
            <span className="text-[11px] font-black text-cyan-300 font-mono">+{stats.level * 1000}</span>
          </div>
          <div className="bg-[#061539]/80 rounded-xl p-1.5 border border-cyan-500/20">
            <span className="block text-[9px] text-slate-400 font-bold">टोकन ({Math.floor(stats.balance)})</span>
            <span className="text-[11px] font-black text-amber-300 font-mono">+{Math.floor(stats.balance * 2)}</span>
          </div>
          <div className="bg-[#061539]/80 rounded-xl p-1.5 border border-cyan-500/20">
            <span className="block text-[9px] text-slate-400 font-bold">टास्क ({completedTasksCount})</span>
            <span className="text-[11px] font-black text-emerald-300 font-mono">+{completedTasksCount * 150}</span>
          </div>
          <div className="bg-[#061539]/80 rounded-xl p-1.5 border border-cyan-500/20">
            <span className="block text-[9px] text-slate-400 font-bold">स्ट्राइक ({stats.dailyStreakDay || 1})</span>
            <span className="text-[11px] font-black text-rose-300 font-mono">+{(stats.dailyStreakDay || 1) * 100}</span>
          </div>
        </div>

        {/* Next Rank Overtake Target */}
        <div className="mt-3 flex items-center justify-between bg-cyan-950/40 rounded-xl px-3 py-2 border border-cyan-400/30">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[10.5px] font-bold text-slate-200">
              {userRank === 1 ? (
                <span className="text-amber-300 font-black">🎉 आप लीडरबोर्ड में नंबर 1 पर हैं!</span>
              ) : (
                <span>
                  अगले रैंक (#{userRank ? userRank - 1 : 1}) के लिए सिर्फ{' '}
                  <strong className="text-cyan-300 font-mono font-black">+{pointsToOvertake}</strong> स्कोर चाहिए!
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                playTapSound();
                onOpenTasks();
              }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[10px] font-black shadow transition-all cursor-pointer"
            >
              टास्क करें (+150)
            </button>
            <button
              onClick={() => {
                playTapSound();
                onOpenBeats();
              }}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-[10px] font-black shadow transition-all cursor-pointer"
            >
              बीट्स बनाएं
            </button>
          </div>
        </div>
      </div>

      {/* Sorting & Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#051336] p-1 rounded-2xl border border-cyan-500/25 mb-3">
        <button
          onClick={() => {
            playTapSound();
            setFilter('score');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-black tracking-tight transition-all cursor-pointer ${
            filter === 'score'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.6)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          👑 {language === 'hi' ? 'टॉप स्कोर' : 'Overall Rank'}
        </button>
        <button
          onClick={() => {
            playTapSound();
            setFilter('level');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-black tracking-tight transition-all cursor-pointer ${
            filter === 'level'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.6)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎚️ {language === 'hi' ? 'लेवल' : 'Levels'}
        </button>
        <button
          onClick={() => {
            playTapSound();
            setFilter('balance');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-black tracking-tight transition-all cursor-pointer ${
            filter === 'balance'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.6)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🪙 {language === 'hi' ? 'टोकन' : '$MIMI'}
        </button>
        <button
          onClick={() => {
            playTapSound();
            setFilter('tasks');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-black tracking-tight transition-all cursor-pointer ${
            filter === 'tasks'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.6)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📋 {language === 'hi' ? 'टास्क' : 'Quests'}
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4 items-end pt-3">
          
          {/* #2 Silver (Left) */}
          {top3[1] ? (
            <div className={`relative flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-[#0b214f] to-[#041029] border ${
              top3[1].userId === stats.userId ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-slate-400/40'
            } shadow-[0_4px_18px_rgba(0,0,0,0.5)]`}>
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black text-xs shadow-md border border-white">
                2
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-700/60 border border-slate-300/40 flex items-center justify-center text-lg mb-1 mt-1 shadow-inner">
                🥈
              </div>
              <span className="font-bold text-[11px] text-slate-100 truncate max-w-[85px] text-center">
                {top3[1].name}
              </span>
              <div className="flex items-center gap-1 mt-0.5 justify-center max-w-[85px] text-[9.5px] text-slate-300 font-mono truncate">
                <TelegramIcon className="w-3 h-3 text-[#24A1DE] shrink-0" />
                <span className="truncate">{top3[1].telegramUsername}</span>
              </div>
              <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-200 text-[9.5px] font-mono font-black">
                {top3[1].score.toLocaleString()} pts
              </div>
              <span className="text-[8.5px] text-cyan-300 font-bold mt-0.5">
                Lvl {top3[1].level} • {top3[1].balance.toFixed(0)} $MIMI
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-[#07173b]/40 border border-dashed border-cyan-500/20 flex flex-col items-center justify-center text-slate-500 text-[10px]">
              खाली
            </div>
          )}

          {/* #1 Gold Champion (Center - Raised) */}
          {top3[0] && (
            <div className={`relative flex flex-col items-center p-3 rounded-2xl bg-gradient-to-b from-[#163878] via-[#0d275a] to-[#051336] border-2 ${
              top3[0].userId === stats.userId ? 'border-amber-300 ring-4 ring-amber-400/40' : 'border-amber-400/80'
            } shadow-[0_8px_30px_rgba(245,158,11,0.35)] -mt-2`}>
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-sm shadow-lg border border-yellow-100 animate-bounce">
                👑
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-300 flex items-center justify-center text-2xl mb-1 mt-1 shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                🥇
              </div>
              <span className="font-black text-xs text-amber-200 truncate max-w-[95px] text-center">
                {top3[0].name}
              </span>
              <div className="flex items-center gap-1 mt-0.5 justify-center max-w-[95px] text-[10px] text-amber-300/90 font-mono font-bold truncate">
                <TelegramIcon className="w-3.5 h-3.5 text-[#24A1DE] shrink-0" />
                <span className="truncate">{top3[0].telegramUsername}</span>
              </div>
              <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-400/30 text-amber-200 text-[10.5px] font-mono font-black shadow-sm">
                {top3[0].score.toLocaleString()} pts
              </div>
              <span className="text-[9px] text-yellow-300 font-bold mt-0.5">
                Lvl {top3[0].level} • {top3[0].balance.toFixed(0)} $MIMI
              </span>
            </div>
          )}

          {/* #3 Bronze (Right) */}
          {top3[2] ? (
            <div className={`relative flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-[#0b214f] to-[#041029] border ${
              top3[2].userId === stats.userId ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-amber-700/40'
            } shadow-[0_4px_18px_rgba(0,0,0,0.5)]`}>
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-md border border-amber-300">
                3
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-600/40 flex items-center justify-center text-lg mb-1 mt-1 shadow-inner">
                🥉
              </div>
              <span className="font-bold text-[11px] text-slate-100 truncate max-w-[85px] text-center">
                {top3[2].name}
              </span>
              <div className="flex items-center gap-1 mt-0.5 justify-center max-w-[85px] text-[9.5px] text-slate-400 font-mono truncate">
                <TelegramIcon className="w-3 h-3 text-[#24A1DE] shrink-0" />
                <span className="truncate">{top3[2].telegramUsername}</span>
              </div>
              <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-700/20 text-orange-200 text-[9.5px] font-mono font-black">
                {top3[2].score.toLocaleString()} pts
              </div>
              <span className="text-[8.5px] text-cyan-300 font-bold mt-0.5">
                Lvl {top3[2].level} • {top3[2].balance.toFixed(0)} $MIMI
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-[#07173b]/40 border border-dashed border-cyan-500/20 flex flex-col items-center justify-center text-slate-500 text-[10px]">
              खाली
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          {language === 'hi' ? 'लाइव प्रोड्यूसर्स लिस्ट' : 'Live Producers List'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          अपडेट: {lastSyncTime}
        </span>
      </div>

      {/* User Rows */}
      <div className="flex flex-col gap-2 mb-4">
        {sortedList.map((user, idx) => {
          const rankNum = idx + 1;
          const isCurrentUser = user.userId === stats.userId;

          return (
            <div
              key={user.userId}
              className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-200 ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-[#0c2e6f] via-[#092257] to-[#05173d] border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.35)]'
                  : 'bg-[#071a42]/80 hover:bg-[#0b2458] border border-cyan-500/20 shadow-sm'
              }`}
            >
              {/* Left: Rank Badge & User Avatar */}
              <div className="flex items-center gap-2.5">
                {getRankBadge(rankNum)}

                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#05173e] border border-cyan-400/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[11px] font-black text-white">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'MM'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-100">
                      {user.name}
                    </span>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black uppercase">
                        आप
                      </span>
                    )}
                    {user.walletAddress && (
                      <span className="inline-flex items-center text-emerald-400 text-[10px]" title="TON Wallet Verified">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1 text-sky-400 font-bold">
                      <TelegramIcon className="w-3.5 h-3.5 text-[#24A1DE] shrink-0" />
                      <span>{user.telegramUsername}</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <span className="text-cyan-300 font-bold">Lvl {user.level}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-300 font-bold">{user.tasksCompletedCount} टास्क</span>
                  </div>
                </div>
              </div>

              {/* Right: Score & Token Balance */}
              <div className="flex flex-col items-end">
                <span className="font-mono font-black text-sm text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  {user.score.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-300 font-mono font-bold">
                  {user.balance.toFixed(1)} $MIMI
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transparent Calculation Explainer Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0c265f] via-[#071a47] to-[#030d26] border border-cyan-400/50 p-5 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">
                  {language === 'hi' ? 'रैंक स्कोर कैसे काम करता है?' : 'How Rank Score Works'}
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              यह पूरी तरह से <strong>100% असली यूज़र्स</strong> का लाइव लीडरबोर्ड है। आपका रैंक स्कोर क्लाउड में रीयल-टाइम अपडेट होता है:
            </p>

            <div className="space-y-2 mb-4 text-xs font-mono">
              <div className="flex items-center justify-between bg-cyan-950/60 p-2 rounded-xl border border-cyan-500/30">
                <span className="text-cyan-300 font-bold">🎚️ लेवल मल्टीप्लायर:</span>
                <span className="text-white font-black">+1,000 अंक प्रति लेवल</span>
              </div>
              <div className="flex items-center justify-between bg-amber-950/60 p-2 rounded-xl border border-amber-500/30">
                <span className="text-amber-300 font-bold">🪙 $MIMI होल्डिंग्स:</span>
                <span className="text-white font-black">+2 अंक प्रति $MIMI टोकन</span>
              </div>
              <div className="flex items-center justify-between bg-emerald-950/60 p-2 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-300 font-bold">📋 पूरे किए गए टास्क:</span>
                <span className="text-white font-black">+150 अंक प्रति टास्क</span>
              </div>
              <div className="flex items-center justify-between bg-rose-950/60 p-2 rounded-xl border border-rose-500/30">
                <span className="text-rose-300 font-bold">🔥 डेली स्ट्राइक दिन:</span>
                <span className="text-white font-black">+100 अंक प्रति स्ट्राइक</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 text-[11px] text-cyan-200 leading-relaxed mb-4">
              💡 <strong>रैंक ऊपर ले जाने का सीक्रेट:</strong> रोज़ टास्क पूरे करें, 8 घंटे का लूप पूरा करके नए ट्रैक अनलॉक करें और लेवल 10 तक पहुंचें!
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              समझ गया (Got It!)
            </button>
          </div>
        </div>
      )}



    </div>
  );
};
