import React, { useState, useEffect } from 'react';
import { X, Play, Square, Lock, CheckCircle2, Music, Sparkles, Volume2 } from 'lucide-react';
import { MusicTrack, MUSIC_TRACKS_DATABASE, Language } from '../types/airdrop.ts';
import { playTrackPreview, stopTrackPreview, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  onClose: () => void;
  unlockedTrackIds: number[];
  currentLevel: number;
}

export const MusicLibraryModal: React.FC<Props> = ({
  language,
  onClose,
  unlockedTrackIds,
  currentLevel,
}) => {
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      stopTrackPreview();
    };
  }, []);

  const handlePlayToggle = (trackId: number) => {
    playTapSound();
    if (playingTrackId === trackId) {
      stopTrackPreview();
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(trackId);
      playTrackPreview(trackId, () => {
        setPlayingTrackId(null);
      });
    }
  };

  const unlockedCount = unlockedTrackIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[85vh] bg-gradient-to-b from-[#0a2356] via-[#051336] to-[#020a1d] border border-cyan-400/40 rounded-3xl p-5 text-white shadow-[0_15px_60px_rgba(0,180,255,0.3)] flex flex-col overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white drop-shadow">
                {language === 'hi' ? 'म्यूजिक लाइब्रेरी' : 'Music Library'}
              </h2>
              <p className="text-[11px] text-cyan-200/80 font-mono">
                {unlockedCount} / {MUSIC_TRACKS_DATABASE.length} {language === 'hi' ? 'ट्रैक्स अनलॉक' : 'Tracks Unlocked'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopTrackPreview();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level Unlock Reward Chart */}
        <div className="w-full my-2.5 p-3 rounded-2xl bg-gradient-to-r from-[#0c244d] via-[#103066] to-[#0c244d] border border-amber-400/40 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🏆</span>
              <span className="text-xs font-black text-amber-300">
                {language === 'hi' ? 'लेवल अनलॉक रिवॉर्ड चार्ट' : 'Level Unlock Rewards'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-400/30">
              {language === 'hi' ? '+500 प्रति लेवल बढ़ता है' : '+500 / Level Increase'}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
              const isPassed = unlockedTrackIds.includes(lvl);
              return (
                <div
                  key={lvl}
                  className={`py-1 px-0.5 rounded-lg border transition-all ${
                    isPassed
                      ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 font-bold'
                      : 'bg-black/40 border-cyan-500/20 text-cyan-200/80'
                  }`}
                >
                  <div className="text-[9px] text-cyan-400">Lvl {lvl}</div>
                  <div className="font-bold text-amber-300">+{lvl * 500}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-3">
          <div className="w-full h-2 bg-[#06183e] rounded-full overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 transition-all duration-300"
              style={{ width: `${(unlockedCount / MUSIC_TRACKS_DATABASE.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none my-1">
          {MUSIC_TRACKS_DATABASE.map((track) => {
            const isUnlocked = unlockedTrackIds.includes(track.id);
            const isPlaying = playingTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isUnlocked
                    ? isPlaying
                      ? 'bg-[#0f346e]/90 border-cyan-300 shadow-[0_0_20px_rgba(0,210,255,0.4)]'
                      : 'bg-[#071d47]/70 border-cyan-500/30 hover:border-cyan-400/50'
                    : 'bg-[#04122d]/60 border-blue-950/60 opacity-65'
                }`}
              >
                {/* Left: Emoji / Cover */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  isUnlocked ? 'bg-cyan-500/20 border border-cyan-400/40 shadow-sm' : 'bg-slate-900 border border-slate-800'
                }`}>
                  {isUnlocked ? track.coverEmoji : <Lock className="w-5 h-5 text-slate-500" />}
                </div>

                {/* Middle: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.2 rounded-full border border-cyan-500/30">
                      #{track.id}
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-white truncate">
                      {track.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-cyan-200/70">
                    <span>{track.genre}</span>
                    <span>•</span>
                    <span>{track.duration}</span>
                    <span>•</span>
                    <span className="font-mono">{track.bpm} BPM</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {track.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-400/40">
                      🎁 +{(track.levelRequired * 500).toLocaleString()} $MIMI
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{language === 'hi' ? 'रिवॉर्ड क्लेम किया' : 'Claimed'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-300/80">
                        {language === 'hi' ? `लेवल ${track.levelRequired} पर` : `At Lvl ${track.levelRequired}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex-shrink-0">
                  {isUnlocked ? (
                    <button
                      onClick={() => handlePlayToggle(track.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse'
                          : 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 hover:scale-105 shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                      }`}
                      title={isPlaying ? 'Pause Track' : 'Play Track'}
                    >
                      {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-slate-950 translate-x-0.5" />}
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 whitespace-nowrap">
                        Level {track.levelRequired}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-cyan-500/20 text-center text-[11px] text-cyan-200/80">
          {language === 'hi'
            ? 'प्रत्येक लेवल पर लूप्स मर्ज करके नए ट्रैक्स अनलॉक करें!'
            : 'Merge loops on each level to unlock and claim all 10 master tracks!'}
        </div>
      </div>
    </div>
  );
};
