// Procedural Web Audio Engine for Music Mimi Protocol

let audioContext: AudioContext | null = null;
let isAudioMuted: boolean = false;
let currentPreviewOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
let previewInterval: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

export function setMuteState(muted: boolean) {
  isAudioMuted = muted;
  if (muted) {
    stopTrackPreview();
  }
}

export function isMuted(): boolean {
  return isAudioMuted;
}

// Trigger mild haptic feedback if on mobile / Telegram WebApp
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window !== 'undefined') {
    const tgHaptic = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (style: string) => void; notificationOccurred: (type: string) => void } } } }).Telegram?.WebApp?.HapticFeedback;
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

// Vinyl turntable start / needle sound
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

    gain.gain.setValueAtTime(0.15, now);
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

// Shiny Gold coin / token pickup chime
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

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.38);
    });
  } catch {}
}

// Subtle click / tap sound
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

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {}
}

// Loop Merging Magic Sound
export function playLoopMergeSound() {
  if (isAudioMuted) return;
  triggerHaptic('heavy');
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Rising futuristic harmonic sweep
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(220, now);
    sweep.frequency.exponentialRampToValueAtTime(880, now + 0.5);

    sweepGain.gain.setValueAtTime(0.05, now);
    sweepGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.65);

    // Chime burst
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.3 + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + 0.3 + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.3 + idx * 0.06);
      osc.stop(now + 0.3 + idx * 0.06 + 0.45);
    });
  } catch {}
}

// Level Up or Jackpot sound
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

      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch {}
}

// Procedural music track preview player
export function playTrackPreview(trackId: number, onEnded?: () => void) {
  if (isAudioMuted) return;
  stopTrackPreview();

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const rootFreq = 220 * (1 + (trackId % 5) * 0.15);
    const scale = [rootFreq, rootFreq * 1.2, rootFreq * 1.333, rootFreq * 1.5, rootFreq * 1.777];

    let step = 0;
    previewInterval = window.setInterval(() => {
      if (!ctx || isAudioMuted) {
        stopTrackPreview();
        return;
      }
      const now = ctx.currentTime;
      const freq = scale[step % scale.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      currentPreviewOscs.push({ osc, gain });

      step++;
      if (step > 24) {
        stopTrackPreview();
        if (onEnded) onEnded();
      }
    }, 250);
  } catch {}
}

export function stopTrackPreview() {
  if (previewInterval) {
    clearInterval(previewInterval);
    previewInterval = null;
  }
  currentPreviewOscs.forEach(({ osc, gain }) => {
    try {
      gain.gain.setValueAtTime(0, 0);
      osc.stop();
    } catch {}
  });
  currentPreviewOscs = [];
}
