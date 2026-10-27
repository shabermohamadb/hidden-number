// src/hooks/useSoundFX.ts
import { useState, useEffect, useCallback } from 'react';
import { soundEngine } from '../audio/soundEngine';

export function useSoundFX() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('hn_muted') === 'true';
  });

  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    const v = localStorage.getItem('hn_sfx_vol');
    return v !== null ? parseFloat(v) : 0.7;
  });

  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    const v = localStorage.getItem('hn_music_vol');
    return v !== null ? parseFloat(v) : 0.3;
  });

  useEffect(() => {
    soundEngine.setMuted(isMuted);
    localStorage.setItem('hn_muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    soundEngine.setSfxVolume(sfxVolume);
    localStorage.setItem('hn_sfx_vol', String(sfxVolume));
  }, [sfxVolume]);

  useEffect(() => {
    soundEngine.setMusicVolume(musicVolume);
    localStorage.setItem('hn_music_vol', String(musicVolume));
  }, [musicVolume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const setSfxVol = useCallback((vol: number) => {
    setSfxVolumeState(vol);
  }, []);

  const setMusicVol = useCallback((vol: number) => {
    setMusicVolumeState(vol);
  }, []);

  return {
    isMuted,
    sfxVolume,
    musicVolume,
    toggleMute,
    setSfxVolume: setSfxVol,
    setMusicVolume: setMusicVol,
    playClick: () => soundEngine.playClick(),
    playJoin: () => soundEngine.playJoin(),
    playStart: () => soundEngine.playStart(),
    playTick: (urgent?: boolean) => soundEngine.playTick(urgent),
    playHeartbeat: () => soundEngine.playHeartbeat(),
    playSubmitGuess: () => soundEngine.playSubmitGuess(),
    playDing: () => soundEngine.playDing(),
    playReveal: (isExact?: boolean) => soundEngine.playReveal(isExact),
    playVictory: () => soundEngine.playVictory(),
    startAmbient: () => soundEngine.startAmbient(),
    stopAmbient: () => soundEngine.stopAmbient(),
  };
}

