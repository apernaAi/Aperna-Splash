// Audio Engine for Music Mimi Protocol
// Supports real MP3 playback, persistent background music (BGM), looping, and sound effects

import { MUSIC_TRACKS_DATABASE } from '../types/airdrop.ts';

let audioContext: AudioContext | null = null;

function getSavedMutePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const userTurnedOff = localStorage.getItem('mimi_music_user_turned_off');
    if (userTurnedOff !== null) return userTurnedOff === 'true';
    const muted = localStorage.getItem('mimi_music_muted');
    if (muted !== null) return muted === 'true';
    const bgmEnabled = localStorage.getItem('mimi_bgm_enabled');
    if (bgmEnabled !== null) return bgmEnabled === 'false';
  } catch {}
  return false; // Default: sound & music are ON!
}

let isAudioMuted: boolean = getSavedMutePreference();

// Background Music State
let bgmAudio: HTMLAudioElement | null = null;
let currentBgmTrackId: number = 1;
let isBgmPlaying: boolean = false;
let bgmVolume: number = 0.28; // Gentle, comfortable ambient volume (not loud)
let wasBgmPlayingBeforePreview: boolean = false;
let bgmAutoplayAttached: boolean = false;

// Preview Player State
let previewAudio: HTMLAudioElement | null = null;
let currentPreviewTrackId: number | null = null;
let currentPreviewEndCallback: (() => void) | null = null;

// Subscribers for real-time UI synchronization
type BgmListener = (state: { isPlaying: boolean; trackId: number; volume: number; isMuted: boolean }) => void;
const bgmListeners: Set<BgmListener> = new Set();

function notifyBgmListeners() {
  const state = getBgmState();
  bgmListeners.forEach((listener) => {
    try {
      listener(state);
    } catch {}
  });
}

export function subscribeBgmState(listener: BgmListener): () => void {
  bgmListeners.add(listener);
  listener(getBgmState());
  return () => {
    bgmListeners.delete(listener);
  };
}

export function getBgmState() {
  return {
    isPlaying: isBgmPlaying && !isAudioMuted,
    trackId: currentBgmTrackId,
    volume: bgmVolume,
    isMuted: isAudioMuted,
  };
}

function getTrackAudioUrl(trackId: number): string {
  const track = MUSIC_TRACKS_DATABASE.find((t) => t.id === trackId);
  const relativePath = track ? track.audioUrl : `/audio/tracks/track-${Math.min(10, Math.max(1, trackId))}.mp3`;
  if (typeof window !== 'undefined') {
    try {
      return new URL(relativePath, window.location.href).href;
    } catch {
      return relativePath;
    }
  }
  return relativePath;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

// Global Mute Toggle (Persistent in localStorage)
export function setMuteState(muted: boolean) {
  isAudioMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      if (muted) {
        localStorage.setItem('mimi_music_user_turned_off', 'true');
        localStorage.setItem('mimi_music_muted', 'true');
        localStorage.setItem('mimi_bgm_enabled', 'false');
      } else {
        localStorage.removeItem('mimi_music_user_turned_off');
        localStorage.setItem('mimi_music_muted', 'false');
        localStorage.setItem('mimi_bgm_enabled', 'true');
      }
    } catch {}
  }

  if (muted) {
    if (previewAudio) {
      stopTrackPreview();
    }
    if (bgmAudio) {
      bgmAudio.pause();
    }
    isBgmPlaying = false;
  } else {
    getAudioContext();
    playBackgroundMusic();
  }
  notifyBgmListeners();
}

export function isMuted(): boolean {
  return isAudioMuted;
}

// Mild haptic feedback for Telegram WebApp / Mobile
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window !== 'undefined') {
    const tgHaptic = (
      window as unknown as {
        Telegram?: {
          WebApp?: {
            HapticFeedback?: {
              impactOccurred: (style: string) => void;
              notificationOccurred: (type: string) => void;
            };
          };
        };
      }
    ).Telegram?.WebApp?.HapticFeedback;

    if (tgHaptic) {
      if (type === 'light') tgHaptic.impactOccurred('light');
      else if (type === 'medium') tgHaptic.impactOccurred('medium');
      else tgHaptic.notificationOccurred('success');
      return;
    }
    if (navigator.vibrate) {
      navigator.vibrate(type === 'light' ? 15 : type === 'medium' ? 30 : [30, 20, 50]);
    }
  }
}

// -------------------------------------------------------------
// BACKGROUND MUSIC (BGM) ENGINE - Persistent, Looping, Soft Volume
// -------------------------------------------------------------

function attachAutoplayUnlock() {
  if (bgmAutoplayAttached || typeof window === 'undefined' || isAudioMuted) return;
  bgmAutoplayAttached = true;

  const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];

  const unlockHandler = () => {
    if (isAudioMuted) {
      removeUnlockListeners();
      return;
    }

    getAudioContext();

    if (bgmAudio) {
      bgmAudio.volume = bgmVolume;
      const p = bgmAudio.play();
      if (p !== undefined) {
        p.then(() => {
          isBgmPlaying = true;
          notifyBgmListeners();
          removeUnlockListeners();
        }).catch(() => {
          // If still blocked, wait for next user touch
        });
      }
    }
  };

  const removeUnlockListeners = () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, unlockHandler, { capture: true } as EventListenerOptions);
      document.removeEventListener(evt, unlockHandler, { capture: true } as EventListenerOptions);
    });
    bgmAutoplayAttached = false;
  };

  events.forEach((evt) => {
    window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    document.addEventListener(evt, unlockHandler, { capture: true, passive: true });
  });
}

export function resumeAudioOnGesture() {
  if (isAudioMuted) return;
  getAudioContext();
  if (bgmAudio && (bgmAudio.paused || !isBgmPlaying)) {
    bgmAudio.volume = bgmVolume;
    bgmAudio.play().then(() => {
      isBgmPlaying = true;
      notifyBgmListeners();
    }).catch(() => {});
  }
}

export function initBackgroundMusic() {
  if (typeof window === 'undefined') return;

  // Restore saved track ID, volume, and mute state
  isAudioMuted = getSavedMutePreference();
  try {
    const savedTrack = localStorage.getItem('mimi_bgm_track_id');
    if (savedTrack) {
      const parsed = parseInt(savedTrack, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        currentBgmTrackId = parsed;
      }
    }
    const savedVol = localStorage.getItem('mimi_bgm_volume');
    if (savedVol) {
      const parsedVol = parseFloat(savedVol);
      if (!isNaN(parsedVol) && parsedVol > 0 && parsedVol <= 0.6) {
        bgmVolume = parsedVol;
      }
    }
  } catch {}

  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.loop = true; // Infinite repeat when finished
    bgmAudio.volume = isAudioMuted ? 0 : bgmVolume;
    bgmAudio.preload = 'auto';

    // Fallback repeat safeguard if browser loop glitches
    bgmAudio.addEventListener('ended', () => {
      if (bgmAudio && !isAudioMuted) {
        bgmAudio.currentTime = 0;
        bgmAudio.play().catch(() => {});
      }
    });

    bgmAudio.addEventListener('play', () => {
      isBgmPlaying = true;
      notifyBgmListeners();
    });

    bgmAudio.addEventListener('pause', () => {
      isBgmPlaying = false;
      notifyBgmListeners();
    });
  }

  const targetSrc = getTrackAudioUrl(currentBgmTrackId);
  if (!bgmAudio.src || !bgmAudio.src.endsWith(`track-${currentBgmTrackId}.mp3`)) {
    bgmAudio.src = targetSrc;
  }

  if (!isAudioMuted) {
    playBackgroundMusic();
    attachAutoplayUnlock();
  }
}

export function playBackgroundMusic() {
  if (typeof window === 'undefined') return;
  if (isAudioMuted) return;

  if (!bgmAudio) {
    initBackgroundMusic();
  }
  if (!bgmAudio || isAudioMuted) return;

  bgmAudio.volume = bgmVolume;

  const playPromise = bgmAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isBgmPlaying = true;
        notifyBgmListeners();
      })
      .catch(() => {
        // Autoplay was blocked by browser policy until user gesture
        attachAutoplayUnlock();
      });
  }
}

export function pauseBackgroundMusic() {
  if (bgmAudio) {
    bgmAudio.pause();
    isBgmPlaying = false;
    notifyBgmListeners();
  }
}

export function toggleBackgroundMusic(forceState?: boolean): boolean {
  if (!bgmAudio) {
    initBackgroundMusic();
  }
  const targetState = forceState !== undefined ? forceState : !isBgmPlaying;

  if (targetState) {
    setMuteState(false);
    return true;
  } else {
    setMuteState(true);
    return false;
  }
}

export function setBackgroundMusicTrack(trackId: number, autoPlay: boolean = true) {
  currentBgmTrackId = trackId;
  try {
    localStorage.setItem('mimi_bgm_track_id', String(trackId));
  } catch {}

  if (!bgmAudio) {
    initBackgroundMusic();
  } else {
    const nextUrl = getTrackAudioUrl(trackId);
    if (bgmAudio.src !== nextUrl && !bgmAudio.src.endsWith(nextUrl)) {
      bgmAudio.src = nextUrl;
      bgmAudio.currentTime = 0;
    }
    if (autoPlay && !isAudioMuted) {
      playBackgroundMusic();
    }
  }
  notifyBgmListeners();
}

export function setBgmVolume(volume: number) {
  // Clamp between 0.05 and 0.50 (comfortable soft ambient listening)
  const clamped = Math.max(0.05, Math.min(0.5, volume));
  bgmVolume = clamped;
  if (bgmAudio && !isAudioMuted) {
    bgmAudio.volume = clamped;
  }
  try {
    localStorage.setItem('mimi_bgm_volume', String(clamped));
  } catch {}
  notifyBgmListeners();
}

export function getCurrentBgmTrackId(): number {
  return currentBgmTrackId;
}

export function isBackgroundMusicPlaying(): boolean {
  return isBgmPlaying && !isAudioMuted;
}

// -------------------------------------------------------------
// REAL TRACK PREVIEW PLAYER - High Fidelity MP3 Preview
// -------------------------------------------------------------

export function playTrackPreview(trackId: number, onEnded?: () => void) {
  if (isAudioMuted) return;

  // Stop any ongoing preview
  stopTrackPreview();

  // Duck / pause background music while user samples a preview
  if (bgmAudio && isBgmPlaying) {
    wasBgmPlayingBeforePreview = true;
    bgmAudio.pause();
  } else {
    wasBgmPlayingBeforePreview = false;
  }

  currentPreviewTrackId = trackId;
  currentPreviewEndCallback = onEnded || null;

  const url = getTrackAudioUrl(trackId);
  previewAudio = new Audio(url);
  // Clear preview volume at 0.40 (crystal clear preview without ear strain)
  previewAudio.volume = isAudioMuted ? 0 : 0.40;

  previewAudio.addEventListener('ended', () => {
    stopTrackPreview();
    if (onEnded) onEnded();
  });

  previewAudio.addEventListener('error', () => {
    stopTrackPreview();
    if (onEnded) onEnded();
  });

  previewAudio.play().catch(() => {
    stopTrackPreview();
    if (onEnded) onEnded();
  });
}

export function stopTrackPreview() {
  if (previewAudio) {
    try {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    } catch {}
    previewAudio = null;
  }
  currentPreviewTrackId = null;

  // Restore background music if it was active before the preview
  if (wasBgmPlayingBeforePreview && !isAudioMuted) {
    wasBgmPlayingBeforePreview = false;
    const enabled = typeof window !== 'undefined' ? localStorage.getItem('mimi_bgm_enabled') : 'true';
    if (enabled !== 'false') {
      playBackgroundMusic();
    }
  }
}

export function getPlayingPreviewTrackId(): number | null {
  return currentPreviewTrackId;
}

// -------------------------------------------------------------
// SOUND EFFECTS (Synthesizer Chimes & Haptic FX)
// -------------------------------------------------------------

export function playTurntableStartSound() {
  if (isAudioMuted) return;
  triggerHaptic('light');
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {}
}

export function playPickaxeStrikeSound() {
  playTurntableStartSound();
}

export function playClaimRewardSound() {
  if (isAudioMuted) return;
  triggerHaptic('heavy');
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.38);
    });
  } catch {}
}

export function playTapSound() {
  if (isAudioMuted) return;
  triggerHaptic('light');
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {}
}

export function playLoopMergeSound() {
  if (isAudioMuted) return;
  triggerHaptic('heavy');
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(220, now);
    sweep.frequency.exponentialRampToValueAtTime(880, now + 0.5);

    sweepGain.gain.setValueAtTime(0.05, now);
    sweepGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.65);

    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.3 + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + 0.3 + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.3 + idx * 0.06);
      osc.stop(now + 0.3 + idx * 0.06 + 0.45);
    });
  } catch {}
}

export function playJackpotFanfare() {
  if (isAudioMuted) return;
  triggerHaptic('heavy');
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch {}
}
