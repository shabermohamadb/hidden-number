// src/components/landing/HeroSection.tsx
import React, { useState, useEffect } from 'react';
import { Play, Plus, KeyRound, HelpCircle, BookOpen, Users, Lock, RefreshCw } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  onPlayNow: () => void;
  onCreateRoom: () => void;
  onJoinRoomModal: () => void;
  onHowToPlay: () => void;
  onRules: () => void;
  onQuickJoin: (roomCode: string) => void;
}

interface PublicRoom {
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  minPlayers: number;
  hasPassword: boolean;
}

export const HeroSection: React.FC<Props> = ({
  onPlayNow,
  onCreateRoom,
  onJoinRoomModal,
  onHowToPlay,
  onRules,
  onQuickJoin
}) => {
  const { playClick } = useSoundFX();
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // Ignore network failure
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto text-center z-10">
      {/* Visual Accent Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-6 shadow-lg shadow-cyan-500/10 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span>THREE.JS MULTIPLAYER DEDUCTION ARENA</span>
      </div>

      {/* Hero Title */}
      <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight text-white mb-4 drop-shadow-2xl">
        HIDDEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400">NUMBER</span>
      </h1>

      {/* Hero Tagline */}
      <p className="font-sans text-lg sm:text-2xl text-slate-300 font-light max-w-2xl mb-8 tracking-wide">
        Everyone in the arena knows your number. <br className="hidden sm:inline" />
        <span className="text-cyan-300 font-medium">Except you.</span>
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10">
        <button
          onClick={() => {
            playClick();
            onPlayNow();
          }}
          className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-bold text-lg shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Play className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition-transform" />
          <span>PLAY NOW (MATCHMAKING)</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onCreateRoom();
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-display font-bold text-base hover:border-cyan-400/50 hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
        >
          <Plus className="w-5 h-5 text-cyan-400" />
          <span>CREATE PRIVATE ROOM</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onJoinRoomModal();
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-mono text-sm hover:border-violet-400/50 hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
        >
          <KeyRound className="w-4 h-4 text-violet-400" />
          <span>ENTER ROOM CODE</span>
        </button>
      </div>

      {/* Secondary Actions: Rules & Guide */}
      <div className="flex items-center gap-6 text-xs font-mono text-slate-400 mb-12">
        <button
          onClick={() => {
            playClick();
            onHowToPlay();
          }}
          className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>How to Play</span>
        </button>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <button
          onClick={() => {
            playClick();
            onRules();
          }}
          className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Scoring Rules</span>
        </button>
      </div>

      {/* Active Public Lobbies Feed */}
      <div className="w-full max-w-3xl bg-slate-900/60 border border-white/10 rounded-3xl p-5 backdrop-blur-md text-left">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Open Public Arenas
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              {publicRooms.length} Active
            </span>
          </div>

          <button
            onClick={() => {
              playClick();
              fetchRooms();
            }}
            title="Refresh Lobbies"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-400">
            No public lobbies currently waiting. Click <span className="text-cyan-300">"Create Private Room"</span> or <span className="text-cyan-300">"Play Now"</span> to start one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {publicRooms.map((room) => (
              <div
                key={room.roomCode}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 flex items-center justify-between transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-cyan-300">{room.roomCode}</span>
                    {room.hasPassword && <Lock className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {room.playerCount}/{room.maxPlayers} Players
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    onQuickJoin(room.roomCode);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold border border-cyan-500/30 transition-all"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

