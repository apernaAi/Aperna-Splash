import React, { useState } from 'react';
import { Trophy, Sparkles, Music, CheckCircle2, X } from 'lucide-react';
import { MusicTrack, Language } from '../types/airdrop.ts';
import { setBackgroundMusicTrack, playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  newLevel: number;
  unlockedTrack: MusicTrack;
  onClose: () => void;
  onOpenLibrary: () => void;
  onSetAsBackgroundMusic?: (trackId: number) => void;
}

export const LevelUpCelebrationModal: React.FC<Props> = ({
  language,
  newLevel,
  unlockedTrack,
  onClose,
  onOpenLibrary,
  onSetAsBackgroundMusic,
}) => {
  const [isBgmSet, setIsBgmSet] = useState(false);

  const handleSetBgm = () => {
    playClaimRewardSound();
    setBackgroundMusicTrack(unlockedTrack.id, true);
    setIsBgmSet(true);
    if (onSetAsBackgroundMusic) {
      onSetAsBackgroundMusic(unlockedTrack.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#0c2a68] via-[#06183e] to-[#020b1f] border-2 border-cyan-400 rounded-3xl p-5 sm:p-6 text-white text-center shadow-[0_0_60px_rgba(0,210,255,0.6)] overflow-hidden">
        {/* Radiance background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.25)_0%,transparent_70%)] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-white/10 text-cyan-200 hover:text-white cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy / Star icon */}
        <div className="relative mx-auto w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 p-1 flex items-center justify-center shadow-[0_0_35px_rgba(0,210,255,0.8)] mb-3 animate-bounce">
          <div className="w-full h-full rounded-full bg-[#051538] flex items-center justify-center">
            <Trophy className="w-9 h-9 sm:w-10 sm:h-10 text-amber-300" />
          </div>
        </div>

        {/* Celebration Title */}
        <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
          {language === 'hi' ? 'लूप्स सफलतापूर्वक मर्ज हुए!' : 'LOOPS MERGED SUCCESSFULLY!'}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-[0_0_15px_rgba(0,210,255,0.8)]">
          {language === 'hi' ? `लेवल अप! आप पहुंचे लेवल ${newLevel}!` : `Level Up! You reached Level ${newLevel}!`}
        </h2>

        {/* 500x Level Tokens Celebration Box */}
        <div className="my-2.5 py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
          <span className="text-base sm:text-lg">💰</span>
          <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
            {language === 'hi'
              ? `+${(Math.max(1, newLevel - 1) * 500).toLocaleString()} $MIMI टोकन रिवॉर्ड प्राप्त हुआ!`
              : `+${(Math.max(1, newLevel - 1) * 500).toLocaleString()} $MIMI Tokens Rewarded!`}
          </span>
        </div>

        {/* Unlocked Track Card */}
        <div className="my-3 p-3.5 rounded-2xl bg-[#09224f] border border-cyan-400/40 shadow-inner text-left relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
              {unlockedTrack.coverEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-wider">
                {language === 'hi' ? 'नया म्यूजिक ट्रैक अनलॉक!' : 'NEW TRACK UNLOCKED!'}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                #{unlockedTrack.id} {unlockedTrack.title}
              </h3>
              <p className="text-[11px] text-cyan-200/80 truncate">
                {unlockedTrack.artist} • {unlockedTrack.genre}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Option to Set as Active Background Music */}
          {isBgmSet ? (
            <div className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/25 border-2 border-emerald-400 text-emerald-300 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? 'एक्टिव बैकग्राउंड म्यूजिक सेट हो गया!' : 'Set as Background Music!'}</span>
            </div>
          ) : (
            <button
              onClick={handleSetBgm}
              className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Music className="w-4 h-4 text-slate-950" />
              <span>{language === 'hi' ? '🎵 इसे बैकग्राउंड म्यूजिक में लगाएं' : '🎵 Set as Background Music'}</span>
            </button>
          )}

          <button
            onClick={() => {
              playTapSound();
              onClose();
              onOpenLibrary();
            }}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(0,210,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Music className="w-4 h-4" />
            <span>{language === 'hi' ? 'म्यूजिक लाइब्रेरी में देखें' : 'View in Music Library'}</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-full py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {language === 'hi' ? 'अगला लूप बनाना शुरू करें' : 'Continue Making Loops'}
          </button>
        </div>
      </div>
    </div>
  );
};
