import React from 'react';
import { Trophy, Sparkles, Music, ArrowRight, X } from 'lucide-react';
import { MusicTrack, Language } from '../types/airdrop.ts';

interface Props {
  language: Language;
  newLevel: number;
  unlockedTrack: MusicTrack;
  onClose: () => void;
  onOpenLibrary: () => void;
}

export const LevelUpCelebrationModal: React.FC<Props> = ({
  language,
  newLevel,
  unlockedTrack,
  onClose,
  onOpenLibrary,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#0c2a68] via-[#06183e] to-[#020b1f] border-2 border-cyan-400 rounded-3xl p-6 text-white text-center shadow-[0_0_60px_rgba(0,210,255,0.6)] overflow-hidden">
        {/* Radiance background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.25)_0%,transparent_70%)] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-white/10 text-cyan-200 hover:text-white cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy / Star icon */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 p-1 flex items-center justify-center shadow-[0_0_35px_rgba(0,210,255,0.8)] mb-4 animate-bounce">
          <div className="w-full h-full rounded-full bg-[#051538] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-300" />
          </div>
        </div>

        {/* Celebration Title */}
        <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
          {language === 'hi' ? 'लूप्स सफलतापूर्वक मर्ज हुए!' : 'LOOPS MERGED SUCCESSFULLY!'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 drop-shadow-[0_0_15px_rgba(0,210,255,0.8)]">
          {language === 'hi' ? `लेवल अप! आप पहुंचे लेवल ${newLevel}!` : `Level Up! You reached Level ${newLevel}!`}
        </h2>

        {/* 500x Level Tokens Celebration Box */}
        <div className="my-3 py-2 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-amber-400/50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
          <span className="text-lg">💰</span>
          <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
            {language === 'hi'
              ? `+{(Math.max(1, newLevel - 1) * 500).toLocaleString()} $MIMI टोकन रिवॉर्ड प्राप्त हुआ!`
              : `+{(Math.max(1, newLevel - 1) * 500).toLocaleString()} $MIMI Tokens Rewarded!`}
          </span>
        </div>

        {/* Unlocked Track Card */}
        <div className="my-5 p-4 rounded-2xl bg-[#09224f] border border-cyan-400/40 shadow-inner text-left relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-sm">
              {unlockedTrack.coverEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-wider">
                {language === 'hi' ? 'नया म्यूजिक ट्रैक अनलॉक!' : 'NEW TRACK UNLOCKED!'}
              </span>
              <h3 className="text-sm font-black text-white truncate mt-0.5">
                #{unlockedTrack.id} {unlockedTrack.title}
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                {unlockedTrack.genre} • {unlockedTrack.duration} • {unlockedTrack.bpm} BPM
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onOpenLibrary();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Music className="w-4 h-4" />
            <span>{language === 'hi' ? 'म्यूजिक लाइब्रेरी में सुनें' : 'Play in Music Library'}</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {language === 'hi' ? 'अगला लूप बनाना शुरू करें' : 'Continue Making Loops'}
          </button>
        </div>
      </div>
    </div>
  );
};
