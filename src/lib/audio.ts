"use client";

import type { SfxName } from "@/shared/types";

/**
 * Synthesised game-show audio — no asset files, everything is Web Audio.
 * Call `unlock()` from a user gesture before playing on iOS/Safari.
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  get enabled() {
    return !!this.ctx && !this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  play(name: SfxName) {
    if (!this.ctx || !this.master || this.muted) return;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    const t = this.ctx.currentTime;
    switch (name) {
      case "chime":
        return this.chime(t);
      case "tick":
        return this.tick(t);
      case "buzzer":
        return this.buzzer(t);
      case "whoosh":
        return this.whoosh(t);
      case "splash":
        return this.splash(t);
      case "fanfare":
        return this.fanfare(t);
      case "cheer":
        return this.cheer(t);
      case "tally":
        return this.tally(t);
      case "pop":
        return this.pop(t);
      case "drumroll":
        return this.drumroll(t);
    }
  }

  /* ───── building blocks ───── */

  private tone(freq: number, t: number, dur: number, opts: { type?: OscillatorType; gain?: number; attack?: number; decay?: number; slideTo?: number } = {}) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    const peak = opts.gain ?? 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (opts.decay ?? 0));
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + (opts.decay ?? 0) + 0.05);
  }

  private noise(t: number, dur: number, opts: { gain?: number; filter?: BiquadFilterType; freq?: number; freqTo?: number; q?: number } = {}) {
    const ctx = this.ctx!;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = opts.filter ?? "bandpass";
    f.frequency.setValueAtTime(opts.freq ?? 1000, t);
    if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(opts.freqTo, t + dur);
    f.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /* ───── cues ───── */

  /** The classic two-tone convenience store door chime. */
  private chime(t: number) {
    this.tone(1318.5, t, 0.5, { gain: 0.25, decay: 0.4 });
    this.tone(2637, t, 0.3, { gain: 0.05, decay: 0.3 });
    this.tone(1046.5, t + 0.32, 0.6, { gain: 0.25, decay: 0.6 });
    this.tone(2093, t + 0.32, 0.4, { gain: 0.05, decay: 0.4 });
  }

  private tick(t: number) {
    this.tone(1800, t, 0.03, { type: "square", gain: 0.06, decay: 0.03 });
  }

  private buzzer(t: number) {
    this.tone(110, t, 0.55, { type: "sawtooth", gain: 0.25, decay: 0.1 });
    this.tone(165, t, 0.55, { type: "square", gain: 0.12, decay: 0.1 });
  }

  private whoosh(t: number) {
    this.noise(t, 0.45, { gain: 0.25, filter: "bandpass", freq: 300, freqTo: 4000, q: 1.2 });
  }

  /** Slurpee splash: a liquid thwack then bubbles. */
  private splash(t: number) {
    this.noise(t, 0.35, { gain: 0.35, filter: "lowpass", freq: 3500, freqTo: 400 });
    const notes = [880, 1174, 1568, 2093, 1760, 2349];
    notes.forEach((n, i) => this.tone(n, t + 0.05 + i * 0.06, 0.09, { gain: 0.12, decay: 0.12, slideTo: n * 1.2 }));
  }

  private fanfare(t: number) {
    const seq = [523.25, 659.25, 783.99, 1046.5];
    seq.forEach((n, i) => {
      this.tone(n, t + i * 0.11, 0.18, { type: "triangle", gain: 0.22, decay: 0.15 });
      this.tone(n / 2, t + i * 0.11, 0.18, { type: "square", gain: 0.05, decay: 0.15 });
    });
    this.tone(1046.5, t + 0.44, 0.5, { type: "triangle", gain: 0.25, decay: 0.5 });
    this.tone(1318.5, t + 0.44, 0.5, { type: "triangle", gain: 0.15, decay: 0.5 });
  }

  private cheer(t: number) {
    this.noise(t, 1.4, { gain: 0.22, filter: "bandpass", freq: 900, freqTo: 1600, q: 0.5 });
    this.noise(t + 0.15, 1.2, { gain: 0.15, filter: "bandpass", freq: 2400, q: 0.7 });
    [523.25, 659.25, 783.99].forEach((n) => this.tone(n, t, 0.9, { type: "triangle", gain: 0.12, attack: 0.15, decay: 0.6 }));
    this.tone(1046.5, t + 0.2, 0.8, { type: "triangle", gain: 0.12, attack: 0.1, decay: 0.6 });
  }

  private tally(t: number) {
    for (let i = 0; i < 14; i++) this.tone(900 + i * 60, t + i * 0.045, 0.03, { type: "square", gain: 0.07, decay: 0.03 });
    this.tone(1760, t + 0.68, 0.25, { type: "triangle", gain: 0.2, decay: 0.3 });
  }

  private pop(t: number) {
    this.tone(700, t, 0.08, { gain: 0.18, decay: 0.05, slideTo: 300 });
  }

  private drumroll(t: number) {
    for (let i = 0; i < 40; i++) this.noise(t + i * 0.055, 0.05, { gain: 0.14, filter: "lowpass", freq: 900 });
    this.noise(t + 2.25, 0.5, { gain: 0.3, filter: "lowpass", freq: 1200, freqTo: 200 });
  }
}

export const sfx = new Sfx();

/** Light haptic tap for controllers (no-op where unsupported). */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
