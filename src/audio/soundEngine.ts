// src/audio/soundEngine.ts

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private isAmbientPlaying = false;
  private isMuted = false;

  private sfxVolume = 0.7;
  private musicVolume = 0.3;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.sfxGain.gain.value = this.sfxVolume;
      this.musicGain.gain.value = this.musicVolume;

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public playClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Ignore audio failure
    }
  }

  public playJoin() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A chord chime
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.4);
      });
    } catch {
      // Ignore audio failure
    }
  }

  public playStart() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(587.33, t + 0.5);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.75);
    } catch {
      // Ignore audio failure
    }
  }

  public playTick(isUrgent = false) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 440, t);

      gain.gain.setValueAtTime(isUrgent ? 0.35 : 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch {
      // Ignore audio failure
    }
  }

  public playHeartbeat() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {
      // Ignore audio failure
    }
  }

  public playSubmitGuess() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.15);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch {
      // Ignore audio failure
    }
  }

  public playDing() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, t); // C6

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch {
      // Ignore audio failure
    }
  }

  public playReveal(isExact = false) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const chord = isExact ? [523.25, 659.25, 783.99, 1046.5] : [349.23, 440, 523.25];
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isExact ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        gain.gain.setValueAtTime(0, t + idx * 0.05);
        gain.gain.linearRampToValueAtTime(isExact ? 0.3 : 0.2, t + idx * 0.05 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + (isExact ? 1.0 : 0.6));

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + (isExact ? 1.1 : 0.7));
      });
    } catch {
      // Ignore audio failure
    }
  }

  public playVictory() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      // Fanfare: C4, E4, G4, C5 arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);

        gain.gain.setValueAtTime(0, t + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.3, t + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.8);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.9);
      });
    } catch {
      // Ignore audio failure
    }
  }

  public startAmbient() {
    if (this.isAmbientPlaying) return;
    try {
      this.initContext();
      if (!this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc2 = this.ctx.createOscillator();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);

      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(65.41, t); // C2

      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(98.00, t); // G2

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.musicGain);

      this.ambientOsc1.start(t);
      this.ambientOsc2.start(t);
      this.isAmbientPlaying = true;
    } catch {
      // Ignore audio failure
    }
  }

  public stopAmbient() {
    if (!this.isAmbientPlaying) return;
    try {
      if (this.ambientOsc1) {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
        this.ambientOsc1 = null;
      }
      if (this.ambientOsc2) {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
        this.ambientOsc2 = null;
      }
      this.isAmbientPlaying = false;
    } catch {
      // Ignore audio failure
    }
  }
}

export const soundEngine = new SoundEngine();

