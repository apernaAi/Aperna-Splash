import React, { useState } from 'react';
import { X, Trophy, Radio, Clock, Headphones, AlertCircle } from 'lucide-react';
import { Language } from '../types/airdrop.ts';
import { playClaimRewardSound, playJackpotFanfare, playTurntableStartSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  onClose: () => void;
  onWinTokens: (amount: number) => void;
  playsRemaining: number;
  maxPlays: number;
  onRecordPlay: () => void;
  onGoToStudio?: () => void;
}

interface TrackLayer {
  step: number;
  nameHi: string;
  nameEn: string;
  hitsRequired: number;
  reward: number;
  color: string;
  accent: string;
  icon: string;
}

const BEAT_LAYERS: TrackLayer[] = [
  { step: 1, nameHi: 'बेस ड्रॉप वेव (Bass Drop)', nameEn: 'Bass Drop Wave', hitsRequired: 3, reward: 1, color: '#0369a1', accent: '#38bdf8', icon: '🔊' },
  { step: 2, nameHi: 'सिंथ मेलोडी (Synth Melody)', nameEn: 'Synth Melody', hitsRequired: 4, reward: 2, color: '#4338ca', accent: '#818cf8', icon: '🎹' },
  { step: 3, nameHi: 'वोकल लूप (Vocal Chop)', nameEn: 'Vocal Chop Loop', hitsRequired: 5, reward: 2, color: '#7e22ce', accent: '#c084fc', icon: '🎙️' },
  { step: 4, nameHi: 'ड्रम ग्रूव (Drum Groove)', nameEn: 'Drum Groove Rhythm', hitsRequired: 6, reward: 3, color: '#0f766e', accent: '#2dd4bf', icon: '🥁' },
  { step: 5, nameHi: 'मास्टर हारमोनिक मिंट (Master Drop)', nameEn: 'Master Harmonic Drop', hitsRequired: 7, reward: 5, color: '#c2410c', accent: '#fb923c', icon: '💎' },
];

export const MimiBeatRushModal: React.FC<Props> = ({
  language,
  onClose,
  onWinTokens,
  playsRemaining,
  maxPlays,
  onRecordPlay,
  onGoToStudio,
}) => {
  const [currentLayerIdx, setCurrentLayerIdx] = useState(0);
  const [layerHits, setLayerHits] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState<{ id: number; text: string } | null>(null);

  const currentLayer = BEAT_LAYERS[currentLayerIdx];

  const handleHit = () => {
    if (isCompleted || playsRemaining <= 0) return;
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 120);

    playTurntableStartSound();
    const nextHits = layerHits + 1;

    if (nextHits >= currentLayer.hitsRequired) {
      const layerReward = currentLayer.reward;
      const newTotal = totalWon + layerReward;
      setTotalWon(newTotal);
      onWinTokens(layerReward);
      playClaimRewardSound();
      setFloatingBonus({ id: Date.now(), text: `+${layerReward} !` });
      setTimeout(() => setFloatingBonus(null), 1200);

      if (currentLayerIdx + 1 < BEAT_LAYERS.length) {
        setCurrentLayerIdx(currentLayerIdx + 1);
        setLayerHits(0);
      } else {
        setIsCompleted(true);
        onRecordPlay(); // Record one play consumed for the day
        playJackpotFanfare();
      }
    } else {
      setLayerHits(nextHits);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#092252] via-[#061638] to-[#020b1f] border border-cyan-400/35 rounded-3xl p-5 text-white shadow-[0_15px_60px_rgba(0,180,255,0.25)] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,210,255,0.5)]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-cyan-300 drop-shadow">
              {language === 'hi' ? 'मिमी बीट रश' : 'Mimi Beat Rush'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400/30">
                {language === 'hi' ? `आज शेष: ${playsRemaining}/${maxPlays}` : `Today: ${playsRemaining}/${maxPlays} Plays`}
              </span>
            </div>
          </div>
        </div>

        {/* STATE 1: NO PLAYS LEFT TODAY (Anti-Bot & Anti-Exploit Security Gate) */}
        {playsRemaining <= 0 && !isCompleted ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-300">
                {language === 'hi' ? 'दैनिक सीमा समाप्त (Daily Limit Reached)' : 'Daily Limit Reached'}
              </h3>
              <p className="text-xs text-cyan-100/80 mt-1 max-w-xs leading-relaxed">
                {language === 'hi'
                  ? 'आपने आज के सभी उपलब्ध खेल लिए हैं। हर 24 घंटे में कोटा रीसेट होता है, या फिर स्टूडियो में हेडफ़ोन अपग्रेड करके अतिरिक्त दैनिक गेम्स अनलॉक करें!'
                  : 'You used all available plays today! Plays reset daily, or upgrade Hi-Fi Headphones in Studio for +1 extra daily play.'}
              </p>
            </div>

            {onGoToStudio && (
              <button
                onClick={() => {
                  playTapSound();
                  onClose();
                  onGoToStudio();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Headphones className="w-4 h-4 text-slate-950" />
                <span>{language === 'hi' ? 'स्टूडियो में हेडफ़ोन अपग्रेड करें (+1 Play)' : 'Upgrade Headphones in Studio (+1 Play)'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              {language === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        ) : !isCompleted ? (
          /* STATE 2: ACTIVE GAME PLAY */
          <>
            {/* Layer Indicators (5 steps) */}
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {BEAT_LAYERS.map((l, idx) => {
                const isDone = idx < currentLayerIdx;
                const isCurrent = idx === currentLayerIdx;
                return (
                  <div
                    key={l.step}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]'
                        : isCurrent
                        ? 'bg-cyan-400/60 animate-pulse'
                        : 'bg-blue-950/80'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="text-center mb-3">
                <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                  {language === 'hi' ? `ट्रैक लेयर ${currentLayer.step} / 5` : `Track Layer ${currentLayer.step} / 5`}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {language === 'hi' ? currentLayer.nameHi : currentLayer.nameEn}
                </h3>
                <p className="text-xs text-amber-300 mt-0.5 font-mono font-bold">
                  {language === 'hi'
                    ? `इनाम: +${currentLayer.reward} `
                    : `Reward: +${currentLayer.reward} `}
                </p>
              </div>

              {/* Interactive Vinyl Button to Click */}
              <div className="relative my-2">
                {floatingBonus && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-cyan-300 font-black text-xl animate-bounce drop-shadow-[0_0_12px_rgba(0,210,255,0.9)] z-20 whitespace-nowrap">
                    {floatingBonus.text}
                  </div>
                )}
                <button
                  onClick={handleHit}
                  className={`relative w-38 h-38 rounded-3xl flex flex-col items-center justify-center p-3 transition-transform cursor-pointer border-2 ${
                    isStriking ? 'scale-95' : 'hover:scale-102 active:scale-95'
                  }`}
                  style={{
                    backgroundColor: currentLayer.color,
                    borderColor: currentLayer.accent,
                    boxShadow: `0 8px 30px ${currentLayer.accent}50`,
                  }}
                >
                  <div
                    className={`text-4xl transition-transform ${
                      isStriking ? 'scale-125 rotate-12' : ''
                    }`}
                  >
                    {currentLayer.icon}
                  </div>
                  <div className="mt-2 text-xs font-black text-white drop-shadow-md">
                    {language === 'hi' ? 'बीट ड्रॉप टैप करें!' : 'Tap Beat Drop!'}
                  </div>
                  <div className="text-[10px] text-cyan-100 mt-1 font-mono">
                    {layerHits} / {currentLayer.hitsRequired} Beats
                  </div>
                </button>
              </div>

              {/* Health / Progress */}
              <div className="w-full mt-3">
                <div className="flex justify-between text-[11px] text-cyan-200/80 mb-1">
                  <span>{language === 'hi' ? 'ट्रैक सिंक्रोनाइज़ेशन' : 'Track Sync'}</span>
                  <span>
                    {Math.round((layerHits / currentLayer.hitsRequired) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 transition-all duration-150"
                    style={{
                      width: `${(layerHits / currentLayer.hitsRequired) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* STATE 3: VICTORY SCREEN */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mb-3 shadow-[0_0_35px_rgba(0,210,255,0.7)]">
              <Trophy className="w-10 h-10 text-cyan-300 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-cyan-300">
              {language === 'hi' ? 'बधाई हो! मास्टर बीट अनलॉक!' : 'Jackpot! Master Beat Unlocked!'}
            </h3>
            <p className="text-xs text-cyan-100 mt-1 max-w-xs">
              {language === 'hi'
                ? `आपने कुल +${totalWon}  टोकन अर्जित किए हैं!`
                : `You retrieved +${totalWon}  tokens from the beat drop!`}
            </p>
            <div className="mt-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(0,210,255,0.5)]">
              +{totalWon}  {language === 'hi' ? 'खाते में जोड़ा गया' : 'Added to Balance'}
            </div>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'hi' ? 'स्टूडियो में वापस जाएँ' : 'Back to Studio'}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-2 text-center text-[10px] text-cyan-300/80 flex items-center justify-between px-1">
          <span>
            {language === 'hi' ? 'कुल अर्जित: ' : 'Total Won: '}
            <span className="font-bold text-cyan-300">+{totalWon} </span>
          </span>
          <span className="font-mono">
            Max: 13 
          </span>
        </div>
      </div>
    </div>
  );
};
