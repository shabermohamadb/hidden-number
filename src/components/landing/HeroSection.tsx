// src/components/landing/HeroSection.tsx
import React, { useState, useEffect } from 'react';
import { Play, Plus, KeyRound, HelpCircle, BookOpen, Users, Lock, RefreshCw } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';
import { getServerUrl } from '../../config/serverUrl';

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
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/api/rooms`);
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
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8 max-w-5xl mx-auto text-center z-10">
      {/* Visual Accent Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1017] border border-[#C5A059]/40 text-[#D4AF37] text-[10px] sm:text-xs font-mono font-medium mb-4 sm:mb-6 shadow-md shadow-[#D4AF37]/5 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
        <span>THREE.JS MULTIPLAYER DEDUCTION ARENA</span>
      </div>

      {/* Hero Title */}
      <h1 className="font-display font-black text-4xl sm:text-7xl md:text-8xl tracking-tight text-[#FAF8F5] mb-3 sm:mb-4 drop-shadow-2xl">
        HIDDEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#F3E5AB]">NUMBER</span>
      </h1>

      {/* Hero Tagline */}
      <p className="font-sans text-base sm:text-2xl text-[#A7A29A] font-light max-w-2xl mb-6 sm:mb-8 tracking-wide px-2">
        Everyone in the arena knows your number. <br className="hidden sm:inline" />
        <span className="text-[#D4AF37] font-medium">Except you.</span>
      </p>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto mb-10">
        <button
          onClick={() => {
            playClick();
            onPlayNow();
          }}
          className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-display font-black text-base sm:text-lg shadow-xl shadow-[#D4AF37]/20 border border-[#F3E5AB]/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Play className="w-5 h-5 fill-black group-hover:translate-x-0.5 transition-transform" />
          <span>PLAY NOW (MATCHMAKING)</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onCreateRoom();
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#0D1017] hover:bg-[#131722] border border-[#C5A059]/40 hover:border-[#D4AF37]/70 text-[#FAF8F5] font-display font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/50"
        >
          <Plus className="w-5 h-5 text-[#D4AF37]" />
          <span>CREATE PRIVATE ROOM</span>
        </button>

        <button
          onClick={() => {
            playClick();
            onJoinRoomModal();
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#0D1017] hover:bg-[#131722] border border-[#C5A059]/30 hover:border-[#D4AF37]/60 text-[#A7A29A] hover:text-[#FAF8F5] font-mono text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/50"
        >
          <KeyRound className="w-4 h-4 text-[#D4AF37]" />
          <span>ENTER ROOM CODE</span>
        </button>
      </div>

      {/* Secondary Actions: Rules & Guide */}
      <div className="flex items-center gap-6 text-xs font-mono text-[#8F8B83] mb-12">
        <button
          onClick={() => {
            playClick();
            onHowToPlay();
          }}
          className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
          <span>How to Play</span>
        </button>
        <span className="w-1 h-1 rounded-full bg-[#5A564F]" />
        <button
          onClick={() => {
            playClick();
            onRules();
          }}
          className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          <span>Scoring Rules</span>
        </button>
      </div>

      {/* Active Public Lobbies Feed */}
      <div className="w-full max-w-3xl bg-[#0D1017]/90 border border-[#C5A059]/25 rounded-3xl p-5 backdrop-blur-md text-left shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#C5A059]/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-display font-bold text-sm text-[#F5F2EB] uppercase tracking-wider">
              Open Public Arenas
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#131722] text-[#D4AF37] border border-[#C5A059]/30">
              {publicRooms.length} Active
            </span>
          </div>

          <button
            onClick={() => {
              playClick();
              fetchRooms();
            }}
            title="Refresh Lobbies"
            className="p-1.5 rounded-lg bg-[#131722] hover:bg-[#1B2130] text-[#A7A29A] hover:text-[#FAF8F5] transition-all border border-[#C5A059]/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${loadingRooms ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-[#8F8B83]">
            No public lobbies currently waiting. Click <span className="text-[#D4AF37]">"Create Private Room"</span> or <span className="text-[#D4AF37]">"Play Now"</span> to start one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {publicRooms.map((room) => (
              <div
                key={room.roomCode}
                className="p-3.5 rounded-2xl bg-[#131722] border border-[#C5A059]/20 hover:border-[#D4AF37]/50 flex items-center justify-between transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-[#D4AF37]">{room.roomCode}</span>
                    {room.hasPassword && <Lock className="w-3 h-3 text-[#E5A83B]" />}
                  </div>
                  <div className="text-[11px] font-mono text-[#8F8B83] mt-0.5">
                    {room.playerCount}/{room.maxPlayers} Players
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    onQuickJoin(room.roomCode);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#181E2C] hover:bg-[#222A3E] text-[#D4AF37] text-xs font-mono font-semibold border border-[#C5A059]/30 transition-all"
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
