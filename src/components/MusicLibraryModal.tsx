import React, { useState, useEffect } from 'react';
import { 
  X, Play, Square, Lock, CheckCircle2, Music, Sparkles, Volume2, 
  VolumeX, Disc, Radio, Sliders, RotateCw
} from 'lucide-react';
import { MusicTrack, MUSIC_TRACKS_DATABASE, Language } from '../types/airdrop.ts';
import { 
  playTrackPreview, 
  stopTrackPreview, 
  playTapSound, 
  playClaimRewardSound,
  subscribeBgmState,
  setBackgroundMusicTrack,
  toggleBackgroundMusic,
  setBgmVolume
} from '../utils/audioEngine.ts';

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
  const [playingPreviewId, setPlayingPreviewId] = useState<number | null>(null);
  const [bgmState, setBgmState] = useState({
    isPlaying: false,
    trackId: 1,
    volume: 0.28,
    isMuted: false,
  });

  useEffect(() => {
    const unsub = subscribeBgmState((state) => {
      setBgmState(state);
    });
    return () => {
      unsub();
      stopTrackPreview();
    };
  }, []);

  const handlePreviewToggle = (trackId: number) => {
    playTapSound();
    if (playingPreviewId === trackId) {
      stopTrackPreview();
      setPlayingPreviewId(null);
    } else {
      setPlayingPreviewId(trackId);
      playTrackPreview(trackId, () => {
        setPlayingPreviewId(null);
      });
    }
  };

  const handleSetBgm = (trackId: number) => {
    playClaimRewardSound();
    // Stop any preview sample before engaging background music
    stopTrackPreview();
    setPlayingPreviewId(null);
    setBackgroundMusicTrack(trackId, true);
  };

  const handleToggleBgmPlay = () => {
    playTapSound();
    toggleBackgroundMusic();
  };

  const handleCycleVolume = () => {
    playTapSound();
    // Cycle between soft (0.18), gentle (0.28), and medium (0.38)
    const nextVol = bgmState.volume <= 0.2 ? 0.28 : bgmState.volume <= 0.3 ? 0.38 : 0.18;
    setBgmVolume(nextVol);
  };

  // Ensure Level 1 users always have at least Track 1 unlocked for testing and immediate listening
  const effectiveUnlockedIds = unlockedTrackIds.length === 0 ? [1] : unlockedTrackIds;
  const unlockedCount = effectiveUnlockedIds.length;
  const activeBgmTrack = MUSIC_TRACKS_DATABASE.find((t) => t.id === bgmState.trackId) || MUSIC_TRACKS_DATABASE[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] bg-gradient-to-b from-[#0a2356] via-[#051336] to-[#020a1d] border border-cyan-400/40 rounded-3xl p-4 sm:p-5 text-white shadow-[0_15px_60px_rgba(0,180,255,0.3)] flex flex-col overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Music className="w-5 h-5 animate-pulse" />
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

        {/* 1. MASTER BACKGROUND MUSIC (BGM) LIVE PLAYER CARD */}
        <div className="w-full my-2 p-3 rounded-2xl bg-gradient-to-r from-[#0d2a5e] via-[#0b2454] to-[#091b40] border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(0,210,255,0.25)] flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {bgmState.isPlaying && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${bgmState.isPlaying ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
              </span>
              <span className="text-[11px] font-black tracking-wide uppercase text-cyan-300 flex items-center gap-1">
                <Disc className={`w-3.5 h-3.5 text-cyan-300 ${bgmState.isPlaying ? 'animate-spin' : ''}`} />
                <span>{language === 'hi' ? 'एक्टिव बैकग्राउंड म्यूजिक (BGM)' : 'ACTIVE BACKGROUND MUSIC'}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                <RotateCw className="w-2.5 h-2.5" />
                <span>{language === 'hi' ? 'लगातार रिपीट' : 'Auto-Loop'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-black/40 rounded-xl p-2.5 border border-cyan-500/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl flex-shrink-0">
                {activeBgmTrack.coverEmoji}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">
                  #{activeBgmTrack.id} {activeBgmTrack.title}
                </h4>
                <p className="text-[10px] text-cyan-200/80 truncate">
                  {activeBgmTrack.artist} • {activeBgmTrack.genre}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Gentle Volume Control Preset */}
              <button
                onClick={handleCycleVolume}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-mono text-cyan-200 font-bold border border-cyan-400/20 cursor-pointer"
                title="Adjust Gentle Ambient Volume"
              >
                {Math.round(bgmState.volume * 100)}% {language === 'hi' ? 'आवाज़' : 'Vol'}
              </button>

              {/* Master BGM Play / Pause Toggle */}
              <button
                onClick={handleToggleBgmPlay}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  bgmState.isPlaying
                    ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                    : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black shadow-[0_0_15px_rgba(0,210,255,0.5)]'
                }`}
                title={bgmState.isPlaying ? 'Pause Background Music' : 'Play Background Music'}
              >
                {bgmState.isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-slate-950 translate-x-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Level Unlock Reward Chart */}
        <div className="w-full my-1.5 p-2.5 rounded-2xl bg-gradient-to-r from-[#0c244d] via-[#103066] to-[#0c244d] border border-amber-400/40 shadow-sm flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🏆</span>
              <span className="text-[11px] font-black text-amber-300">
                {language === 'hi' ? 'लेवल अनलॉक रिवॉर्ड चार्ट (+500 $MIMI/लेवल)' : 'Level Unlock Rewards (+500 $MIMI/Lvl)'}
              </span>
            </div>
            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-400/30">
              {language === 'hi' ? '10 असली म्यूजिक' : '10 Real Songs'}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
              const isPassed = effectiveUnlockedIds.includes(lvl);
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

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none my-1">
          {MUSIC_TRACKS_DATABASE.map((track) => {
            const isUnlocked = effectiveUnlockedIds.includes(track.id);
            const isPreviewing = playingPreviewId === track.id;
            const isSelectedAsBgm = bgmState.trackId === track.id;

            return (
              <div
                key={track.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                  isUnlocked
                    ? isSelectedAsBgm
                      ? 'bg-[#0f346e]/95 border-cyan-300 shadow-[0_0_20px_rgba(0,210,255,0.35)]'
                      : 'bg-[#071d47]/70 border-cyan-500/30 hover:border-cyan-400/50'
                    : 'bg-[#04122d]/60 border-blue-950/60 opacity-65'
                }`}
              >
                {/* Upper row: Cover + Details + Preview Play Button */}
                <div className="flex items-center justify-between gap-3">
                  {/* Cover */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    isUnlocked ? 'bg-cyan-500/20 border border-cyan-400/40 shadow-sm' : 'bg-slate-900 border border-slate-800'
                  }`}>
                    {isUnlocked ? track.coverEmoji : <Lock className="w-5 h-5 text-slate-500" />}
                  </div>

                  {/* Middle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.2 rounded-full border border-cyan-500/30">
                        Lvl {track.levelRequired}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white truncate">
                        {track.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-cyan-200/80 truncate">
                      <span className="font-semibold text-white/90">{track.artist}</span>
                      <span>•</span>
                      <span>{track.genre}</span>
                      <span>•</span>
                      <span>{track.duration}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {track.description}
                    </p>
                  </div>

                  {/* Preview Button */}
                  <div className="flex-shrink-0">
                    {isUnlocked ? (
                      <button
                        onClick={() => handlePreviewToggle(track.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isPreviewing
                            ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse'
                            : 'bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 hover:scale-105 shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                        }`}
                        title={isPreviewing ? 'Stop Preview' : 'Play Full Audio Preview'}
                      >
                        {isPreviewing ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-slate-950 translate-x-0.5" />}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 whitespace-nowrap">
                        Level {track.levelRequired}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom row: Reward Claim + Set as Background Music Button */}
                {isUnlocked && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-cyan-500/15 gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-400/40">
                      🎁 +{(track.levelRequired * 500).toLocaleString()} $MIMI {language === 'hi' ? 'क्लेम्ड' : 'Claimed'}
                    </span>

                    {/* Set BGM button or Active badge */}
                    {isSelectedAsBgm ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-black shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{language === 'hi' ? 'एक्टिव बैकग्राउंड म्यूजिक' : 'Active BGM Track'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetBgm(track.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-600/50 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 hover:text-white text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Music className="w-3 h-3 text-cyan-300" />
                        <span>{language === 'hi' ? 'बैकग्राउंड में लगाएं' : 'Set as Background Music'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-cyan-500/20 text-center text-[10px] text-cyan-200/80 font-mono">
          {language === 'hi'
            ? '🎧 बैकग्राउंड म्यूजिक हमेशा लूप पर बजता रहेगा, जब तक आप खुद बंद न करें।'
            : '🎧 Background music repeats automatically until you turn it off.'}
        </div>
      </div>
    </div>
  );
};
