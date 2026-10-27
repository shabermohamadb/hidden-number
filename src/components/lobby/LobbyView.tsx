// src/components/lobby/LobbyView.tsx
import React, { useState } from 'react';
import { ArrowLeft, Lock, Settings, Copy, Check, Link as LinkIcon, Crown, Shield, Users, Home, BookOpen, User } from 'lucide-react';
import { GameState } from '../../types/game';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onReadyToggle: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onInspectPlayer?: (playerId: string) => void;
  error?: string | null;
}

export const LobbyView: React.FC<Props> = ({
  gameState,
  myPlayerId,
  onReadyToggle,
  onStartGame,
  onLeaveRoom,
  onInspectPlayer,
  error
}) => {
  const { playClick, playStart } = useSoundFX();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Reliable player resolution
  const myNickname = localStorage.getItem('hn_nickname');
  const me = gameState.players.find(p => p.id === myPlayerId || (myNickname && p.nickname === myNickname));
  const isHost = me?.isHost || myPlayerId === gameState.hostId;
  const connectedPlayers = gameState.players.filter(p => p.connected);
  const maxPlayers = gameState.settings.maxPlayers || 6;
  const minPlayers = gameState.settings.minPlayers || 2;
  const readyCount = connectedPlayers.filter(p => p.isReady || p.isHost).length;
  const waitingCount = connectedPlayers.filter(p => !p.isReady && !p.isHost).length;
  const allReady = connectedPlayers.length >= minPlayers && waitingCount === 0;
  const canStart = allReady && isHost;

  const handleCopyInviteLink = () => {
    playClick();
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyRoomCode = () => {
    playClick();
    navigator.clipboard.writeText(gameState.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleReadyClick = () => {
    playClick();
    const nextReady = !me?.isReady;
    onReadyToggle(nextReady);
  };

  // Generate empty slot placeholders up to maxPlayers
  const emptySlotsCount = Math.max(0, maxPlayers - connectedPlayers.length);
  const emptySlots = Array.from({ length: emptySlotsCount });

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-4xl mx-auto px-4 sm:px-6 py-6 z-10">
      <div className="space-y-6">
        {/* Top Navigation Bar: Back button, Title, Status & Settings */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              playClick();
              onLeaveRoom();
            }}
            className="flex items-center gap-2 text-sm font-display font-semibold text-[#F1EBDD] hover:text-[#A8C66C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>LOBBY</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101719] border border-[#293130] text-[11px] font-mono text-[#A8ADA7]">
              <Lock className="w-3 h-3 text-[#C6A45A]" />
              <span className="uppercase">{gameState.settings.visibility === 'public' ? 'Public Room' : 'Private Room'}</span>
            </div>

            <div className="p-1.5 rounded-lg bg-[#101719] border border-[#293130] text-[#A8ADA7]">
              <Settings className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Room Code & Invite Link Dual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Room Code Card */}
          <div className="p-4 rounded-2xl bg-[#101719] border border-[#293130] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8ADA7] block mb-1">
                ROOM CODE
              </span>
              <span className="font-mono font-bold text-xl sm:text-2xl tracking-wider text-[#F1EBDD]">
                {gameState.roomCode}
              </span>
            </div>
            <button
              onClick={handleCopyRoomCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-xs font-mono text-[#F1EBDD] hover:text-[#A8C66C] transition-all"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#A8C66C]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          {/* Invite Link Card */}
          <div className="p-4 rounded-2xl bg-[#101719] border border-[#293130] flex items-center justify-between">
            <div className="truncate mr-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8ADA7] block mb-1">
                INVITE LINK
              </span>
              <span className="font-mono text-xs text-[#A8ADA7] truncate block max-w-[200px] sm:max-w-[220px]">
                {`${window.location.host}?room=${gameState.roomCode}`}
              </span>
            </div>
            <button
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] border border-[#293130] text-xs font-mono text-[#F1EBDD] hover:text-[#A8C66C] transition-all shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#A8C66C]" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'COPIED' : 'COPY LINK'}</span>
            </button>
          </div>
        </div>

        {/* Main Content: Split Players List vs Room Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Player Slots (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[#101719] border border-[#293130] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#293130]/60">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7]">
                PLAYERS ({connectedPlayers.length}/{maxPlayers})
              </span>
              <span className="text-[11px] font-mono text-[#A8ADA7]">
                Min {minPlayers} to start
              </span>
            </div>

            {/* Connected Player Rows */}
            <div className="space-y-2">
              {connectedPlayers.map((player) => {
                const isMe = player.id === me?.id;
                const isReady = player.isReady || player.isHost;

                return (
                  <div
                    key={player.id}
                    onClick={() => onInspectPlayer?.(player.id)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                      isMe
                        ? 'bg-[#151D1D] border border-[#293130]'
                        : 'bg-[#101719] hover:bg-[#151D1D]/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1E2728] border border-[#293130] flex items-center justify-center font-display font-bold text-xs text-[#F1EBDD] shrink-0">
                        {player.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-medium text-sm text-[#F1EBDD]">
                          {player.nickname}
                        </span>
                        {player.isHost && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C6A45A]/15 border border-[#C6A45A]/40 text-[#C6A45A] text-[10px] font-mono font-bold">
                            <Crown className="w-2.5 h-2.5" />
                            <span>HOST</span>
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] font-mono text-[#A8ADA7]">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-[#A8C66C]' : 'bg-[#E5A83B]'}`} />
                      <span className={`text-xs font-mono font-bold ${isReady ? 'text-[#A8C66C]' : 'text-[#E5A83B]'}`}>
                        {isReady ? 'READY' : 'NOT READY'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Empty Slots */}
              {emptySlots.map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#293130]/50 text-[#A8ADA7]/60"
                >
                  <div className="w-9 h-9 rounded-full border border-dashed border-[#293130] flex items-center justify-center text-xs">
                    •
                  </div>
                  <span className="text-xs font-mono">
                    Waiting for player...
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Room Settings & CTA (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#101719] border border-[#293130] space-y-3.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A8ADA7] block pb-2 border-b border-[#293130]/60">
                ROOM SETTINGS
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-[#293130]/30">
                  <span className="text-[#A8ADA7]">Number Range</span>
                  <span className="font-bold text-[#F1EBDD]">1 - 100</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#293130]/30">
                  <span className="text-[#A8ADA7]">Round Time</span>
                  <span className="font-bold text-[#F1EBDD]">{gameState.settings.roundTime || 60} sec</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#293130]/30">
                  <span className="text-[#A8ADA7]">Question Time</span>
                  <span className="font-bold text-[#F1EBDD]">{gameState.settings.questionTime || 15} sec</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#293130]/30">
                  <span className="text-[#A8ADA7]">Guess Time</span>
                  <span className="font-bold text-[#F1EBDD]">{gameState.settings.guessTime || 30} sec</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#A8ADA7]">Max Players</span>
                  <span className="font-bold text-[#F1EBDD]">{maxPlayers}</span>
                </div>
              </div>

              {/* Actions Area */}
              <div className="pt-3 space-y-2.5">
                {isHost ? (
                  <>
                    <button
                      onClick={() => {
                        playStart();
                        onStartGame();
                      }}
                      disabled={!canStart}
                      className="w-full py-3.5 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] disabled:bg-[#1E2728] disabled:text-[#A8ADA7] text-[#070B0D] font-display font-bold text-sm tracking-wide transition-all shadow-md active:scale-98"
                    >
                      START GAME
                    </button>
                    {!allReady && (
                      <p className="text-[11px] font-mono text-center text-[#A8ADA7]">
                        All players must be ready
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleReadyClick}
                    className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 ${
                      me?.isReady
                        ? 'bg-[#151D1D] border border-[#A8C66C] text-[#A8C66C]'
                        : 'bg-[#A8C66C] text-[#070B0D] hover:bg-[#B8D47C]'
                    }`}
                  >
                    {me?.isReady ? '✓ I AM READY (WAITING FOR HOST)' : 'READY UP'}
                  </button>
                )}

                <button
                  onClick={() => {
                    playClick();
                    onLeaveRoom();
                  }}
                  className="w-full py-2.5 rounded-xl bg-transparent hover:bg-rose-950/20 border border-[#E05D52]/40 text-[#E05D52] font-mono text-xs font-semibold transition-all"
                >
                  LEAVE ROOM
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="pt-6 border-t border-[#293130] flex items-center justify-around text-xs font-mono text-[#A8ADA7]">
        <div className="flex flex-col items-center gap-1 text-[#A8C66C] cursor-pointer">
          <Home className="w-4 h-4" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Lobby</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Rules</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Settings</span>
        </div>
        <div className="flex flex-col items-center gap-1 hover:text-[#F1EBDD] cursor-pointer transition-colors">
          <User className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider">Profile</span>
        </div>
      </div>
    </div>
  );
};
