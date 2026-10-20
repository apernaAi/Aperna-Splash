/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Check,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Zap,
} from 'lucide-react';
import { AirdropTask, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import { getTimeUntilNextReset } from '../utils/dailyTaskService.ts';

interface Props {
  mathTasks: AirdropTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  onFailTask?: (taskId: string) => void;
  onBack: () => void;
  language: Language;
  onFocusTask?: (task: AirdropTask) => void;
}

export const QuizArenaView: React.FC<Props> = ({
  mathTasks,
  onCompleteTask,
  onFailTask,
  onBack,
  language,
  onFocusTask,
}) => {
  const [opFilter, setOpFilter] = useState<'all' | '+' | '-' | '×' | '÷'>('all');
  const [inlineTaskAnswer, setInlineTaskAnswer] = useState<Record<string, { option: number; isCorrect: boolean }>>({});
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilNextReset());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalTasks = mathTasks.length;
  const solvedCount = mathTasks.filter(
    (t) => t.isCompleted || inlineTaskAnswer[t.id]?.isCorrect === true
  ).length;
  const failedCount = mathTasks.filter(
    (t) => t.isFailedToday || (inlineTaskAnswer[t.id] && !inlineTaskAnswer[t.id].isCorrect)
  ).length;
  const progressPercent = Math.round((solvedCount / Math.max(1, totalTasks)) * 100);
  const remainingCount = Math.max(0, totalTasks - solvedCount - failedCount);

  const filteredQuestions = mathTasks.filter((t) => {
    if (opFilter === 'all') return true;
    return t.quizData?.operation === opFilter;
  });

  const handleSelectOption = (task: AirdropTask, option: number, e: React.MouseEvent) => {
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

  return (
    <div className="w-full flex flex-col gap-3.5 pb-8 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => {
            playTapSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#092247] hover:bg-[#0e326b] border border-cyan-500/30 text-cyan-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-300" />
          <span>{language === 'hi' ? 'टास्क सूची पर वापस' : 'Back to Quests'}</span>
        </button>

        <div className="flex items-center gap-1.5 bg-violet-950/80 border border-violet-400/40 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold text-violet-200 shadow-sm">
          <span className="text-[10px] text-violet-300/80 uppercase font-sans">
            {language === 'hi' ? 'रीसेट:' : 'Reset:'}
          </span>
          <span className="text-amber-300">⏳ {timeUntilReset.formatted}</span>
        </div>
      </div>

      {/* Arena Hero Dashboard Card */}
      <div className="w-full rounded-3xl p-4 bg-gradient-to-br from-[#1e1346] via-[#0e1d4d] to-[#040e29] border-2 border-violet-400/40 shadow-[0_12px_40px_rgba(139,92,246,0.35)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white text-2xl shadow-[0_0_20px_rgba(139,92,246,0.7)] border border-violet-300/40 shrink-0">
              🧮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-300 border border-violet-400/40">
                  ⚡ QUIZ ARENA
                </span>
                <span className="text-xs font-black text-amber-300 font-mono">
                  +450 $MIMI POOL
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide mt-0.5">
                {language === 'hi' ? 'मिमी मैथ क्विज एरीना' : 'Mimi Math Quiz Arena'}
              </h2>
            </div>
          </div>
        </div>

        {/* 3 Arena Live Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">
              {language === 'hi' ? 'हल किए' : 'Solved'}
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-emerald-400">
              {solvedCount} / {totalTasks}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">
              {language === 'hi' ? 'आज कमाई' : 'Earned'}
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-amber-300">
              +{solvedCount * 15}
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block font-medium">
              {language === 'hi' ? 'शेष प्रश्न' : 'Remaining'}
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-cyan-300">
              {remainingCount}
            </span>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-cyan-300/80">
            <span>{language === 'hi' ? 'दैनिक एरीना प्रगति' : 'Daily Arena Progress'}</span>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Operation Filter Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: language === 'hi' ? 'सभी प्रश्न (30)' : 'All Tasks (30)' },
          { id: '+', label: language === 'hi' ? '➕ जोड़ (+)' : '➕ Addition (+)' },
          { id: '-', label: language === 'hi' ? '➖ घटाव (-)' : '➖ Subtraction (-)' },
          { id: '×', label: language === 'hi' ? '✖️ गुणा (×)' : '✖️ Multiply (×)' },
          { id: '÷', label: language === 'hi' ? '➗ भाग (÷)' : '➗ Division (÷)' },
        ].map((op) => {
          const isSelected = opFilter === op.id;
          return (
            <button
              key={op.id}
              onClick={() => {
                playTapSound();
                setOpFilter(op.id as typeof opFilter);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-violet-500 to-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(139,92,246,0.6)] scale-102'
                  : 'bg-[#091e45] text-cyan-200 border border-cyan-500/20 hover:bg-[#0e2d63]'
              }`}
            >
              {op.label}
            </button>
          );
        })}
      </div>

      {/* 30 Questions Cards List */}
      <div className="flex flex-col gap-2.5">
        {filteredQuestions.map((task, idx) => {
          const inlineAns = inlineTaskAnswer[task.id];
          const isLocked = Boolean(task.isFailedToday || (inlineAns && inlineAns.isCorrect === false));
          const isDone = Boolean(task.isCompleted || (inlineAns && inlineAns.isCorrect === true));
          const hasAttempted = isDone || isLocked || inlineAns !== undefined;

          return (
            <div
              key={task.id}
              className={`w-full rounded-2xl p-3.5 glass-panel-blue transition-all flex flex-col gap-2.5 border ${
                isDone
                  ? 'border-emerald-500/40 bg-[#06193d]/70'
                  : isLocked
                  ? 'border-rose-500/40 bg-[#1f0e1a]/70'
                  : 'border-violet-500/40 hover:border-violet-400/70 shadow-sm'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm border border-violet-400/40 font-mono font-black text-sm flex-shrink-0">
                    {task.quizData?.operation || '🧮'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-black text-amber-300 font-mono flex items-center gap-1">
                        <img src={ASSETS.mimiTokenCoin} alt="$MIMI" className="w-3.5 h-3.5 rounded-full object-cover" />
                        +{task.reward} $MIMI
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-white truncate mt-0.5">
                      {language === 'hi' ? task.title : task.titleEn}
                    </h4>
                  </div>
                </div>

                {/* Status Badge or Focus Button */}
                <div className="flex-shrink-0">
                  {isDone ? (
                    <div className="flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/40">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'hi' ? 'पूरा हुआ' : 'Done'}</span>
                    </div>
                  ) : isLocked ? (
                    <div className="flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/40">
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>{language === 'hi' ? 'कल प्रयास करें' : 'Try Tomorrow'}</span>
                    </div>
                  ) : onFocusTask ? (
                    <button
                      onClick={() => onFocusTask(task)}
                      className="px-2.5 py-1 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 text-[11px] font-bold border border-violet-400/30 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-violet-300" />
                      <span>{language === 'hi' ? 'बड़ा देखें' : 'Focus'}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Math Question Highlight */}
              <div className="w-full py-2 px-3 rounded-xl bg-black/45 border border-violet-500/20 flex items-center justify-between">
                <span className="text-[11px] text-violet-200/90 font-medium">
                  {language === 'hi' ? 'हल करें (1 मौका):' : 'Solve equation:'}
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-cyan-200 tracking-wider">
                  {task.quizData?.question}
                </span>
              </div>

              {/* Options Grid or Result */}
              {isDone ? (
                <div className="py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-center space-y-0.5">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'hi' ? '🎉 सही उत्तर! (+15 $MIMI मिले)' : '🎉 Correct! (+15 $MIMI credited)'}</span>
                  </div>
                </div>
              ) : isLocked ? (
                <div className="py-2 px-3 rounded-xl bg-rose-950/60 border border-rose-400/40 text-center space-y-0.5">
                  <div className="flex items-center justify-center gap-1.5 text-rose-300 font-bold text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {language === 'hi'
                        ? `❌ गलत उत्तर! सही उत्तर ${task.quizData?.correctAnswer} था`
                        : `❌ Wrong answer! Correct answer was ${task.quizData?.correctAnswer}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {task.quizData?.options.map((option, optIdx) => {
                    const optionLetter = ['A', 'B', 'C', 'D'][optIdx];
                    const isOptionSelected = inlineAns?.option === option;
                    const isOptionCorrect = option === task.quizData!.correctAnswer;

                    let btnClass = 'bg-[#0b1c3c] hover:bg-[#122a57] border border-cyan-500/30 text-white active:scale-95';
                    if (inlineAns) {
                      if (isOptionSelected) {
                        btnClass = isOptionCorrect
                          ? 'bg-emerald-500 text-slate-950 font-black border-2 border-emerald-300'
                          : 'bg-rose-600 text-white font-black border-2 border-rose-300';
                      } else if (isOptionCorrect && inlineAns.isCorrect === false) {
                        btnClass = 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-bold';
                      } else {
                        btnClass = 'bg-slate-900/50 border border-slate-700/40 text-slate-500 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={hasAttempted}
                        onClick={(e) => handleSelectOption(task, option, e)}
                        className={`p-2 rounded-xl flex items-center justify-between gap-1.5 font-mono text-xs sm:text-sm transition-all duration-150 cursor-pointer ${btnClass}`}
                      >
                        <span className="w-4 h-4 rounded-md bg-black/40 flex items-center justify-center text-[9px] font-sans font-black opacity-80 shrink-0">
                          {optionLetter}
                        </span>
                        <span className="font-extrabold text-sm sm:text-base flex-1 text-center">
                          {option}
                        </span>
                        <span className="w-3.5 flex justify-end shrink-0">
                          {isOptionSelected && isOptionCorrect && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                          {isOptionSelected && !isOptionCorrect && <X className="w-3 h-3 text-white stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Back Button */}
      <button
        onClick={() => {
          playTapSound();
          onBack();
        }}
        className="w-full py-2.5 rounded-2xl bg-[#092247] hover:bg-[#0e326b] border border-cyan-500/30 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{language === 'hi' ? 'टास्क सूची पर वापस जाएँ' : 'Back to Main Tasks'}</span>
      </button>
    </div>
  );
};
