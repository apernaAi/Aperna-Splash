/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Zap,
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
  X,
  Youtube,
  ThumbsUp,
  MessageSquare,
  Bell,
  Play,
  AlertCircle,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { AirdropTask, UserStats, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { QuizArenaView } from './QuizArenaView.tsx';
import { shortenAddress } from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import { getTimeUntilNextReset, getTodayDateString } from '../utils/dailyTaskService.ts';
import { getAdsCooldownStatus } from '../utils/adsgramService.ts';

interface Props {
  tasks: AirdropTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  onFailTask?: (taskId: string) => void;
  stats: UserStats;
  onClaimDailyStreak: (day: number, reward: number) => void;
  onOpenArcade: () => void;
  onOpenWallet: () => void;
  onOpenAdsgram?: (task?: AirdropTask) => void;
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
  onFailTask,
  stats,
  onClaimDailyStreak,
  onOpenArcade,
  onOpenWallet,
  onOpenAdsgram,
  language,
}) => {
  const [filter, setFilter] = useState<'all' | 'adsgram' | 'native' | 'social'>('all');
  const [cooldownAlert, setCooldownAlert] = useState<string | null>(null);
  const [isQuizArenaOpen, setIsQuizArenaOpen] = useState(false);
  const [arenaOpFilter, setArenaOpFilter] = useState<'all' | '+' | '-' | '×' | '÷'>('all');
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [activeMathTask, setActiveMathTask] = useState<AirdropTask | null>(null);
  const [selectedMathOption, setSelectedMathOption] = useState<number | null>(null);
  const [mathQuizResult, setMathQuizResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [inlineTaskAnswer, setInlineTaskAnswer] = useState<Record<string, { option: number; isCorrect: boolean }>>({});
  
  const [visitedTaskIds, setVisitedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_visited_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [taskStartTimes, setTaskStartTimes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('music_mimi_task_start_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeTaskPrompt, setActiveTaskPrompt] = useState<AirdropTask | null>(null);
  const [now, setNow] = useState(Date.now());
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilNextReset());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setTimeUntilReset(getTimeUntilNextReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mathTasks = tasks.filter((t) => t.category === 'math' || t.subType === 'math');
  const nonMathTasks = tasks.filter((t) => t.category !== 'math' && t.subType !== 'math');

  const mathTasksCount = mathTasks.length;
  const solvedMathCount = mathTasks.filter(
    (t) => t.isCompleted || inlineTaskAnswer[t.id]?.isCorrect === true
  ).length;
  const failedMathCount = mathTasks.filter(
    (t) => t.isFailedToday || (inlineTaskAnswer[t.id] && !inlineTaskAnswer[t.id].isCorrect)
  ).length;
  const mathProgressPercent = Math.round((solvedMathCount / Math.max(1, mathTasksCount)) * 100);

  const adsTasksCount = nonMathTasks.filter((t) => t.category === 'adsgram' || t.isAdsgramTask).length;
  const nativeTasksCount = nonMathTasks.filter(
    (t) =>
      t.id === 'connect-ton-wallet' ||
      t.id === 'reach-level-3' ||
      t.id === 'craft-first-loop' ||
      t.id === 'play-beat-rush-arcade' ||
      t.id === 'invite-squad-fren'
  ).length;
  const socialTasksCount = nonMathTasks.filter(
    (t) => t.category === 'social' || t.category === 'community' || t.iconType === 'discord' || t.iconType === 'telegram'
  ).length;

  const filteredTasks = nonMathTasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'adsgram') return t.category === 'adsgram' || t.isAdsgramTask;
    if (filter === 'native') {
      return (
        t.id === 'connect-ton-wallet' ||
        t.id === 'reach-level-3' ||
        t.id === 'craft-first-loop' ||
        t.id === 'play-beat-rush-arcade' ||
        t.id === 'invite-squad-fren'
      );
    }
    if (filter === 'social') return t.category === 'social' || t.category === 'community' || t.iconType === 'discord' || t.iconType === 'telegram';
    return true;
  });

  const filteredArenaTasks = mathTasks.filter((t) => {
    if (arenaOpFilter === 'all') return true;
    return t.quizData?.operation === arenaOpFilter;
  });

  // Daily Streak 24h checks
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const timeSinceLastClaim = stats.lastDailyClaim ? now - stats.lastDailyClaim : null;
  const canClaimDaily = timeSinceLastClaim === null || timeSinceLastClaim >= ONE_DAY_MS;

  const currentStreakDay = stats.dailyStreakDay || 1;
  const currentRewardItem = DAILY_REWARDS.find((r) => r.day === currentStreakDay) || DAILY_REWARDS[0];

  const openLinkSafely = (url: string) => {
    if (typeof window !== 'undefined') {
      const tg = (window as any)?.Telegram?.WebApp;
      if (tg && typeof tg.openLink === 'function') {
        tg.openLink(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleSelectMathOption = (option: number) => {
    if (!activeMathTask || !activeMathTask.quizData || selectedMathOption !== null || activeMathTask.isFailedToday || activeMathTask.isCompleted) return;

    setSelectedMathOption(option);
    const isCorrect = option === activeMathTask.quizData.correctAnswer;

    if (isCorrect) {
      setMathQuizResult('correct');
      playClaimRewardSound();
      triggerHaptic('heavy');
      onCompleteTask(activeMathTask.id, activeMathTask.reward || 15);
    } else {
      setMathQuizResult('wrong');
      triggerHaptic('medium');
      if (onFailTask) {
        onFailTask(activeMathTask.id);
      }
    }
  };

  const handleInlineMathAnswer = (task: AirdropTask, option: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.quizData || task.isFailedToday || task.isCompleted || inlineTaskAnswer[task.id]) return;

    const isCorrect = option === task.quizData.correctAnswer;
    setInlineTaskAnswer((prev) => ({
      ...prev,
      [task.id]: { option, isCorrect },
    }));

    if (isCorrect) {
      playClaimRewardSound();
      triggerHaptic('heavy');
      onCompleteTask(task.id, task.reward || 15);
    } else {
      triggerHaptic('medium');
      if (onFailTask) {
        onFailTask(task.id);
      }
    }
  };

  const handleTaskClick = (task: AirdropTask) => {
    if (verifyingTaskId) return;

    playTapSound();

    // Adsgram Rewarded Video tasks trigger interactive video player & SDK (with 8h 10-ad limit check)
    if (task.isAdsgramTask || task.category === 'adsgram' || task.verificationType === 'ad_watched') {
      const cooldown = getAdsCooldownStatus(stats);
      if (!cooldown.canWatch) {
        setCooldownAlert(
          language === 'hi'
            ? `8 घंटे में अधिकतम 10 विज्ञापन सीमा पूरी हो चुकी है। कृपया ${cooldown.formattedCooldown} बाद पुनः देखें।`
            : `10/10 ads limit reached for this 8-hour period. Next batch in ${cooldown.formattedCooldown}.`
        );
        triggerHaptic('medium');
        return;
      }
      if (onOpenAdsgram) {
        onOpenAdsgram(task);
      }
      return;
    }

    // Math Quiz tasks open the interactive quiz challenge modal
    if (task.category === 'math' || task.quizData) {
      setActiveMathTask(task);
      setSelectedMathOption(null);
      setMathQuizResult('idle');
      return;
    }

    if (task.isCompleted) return;

    // 1. TON Wallet Connect Native Quest
    if (task.id === 'connect-ton-wallet' || task.requiresWallet) {
      if (stats.walletAddress) {
        onCompleteTask(task.id, task.reward);
        playClaimRewardSound();
        triggerHaptic('heavy');
      } else {
        onOpenWallet();
      }
      return;
    }

    // 2. Reach Producer Level 3 Quest
    if (task.id === 'reach-level-3') {
      if (stats.level >= 3) {
        onCompleteTask(task.id, task.reward);
        playClaimRewardSound();
        triggerHaptic('heavy');
      } else {
        setCooldownAlert(
          language === 'hi'
            ? `आपका वर्तमान स्तर Level ${stats.level} है। Mimi Making में बीट्स बनाएं और लेवल 3 पर पहुंचें!`
            : `Current level is Level ${stats.level}. Upgrade gear & craft loops to reach Level 3!`
        );
        triggerHaptic('medium');
      }
      return;
    }

    // 3. Craft Sound Loop Quest
    if (task.id === 'craft-first-loop') {
      if (stats.totalLoopsCrafted >= 1 || stats.loopMakingActive) {
        onCompleteTask(task.id, task.reward);
        playClaimRewardSound();
        triggerHaptic('heavy');
      } else {
        setCooldownAlert(
          language === 'hi'
            ? 'Mimi Making में पहले 8-घंटे लूप क्राफ्टिंग सक्रिय करें!'
            : 'Start 8-hour loop craft session in Mimi Making first!'
        );
        triggerHaptic('medium');
      }
      return;
    }

    // 4. Play Mimi Beat Rush Arcade Quest
    if (task.id === 'play-beat-rush-arcade') {
      if (stats.beatsStreamed > 0 || (stats.arcadePlaysToday && stats.arcadePlaysToday > 0)) {
        onCompleteTask(task.id, task.reward);
        playClaimRewardSound();
        triggerHaptic('heavy');
      } else {
        onOpenArcade();
      }
      return;
    }

    // 5. Invite Fren Quest
    if (task.id === 'invite-squad-fren') {
      if (stats.recruitsCount >= 1) {
        onCompleteTask(task.id, task.reward);
        playClaimRewardSound();
        triggerHaptic('heavy');
      } else {
        const refLink = `https://t.me/Aperna_Splash_bot/app?startapp=ref_${stats.userId}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(refLink).catch(() => {});
        }
        setCooldownAlert(
          language === 'hi'
            ? 'रेफरल लिंक क्लिपबोर्ड पर कॉपी हो गया! कम से कम 1 दोस्त को जोड़ें।'
            : 'Referral link copied to clipboard! Invite at least 1 fren to claim.'
        );
        triggerHaptic('medium');
      }
      return;
    }

    const isAlreadyStarted = Boolean(visitedTaskIds[task.id]);
    const nowTime = Date.now();

    if (!isAlreadyStarted || !taskStartTimes[task.id]) {
      const updatedVisited = { ...visitedTaskIds, [task.id]: true };
      const updatedTimes = { ...taskStartTimes, [task.id]: nowTime };
      setVisitedTaskIds(updatedVisited);
      setTaskStartTimes(updatedTimes);
      try {
        localStorage.setItem('music_mimi_visited_tasks', JSON.stringify(updatedVisited));
        localStorage.setItem('music_mimi_task_start_times', JSON.stringify(updatedTimes));
      } catch {}

      if (task.actionUrl) {
        openLinkSafely(task.actionUrl);
      }
      setActiveTaskPrompt(task);
    } else {
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

  const adCooldown = getAdsCooldownStatus(stats);



  // Helper for task modal timer calculation
  const getTaskRemainingSeconds = (task: AirdropTask | null) => {
    if (!task) return 0;
    const startTime = taskStartTimes[task.id];
    if (!startTime) return task.requiredWaitSeconds || 15;
    const requiredWait = task.requiredWaitSeconds || 15;
    const elapsed = Math.floor((now - startTime) / 1000);
    return Math.max(0, requiredWait - elapsed);
  };

  const activeTaskRemaining = getTaskRemainingSeconds(activeTaskPrompt);
  const activeTaskTotalWait = activeTaskPrompt?.requiredWaitSeconds || 15;
  const activeTaskElapsed = Math.max(0, activeTaskTotalWait - activeTaskRemaining);
  const activeTaskProgress = Math.min(100, Math.floor((activeTaskElapsed / activeTaskTotalWait) * 100));
  const isTimerDone = activeTaskRemaining === 0;

  return (
    <div className="w-full flex flex-col gap-4 pb-36 pt-2 px-4 select-none">
      {/* 1. Mimi Beat Rush Arcade Banner */}
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

      {/* 2. Daily Check-in Card (रोज़ाना चेक-इन) */}
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

      {/* 3. Tasks Container */}
      {tasks.length === 0 ? (
        <div className="w-full rounded-3xl glass-panel-blue p-6 text-center border border-cyan-500/30 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-inner">
            ✨
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {language === 'hi' ? 'कोई सक्रिय टास्क नहीं है' : 'No Active Tasks'}
            </h3>
            <p className="text-xs text-cyan-200/70 mt-1 max-w-xs mx-auto">
              {language === 'hi'
                ? 'टास्क सेक्शन के सभी टास्क हटा दिए गए हैं। नए टास्क जल्द ही उपलब्ध होंगे। तब तक रोज़ाना चेक-इन करें और बीट रश खेलें!'
                : 'All tasks have been removed. New quests will be added soon! Keep claiming your daily streak & playing Beat Rush.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{language === 'hi' ? '0 टास्क सक्रिय' : '0 Tasks Active'}</span>
          </div>
        </div>
      ) : (
        <>
          {isQuizArenaOpen ? (
            <QuizArenaView
              mathTasks={mathTasks}
              onCompleteTask={onCompleteTask}
              onFailTask={onFailTask}
              onBack={() => setIsQuizArenaOpen(false)}
              language={language}
              onFocusTask={(task) => {
                setActiveMathTask(task);
                setSelectedMathOption(null);
                setMathQuizResult('idle');
              }}
            />
          ) : (
            <>
              {/* 3. Mimi Math Quiz Arena Entry Banner */}
              <div className="w-full rounded-3xl p-4 bg-gradient-to-br from-[#1e1346] via-[#0d2252] to-[#04122d] border-2 border-violet-500/40 shadow-[0_8px_30px_rgba(139,92,246,0.3)] flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl shadow-[0_0_15px_rgba(139,92,246,0.6)] border border-violet-400/40 shrink-0">
                      🧮
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
                          ⚡ QUIZ ARENA
                        </span>
                        <span className="text-xs font-black text-amber-300 font-mono">
                          +450 $MIMI
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                        {language === 'hi' ? 'मैथ क्विज एरीना (30 दैनिक प्रश्न)' : 'Math Quiz Arena (30 Daily Quests)'}
                      </h3>
                      <p className="text-xs text-cyan-200/80 mt-0.5">
                        {language === 'hi'
                          ? 'गणित सवाल हल करें और +450 $MIMI जीतें! रीसेट पर सवाल अपने आप बदल जाते हैं 🔄'
                          : 'Solve daily math & win +450 $MIMI! Questions rotate automatically on reset 🔄'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Solved Progress Bar */}
                <div className="space-y-1 bg-black/30 p-2.5 rounded-2xl border border-white/10">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-cyan-200 font-medium">
                      {language === 'hi' ? 'आज हल किए गए:' : 'Solved Today:'}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {solvedMathCount} / {mathTasksCount} (+{solvedMathCount * 15} $MIMI)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${mathProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    playTapSound();
                    setIsQuizArenaOpen(true);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_20px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {language === 'hi' ? 'क्विज एरीना में प्रवेश करें (30 प्रश्न) →' : 'Enter Quiz Arena (30 Quests) →'}
                  </span>
                </button>
              </div>

              {/* Daily Reset Countdown Banner */}
              <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#0d2a5e] via-[#091f48] to-[#071838] border border-cyan-400/40 shadow-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                    🔁
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      {language === 'hi' ? 'दैनिक रीसेट (रोज़ाना क्लेम करें)' : 'Daily Quests (Claim Every Day)'}
                    </span>
                    <span className="text-[10px] text-cyan-300/80 font-mono">
                      {language === 'hi' ? 'सभी टास्क हर दिन दोबारा क्लेम के लिए खुलते हैं' : 'Tasks reset daily so you can earn every day'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[9px] font-mono text-cyan-300/80 uppercase tracking-wider block">
                    {language === 'hi' ? 'रीसेट में शेष:' : 'Next Reset:'}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-400/40 inline-block mt-0.5">
                    ⏳ {timeUntilReset.formatted}
                  </span>
                </div>
              </div>

              {/* Cooldown Alert Toast if user tapped when full */}
              {cooldownAlert && (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>{cooldownAlert}</span>
                  </div>
                  <button onClick={() => setCooldownAlert(null)} className="p-1 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Filter Segmented Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', hi: 'सभी कार्य', en: 'All Tasks', count: nonMathTasks.length },
                  { id: 'adsgram', hi: '📺 स्पॉन्सर एड्स', en: '📺 Adsgram Ads', count: adsTasksCount },
                  { id: 'native', hi: '⚡ इन-ऐप टास्क', en: '⚡ Native Quests', count: nativeTasksCount },
                  { id: 'arena', hi: '🧮 क्विज एरीना', en: '🧮 Quiz Arena', count: `${solvedMathCount}/${mathTasksCount}` },
                  { id: 'social', hi: '🌐 कम्युनिटी', en: '🌐 Community', count: socialTasksCount },
                ].map((tab) => {
                  const isActive = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        playTapSound();
                        if (tab.id === 'arena') {
                          setIsQuizArenaOpen(true);
                        } else {
                          setFilter(tab.id as typeof filter);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.5)] font-black scale-102'
                          : 'bg-[#081a3d] text-cyan-200 hover:text-white hover:bg-[#0c2759] border border-cyan-500/20'
                      }`}
                    >
                      <span>{language === 'hi' ? tab.hi : tab.en}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-slate-900/30 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

          {/* Authentic Task List */}
          <div className="flex flex-col gap-2.5">
        {filteredTasks.length === 0 ? (
          <div className="w-full py-8 text-center text-xs text-cyan-300/60 bg-[#06183a] rounded-2xl border border-cyan-500/20">
            {language === 'hi' ? 'इस श्रेणी में कोई कार्य नहीं है' : 'No tasks in this category'}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isVerifying = verifyingTaskId === task.id;
            const isVisited = Boolean(visitedTaskIds[task.id]);
            const remainingSec = getTaskRemainingSeconds(task);
            const isTaskTimerDone = remainingSec === 0;

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
                  {task.iconType === 'adsgram' && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-slate-950 border ${
                      task.adsgramBlockType === 'task'
                        ? 'bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                        : 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 border-cyan-300 shadow-[0_0_15px_rgba(0,210,255,0.6)]'
                    }`}>
                      {task.adsgramBlockType === 'task' ? (
                        <Sparkles className="w-4 h-4 text-slate-950" />
                      ) : (
                        <Tv className="w-4 h-4 text-slate-950" />
                      )}
                    </div>
                  )}
                  {task.iconType === 'youtube' && (
                    <div className="w-8 h-8 rounded-xl bg-[#FF0000] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,0,0,0.5)] border border-red-400/30">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                  )}
                  {task.iconType === 'math' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(139,92,246,0.6)] border border-violet-400/40 font-mono font-black text-sm">
                      {task.quizData?.operation || '🧮'}
                    </div>
                  )}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-extrabold text-white truncate">
                      {language === 'hi' ? task.title : task.titleEn}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-cyan-200/80 line-clamp-1 mt-0.5">
                    {language === 'hi' ? task.description : task.descriptionEn}
                  </p>

                  {/* Badges row: Reward & requirement highlight */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 font-mono">
                      <img src={ASSETS.mimiTokenCoin} alt="$MIMI" className="w-3.5 h-3.5 rounded-full object-cover" />
                      <span>+{task.reward.toLocaleString()} $MIMI</span>
                    </span>

                    {task.isAdsgramTask && task.adsgramBlockType === 'task' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Adsgram Task (task-55579)</span>
                      </span>
                    )}

                    {task.isAdsgramTask && task.adsgramBlockType === 'reward' && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-mono">
                        <Tv className="w-2.5 h-2.5" />
                        <span>{language === 'hi' ? '15s स्पॉन्सर वीडियो' : '15s Sponsor Video'}</span>
                      </span>
                    )}

                    {task.subType === 'video' && !task.isAdsgramTask && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        {language === 'hi' ? 'वॉच + Like + Comment' : 'Watch + Like + Comment'}
                      </span>
                    )}

                    {task.subType === 'subscribe' && (
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Bell className="w-2.5 h-2.5" />
                        {language === 'hi' ? 'सब्सक्राइब + बेल' : 'Subscribe + Bell'}
                      </span>
                    )}

                    {task.subType === 'telegram' && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {language === 'hi' ? 'जॉइन अनिवार्य' : 'Join Required'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Status / Action */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {task.isCompleted ? (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/40 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === 'hi' ? 'आज पूरा हुआ' : 'Done Today'}</span>
                      </div>
                      <span className="text-[9px] text-cyan-300/80 font-mono mt-0.5 whitespace-nowrap">
                        {language === 'hi' ? 'कल फिर क्लेम करें 🔁' : 'Claim again tomorrow 🔁'}
                      </span>
                    </div>
                  ) : task.isFailedToday ? (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/40">
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>{language === 'hi' ? 'कल फिर प्रयास' : 'Try Tomorrow'}</span>
                      </div>
                      <span className="text-[9px] text-rose-300/70 font-mono mt-0.5 whitespace-nowrap">
                        {language === 'hi' ? 'गलत उत्तर 🔒' : 'Locked Today 🔒'}
                      </span>
                    </div>
                  ) : task.isAdsgramTask || task.category === 'adsgram' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1 ${
                        adCooldown.canWatch
                          ? task.adsgramBlockType === 'task'
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 hover:brightness-110 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                            : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-slate-950 hover:brightness-110 shadow-[0_0_12px_rgba(0,210,255,0.5)]'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[10px]'
                      }`}
                    >
                      {task.adsgramBlockType === 'task' ? (
                        <Sparkles className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span>
                        {adCooldown.canWatch
                          ? task.adsgramBlockType === 'task'
                            ? (language === 'hi' ? 'टास्क करें' : 'Start')
                            : (language === 'hi' ? 'देखें' : 'Watch')
                          : (adCooldown.formattedCooldown || 'Cooldown')}
                      </span>
                    </button>
                  ) : task.category === 'math' ? (
                    <button className="px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 text-slate-950 hover:brightness-110 shadow-[0_0_12px_rgba(167,139,250,0.5)] flex items-center gap-1 font-bold">
                      <span>{language === 'hi' ? 'हल करें' : 'Solve'}</span>
                      <span className="font-mono text-[10px] bg-slate-950/20 px-1 rounded">+15</span>
                    </button>
                  ) : isVerifying ? (
                    <div className="px-3 py-1.5 rounded-full bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/40 animate-pulse">
                      {language === 'hi' ? 'सत्यापन...' : 'Verifying...'}
                    </div>
                  ) : (
                    <button className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer ${
                      isVisited && isTaskTimerDone
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                        : isVisited && !isTaskTimerDone
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono animate-pulse'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400'
                    }`}>
                      {task.requiresWallet && !stats.walletAddress
                        ? language === 'hi' ? 'वॉलेट जोड़ें' : 'Connect'
                        : isVisited && !isTaskTimerDone
                        ? `⏳ ${remainingSec}s`
                        : isVisited && isTaskTimerDone
                        ? language === 'hi' ? 'क्लेम करें' : 'Claim'
                        : language === 'hi' ? 'शुरू करें' : 'Start'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </>
      )}
      </>
      )}

      {/* STRICT ANTI-CHEAT TASK COMPLETION VERIFICATION MODAL */}
      {activeTaskPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0e2a5e] via-[#091b42] to-[#020b20] border-2 border-cyan-400/50 p-5 text-white shadow-[0_20px_70px_rgba(0,180,255,0.4)] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm ${
                  activeTaskPrompt.iconType === 'youtube'
                    ? 'bg-red-500/20 text-red-400 border-red-400/40'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  {activeTaskPrompt.iconType === 'youtube' ? (
                    <Youtube className="w-4 h-4 text-red-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white truncate max-w-[200px]">
                    {language === 'hi' ? activeTaskPrompt.title : activeTaskPrompt.titleEn}
                  </h3>
                  <span className="text-[10px] text-cyan-200/80 font-mono">
                    {language === 'hi' ? 'असली सत्यापन आवश्यक' : 'Genuine Verification Required'}
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

            {/* Dynamic Step-by-Step Instructions based on Task Type */}
            {activeTaskPrompt.subType === 'video' ? (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-red-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-red-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-red-400" />
                    {language === 'hi' ? 'YouTube वीडियो टास्क निर्देश' : 'YouTube Video Task Steps'}
                  </span>
                  <span className="text-[10px] font-mono bg-red-500/20 px-2 py-0.5 rounded-full border border-red-400/30">
                    20s वॉच टाइम
                  </span>
                </div>
                
                <div className="space-y-1.5 text-[11px] text-slate-200">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 font-bold text-[9px]">1</span>
                    <span>{language === 'hi' ? 'वीडियो पूरा देखें ताकि असली व्यूज और वॉच टाइम रजिस्टर हो।' : 'Watch the video to register full view & watch time.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 font-bold text-[9px]">2</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-red-300 inline" />
                      {language === 'hi' ? 'वीडियो पर 👍 Like बटन दबाएं।' : 'Hit the 👍 Like button on the video.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 font-bold text-[9px]">3</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-red-300 inline" />
                      {language === 'hi' ? 'कमेंट बॉक्स में एक प्यारा सा कमेंट ड्रॉप करें!' : 'Drop a nice comment in the comment box!'}
                    </span>
                  </div>
                </div>
              </div>
            ) : activeTaskPrompt.subType === 'subscribe' ? (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-red-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-red-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-red-400" />
                    {language === 'hi' ? 'चैनल सब्सक्राइब निर्देश' : 'Subscribe Instructions'}
                  </span>
                  <span className="text-[10px] font-mono bg-red-500/20 px-2 py-0.5 rounded-full border border-red-400/30">
                    सब्सक्राइब + बेल
                  </span>
                </div>
                
                <div className="space-y-1.5 text-[11px] text-slate-200">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 font-bold text-[9px]">1</span>
                    <span>{language === 'hi' ? '@hashmicrypto1 चैनल पर Subscribe बटन दबाएं।' : 'Click Subscribe on @hashmicrypto1 channel.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 font-bold text-[9px]">2</span>
                    <span>{language === 'hi' ? 'नोटिफिकेशन बेल (घंटी 🔔) को All पर सेट करें।' : 'Set notification bell (🔔) to All.'}</span>
                  </div>
                </div>
              </div>
            ) : activeTaskPrompt.iconType === 'discord' ? (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-indigo-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    {language === 'hi' ? 'Discord सर्वर जॉइन निर्देश' : 'Discord Server Join'}
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/30">
                    Discord
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {language === 'hi'
                    ? 'आधिकारिक Discord सर्वर को जॉइन करें और 15 सेकंड के बाद क्लेम बटन दबाएं।'
                    : 'Join the official Discord server and claim your tokens after 15s.'}
                </p>
              </div>
            ) : activeTaskPrompt.subType === 'telegram' || activeTaskPrompt.iconType === 'telegram' ? (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-sky-400/30 space-y-2.5">
                <div className="flex items-center justify-between text-sky-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    {language === 'hi' ? 'Telegram चैनल / बॉट निर्देश' : 'Telegram Channel / Bot Steps'}
                  </span>
                  <span className="text-[10px] font-mono bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30">
                    Telegram
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {language === 'hi'
                    ? 'Telegram चैनल को जॉइन करें या बॉट को स्टार्ट करें। 15 सेकंड का टाइमर पूरा होते ही टोकन क्लेम करें।'
                    : 'Join the Telegram channel or start the bot. Claim your tokens once the countdown completes!'}
                </p>
              </div>
            ) : activeTaskPrompt.subType === 'instagram' ? (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-pink-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-pink-300 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-pink-400" />
                    {language === 'hi' ? 'Instagram फॉलो निर्देश' : 'Instagram Follow Steps'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {language === 'hi'
                    ? '@hashmicrypto प्रोफाइल खोलकर Follow बटन दबाएं और टाइमर समाप्त होने पर टोकन क्लेम करें।'
                    : 'Open @hashmicrypto profile on Instagram and hit Follow. Claim once the timer finishes.'}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-400/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {language === 'hi' ? 'असली कार्य पूरा करना अनिवार्य है!' : 'Must genuinely complete task!'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'लिंक पर जाकर फॉलो, जॉइन या ऑफर की आवश्यक शर्तें 100% पूरी करें। उसके बाद ही आपको टोकन मिलेंगे।'
                    : 'Follow the link and complete the genuine follow, join or offer action to unlock your tokens.'}
                </p>
              </div>
            )}

            {/* Countdown Timer & Progress Bar */}
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-200/80 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{language === 'hi' ? 'सत्यापन टाइमर:' : 'Verification Countdown:'}</span>
                </span>
                <span className={`font-mono font-black ${isTimerDone ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {isTimerDone
                    ? language === 'hi' ? '✓ अनलॉक हो गया' : '✓ Unlocked'
                    : `${activeTaskRemaining}s`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${activeTaskProgress}%` }}
                />
              </div>

              {!isTimerDone && (
                <p className="text-[10px] text-amber-300/90 text-center font-medium animate-pulse">
                  {language === 'hi'
                    ? 'कृपया चैनल / वीडियो लिंक पर रुकें और कार्य पूरा करें...'
                    : 'Please stay on the channel / video to complete the action...'}
                </p>
              )}
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
            <div className="space-y-2 pt-1">
              {/* Button 1: Re-open task link if needed */}
              {activeTaskPrompt.actionUrl && (
                <button
                  onClick={() => {
                    playTapSound();
                    openLinkSafely(activeTaskPrompt.actionUrl!);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' ? '🔗 लिंक फिर से खोलें' : '🔗 Re-open Link / Video'}
                  </span>
                </button>
              )}

              {/* Button 2: Verification / Claim button */}
              {isTimerDone ? (
                <button
                  onClick={() => handleConfirmTaskCompletion(activeTaskPrompt)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs tracking-wider shadow-[0_0_25px_rgba(52,211,153,0.7)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>
                    {language === 'hi'
                      ? `मैंने पूरा कर लिया है (+${activeTaskPrompt.reward} $MIMI क्लेम करें)`
                      : `I Have Fully Completed (Claim +${activeTaskPrompt.reward} $MIMI)`}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 rounded-2xl bg-[#092247] border border-cyan-500/30 text-cyan-200/60 font-bold text-xs tracking-wide flex items-center justify-center gap-2 cursor-not-allowed opacity-85"
                >
                  <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>
                    {language === 'hi'
                      ? `सत्यापन प्रगति: ${activeTaskRemaining}s (लिंक पर रहें)`
                      : `Verification in progress: ${activeTaskRemaining}s`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Interactive Math Quiz Modal (1 Attempt per Task per Day, +15 $MIMI) */}
      {activeMathTask && activeMathTask.quizData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#131b38] via-[#09152e] to-[#030917] border-2 border-violet-400/50 p-5 shadow-[0_0_40px_rgba(139,92,246,0.35)] text-white space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-base shadow-[0_0_12px_rgba(139,92,246,0.6)]">
                  🧮
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {language === 'hi' ? 'गणित चुनौती' : 'Math Quiz Challenge'}
                  </h3>
                  <span className="text-[10px] text-violet-300 font-medium">
                    {language === 'hi' ? '1 बार में सही जवाब दें' : '1 chance to solve today'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs">
                  +15 $MIMI
                </span>
                <button
                  onClick={() => {
                    playTapSound();
                    setActiveMathTask(null);
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Display Card */}
            <div className="py-4 px-3 rounded-2xl bg-gradient-to-br from-violet-950/60 to-slate-900/90 border border-violet-400/40 text-center space-y-1 shadow-inner">
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300/80 font-bold">
                {language === 'hi' ? 'प्रश्न (Question)' : 'Question'}
              </span>
              <div className="text-3xl font-black font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-cyan-200 py-1 drop-shadow-sm">
                {activeMathTask.quizData.question}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {language === 'hi'
                  ? 'चारों में से सही उत्तर चुनें:'
                  : 'Choose the correct answer from the 4 options:'}
              </p>
            </div>

            {/* If Already Attempted Today */}
            {activeMathTask.isCompleted ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-400/40 text-center space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'hi' ? 'आज का क्विज पूरा हो चुका है!' : 'Quiz already completed today!'}</span>
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  {language === 'hi'
                    ? 'आप पहले ही इस प्रश्न के +15 $MIMI प्राप्त कर चुके हैं। कल रात 12:00 बजे रीसेट पर फिर खेलें!'
                    : 'You already claimed +15 $MIMI for this question today. Come back tomorrow after daily reset!'}
                </p>
                <button
                  onClick={() => {
                    playTapSound();
                    setActiveMathTask(null);
                  }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer"
                >
                  {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
                </button>
              </div>
            ) : activeMathTask.isFailedToday ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-400/40 text-center space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-center gap-1.5 text-rose-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{language === 'hi' ? 'आज का मौका समाप्त हो चुका है' : 'Attempt used for today'}</span>
                </div>
                <p className="text-[11px] text-rose-200/80 leading-relaxed">
                  {language === 'hi'
                    ? `आज आपका उत्तर गलत हो गया था। कल रात 12:00 बजे (शेष: ${timeUntilReset.formatted}) रीसेट के बाद पुनः प्रयास करें!`
                    : `You got this question wrong today. Try again tomorrow after daily reset (${timeUntilReset.formatted})!`}
                </p>
                <button
                  onClick={() => {
                    playTapSound();
                    setActiveMathTask(null);
                  }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer border border-white/20"
                >
                  {language === 'hi' ? 'कल फिर कोशिश करेंगे (OK)' : 'Got it (OK)'}
                </button>
              </div>
            ) : (
              <>
                {/* 4 Options Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {activeMathTask.quizData.options.map((option, idx) => {
                    const optionLetter = ['A', 'B', 'C', 'D'][idx] || '';
                    const isSelected = selectedMathOption === option;
                    const isCorrect = option === activeMathTask.quizData!.correctAnswer;
                    const hasAnswered = selectedMathOption !== null;

                    let btnStyle = 'bg-[#0b1c3c] hover:bg-[#122a57] border border-cyan-500/30 text-white shadow-sm active:scale-95';
                    if (hasAnswered) {
                      if (isSelected) {
                        btnStyle = isCorrect
                          ? 'bg-emerald-500 text-slate-950 font-black border-2 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-102'
                          : 'bg-rose-600 text-white font-black border-2 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.8)]';
                      } else if (isCorrect && mathQuizResult === 'wrong') {
                        btnStyle = 'bg-emerald-950/70 border-2 border-emerald-400/80 text-emerald-200 font-bold';
                      } else {
                        btnStyle = 'bg-slate-900/50 border border-slate-700/40 text-slate-500 opacity-50 cursor-not-allowed';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={hasAnswered}
                        onClick={() => handleSelectMathOption(option)}
                        className={`p-3.5 rounded-2xl flex items-center justify-between gap-2 font-mono text-base transition-all duration-200 cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-xs font-sans font-black opacity-80 shrink-0">
                          {optionLetter}
                        </span>
                        <span className="font-extrabold text-lg flex-1 text-center">
                          {option}
                        </span>
                        <span className="w-5 flex justify-end shrink-0">
                          {isSelected && isCorrect && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                          {isSelected && !isCorrect && <X className="w-4 h-4 text-white stroke-[3]" />}
                          {hasAnswered && !isSelected && isCorrect && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback Result Banners */}
                {mathQuizResult === 'correct' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-2 border-emerald-400/70 text-center space-y-2 animate-bounce-short shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-black text-sm">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{language === 'hi' ? '🎉 बधाई हो! बिल्कुल सही उत्तर!' : '🎉 Congratulations! Correct!'}</span>
                    </div>
                    <p className="text-xs text-emerald-100 font-semibold">
                      {language === 'hi'
                        ? '+15 $MIMI टोकन आपके वॉलेट में जोड़ दिए गए हैं!'
                        : '+15 $MIMI tokens credited to your balance!'}
                    </p>
                    <button
                      onClick={() => {
                        playTapSound();
                        setActiveMathTask(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      {language === 'hi' ? 'शानदार! जारी रखें (Continue)' : 'Awesome! Continue'}
                    </button>
                  </div>
                )}

                {mathQuizResult === 'wrong' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 to-red-950/90 border-2 border-rose-400/70 text-center space-y-2 animate-fadeIn shadow-[0_0_25px_rgba(244,63,94,0.4)]">
                    <div className="flex items-center justify-center gap-1.5 text-rose-300 font-black text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>{language === 'hi' ? '❌ गलत उत्तर!' : '❌ Wrong Answer!'}</span>
                    </div>
                    <p className="text-xs text-rose-100 font-medium">
                      {language === 'hi'
                        ? `सही उत्तर ${activeMathTask.quizData.correctAnswer} था। कल फिर प्रयास करें!`
                        : `The correct answer was ${activeMathTask.quizData.correctAnswer}. Try again tomorrow!`}
                    </p>
                    <button
                      onClick={() => {
                        playTapSound();
                        setActiveMathTask(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-rose-400/40 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                    >
                      {language === 'hi' ? 'ठीक है, कल कोशिश करेंगे (OK)' : 'OK, will try tomorrow'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
