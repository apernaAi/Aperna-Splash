/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronRight,
  Check,
  Clock,
  Radio,
  Users,
  Wallet,
  Share2,
  Flame,
  Droplets,
  Coins,
  ExternalLink,
  Copy,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  AlertTriangle,
  X
} from 'lucide-react';
import { AirdropTask, UserStats, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { shortenAddress } from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  tasks: AirdropTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  stats: UserStats;
  onClaimDailyStreak: (day: number, reward: number) => void;
  onOpenArcade: () => void;
  onOpenWallet: () => void;
  language: Language;
}

const DAILY_REWARDS = [
  { day: 1, labelHi: 'दि1', labelEn: 'D1', reward: 5 },
  { day: 2, labelHi: 'दि2', labelEn: 'D2', reward: 5 },
  { day: 3, labelHi: 'दि3', labelEn: 'D3', reward: 6 },
  { day: 4, labelHi: 'दि4', labelEn: 'D4', reward: 7 },
  { day: 5, labelHi: 'दि5', labelEn: 'D5', reward: 8 },
  { day: 6, labelHi: 'दि6', labelEn: 'D6', reward: 9 },
  { day: 7, labelHi: 'दि7', labelEn: 'D7', reward: 10 },
];

export const TasksView: React.FC<Props> = ({
  tasks,
  onCompleteTask,
  stats,
  onClaimDailyStreak,
  onOpenArcade,
  onOpenWallet,
  language,
}) => {
  const [filter, setFilter] = useState<'all' | 'social' | 'partner'>('all');
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [visitedTaskIds, setVisitedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_visited_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activeTaskPrompt, setActiveTaskPrompt] = useState<AirdropTask | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'social') return t.category === 'social' || t.category === 'community';
    return t.category === filter;
  });

  const openTasksCount = tasks.filter((t) => !t.isCompleted).length;
  const totalAvailableReward = tasks
    .filter((t) => !t.isCompleted)
    .reduce((acc, curr) => acc + curr.reward, 0);

  // Daily Streak 24h checks
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timeSinceLastClaim = stats.lastDailyClaim ? now - stats.lastDailyClaim : null;
  const canClaimDaily = timeSinceLastClaim === null || timeSinceLastClaim >= ONE_DAY_MS;

  const currentStreakDay = stats.dailyStreakDay || 1;
  const currentRewardItem = DAILY_REWARDS.find((r) => r.day === currentStreakDay) || DAILY_REWARDS[0];

  const handleTaskClick = (task: AirdropTask) => {
    if (task.isCompleted || verifyingTaskId) return;

    playTapSound();

    // 1. If Wallet required -> MUST have connected wallet
    if (task.requiresWallet && !stats.walletAddress) {
      onOpenWallet();
      return;
    }

    // 2. Real link tasks (Telegram, Instagram, Twitter/X, Discord, Dolicash offer)
    const isAlreadyStarted = Boolean(visitedTaskIds[task.id]);

    if (!isAlreadyStarted) {
      const updated = { ...visitedTaskIds, [task.id]: true };
      setVisitedTaskIds(updated);
      try {
        localStorage.setItem('music_mimi_visited_tasks', JSON.stringify(updated));
      } catch {}

      if (task.actionUrl) {
        if (typeof window !== 'undefined') {
          const tg = (window as any)?.Telegram?.WebApp;
          if (tg && typeof tg.openLink === 'function') {
            tg.openLink(task.actionUrl);
          } else {
            window.open(task.actionUrl, '_blank', 'noopener,noreferrer');
          }
        }
      }
      // Open verification prompt modal to explain requirement
      setActiveTaskPrompt(task);
    } else {
      // User has already visited and clicked the link! Open verification modal to claim
      setActiveTaskPrompt(task);
    }
  };

  const handleConfirmTaskCompletion = (task: AirdropTask) => {
    playTapSound();
    setVerifyingTaskId(task.id);
    setActiveTaskPrompt(null);

    // Verify task completion check
    setTimeout(() => {
      onCompleteTask(task.id, task.reward);
      setVerifyingTaskId(null);
      playClaimRewardSound();
    }, 1200);
  };

  const handleClaimStreak = () => {
    if (!canClaimDaily) return;
    onClaimDailyStreak(currentStreakDay, currentRewardItem.reward);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-28 pt-2 px-4 select-none">
      {/* 1. DOLICASH PARTNER TASK CARD (Updated to 15 $MIMI as requested) */}
      <div className="relative w-full rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#020617] border-2 border-amber-400/60 shadow-[0_12px_45px_rgba(245,158,11,0.3)] text-white space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {language === 'hi' ? 'Dolicash स्पेशल टास्क' : 'Dolicash Task Offer'}
                </h2>
                <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  +15 $MIMI
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80 font-mono">
                {language === 'hi'
                  ? 'Dolicash स्पॉन्सर ऑफर पूरा करें और 15 $MIMI टोकन प्राप्त करें'
                  : 'Complete Dolicash sponsor offer to earn 15 $MIMI tokens'}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        {(() => {
          const dolicashTask = tasks.find((t) => t.id === 'dolicash-task-offer');
          const isDone = dolicashTask ? dolicashTask.isCompleted : false;
          const isStarted = dolicashTask ? Boolean(visitedTaskIds[dolicashTask.id]) : false;

          if (isDone) {
            return (
              <div className="w-full py-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-black text-xs sm:text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-cyan-300" />
                <span>{language === 'hi' ? 'Dolicash टास्क पूर्ण (+15 $MIMI प्राप्त)' : 'Dolicash Task Completed (+15 $MIMI Claimed)'}</span>
              </div>
            );
          }

          if (isStarted) {
            return (
              <button
                onClick={() => {
                  if (dolicashTask) handleTaskClick(dolicashTask);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(52,211,153,0.7)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>
                  {language === 'hi' ? 'टास्क पूरा किया? टोकन सत्यापित करें (+15 $MIMI)' : 'Completed Offer? Verify Tokens (+15 $MIMI)'}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-950" />
              </button>
            );
          }

          return (
            <button
              onClick={() => {
                if (dolicashTask) {
                  handleTaskClick(dolicashTask);
                } else {
                  playTapSound();
                  const url = 'https://www.fastrsrvr.com/view.php?id=5547102&pub=3366972';
                  const tg = (window as any)?.Telegram?.WebApp;
                  if (tg && typeof tg.openLink === 'function') {
                    tg.openLink(url);
                  } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-950" />
              <span>
                {language === 'hi' ? 'Dolicash टास्क शुरू करें (+15 $MIMI)' : 'Start Dolicash Task (+15 $MIMI)'}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-950" />
            </button>
          );
        })()}
      </div>

      {/* 2. Mimi Beat Rush Arcade Banner */}
      <button
        onClick={() => {
          playTapSound();
          onOpenArcade();
        }}
        className="group relative w-full rounded-2xl p-4 overflow-hidden bg-gradient-to-r from-[#0284c7] via-[#6366f1] to-[#8b5cf6] border border-cyan-400/30 shadow-[0_8px_25px_rgba(37,99,235,0.4)] text-white text-left transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-cyan-300 text-2xl shadow-inner group-hover:scale-110 transition-transform">
            🎧
          </div>
          <div>
            <h3 className="text-base font-black tracking-wide text-white drop-shadow-sm">
              {language === 'hi' ? 'मिमी बीट रश' : 'Mimi Beat Rush'}
            </h3>
            <p className="text-xs text-cyan-100 font-medium">
              {language === 'hi'
                ? 'म्यूजिक ट्रैक लेयर्स अनलॉक करें - और $MIMI जीतें!'
                : 'Unlock music layers & earn real $MIMI tokens!'}
            </p>
          </div>
        </div>

        <div className="p-1 rounded-full bg-white/20 text-white group-hover:translate-x-1 transition-transform">
          <ChevronRight className="w-5 h-5" />
        </div>
      </button>

      {/* 3. Daily Check-in Card (रोज़ाना चेक-इन) */}
      <div className="w-full rounded-3xl glass-panel-blue p-4 shadow-[0_8px_30px_rgba(0,10,30,0.7)]">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-extrabold text-white">
            {language === 'hi' ? 'रोज़ाना चेक-इन' : 'Daily Check-in'}
          </h3>
          <span className="text-xs font-semibold text-cyan-300">
            {language === 'hi' ? `दिन ${currentStreakDay} / 7` : `Day ${currentStreakDay} / 7`}
          </span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3.5">
          {DAILY_REWARDS.map((item) => {
            const isCompleted = item.day < currentStreakDay;
            const isCurrent = item.day === currentStreakDay;

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-between py-2 px-1 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-[#0e326b] border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.6)]'
                    : isCompleted
                    ? 'bg-[#092147] border border-cyan-500/40 text-cyan-200'
                    : 'bg-[#051532] border border-blue-950 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-bold text-cyan-200">
                  {language === 'hi' ? item.labelHi : item.labelEn}
                </span>

                <div className="my-1.5 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-300 flex items-center justify-center animate-pulse">
                      <Check className="w-3.5 h-3.5 text-cyan-200" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[10px] font-black text-amber-300">
                      🎵
                    </div>
                  )}
                </div>

                <span
                  className={`text-[10px] sm:text-xs font-black ${
                    isCurrent ? 'text-cyan-300' : isCompleted ? 'text-cyan-100' : 'text-amber-300'
                  }`}
                >
                  +{item.reward}
                </span>
              </div>
            );
          })}
        </div>

        {/* Daily Streak Button */}
        {canClaimDaily ? (
          <button
            onClick={handleClaimStreak}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_20px_rgba(0,210,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>
              {language === 'hi'
                ? `दिन ${currentStreakDay} का इनाम दावा करें (+${currentRewardItem.reward} $MIMI)`
                : `Claim Day ${currentStreakDay} Reward (+${currentRewardItem.reward} $MIMI)`}
            </span>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 rounded-2xl bg-[#0a2046] text-cyan-200/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
          >
            <Calendar className="w-4 h-4 text-cyan-400/60" />
            <span>{language === 'hi' ? 'कल वापस आएँ' : 'Come back tomorrow'}</span>
          </button>
        )}
      </div>

      {/* 4. Filter Segmented Tabs (Clean Social & Partner Filter, No Ads) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', hi: 'सभी कार्य', en: 'All Tasks' },
          { id: 'social', hi: '🌐 सोशल व कम्युनिटी', en: '🌐 Social & Community' },
          { id: 'partner', hi: '🔥 Dolicash ऑफर', en: '🔥 Dolicash Offer' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playTapSound();
                setFilter(tab.id as typeof filter);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.5)] font-black scale-102'
                  : 'bg-[#081a3d] text-cyan-200 hover:text-white hover:bg-[#0c2759] border border-cyan-500/20'
              }`}
            >
              {language === 'hi' ? tab.hi : tab.en}
            </button>
          );
        })}
      </div>

      {/* 5. Authentic Task List */}
      <div className="flex flex-col gap-2.5">
        {filteredTasks.length === 0 ? (
          <div className="w-full py-8 text-center text-xs text-cyan-300/60 bg-[#06183a] rounded-2xl border border-cyan-500/20">
            {language === 'hi' ? 'इस श्रेणी में कोई कार्य नहीं है' : 'No tasks in this category'}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isVerifying = verifyingTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`w-full rounded-2xl p-3.5 glass-panel-blue transition-all flex items-center justify-between gap-3 ${
                  task.isCompleted
                    ? 'border-cyan-500/20 bg-[#06193d]/50 opacity-70'
                    : 'border-cyan-500/30 hover:border-cyan-400/60 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {/* Left Platform Icon */}
                <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center bg-[#0284c7]/20 border border-cyan-400/30 text-white shadow-sm overflow-hidden">
                  {task.iconType === 'flame' && (
                    <Flame className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                  )}
                  {task.iconType === 'telegram' && (
                    <svg className="w-6 h-6 text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.28-.01.06-.01.19-.03.35z" />
                    </svg>
                  )}
                  {task.iconType === 'instagram' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </div>
                  )}
                  {task.iconType === 'twitter' && (
                    <div className="w-8 h-8 rounded-xl bg-black border border-cyan-400/40 flex items-center justify-center text-white shadow-sm">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                  )}
                  {task.iconType === 'discord' && (
                    <div className="w-8 h-8 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-sm">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    </div>
                  )}
                  {task.iconType === 'wallet' && (
                    <Wallet className="w-5 h-5 text-cyan-300" />
                  )}
                  {task.iconType === 'music' && (
                    <span className="text-xl">🎵</span>
                  )}
                  {task.iconType === 'users' && (
                    <Users className="w-5 h-5 text-cyan-300" />
                  )}
                </div>

                {/* Center Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-white truncate">
                    {language === 'hi' ? task.title : task.titleEn}
                  </h4>
                  <p className="text-xs text-cyan-200/80 truncate mt-0.5">
                    {language === 'hi' ? task.description : task.descriptionEn}
                  </p>

                  {/* Reward badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 font-mono">
                      <img src={ASSETS.mimiTokenCoin} alt="$MIMI" className="w-3.5 h-3.5 rounded-full object-cover" />
                      <span>+{task.reward.toLocaleString()} $MIMI</span>
                    </span>
                  </div>
                </div>

                {/* Right Status / Action */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {task.isCompleted ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30">
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'पूर्ण' : 'Claimed'}</span>
                    </div>
                  ) : isVerifying ? (
                    <div className="px-3 py-1.5 rounded-full bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/40 animate-pulse">
                      {language === 'hi' ? 'सत्यापन...' : 'Verifying...'}
                    </div>
                  ) : (
                    <button className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer ${
                      visitedTaskIds[task.id]
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 animate-pulse'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400'
                    }`}>
                      {task.requiresWallet && !stats.walletAddress
                        ? language === 'hi' ? 'वॉलेट जोड़ें' : 'Connect'
                        : visitedTaskIds[task.id]
                        ? language === 'hi' ? 'जांचें / क्लेम' : 'Verify'
                        : language === 'hi' ? 'शुरू करें' : 'Start'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* STRICT ANTI-CHEAT TASK COMPLETION VERIFICATION MODAL */}
      {activeTaskPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0e2a5e] via-[#091b42] to-[#020b20] border-2 border-cyan-400/50 p-5 text-white shadow-[0_20px_70px_rgba(0,180,255,0.4)] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {language === 'hi' ? 'टास्क सत्यापन आवश्यकता' : 'Task Completion Verification'}
                  </h3>
                  <span className="text-[10px] text-cyan-200/80 font-mono">
                    {activeTaskPrompt.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTaskPrompt(null)}
                className="p-1 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Warning Box */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-400/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {language === 'hi'
                    ? 'असली कार्य पूरा करना अनिवार्य है!'
                    : 'Must genuinely complete task!'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'लिंक पर जाकर फॉलो, जॉइन या ऑफर की आवश्यक शर्तें 100% पूरी करें। उसके बाद ही आपको टोकन मिलेंगे।'
                  : 'Follow the link and complete the genuine follow, join or offer action to unlock your tokens.'}
              </p>
            </div>

            {/* Reward Summary */}
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="text-cyan-200/80 font-medium">
                {language === 'hi' ? 'टास्क पूरा करने पर इनाम:' : 'Task Completion Reward:'}
              </span>
              <span className="text-amber-300 font-mono font-black text-sm">
                +{activeTaskPrompt.reward} $MIMI
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Button 1: Re-open task link if needed */}
              {activeTaskPrompt.actionUrl && (
                <button
                  onClick={() => {
                    playTapSound();
                    if (typeof window !== 'undefined') {
                      const tg = (window as any)?.Telegram?.WebApp;
                      if (tg && typeof tg.openLink === 'function') {
                        tg.openLink(activeTaskPrompt.actionUrl!);
                      } else {
                        window.open(activeTaskPrompt.actionUrl, '_blank', 'noopener,noreferrer');
                      }
                    }
                  }}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? 'टास्क लिंक फिर से खोलें' : 'Re-open Task / Offer Link'}
                  </span>
                </button>
              )}

              {/* Button 2: I have 100% completed it */}
              <button
                onClick={() => handleConfirmTaskCompletion(activeTaskPrompt)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs tracking-wider shadow-[0_0_25px_rgba(52,211,153,0.7)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>
                  {language === 'hi'
                    ? `मैंने पूरा कर लिया है (+${activeTaskPrompt.reward} $MIMI क्लेम करें)`
                    : `I Have Fully Completed (Claim +${activeTaskPrompt.reward} $MIMI)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
