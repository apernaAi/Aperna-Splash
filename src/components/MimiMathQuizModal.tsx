import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListFilter,
  Grid,
  RotateCcw,
} from 'lucide-react';
import { AirdropTask, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import { getTimeUntilNextReset } from '../utils/dailyTaskService.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: AirdropTask[];
  onCompleteTask: (taskId: string, reward: number) => void;
  onFailTask?: (taskId: string) => void;
  language: Language;
}

export const MimiMathQuizModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks,
  onCompleteTask,
  onFailTask,
  language,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [viewMode, setViewMode] = useState<'stepper' | 'list'>('stepper');
  const [opFilter, setOpFilter] = useState<'all' | '+' | '-' | '×' | '÷'>('all');
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilNextReset());

  // Per-task inline answer tracking for list view
  const [listAnswers, setListAnswers] = useState<Record<string, { option: number; isCorrect: boolean }>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allReset = tasks.every((t) => !t.isCompleted && !t.isFailedToday);
    if (allReset && Object.keys(listAnswers).length > 0) {
      setListAnswers({});
      setSelectedOption(null);
      setFeedbackResult('idle');
    }
  }, [tasks]);

  if (!isOpen) return null;

  const mathTasks = tasks.filter((t) => t.category === 'math' || t.quizData);
  const filteredTasks = mathTasks.filter((t) => {
    if (opFilter === 'all') return true;
    return t.quizData?.operation === opFilter;
  });

  const totalTasks = mathTasks.length;
  const completedCount = mathTasks.filter((t) => t.isCompleted).length;
  const failedCount = mathTasks.filter((t) => t.isFailedToday).length;
  const tokensWon = completedCount * 15;
  const totalPossible = totalTasks * 15;

  const currentTask = filteredTasks[currentIndex] || filteredTasks[0] || mathTasks[0];

  const handleSelectOption = (option: number) => {
    if (!currentTask || !currentTask.quizData) return;
    if (selectedOption !== null || currentTask.isCompleted || currentTask.isFailedToday) return;

    setSelectedOption(option);
    const isCorrect = option === currentTask.quizData.correctAnswer;

    if (isCorrect) {
      setFeedbackResult('correct');
      playClaimRewardSound();
      triggerHaptic('heavy');
      onCompleteTask(currentTask.id, currentTask.reward || 15);
    } else {
      setFeedbackResult('wrong');
      triggerHaptic('medium');
      if (onFailTask) {
        onFailTask(currentTask.id);
      }
    }
  };

  const handleListOptionSelect = (task: AirdropTask, option: number) => {
    if (!task.quizData || task.isCompleted || task.isFailedToday || listAnswers[task.id]) return;

    const isCorrect = option === task.quizData.correctAnswer;
    setListAnswers((prev) => ({
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

  const handleNextQuestion = () => {
    playTapSound();
    setSelectedOption(null);
    setFeedbackResult('idle');
    if (currentIndex < filteredTasks.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevQuestion = () => {
    playTapSound();
    setSelectedOption(null);
    setFeedbackResult('idle');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredTasks.length - 1);
    }
  };

  const jumpToQuestion = (idx: number) => {
    playTapSound();
    setSelectedOption(null);
    setFeedbackResult('idle');
    setCurrentIndex(idx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#180f33] via-[#0d142e] to-[#040817] border-2 border-purple-400/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] text-white overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 pb-3 border-b border-purple-500/20 bg-black/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white text-xl shadow-[0_0_15px_rgba(219,39,119,0.5)] border border-pink-400/40">
              🧮
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200">
                  {language === 'hi' ? 'मिमी मैथ क्विज एरीना' : 'Mimi Math Quiz Arena'}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-300 font-bold">
                  30 Tasks
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80 font-medium">
                {language === 'hi'
                  ? 'हर सही जवाब पर तुरंत 15 $MIMI जीतें • 1 मौका आज'
                  : 'Win 15 $MIMI per correct answer • 1 chance today'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats & Countdown Ribbon */}
        <div className="px-4 py-2 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedCount}/{totalTasks} {language === 'hi' ? 'पूरा' : 'Done'}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-300 font-black font-mono">
              <img src={ASSETS.mimiTokenCoin} alt="$MIMI" className="w-3.5 h-3.5 rounded-full object-cover" />
              <span>+{tokensWon} / {totalPossible} $MIMI</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-mono">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{language === 'hi' ? 'रीसेट:' : 'Reset:'} ⏳ {timeUntilReset.formatted}</span>
          </div>
        </div>

        {/* Operation Filter & View Mode Switcher */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between gap-2 shrink-0 bg-slate-950/30">
          {/* Operations: All, +, -, ×, ÷ */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'all', label: language === 'hi' ? 'सभी' : 'All' },
              { id: '+', label: '➕ जोड़' },
              { id: '-', label: '➖ घटाव' },
              { id: '×', label: '✖️ गुणा' },
              { id: '÷', label: '➗ भाग' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  playTapSound();
                  setOpFilter(btn.id as typeof opFilter);
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setFeedbackResult('idle');
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  opFilter === btn.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Stepper vs List */}
          <button
            onClick={() => {
              playTapSound();
              setViewMode((prev) => (prev === 'stepper' ? 'list' : 'stepper'));
            }}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-cyan-200 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {viewMode === 'stepper' ? (
              <>
                <ListFilter className="w-3.5 h-3.5 text-cyan-300" />
                <span>{language === 'hi' ? 'सूची (30)' : 'List (30)'}</span>
              </>
            ) : (
              <>
                <Grid className="w-3.5 h-3.5 text-cyan-300" />
                <span>{language === 'hi' ? 'कार्ड' : 'Card'}</span>
              </>
            )}
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {viewMode === 'stepper' && currentTask && currentTask.quizData ? (
            <div className="flex flex-col gap-3.5 animate-fadeIn">
              {/* Question Number Pills Navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {filteredTasks.map((t, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isDone = t.isCompleted;
                  const isFailed = t.isFailedToday;

                  let pillStyle = 'bg-white/10 text-slate-300 border-white/10';
                  if (isDone) pillStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 font-bold';
                  else if (isFailed) pillStyle = 'bg-rose-500/20 text-rose-300 border-rose-400/50';
                  if (isCurrent) pillStyle += ' ring-2 ring-pink-400 ring-offset-1 ring-offset-black scale-105';

                  return (
                    <button
                      key={t.id}
                      onClick={() => jumpToQuestion(idx)}
                      className={`w-7 h-7 rounded-lg border text-xs font-mono flex items-center justify-center shrink-0 cursor-pointer transition-all ${pillStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Box */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950/70 via-indigo-950/60 to-slate-900 border-2 border-purple-400/40 shadow-inner space-y-2 text-center relative overflow-hidden">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 font-bold font-mono">
                    {language === 'hi' ? `प्रश्न #${currentIndex + 1} / ${filteredTasks.length}` : `Question #${currentIndex + 1} / ${filteredTasks.length}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono font-black">
                    +15 $MIMI
                  </span>
                </div>

                <div className="py-2">
                  <span className="text-3xl sm:text-4xl font-mono font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-pink-200 drop-shadow-sm">
                    {currentTask.quizData.question}
                  </span>
                </div>

                <p className="text-xs text-purple-200/80">
                  {language === 'hi'
                    ? 'सही उत्तर चुनें (केवल 1 मौका आज):'
                    : 'Choose the correct answer (1 try today):'}
                </p>
              </div>

              {/* Status or 4 Options Grid */}
              {currentTask.isCompleted ? (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400/50 text-center space-y-1.5 animate-fadeIn shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{language === 'hi' ? '🎉 आज पूरा हुआ! +15 $MIMI मिले' : '🎉 Done Today! Won +15 $MIMI'}</span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    {language === 'hi'
                      ? 'आपने यह सवाल पहले ही सही हल कर लिया है। कल रात 12:00 बजे रीसेट पर फिर खेलें!'
                      : 'You already answered this question correctly today. Play again tomorrow after midnight reset!'}
                  </p>
                  <button
                    onClick={handleNextQuestion}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    {language === 'hi' ? 'अगला सवाल देखें ➡️' : 'Next Question ➡️'}
                  </button>
                </div>
              ) : currentTask.isFailedToday ? (
                <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-400/50 text-center space-y-1.5 animate-fadeIn shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                  <div className="flex items-center justify-center gap-1.5 text-rose-300 font-black text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span>{language === 'hi' ? '❌ गलत उत्तर! आज का मौका समाप्त' : '❌ Wrong Answer! Locked Today'}</span>
                  </div>
                  <p className="text-xs text-rose-100">
                    {language === 'hi'
                      ? `सही उत्तर ${currentTask.quizData.correctAnswer} था। कल रात 12:00 बजे रीसेट (शेष: ⏳ ${timeUntilReset.formatted}) के बाद फिर प्रयास करें!`
                      : `The correct answer was ${currentTask.quizData.correctAnswer}. Try again tomorrow after daily reset (${timeUntilReset.formatted})!`}
                  </p>
                  <button
                    onClick={handleNextQuestion}
                    className="w-full mt-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer border border-white/20"
                  >
                    {language === 'hi' ? 'अगला सवाल देखें ➡️' : 'Next Question ➡️'}
                  </button>
                </div>
              ) : (
                <>
                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {currentTask.quizData.options.map((option, idx) => {
                      const letter = ['A', 'B', 'C', 'D'][idx];
                      const isSelected = selectedOption === option;
                      const isCorrect = option === currentTask.quizData!.correctAnswer;
                      const hasChosen = selectedOption !== null;

                      let btnStyle = 'bg-[#0b1c3c] hover:bg-[#122a57] border border-cyan-500/30 text-white shadow-sm active:scale-95';
                      if (hasChosen) {
                        if (isSelected) {
                          btnStyle = isCorrect
                            ? 'bg-emerald-500 text-slate-950 font-black border-2 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-102'
                            : 'bg-rose-600 text-white font-black border-2 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.8)]';
                        } else if (isCorrect && feedbackResult === 'wrong') {
                          btnStyle = 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-bold';
                        } else {
                          btnStyle = 'bg-slate-900/50 border border-slate-700/40 text-slate-500 opacity-50 cursor-not-allowed';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasChosen}
                          onClick={() => handleSelectOption(option)}
                          className={`p-3.5 rounded-2xl flex items-center justify-between gap-2 font-mono text-base transition-all duration-200 cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-xs font-sans font-black opacity-80 shrink-0">
                            {letter}
                          </span>
                          <span className="font-extrabold text-lg flex-1 text-center">
                            {option}
                          </span>
                          <span className="w-5 flex justify-end shrink-0">
                            {isSelected && isCorrect && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                            {isSelected && !isCorrect && <X className="w-4 h-4 text-white stroke-[3]" />}
                            {hasChosen && !isSelected && isCorrect && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Feedback Banners */}
                  {feedbackResult === 'correct' && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-2 border-emerald-400/80 text-center space-y-2 animate-bounce-short shadow-[0_0_25px_rgba(52,211,153,0.5)]">
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
                        onClick={handleNextQuestion}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        {language === 'hi' ? 'शानदार! अगला सवाल ➡️' : 'Awesome! Next Question ➡️'}
                      </button>
                    </div>
                  )}

                  {feedbackResult === 'wrong' && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 to-red-950/90 border-2 border-rose-400/80 text-center space-y-2 animate-fadeIn shadow-[0_0_25px_rgba(244,63,94,0.4)]">
                      <div className="flex items-center justify-center gap-1.5 text-rose-300 font-black text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>{language === 'hi' ? '❌ गलत उत्तर!' : '❌ Wrong Answer!'}</span>
                      </div>
                      <p className="text-xs text-rose-100 font-medium">
                        {language === 'hi'
                          ? `सही उत्तर ${currentTask.quizData.correctAnswer} था। कल फिर प्रयास करें!`
                          : `The correct answer was ${currentTask.quizData.correctAnswer}. Try again tomorrow!`}
                      </p>
                      <button
                        onClick={handleNextQuestion}
                        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-rose-400/40 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                      >
                        {language === 'hi' ? 'अगला सवाल देखें ➡️' : 'Next Question ➡️'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Prev / Next Navigation Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={handlePrevQuestion}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पिछला' : 'Prev'}</span>
                </button>

                <span className="text-[11px] font-mono text-purple-300">
                  {currentIndex + 1} / {filteredTasks.length}
                </span>

                <button
                  onClick={handleNextQuestion}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  <span>{language === 'hi' ? 'अगला' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* List View: All 30 Tasks */
            <div className="flex flex-col gap-3">
              {filteredTasks.map((task, idx) => {
                if (!task.quizData) return null;
                const inlineAns = listAnswers[task.id];
                const isLocked = Boolean(task.isFailedToday || (inlineAns && inlineAns.isCorrect === false));
                const isDone = Boolean(task.isCompleted || (inlineAns && inlineAns.isCorrect === true));
                const hasAttempted = isDone || isLocked || inlineAns !== undefined;

                return (
                  <div
                    key={task.id}
                    className={`w-full rounded-2xl p-3.5 border transition-all flex flex-col gap-2.5 ${
                      isDone
                        ? 'border-emerald-500/30 bg-[#06193d]/60'
                        : isLocked
                        ? 'border-rose-500/30 bg-[#1f0e1a]/60'
                        : 'border-purple-500/30 bg-purple-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 text-xs font-mono font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-base font-black font-mono text-white">
                          {task.quizData.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-300 font-mono">
                          +15 $MIMI
                        </span>
                        {isDone ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {language === 'hi' ? 'पूरा' : 'Done'}
                          </span>
                        ) : isLocked ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-400/30 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {language === 'hi' ? 'कल' : 'Tomorrow'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* 4 Options Grid */}
                    {isDone ? (
                      <p className="text-[11px] text-emerald-300 text-center font-medium bg-emerald-950/40 py-1.5 rounded-lg border border-emerald-500/20">
                        {language === 'hi' ? '🎉 सही उत्तर! +15 $MIMI क्लेम किए गए' : '🎉 Correct! +15 $MIMI claimed'}
                      </p>
                    ) : isLocked ? (
                      <p className="text-[11px] text-rose-300 text-center font-medium bg-rose-950/40 py-1.5 rounded-lg border border-rose-500/20">
                        {language === 'hi'
                          ? `❌ गलत उत्तर (सही: ${task.quizData.correctAnswer}) - कल पुनः प्रयास करें`
                          : `❌ Wrong (Correct: ${task.quizData.correctAnswer}) - Try tomorrow`}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {task.quizData.options.map((option, optIdx) => {
                          const letter = ['A', 'B', 'C', 'D'][optIdx];
                          const isOptionSelected = inlineAns?.option === option;
                          const isOptionCorrect = option === task.quizData!.correctAnswer;

                          let btnClass = 'bg-[#0b1c3c] hover:bg-[#122a57] border border-cyan-500/30 text-white';
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
                              onClick={() => handleListOptionSelect(task, option)}
                              className={`p-2 rounded-xl flex items-center justify-between font-mono text-xs cursor-pointer active:scale-95 transition-all ${btnClass}`}
                            >
                              <span className="w-4 h-4 rounded bg-black/40 flex items-center justify-center text-[9px] font-sans font-bold">
                                {letter}
                              </span>
                              <span className="font-extrabold text-sm flex-1 text-center">
                                {option}
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
          )}
        </div>

        {/* Footer Close Button */}
        <div className="p-3 border-t border-purple-500/20 bg-black/40 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-purple-300/80 font-mono">
            {language === 'hi' ? 'दैनिक रीसेट: रात 12:00 बजे' : 'Daily Reset: 00:00 Local Time'}
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer border border-white/20"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
