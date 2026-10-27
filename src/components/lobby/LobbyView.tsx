// src/components/lobby/LobbyView.tsx
import React, { useState } from 'react';
import { Play, Copy, Check, LogOut, Crown, Shield, Users, Clock, AlertCircle, KeyRound, Link as LinkIcon } from 'lucide-react';
import { GameState } from '../../types/game';
import { useSoundFX } from '../../hooks/useSoundFX';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onReadyToggle: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  error?: string | null;
}

export const LobbyView: React.FC<Props> = ({
  gameState,
  myPlayerId,
  onReadyToggle,
  onStartGame,
  onLeaveRoom,
  error
}) => {
  const { playClick, playStart } = useSoundFX();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Reliable player resolution: matches ID or persisted nickname
  const myNickname = localStorage.getItem('hn_nickname');
  const me = gameState.players.find(p => p.id === myPlayerId || (myNickname && p.nickname === myNickname));
  const isHost = me?.isHost || myPlayerId === gameState.hostId;
  const connectedPlayers = gameState.players.filter(p => p.connected);
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

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 z-10">
      {/* Header Info */}
      <div className="bg-[#0D1017]/90 border border-[#C5A059]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#131722] text-[#D4AF37] border border-[#C5A059]/30">
                LOBBY STAGING
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-[#8F8B83]">
                {gameState.settings.visibility === 'public' ? 'Public Arena' : 'Private Arena'}
              </span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-3xl text-[#FAF8F5] tracking-wide flex items-center gap-2 sm:gap-3">
              <span>ARENA ROOM:</span>
              <span className="text-[#D4AF37] font-mono tracking-wider">
                {gameState.roomCode}
              </span>
            </h1>
          </div>

          {/* Action Buttons: Separate Copy Link & Copy Code */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyInviteLink}
              title="Copy direct invite link to share with friends"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/30 text-xs font-mono text-[#D4AF37] transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
              <span>{copiedLink ? '✓ Link Copied!' : 'Copy Invite Link'}</span>
            </button>

            <button
              onClick={handleCopyRoomCode}
              title="Copy room code only"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#131722] hover:bg-[#1B2130] border border-[#C5A059]/30 text-xs font-mono text-[#F3E5AB] transition-all active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? '✓ Copied' : 'Copy Code'}</span>
            </button>

            <button
              onClick={() => {
                playClick();
                onLeaveRoom();
              }}
              className="p-2.5 rounded-xl bg-[#131722] hover:bg-rose-950/40 border border-[#C5A059]/20 hover:border-rose-500/40 text-[#8F8B83] hover:text-rose-400 transition-all active:scale-95 shrink-0"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room settings pill bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#C5A059]/20 text-[11px] sm:text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#A7A29A]">
            <Users className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Players: {connectedPlayers.length}/{gameState.settings.maxPlayers} (Min {minPlayers})</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#A7A29A]">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Questions: {gameState.settings.questionTime}s</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#A7A29A]">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Guess: {gameState.settings.guessTime}s</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#A7A29A]">
            <Crown className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Rounds: {gameState.settings.totalRounds}</span>
          </div>
        </div>
      </div>

      {/* Player Slots Grid */}
      <div className="flex-1 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <h2 className="font-display font-bold text-sm sm:text-base text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
            <span>Roster Members</span>
            <span className="text-[10px] sm:text-xs font-mono text-[#D4AF37] bg-[#131722] px-2.5 py-0.5 rounded-lg border border-[#C5A059]/30">
              {readyCount} of {connectedPlayers.length} Ready
            </span>
          </h2>

          <div className="flex items-center gap-2">
            {connectedPlayers.length < minPlayers ? (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Need {minPlayers - connectedPlayers.length} more player(s)</span>
              </div>
            ) : waitingCount > 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A7A29A] bg-[#131722] px-2.5 py-1 rounded-xl border border-[#C5A059]/20">
                <span>Waiting for {waitingCount} player{waitingCount === 1 ? '' : 's'} to ready up</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>All players ready! Host can start.</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {gameState.players.map((player) => {
            const isCurrentMe = player.id === myPlayerId || (myNickname && player.nickname === myNickname);
            return (
              <div
                key={player.id}
                className={`relative p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all ${
                  isCurrentMe
                    ? 'bg-[#181E2C] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
                    : 'bg-[#0D1017] border-[#C5A059]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#8C6D34] to-[#D4AF37] flex items-center justify-center font-display font-black text-black text-base sm:text-lg shadow-md shrink-0">
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-sm sm:text-base text-[#FAF8F5] max-w-[110px] sm:max-w-[140px] truncate">
                          {player.nickname}
                        </span>
                        {isCurrentMe && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#8F8B83] mt-0.5">
                        {player.isHost ? (
                          <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
                            <Crown className="w-3 h-3" /> Host
                          </span>
                        ) : (
                          <span>Player</span>
                        )}
                        {!player.connected && (
                          <span className="text-rose-400 font-semibold">(Reconnecting...)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ready Indicator */}
                  <div>
                    {player.isHost ? (
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#131722] text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                        HOST
                      </span>
                    ) : player.isReady ? (
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 animate-pulse">
                        <Check className="w-3 h-3" /> READY
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#131722] text-[#8F8B83] border border-[#C5A059]/20">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Controls Bar (Mobile Sticky) */}
      <div className="sticky bottom-2 z-20 bg-[#0D1017]/95 border border-[#C5A059]/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        <div className="w-full sm:w-auto text-center sm:text-left">
          <span className="text-[11px] sm:text-xs font-mono text-[#A7A29A] block">
            {isHost
              ? canStart
                ? 'All players ready! Click Start Arena Game below.'
                : `Waiting for all players to ready up (Min ${minPlayers} players).`
              : me?.isReady
              ? 'You are READY! Waiting for host to launch.'
              : 'Click "I AM READY" to confirm preparedness.'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {!isHost && (
            <button
              onClick={handleReadyClick}
              className={`w-full sm:w-auto flex-1 sm:flex-initial py-3.5 px-6 rounded-xl sm:rounded-2xl font-display font-bold text-sm transition-all active:scale-95 shadow-lg ${
                me?.isReady
                  ? 'bg-rose-950/40 text-rose-200 border border-rose-500/50 hover:bg-rose-900/50'
                  : 'bg-emerald-950/40 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-900/50 shadow-emerald-500/10'
              }`}
            >
              {me?.isReady ? 'CANCEL READY' : 'I AM READY'}
            </button>
          )}

          {isHost && (
            <button
              onClick={() => {
                playStart();
                onStartGame();
              }}
              disabled={!canStart}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#9A7B38] via-[#D4AF37] to-[#8C6D34] hover:from-[#B89243] hover:via-[#E5C158] hover:to-[#A7833D] text-black font-display font-extrabold text-sm sm:text-base shadow-xl shadow-[#D4AF37]/25 border border-[#F3E5AB]/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black shrink-0" />
              <span>START ARENA GAME</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
