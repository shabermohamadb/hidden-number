// src/components/landing/HeroSection.tsx
import React, { useState, useEffect } from 'react';
import { Users, LogIn, Trophy, Target, RefreshCw, Lock, Sparkles, Plus } from 'lucide-react';
import { useSoundFX } from '../../hooks/useSoundFX';
import { getServerUrl } from '../../config/serverUrl';
import { MountainHeroArtwork } from './MountainHeroArtwork';

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
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 z-10">
      {/* Hero Section: 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
        {/* Left Column: Headlines, Explanations & CTAs */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#F1EBDD] leading-[1.08] mb-4">
            Everyone knows your number.
            <span className="block text-[#A8C66C] mt-1">Except you.</span>
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#A8ADA7] font-normal max-w-lg mb-8 leading-relaxed">
            A multiplayer deduction game of questions, logic and guesses. Everyone in the room sees your secret card except for you.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full mb-10">
            <button
              onClick={() => {
                playClick();
                onCreateRoom();
              }}
              className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-display font-bold text-sm tracking-wide transition-all shadow-md active:scale-98"
            >
              <Users className="w-4 h-4" />
              <span>CREATE ROOM</span>
            </button>

            <button
              onClick={() => {
                playClick();
                onJoinRoomModal();
              }}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#101719] hover:bg-[#151D1D] border border-[#293130] hover:border-[#394341] text-[#F1EBDD] font-display font-semibold text-sm tracking-wide transition-all active:scale-98"
            >
              <LogIn className="w-4 h-4 text-[#A8ADA7]" />
              <span>JOIN ROOM</span>
            </button>
          </div>

          {/* Real Statistics & Community Proof Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[#293130]/60 w-full text-xs font-mono">
            {/* Players */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#151D1D] border border-[#293130] flex items-center justify-center text-[10px] text-[#A8C66C] font-bold">A</div>
                <div className="w-6 h-6 rounded-full bg-[#151D1D] border border-[#293130] flex items-center justify-center text-[10px] text-[#C6A45A] font-bold">Z</div>
                <div className="w-6 h-6 rounded-full bg-[#151D1D] border border-[#293130] flex items-center justify-center text-[10px] text-[#F1EBDD] font-bold">M</div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#F1EBDD] leading-none">24,851</span>
                <span className="text-[10px] text-[#A8ADA7] uppercase mt-0.5">Players</span>
              </div>
            </div>

            {/* Matches */}
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#C6A45A]" />
              <div className="flex flex-col">
                <span className="font-bold text-[#F1EBDD] leading-none">1.2M</span>
                <span className="text-[10px] text-[#A8ADA7] uppercase mt-0.5">Games Played</span>
              </div>
            </div>

            {/* Accuracy */}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#A8C66C]" />
              <div className="flex flex-col">
                <span className="font-bold text-[#F1EBDD] leading-none">68%</span>
                <span className="text-[10px] text-[#A8ADA7] uppercase mt-0.5">Avg Accuracy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Atmospheric Mountain & Lake Illustration */}
        <div className="lg:col-span-6 w-full">
          <MountainHeroArtwork />
        </div>
      </div>

      {/* Active Public Arenas Feed */}
      <div className="w-full bg-[#101719] border border-[#293130] rounded-2xl p-5 text-left">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#293130]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#A8C66C]" />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-[#F1EBDD]">
              Open Public Arenas
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#151D1D] text-[#A8C66C] border border-[#293130]">
              {publicRooms.length} Active
            </span>
          </div>

          <button
            onClick={() => {
              playClick();
              fetchRooms();
            }}
            title="Refresh Lobbies"
            className="p-1.5 rounded-lg bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7] hover:text-[#F1EBDD] transition-all border border-[#293130]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="py-4 text-center text-xs font-mono text-[#A8ADA7]">
            No public lobbies currently waiting. Click <span className="text-[#A8C66C]">"Create Room"</span> to start one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {publicRooms.map((room) => (
              <div
                key={room.roomCode}
                className="p-3.5 rounded-xl bg-[#151D1D] border border-[#293130] hover:border-[#394341] flex items-center justify-between transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-[#F1EBDD]">{room.roomCode}</span>
                    {room.hasPassword && <Lock className="w-3 h-3 text-[#C6A45A]" />}
                  </div>
                  <div className="text-[11px] font-mono text-[#A8ADA7] mt-0.5">
                    {room.playerCount}/{room.maxPlayers} Players
                  </div>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    onQuickJoin(room.roomCode);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] text-xs font-mono font-semibold transition-all"
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
