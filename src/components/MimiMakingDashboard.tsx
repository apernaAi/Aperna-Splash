import React, { useState, useEffect } from 'react';
import { Music, Disc3, Sparkles, Clock, CheckCircle2, FastForward, Play, Layers, ChevronRight, Trophy, Lock, ShieldCheck, Wallet, Coins, ArrowUpRight } from 'lucide-react';
import { UserStats, Language, getRequiredLoopsForLevel, MUSIC_TRACKS_DATABASE } from '../types/airdrop.ts';
import { TON_CONFIG } from '../utils/tonService.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { playTurntableStartSound, playClaimRewardSound, playLoopMergeSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import { TelegramIcon } from './TelegramIcon.tsx';

interface Props {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  language: Language;
  onOpenLibrary: () => void;
  onOpenWallet: () => void;
  onOpenClaimModal?: () => void;
  onLevelUpCelebration: (newLevel: number, unlockedTrackId: number) => void;
  onOpenRank?: () => void;
}

export const MimiMakingDashboard: React.FC<Props> = ({
  stats,
  onUpdateStats,
  language,
  onOpenLibrary,
  onOpenWallet,
  onOpenClaimModal,
  onLevelUpCelebration,
  onOpenRank,
}) => {
  const [now, setNow] = useState(Date.now());
  const [isMerging, setIsMerging] = useState(false);

  // 1-second interval to update live countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isWalletConnected = Boolean(stats.walletAddress);

  const requiredLoops = getRequiredLoopsForLevel(stats.level);
  const currentLoops = stats.currentLevelLoops || 0;
  const isMergeReady = currentLoops >= requiredLoops && stats.level <= 10;

  // Calculate 8-hour loop making timer status
  const turntableLevel = stats.studioUpgrades?.turntableLevel || 1;
  const amplifierLevel = stats.studioUpgrades?.amplifierLevel || 1;
  const craftReductionSec = Math.max(0, turntableLevel * 120); // -2 minutes (120s) per turntable level
  const baseDurationSec = stats.loopDurationSec || 28800;
  const effectiveDurationSec = Math.max(7200, baseDurationSec - craftReductionSec);
  const LOOP_DURATION_MS = effectiveDurationSec * 1000;
  const elapsedMs = stats.loopStartTime ? now - stats.loopStartTime : 0;
  const isLoopFinished = stats.loopMakingActive && elapsedMs >= LOOP_DURATION_MS;
  const isLoopActive = stats.loopMakingActive && !isLoopFinished;

  const msRemaining = Math.max(0, LOOP_DURATION_MS - elapsedMs);
  const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesLeft = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((msRemaining % (1000 * 60)) / 1000);

  const formattedTimer = `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
  const loopProgressPercent = Math.min(100, Math.floor((elapsedMs / LOOP_DURATION_MS) * 100));

  // Current Target Track
  const targetTrack = MUSIC_TRACKS_DATABASE.find((t) => t.id === stats.level) || MUSIC_TRACKS_DATABASE[0];

  // Action 1: Start 8-hour Loop Making (LOCKED if no wallet)
  const handleStartLoopMaking = () => {
    if (!isWalletConnected) {
      onOpenWallet();
      return;
    }

    playTurntableStartSound();
    triggerHaptic('medium');

    onUpdateStats({
      ...stats,
      loopMakingActive: true,
      loopStartTime: Date.now(),
    });
  };

  // Action 2: Claim Completed Loop
  const handleClaimLoop = () => {
    playClaimRewardSound();
    triggerHaptic('heavy');

    const newLoops = currentLoops + 1;
    const newTotal = (stats.totalLoopsCrafted || 0) + 1;
    const amplifierBonus = (amplifierLevel - 1) * 2;
    const bonusTokens = 5 + amplifierBonus;

    onUpdateStats({
      ...stats,
      loopMakingActive: false,
      loopStartTime: null,
      currentLevelLoops: newLoops,
      totalLoopsCrafted: newTotal,
      balance: Number((stats.balance + bonusTokens).toFixed(2)),
      inAppBalance: Number((stats.inAppBalance + bonusTokens).toFixed(2)),
    });
  };

  // Action 3: Fast-forward (Test 8h Cooldown for instant demo testing)
  const handleFastForwardDemo = () => {
    playTapSound();
    onUpdateStats({
      ...stats,
      loopMakingActive: true,
      loopStartTime: Date.now() - LOOP_DURATION_MS - 1000,
    });
  };

  // Action 4: Merge Loops & Level Up!
  const handleMergeLoops = () => {
    if (!isMergeReady || isMerging) return;

    playLoopMergeSound();
    setIsMerging(true);

    setTimeout(() => {
      setIsMerging(false);

      const nextLevel = Math.min(10, stats.level + 1);
      const unlockedTrackId = nextLevel;
      const newUnlockedIds = Array.from(new Set([...(stats.unlockedTrackIds || [1]), 1, stats.level, nextLevel]));
      const amplifierMergeBonus = (amplifierLevel - 1) * 5;
      const levelReward = stats.level * 500;
      const levelCompletionBonus = levelReward + amplifierMergeBonus;

      onUpdateStats({
        ...stats,
        level: nextLevel,
        currentLevelLoops: 0,
        unlockedTrackIds: newUnlockedIds,
        balance: Number((stats.balance + levelCompletionBonus).toFixed(2)),
        inAppBalance: Number((stats.inAppBalance + levelCompletionBonus).toFixed(2)),
      });

      onLevelUpCelebration(nextLevel, unlockedTrackId);
    }, 1200);
  };

  return (
    <div className="w-full flex flex-col gap-3 pb-36 pt-1 px-3.5 select-none animate-fadeIn">
      {/* Sleek Top Header Bar: Level, Track, Balance, & Music Library */}
      <div className="w-full flex items-center justify-between gap-2 p-1">
        {/* Level & Target Track Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="px-3 py-1.5 rounded-2xl bg-[#09224f]/90 border border-cyan-400/40 shadow-sm flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-black text-white font-mono">
              Lvl {stats.level}
            </span>
          </div>
          <span className="text-xs font-bold text-cyan-200/90 truncate">
            #{targetTrack.id} {targetTrack.title}
          </span>
        </div>

        {/* Right: Balance & Dedicated Music Library Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2.5 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-black flex items-center gap-1 shadow-sm">
            <span>🪙</span>
            <span>{stats.balance.toLocaleString()}</span>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onOpenLibrary();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/30 hover:to-blue-600/40 border border-cyan-400/40 text-cyan-200 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer text-xs font-black"
          >
            <Music className="w-3.5 h-3.5 text-cyan-300" />
            <span>{language === 'hi' ? 'लाइब्रेरी' : 'Library'}</span>
            <span className="text-[10px] text-cyan-300/80 font-mono">
              {Math.max(1, (stats.unlockedTrackIds || []).length)}/10
            </span>
          </button>
        </div>
      </div>

      {/* 2. Main Center Dashboard Card */}
      <div className="relative w-full rounded-3xl glass-panel-glow p-6 flex flex-col items-center justify-center shadow-[0_15px_50px_rgba(0,10,40,0.85)] overflow-hidden">
        {/* Animated Sonic Ambient Waveform Rings */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-cyan-500/15 to-transparent pointer-events-none" />

        {/* Current Level Loop Requirements Banner */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div className="text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
              {language === 'hi' ? `लेवल ${stats.level} प्रगति` : `LEVEL ${stats.level} PROGRESS`}
            </span>
            <span className="text-sm font-extrabold text-white">
              {currentLoops} / {requiredLoops} {language === 'hi' ? 'लूप्स पूरे हुए' : 'Loops Collected'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-cyan-300/80 block">
              {language === 'hi' ? 'अनलॉक पुरस्कार:' : 'Unlock Reward:'}
            </span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-xs font-black text-amber-300">
                Track #{targetTrack.id}
              </span>
              <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400/40">
                +{(stats.level * 500).toLocaleString()} $MIMI
              </span>
            </div>
          </div>
        </div>

        {/* Visual Loop Slots / Nodes Indicator */}
        <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 mb-6 px-1 flex-wrap">
          {Array.from({ length: requiredLoops }).map((_, idx) => {
            const isFilled = idx < currentLoops;
            return (
              <div
                key={idx}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isFilled
                    ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 border border-cyan-200 text-slate-950 font-black shadow-[0_0_12px_rgba(0,210,255,0.7)] scale-105'
                    : 'bg-[#05173e] border border-cyan-500/30 text-cyan-500/40'
                }`}
                title={`Loop Slot #${idx + 1}`}
              >
                {isFilled ? <Disc3 className="w-4 h-4 animate-spin-smooth" /> : <span className="text-[10px] font-mono">{idx + 1}</span>}
              </div>
            );
          })}
        </div>

        {/* 3. CENTRAL VISUAL ELEMENT: Crystal-Clear Official Mimi Cat Token ($MIMI) */}
        <div className="relative my-3 flex flex-col items-center justify-center">
          {/* Pulsing soundwave rings when music generation is ACTIVE */}
          {isLoopActive && (
            <>
              <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-cyan-400/40 animate-ping pointer-events-none" />
              <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-sky-300/30 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Central Glowing Turntable & Token Emblem */}
          <div
            className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-2 transition-all duration-300 flex items-center justify-center shadow-[0_0_40px_rgba(0,210,255,0.5)] ${
              isLoopActive
                ? 'scale-105 shadow-[0_0_60px_rgba(0,210,255,0.85)]'
                : 'hover:scale-102'
            }`}
          >
            {/* Ambient Rotating Turntable Grooves & Gold Rim */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 p-[3px] shadow-lg ${
                isLoopActive ? 'animate-spin-smooth' : 'animate-pulse'
              }`}
              style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }}
            >
              {/* Inner Vinyl Groove Texture */}
              <div className="w-full h-full bg-[#04122d] rounded-full flex items-center justify-center border border-cyan-400/30">
                <div className="w-[94%] h-[94%] rounded-full border border-cyan-500/20" />
              </div>
            </div>

            {/* Official Crystal-Clear Mimi Cat Token Coin Image (Ultra-HD, No Blur) */}
            <div
              className="relative w-[88%] h-[88%] rounded-full overflow-hidden flex items-center justify-center z-10 bg-cyan-950/60 border-2 border-cyan-300 shadow-[0_0_20px_rgba(0,210,255,0.6)]"
              style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }}
            >
              <img
                src={ASSETS.mimiCatToken}
                alt="Music Mimi Official Token"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full drop-shadow-md select-none pointer-events-none"
                style={{
                  imageRendering: 'crisp-edges',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              />
            </div>
          </div>

          {/* Clean Audio Equalizer Indicator (Below Coin, Never Obscuring or Blurring Face) */}
          {isLoopActive && (
            <div className="mt-3.5 flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#03153d]/90 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4.5 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-3 bg-cyan-200 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
              <span className="text-[10px] font-mono font-black text-cyan-200 uppercase tracking-widest">
                {language === 'hi' ? 'लूप तैयार हो रहा है...' : 'Crafting Audio Loop...'}
              </span>
            </div>
          )}
        </div>

        {/* 4. PRIMARY ACTION BUTTON: Positioned right below the central icon */}
        <div className="w-full max-w-xs mt-5 flex flex-col items-center gap-2.5">
          {/* STATE LOCK: If wallet is NOT connected, button is disabled and prompts wallet connect */}
          {!isWalletConnected ? (
            <button
              onClick={onOpenWallet}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500/80 via-orange-500/80 to-amber-600/80 hover:from-amber-400 hover:to-orange-400 border border-amber-300/50 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>{language === 'hi' ? 'TON वॉलेट जोड़ें (Mimi Making अनलॉक)' : 'Connect TON Wallet (Unlock)'}</span>
            </button>
          ) : isLoopFinished ? (
            /* STATE C: LOOP FINISHED -> CLAIM LOOP */
            <button
              onClick={handleClaimLoop}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.7)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>{language === 'hi' ? 'लूप दावा करें (Claim Loop)' : 'Claim Loop'}</span>
            </button>
          ) : isLoopActive ? (
            /* STATE B: ACTIVE -> 8-HOUR COUNTDOWN TIMER */
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full py-3 px-4 rounded-2xl bg-[#071d47] border border-cyan-400/50 shadow-inner flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Clock className="w-4 h-4 animate-spin-smooth" />
                  <span className="text-xs font-bold">
                    {language === 'hi' ? 'लूप तैयार हो रहा है' : 'Crafting Loop'}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-white tracking-widest drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]">
                  {formattedTimer}
                </span>
              </div>

              {/* Progress Bar of 8 Hours */}
              <div className="w-full h-2 bg-[#04122d] rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 transition-all duration-300"
                  style={{ width: `${Math.max(4, loopProgressPercent)}%` }}
                />
              </div>

              {/* Testing / Fast Forward Button for 8h Timer */}
              <button
                onClick={handleFastForwardDemo}
                className="text-[11px] font-mono text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mt-1"
                title="Instant finish for fast testing"
              >
                <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language === 'hi' ? '⚡ टेस्ट 8h स्किप (Fast-Forward)' : '⚡ Fast-Forward 8h (Test Claim)'}</span>
              </button>
            </div>
          ) : (
            /* STATE A: IDLE -> MIMI MAKING (UNLOCKED!) */
            <button
              onClick={handleStartLoopMaking}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm tracking-wider shadow-[0_0_30px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Disc3 className="w-5 h-5 text-slate-950" />
              <span>Mimi Making</span>
            </button>
          )}

          <p className="text-[11px] text-cyan-200/70 text-center font-medium mt-1">
            {!isWalletConnected
              ? language === 'hi'
                ? 'सुरक्षा: बिना TON वॉलेट लूप बनाना लॉक है ताकि बॉट दूर रहें।'
                : 'Security: Loop creation locked until TON wallet is bound.'
              : isLoopActive
              ? language === 'hi'
                ? '8 घंटे में 1 संगीत लूप पूरा बनकर तैयार होगा।'
                : 'Takes 8 hours to synthesize 1 master music loop.'
              : language === 'hi'
                ? '"Mimi Making" दबाकर 8 घंटे का लूप क्राफ्टिंग चक्र शुरू करें।'
                : 'Click "Mimi Making" to begin 8-hour loop craft cycle.'}
          </p>
        </div>

        {/* 5. MERGE LOOPS BUTTON: Automatically appears when all required loops are collected! */}
        {isMergeReady && (
          <div className="w-full mt-6 pt-4 border-t border-cyan-400/30 animate-fadeIn flex flex-col items-center">
            <button
              onClick={handleMergeLoops}
              disabled={isMerging}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_35px_rgba(251,191,36,0.8)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>
                {language === 'hi'
                  ? `लूप्स मर्ज करें (+{(stats.level * 500).toLocaleString()} $MIMI) → Track #${targetTrack.id}`
                  : `Merge Loops (+{(stats.level * 500).toLocaleString()} $MIMI) → Track #${targetTrack.id}`}
              </span>
            </button>
            <span className="text-[10px] text-amber-200 mt-1 font-bold">
              {language === 'hi'
                ? `सभी ${requiredLoops} लूप्स तैयार हैं! मर्ज करके ट्रैक #${targetTrack.id} और लेवल ${stats.level + 1} अनलॉक करें!`
                : `All ${requiredLoops} loops collected! Merge to unlock Track #${targetTrack.id} & Level ${stats.level + 1}!`}
            </span>
          </div>
        )}
      </div>

      {/* 6. Level Progression Rules & Table Overview Card */}
      <div className="w-full rounded-2xl glass-panel-blue p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-300" />
            <span>{language === 'hi' ? 'लेवल प्रोग्रेशन और लूप आवश्यकताएँ' : 'Level Progression & Requirements'}</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-300">
            +1 Loop per Level
          </span>
        </div>

        {/* Horizontal Mini Progression Chips */}
        <div className="grid grid-cols-5 gap-1.5 mt-2">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const isDone = stats.level > lvl;
            const isCurrent = stats.level === lvl;
            const req = lvl + 3;

            return (
              <div
                key={lvl}
                className={`py-1.5 px-1 rounded-xl text-center border transition-all ${
                  isDone
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : isCurrent
                    ? 'bg-[#0a275e] border-cyan-300 text-white shadow-[0_0_10px_rgba(0,210,255,0.4)]'
                    : 'bg-[#04122d]/60 border-blue-950 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-black">Lvl {lvl}</div>
                <div className="text-[9px] font-mono text-cyan-300/80">{req} Loops</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
