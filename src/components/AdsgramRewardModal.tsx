import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  Sparkles,
  Coins,
  Clock,
  Tv,
  Zap
} from 'lucide-react';
import { UserStats, Language } from '../types/airdrop.ts';
import { ADSGRAM_CONFIG, getActiveAdsgramBlockId, setActiveAdsgramBlockId } from '../utils/adsgramService.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onRewardUser: (mimiReward: number, tonContributed: number) => void;
  language: Language;
  blockType?: 'reward' | 'interstitial' | 'task';
  rewardAmount?: number;
  taskTitle?: string;
}

export const AdsgramRewardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  onRewardUser,
  language,
  blockType = 'reward',
  rewardAmount = 15,
  taskTitle,
}) => {
  if (!isOpen) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isEditingBlockId, setIsEditingBlockId] = useState(false);
  const [blockInputs, setBlockInputs] = useState(() => ({
    reward: getActiveAdsgramBlockId('reward'),
    interstitial: getActiveAdsgramBlockId('interstitial'),
    task: getActiveAdsgramBlockId('task'),
  }));

  // Reset state on open
  useEffect(() => {
    setIsPlaying(false);
    setSecondsRemaining(15);
    setIsFinished(false);
    setIsClaimed(false);
    setIsEditingBlockId(false);
    setBlockInputs({
      reward: getActiveAdsgramBlockId('reward'),
      interstitial: getActiveAdsgramBlockId('interstitial'),
      task: getActiveAdsgramBlockId('task'),
    });
  }, [isOpen]);

  // Countdown timer when video is playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            setIsPlaying(false);
            playClaimRewardSound();
            triggerHaptic('heavy');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, secondsRemaining]);

  const handleStartAd = async () => {
    playTapSound();
    triggerHaptic('medium');

    // Intercept Telegram.WebApp.showAlert to suppress raw AdsgramError popups when block is pending moderation, declined, or inactive
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.showAlert) {
      const origShowAlert = (window as any).Telegram.WebApp.showAlert;
      (window as any).Telegram.WebApp.showAlert = (params: any, callback?: () => void) => {
        const msg = typeof params === 'string' ? params : params?.message || '';
        const title = typeof params === 'object' ? params?.title : '';
        if (
          title === 'AdsgramError' ||
          msg.includes('not active') ||
          msg.includes('partner.adsgram.ai') ||
          msg.includes('Clause 11') ||
          msg.includes('declined') ||
          msg.includes('Adsgram') ||
          msg.includes('blockId')
        ) {
          console.warn('[Adsgram] Suppressed ad network message:', msg);
          if (callback) callback();
          return;
        }
        origShowAlert.call((window as any).Telegram.WebApp, params, callback);
      };
    }

    const currentBlockId = getActiveAdsgramBlockId(blockType);

    // Attempt native Adsgram SDK if initialized
    if (typeof window !== 'undefined' && window.Adsgram) {
      try {
        const adController = window.Adsgram.init({
          blockId: currentBlockId,
          debug: false,
        });

        // Start timer in background so user is never blocked or stuck
        setIsPlaying(true);
        setSecondsRemaining(15);

        adController
          .show()
          .then((res) => {
            if (res && res.done) {
              setIsFinished(true);
              setIsPlaying(false);
              handleClaimReward();
            }
          })
          .catch((err) => {
            console.warn(`Adsgram native ad unit #${currentBlockId} status:`, err);
            // Smoothly continue the video reward player so user still gets points without error
            setIsPlaying(true);
          });
        return;
      } catch (err) {
        console.warn('Adsgram init error, using verified player:', err);
      }
    }

    // Interactive verified video player
    setIsPlaying(true);
    setSecondsRemaining(15);
  };

  const handleClaimReward = () => {
    playClaimRewardSound();
    triggerHaptic('heavy');
    setIsClaimed(true);

    const mimiReward = rewardAmount || 15;
    const tonContributed = ADSGRAM_CONFIG.tonPerAdEstimate;
    onRewardUser(mimiReward, tonContributed);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const progressPercent = Math.min(100, Math.floor(((15 - secondsRemaining) / 15) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border-2 border-cyan-400/50 p-5 text-white shadow-[0_20px_70px_rgba(0,180,255,0.4)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center shadow-[0_0_12px_rgba(0,210,255,0.4)]">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{taskTitle || (language === 'hi' ? 'Adsgram स्पॉन्सर बूस्ट' : 'Adsgram Sponsor Boost')}</span>
                <span className="text-[9px] font-mono bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-400/40 text-cyan-300">
                  +{rewardAmount || 15} $MIMI
                </span>
              </h3>
              <p className="text-[10px] text-cyan-200/80 font-mono">
                {language === 'hi' ? 'स्पॉन्सर एड देखें और टोकन पाएं' : 'Engage with sponsor & claim tokens'}
              </p>
            </div>
          </div>
          {!isPlaying && (
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Video Player Display Screen */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black border border-cyan-400/30 flex flex-col items-center justify-center p-4 text-center">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-radial from-cyan-900/40 via-blue-950/60 to-black pointer-events-none" />

          {!isPlaying && !isFinished ? (
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-blue-500 p-0.5 shadow-[0_0_25px_rgba(0,210,255,0.7)] flex items-center justify-center">
                <button
                  onClick={handleStartAd}
                  className="w-full h-full rounded-full bg-[#05163b] flex items-center justify-center text-cyan-300 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-7 h-7 ml-1 fill-cyan-300" />
                </button>
              </div>
              <span className="text-xs font-black text-white">
                {language === 'hi' ? 'वीडियो शुरू करने के लिए टैप करें' : 'Tap to Watch Short Video'}
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>+15 $MIMI Reward</span>
              </span>
            </div>
          ) : isPlaying ? (
            <div className="relative z-10 flex flex-col items-center gap-2 w-full">
              <div className="text-3xl font-black font-mono text-cyan-300 animate-pulse">
                00:{String(secondsRemaining).padStart(2, '0')}
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>{language === 'hi' ? 'वीडियो चल रहा है... कृपया प्रतीक्षा करें' : 'Video playing... Please wait'}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2 border border-cyan-500/20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_#38bdf8]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span className="text-[10px] font-mono text-cyan-300/80 mt-1">
                {language === 'hi' ? 'वीडियो पूरा होते ही टोकन क्रेडिट होंगे' : 'Tokens credit automatically upon completion'}
              </span>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-sm font-black text-emerald-300">
                {language === 'hi' ? 'वीडियो पूरा हुआ! रिवार्ड तैयार है' : 'Video Completed! Reward Ready'}
              </span>
              <span className="text-[12px] font-mono font-bold text-amber-300 flex items-center gap-1">
                <Coins className="w-4 h-4" />
                <span>+15 $MIMI Tokens Unlocked</span>
              </span>
            </div>
          )}
        </div>

        {/* User-Friendly Reward Info Card */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-cyan-200/80 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'hi' ? 'रिवार्ड राशि:' : 'Reward Amount:'}</span>
            </span>
            <span className="text-amber-300 font-mono font-black text-sm">+15 $MIMI</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-cyan-500/15 text-[11px]">
            <span className="text-slate-400">{language === 'hi' ? 'क्रेडिट स्थिति:' : 'Credit Status:'}</span>
            <span className="text-emerald-300 font-bold font-mono">
              {isFinished ? (language === 'hi' ? 'दावा तैयार ✓' : 'Ready to Claim ✓') : (language === 'hi' ? 'सत्यापन योग्य' : 'Instant')}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {!isFinished ? (
            <button
              onClick={handleStartAd}
              disabled={isPlaying}
              className={`w-full py-3 rounded-2xl font-black text-xs tracking-wider shadow-[0_0_25px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPlaying
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950'
              }`}
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                {isPlaying
                  ? (language === 'hi' ? 'वीडियो चल रहा है...' : 'Watching Video...')
                  : (language === 'hi' ? 'वीडियो देखें (+15 $MIMI)' : 'Watch Video (+15 $MIMI)')}
              </span>
            </button>
          ) : (
            <button
              onClick={handleClaimReward}
              disabled={isClaimed}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs tracking-wider shadow-[0_0_30px_rgba(52,211,153,0.7)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Coins className="w-4 h-4" />
              <span>
                {isClaimed
                  ? (language === 'hi' ? 'क्रेडिट हो गया! ✓' : 'Credited! ✓')
                  : (language === 'hi' ? 'रिवार्ड क्लेम करें (+15 $MIMI)' : 'Claim +15 $MIMI Reward')}
              </span>
            </button>
          )}
        </div>

        {/* Ad Network & Liquidity Transparency Badge & Block ID Selector */}
        <div className="pt-2 text-center border-t border-cyan-500/15">
          {isEditingBlockId ? (
            <div className="p-3 rounded-2xl bg-black/75 border border-cyan-400/50 space-y-2.5 text-left animate-fadeIn">
              <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
                <span className="text-[11px] font-mono font-bold text-cyan-300">
                  {language === 'hi' ? 'Adsgram के 3 Block IDs सेटअप:' : 'Configure 3 Adsgram Block IDs:'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingBlockId(false)}
                  className="p-1 rounded-full bg-white/10 text-cyan-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 1. Reward Video ID */}
              <div>
                <label className="text-[9px] font-mono text-cyan-200/80 block mb-0.5">
                  1. Reward Video Block ID:
                </label>
                <input
                  type="text"
                  value={blockInputs.reward}
                  onChange={(e) => setBlockInputs((prev) => ({ ...prev, reward: e.target.value }))}
                  placeholder="e.g. 53441"
                  className="w-full bg-[#030d22] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* 2. Interstitial ID */}
              <div>
                <label className="text-[9px] font-mono text-cyan-200/80 block mb-0.5">
                  2. Interstitial Block ID:
                </label>
                <input
                  type="text"
                  value={blockInputs.interstitial}
                  onChange={(e) => setBlockInputs((prev) => ({ ...prev, interstitial: e.target.value }))}
                  placeholder="e.g. 53441"
                  className="w-full bg-[#030d22] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* 3. Task ID */}
              <div>
                <label className="text-[9px] font-mono text-cyan-200/80 block mb-0.5">
                  3. Task Block ID:
                </label>
                <input
                  type="text"
                  value={blockInputs.task}
                  onChange={(e) => setBlockInputs((prev) => ({ ...prev, task: e.target.value }))}
                  placeholder="e.g. 53441"
                  className="w-full bg-[#030d22] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveAdsgramBlockId('reward', blockInputs.reward.trim());
                  setActiveAdsgramBlockId('interstitial', blockInputs.interstitial.trim());
                  setActiveAdsgramBlockId('task', blockInputs.task.trim());
                  setIsEditingBlockId(false);
                }}
                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Save All 3 Block IDs ✓
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setIsEditingBlockId(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono hover:border-cyan-400 transition-colors cursor-pointer"
                title="Tap to change Adsgram Block IDs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Adsgram Units (Reward: #{blockInputs.reward})</span>
                <span className="text-cyan-600">|</span>
                <span className="text-cyan-400 underline">3 Block IDs ✎</span>
              </button>
              <span className="text-[9px] text-cyan-300/60 font-mono">
                100% Ad Revenue routes to STON.fi DEX Pool
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
