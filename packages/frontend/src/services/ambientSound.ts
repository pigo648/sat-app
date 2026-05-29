// Ambient sound generator using Web Audio API
// Generates procedural sounds — no audio files needed

export type SoundType = 'none' | 'rain' | 'cafe' | 'forest' | 'whitenoise' | 'ocean' | 'lofi';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let soundNodes: AudioNode[] = [];
let isPlaying = false;
let currentType: SoundType = 'none';

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopAll() {
  soundNodes.forEach((n) => {
    try { (n as OscillatorNode).stop?.(); } catch {}
    try { n.disconnect(); } catch {}
  });
  soundNodes = [];
  isPlaying = false;
}

// White noise generator
function createNoiseNode(ctx: AudioContext, gain: number, filterType?: BiquadFilterType, filterFreq?: number): AudioNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;

  source.connect(gainNode);

  if (filterType && filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    gainNode.connect(filter);
    filter.connect(masterGain!);
    soundNodes.push(source, gainNode, filter);
    return filter;
  } else {
    gainNode.connect(masterGain!);
    soundNodes.push(source, gainNode);
    return gainNode;
  }
}

function createOscillator(ctx: AudioContext, freq: number, gain: number, type: OscillatorType = 'sine'): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = gain;
  osc.connect(g);
  g.connect(masterGain!);
  osc.start();
  soundNodes.push(osc, g);
}

function startRain() {
  const ctx = getCtx();
  // Rain = filtered white noise with modulation
  createNoiseNode(ctx, 0.4, 'lowpass', 2000);
  createNoiseNode(ctx, 0.2, 'highpass', 4000);

  // Occasional raindrop plinks
  createOscillator(ctx, 800, 0.02, 'sine');
  createOscillator(ctx, 1200, 0.015, 'sine');
}

function startCafe() {
  const ctx = getCtx();
  // Low rumble + mid chatter
  createNoiseNode(ctx, 0.15, 'lowpass', 800);
  createNoiseNode(ctx, 0.1, 'bandpass', 2000);

  // Clinking cups (soft high freq)
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 3000;
  const g = ctx.createGain();
  g.gain.value = 0.01;
  osc.connect(g);
  g.connect(masterGain!);
  osc.start();
  soundNodes.push(osc, g);
}

function startForest() {
  const ctx = getCtx();
  // Wind through trees
  createNoiseNode(ctx, 0.15, 'lowpass', 1500);
  // Bird-like tones
  createOscillator(ctx, 2000, 0.02, 'sine');
  createOscillator(ctx, 2800, 0.015, 'sine');
  createOscillator(ctx, 3500, 0.01, 'sine');
  // Rustling leaves
  createNoiseNode(ctx, 0.08, 'bandpass', 3000);
}

function startWhiteNoise() {
  const ctx = getCtx();
  createNoiseNode(ctx, 0.3, 'lowpass', 5000);
}

function startOcean() {
  const ctx = getCtx();
  // Slow, rhythmic noise = waves
  createNoiseNode(ctx, 0.25, 'lowpass', 600);
  // Higher freq foam
  createNoiseNode(ctx, 0.1, 'highpass', 2000);
}

function startLofi() {
  const ctx = getCtx();
  // Soft pad chords
  const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord
  notes.forEach((freq) => {
    createOscillator(ctx, freq, 0.04, 'triangle');
  });
  // Warm bass
  createOscillator(ctx, 65.41, 0.06, 'sine');
  // Gentle vinyl crackle
  createNoiseNode(ctx, 0.03, 'highpass', 3000);
}

const soundStarters: Record<SoundType, () => void> = {
  none: () => {},
  rain: startRain,
  cafe: startCafe,
  forest: startForest,
  whitenoise: startWhiteNoise,
  ocean: startOcean,
  lofi: startLofi,
};

export const AMBIENT_SOUNDS: { type: SoundType; label: string; emoji: string }[] = [
  { type: 'none', label: '无', emoji: '🔇' },
  { type: 'rain', label: '雨声', emoji: '🌧️' },
  { type: 'ocean', label: '海浪', emoji: '🌊' },
  { type: 'forest', label: '森林', emoji: '🌿' },
  { type: 'cafe', label: '咖啡馆', emoji: '☕' },
  { type: 'whitenoise', label: '白噪音', emoji: '📡' },
  { type: 'lofi', label: 'Lo-Fi', emoji: '🎵' },
];

export function startAmbientSound(type: SoundType) {
  stopAll();
  if (type === 'none') return;
  currentType = type;
  getCtx(); // ensure context
  soundStarters[type]();
  isPlaying = true;
}

export function stopAmbientSound() {
  stopAll();
  currentType = 'none';
}

export function setAmbientVolume(volume: number) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

export function getCurrentAmbientSound(): SoundType {
  return currentType;
}

export function isAmbientPlaying(): boolean {
  return isPlaying;
}
