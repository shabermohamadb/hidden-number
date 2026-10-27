// src/components/lobby/LobbyView.tsx
import React, { useState } from 'react';
import { Play, Copy, Check, LogOut, Crown, Shield, Users, Clock, AlertCircle } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const me = gameState.players.find(p => p.id === myPlayerId);
  const isHost = me?.isHost || myPlayerId === gameState.hostId;
  const connectedPlayers = gameState.players.filter(p => p.connected);
  const minPlayers = gameState.settings.minPlayers || 3;
  const canStart = connectedPlayers.length >= minPlayers && connectedPlayers.every(p => p.isReady || p.isHost);

  const handleCopyInvite = () => {
    playClick();
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-5xl mx-auto px-4 py-8 z-10">
      {/* Header Info */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                LOBBY STAGING
              </span>
              <span className="text-xs font-mono text-slate-400">
                {gameState.settings.visibility === 'public' ? 'Public Match' : 'Private Match'}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide flex items-center gap-3">
              <span>ARENA ROOM:</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300 font-mono">
                {gameState.roomCode}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopyInvite}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-cyan-300 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>

            <button
              onClick={() => {
                playClick();
                onLeaveRoom();
              }}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room settings pill bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Players: {connectedPlayers.length}/{gameState.settings.maxPlayers} (Min {minPlayers})</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Questions: {gameState.settings.questionTime}s</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Shield className="w-4 h-4 text-violet-400" />
            <span>Guess Time: {gameState.settings.guessTime}s</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Rounds: {gameState.settings.totalRounds}</span>
          </div>
        </div>
      </div>

      {/* Player Slots Grid */}
      <div className="flex-1 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <span>Roster Members</span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-800/40">
              {connectedPlayers.length} Connected
            </span>
          </h2>

          {connectedPlayers.length < minPlayers && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Waiting for {minPlayers - connectedPlayers.length} more player(s)...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gameState.players.map((player) => {
            const isCurrentMe = player.id === myPlayerId;
            return (
              <div
                key={player.id}
                className={`relative p-4 rounded-3xl border transition-all ${
                  isCurrentMe
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center font-display font-black text-white text-lg shadow-lg">
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-base text-white">
                          {player.nickname}
                        </span>
                        {isCurrentMe && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                        {player.isHost ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Crown className="w-3 h-3" /> Host
                          </span>
                        ) : (
                          <span>Player</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ready Indicator */}
                  <div>
                    {player.isHost ? (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        HOST
                      </span>
                    ) : player.isReady ? (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> READY
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-white/5 text-slate-400 border border-white/10">
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
        <div className="mb-4 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Controls Bar */}
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="text-xs font-mono text-slate-400 block">
            {isHost
              ? canStart
                ? 'All conditions met. Host may initiate the arena round.'
                : `Need at least ${minPlayers} ready players to begin.`
              : me?.isReady
              ? 'You are ready! Waiting for the host to start.'
              : 'Click "I am Ready" when prepared to enter the arena.'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isHost && (
            <button
              onClick={() => {
                playClick();
                onReadyToggle(!me?.isReady);
              }}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-display font-bold text-sm transition-all ${
                me?.isReady
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/10'
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-display font-bold text-base shadow-2xl shadow-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>START ARENA GAME</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

