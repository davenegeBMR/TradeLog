// Web Audio API chime & alarm generator for trading session alarms

let activeAudioContext: AudioContext | null = null;
let activeAlarmTimer: ReturnType<typeof setInterval> | null = null;
let activeStopTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Halts any currently active session alarm playback immediately.
 */
export function stopSessionAlarm() {
  if (activeAlarmTimer) {
    clearInterval(activeAlarmTimer);
    activeAlarmTimer = null;
  }
  if (activeStopTimeout) {
    clearTimeout(activeStopTimeout);
    activeStopTimeout = null;
  }
  if (activeAudioContext) {
    try {
      activeAudioContext.close();
    } catch {
      // ignore
    }
    activeAudioContext = null;
  }
}

/**
 * Single pulse sound generator
 */
function playTonePulse(
  ctx: AudioContext,
  tone: 'chime' | 'bell' | 'radar' = 'chime'
) {
  try {
    if (tone === 'bell') {
      // Resonant crystal bell (E5 + B5 overtone)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987.77, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.95);
      osc2.stop(ctx.currentTime + 0.95);
    } else if (tone === 'radar') {
      // Pulsing sonar/radar ping (A5 -> D6 sharp double pulse)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Default: Gentle, crisp three-tone ascending chime (A4 -> C#5 -> E5)
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.5);
      });
    }
  } catch (e) {
    console.warn('Audio tone pulse error', e);
  }
}

/**
 * Plays an alarm chime repeating over a configurable duration in seconds.
 */
export function playSessionAlarm(options?: {
  durationSeconds?: number;
  tone?: 'chime' | 'bell' | 'radar';
  onFinish?: () => void;
}) {
  const durationSeconds = options?.durationSeconds ?? 5;
  const tone = options?.tone ?? 'chime';

  stopSessionAlarm();

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    activeAudioContext = new AudioContextClass();

    // Play first pulse immediately
    playTonePulse(activeAudioContext, tone);

    // If duration is longer than single pulse (~1.2s), schedule repeat intervals
    const pulseIntervalMs = tone === 'radar' ? 700 : tone === 'bell' ? 1200 : 1000;

    activeAlarmTimer = setInterval(() => {
      if (activeAudioContext && activeAudioContext.state !== 'closed') {
        playTonePulse(activeAudioContext, tone);
      }
    }, pulseIntervalMs);

    // Automatically stop after durationSeconds
    activeStopTimeout = setTimeout(() => {
      stopSessionAlarm();
      if (options?.onFinish) {
        options.onFinish();
      }
    }, durationSeconds * 1000);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

/**
 * Backward compatible helper for standard session chime
 */
export function playSessionChime(durationSeconds = 5, tone: 'chime' | 'bell' | 'radar' = 'chime') {
  playSessionAlarm({ durationSeconds, tone });
}

export function playSuccessChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // ignore
  }
}
