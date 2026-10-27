// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { CinematicBackground } from './components/3d/CinematicBackground';
import { NavigationHeader } from './components/common/NavigationHeader';
import { HeroSection } from './components/landing/HeroSection';
import { HowToPlayModal } from './components/landing/HowToPlayModal';
import { RulesAndScoringModal } from './components/landing/RulesAndScoringModal';
import { CreateRoomModal } from './components/landing/CreateRoomModal';
import { JoinRoomModal } from './components/landing/JoinRoomModal';
import { ProfileDrawer } from './components/profile/ProfileDrawer';
import { MatchmakingOverlay } from './components/matchmaking/MatchmakingOverlay';
import { ServerConfigModal } from './components/common/ServerConfigModal';
import { LobbyView } from './components/lobby/LobbyView';
import { GameArenaView } from './components/game/GameArenaView';
import { ResultsView } from './components/results/ResultsView';

export function App() {
  const {
    connected,
    gameState,
    queueStatus,
    error,
    isSubmitting,
    clearError,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    joinMatchmaking,
    cancelMatchmaking,
    askQuestion,
    submitAnswer,
    submitGuess,
    nextRound,
    returnToLobby,
    reconnect
  } = useSocket();

  // Local user profile (persistent across reloads)
  const [nickname, setNickname] = useState<string>(() => {
    let saved = localStorage.getItem('hn_nickname');
    if (!saved) {
      saved = `Player_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('hn_nickname', saved);
    }
    return saved;
  });
  const [avatar, setAvatar] = useState<string>(() => {
    let saved = localStorage.getItem('hn_avatar');
    if (!saved) {
      saved = 'avatar-1';
      localStorage.setItem('hn_avatar', saved);
    }
    return saved;
  });

  // Modal states
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [serverConfigOpen, setServerConfigOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // 1. Immediately cache invite code from URL parameter (?room=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      sessionStorage.setItem('hn_pending_invite', roomFromUrl.toUpperCase());
    }
  }, []);

  // 2. Automatically process cached invitation once connected and not in a room
  useEffect(() => {
    const pendingCode = sessionStorage.getItem('hn_pending_invite');
    if (pendingCode && connected && !gameState) {
      sessionStorage.removeItem('hn_pending_invite');
      // Clean query string from browser bar without triggering page refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));

      joinRoom(pendingCode, nickname, avatar);
    }
  }, [connected, gameState, joinRoom, nickname, avatar]);

  // Record career stats when a match completes
  useEffect(() => {
    if (gameState?.phase === 'COMPLETED' && gameState.results) {
      const myScore = gameState.results.roundScores.find(s => s.playerId === gameState.myPlayerId);
      if (myScore) {
        const games = parseInt(localStorage.getItem('hn_stat_games') || '0', 10) + 1;
        const wins = parseInt(localStorage.getItem('hn_stat_wins') || '0', 10) + (gameState.results.matchWinner?.playerId === gameState.myPlayerId ? 1 : 0);
        const points = parseInt(localStorage.getItem('hn_stat_points') || '0', 10) + myScore.cumulativeScore;
        const exact = parseInt(localStorage.getItem('hn_stat_exact') || '0', 10) + (myScore.isExact ? 1 : 0);

        localStorage.setItem('hn_stat_games', String(games));
        localStorage.setItem('hn_stat_wins', String(wins));
        localStorage.setItem('hn_stat_points', String(points));
        localStorage.setItem('hn_stat_exact', String(exact));
      }
    }
  }, [gameState?.phase, gameState?.results, gameState?.myPlayerId]);

  // Handlers
  const handleSaveProfile = (newNick: string, newAv: string) => {
    setNickname(newNick);
    setAvatar(newAv);
    localStorage.setItem('hn_nickname', newNick);
    localStorage.setItem('hn_avatar', newAv);
  };

  const handleCreateRoom = async (settings: {
    visibility: 'public' | 'private';
    questionTime: number;
    guessTime: number;
    totalRounds: number;
    minPlayers: number;
    maxPlayers: number;
    password?: string | null;
  }) => {
    setLoadingAction(true);
    const res = await createRoom(nickname, avatar, settings);
    setLoadingAction(false);
    if (res.success) {
      setCreateRoomOpen(false);
    }
  };

  const handleJoinRoom = async (code: string, password?: string) => {
    setLoadingAction(true);
    const res = await joinRoom(code, nickname, avatar, password);
    setLoadingAction(false);
    if (res.success) {
      setJoinRoomOpen(false);
    }
  };

  const handlePlayNow = () => {
    joinMatchmaking(nickname, avatar);
  };

  const isUrgentTimer = (gameState?.remainingSeconds ?? 100) <= 10 && (gameState?.phase === 'QUESTION_PHASE' || gameState?.phase === 'GUESSING_PHASE');

  return (
    <div className="relative min-h-screen bg-[#07080B] text-[#F5F2EB] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB]">
      {/* 3D Cinematic Three.js Interactive Background */}
      <CinematicBackground
        phase={gameState?.phase || 'LOBBY'}
        isUrgent={isUrgentTimer}
      />

      {/* Header Navigation */}
      <NavigationHeader
        connected={connected}
        roomCode={gameState?.roomCode || null}
        currentRound={gameState?.currentRound}
        totalRounds={gameState?.totalRounds}
        nickname={nickname}
        avatar={avatar}
        onOpenHowToPlay={() => setHowToPlayOpen(true)}
        onOpenRules={() => setRulesOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenServerConfig={() => setServerConfigOpen(true)}
      />

      {/* Error alert toast with Connect button */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0D1017] border border-rose-500/60 text-rose-300 text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span>{error}</span>
          <button
            onClick={() => setServerConfigOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-[#F5F2EB] font-bold transition-all underline"
          >
            Connect Server
          </button>
          <button onClick={clearError} className="text-[#A7A29A] hover:text-[#FAF8F5] font-bold ml-1">✕</button>
        </div>
      )}

      {/* Main Content Router based on game state */}
      <main className="flex-1 flex flex-col">
        {!gameState ? (
          /* Landing Page */
          <HeroSection
            onPlayNow={handlePlayNow}
            onCreateRoom={() => setCreateRoomOpen(true)}
            onJoinRoomModal={() => setJoinRoomOpen(true)}
            onHowToPlay={() => setHowToPlayOpen(true)}
            onRules={() => setRulesOpen(true)}
            onQuickJoin={(code) => handleJoinRoom(code)}
          />
        ) : gameState.phase === 'LOBBY' ? (
          /* Pre-Game Lobby */
          <LobbyView
            gameState={gameState}
            myPlayerId={gameState.myPlayerId}
            onReadyToggle={setReady}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
            error={error}
          />
        ) : gameState.phase === 'QUESTION_PHASE' || gameState.phase === 'GUESSING_PHASE' ? (
          /* Active Gameplay Arena */
          <GameArenaView
            gameState={gameState}
            myPlayerId={gameState.myPlayerId}
            onAskQuestion={askQuestion}
            onSubmitAnswer={submitAnswer}
            onSubmitGuess={submitGuess}
            isSubmittingGuess={isSubmitting}
          />
        ) : (
          /* Results Phase */
          gameState.results && (
            <ResultsView
              results={gameState.results}
              myPlayerId={gameState.myPlayerId}
              isHost={gameState.hostId === gameState.myPlayerId}
              onNextRound={nextRound}
              onRematch={nextRound}
              onReturnToLobby={returnToLobby}
            />
          )
        )}
      </main>

      {/* Modals & Overlays */}
      <HowToPlayModal
        isOpen={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />

      <RulesAndScoringModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />

      <CreateRoomModal
        isOpen={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        onCreate={handleCreateRoom}
        isLoading={loadingAction}
      />

      <JoinRoomModal
        isOpen={joinRoomOpen}
        onClose={() => setJoinRoomOpen(false)}
        onJoin={handleJoinRoom}
        isLoading={loadingAction}
        errorMessage={error}
      />

      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        nickname={nickname}
        avatar={avatar}
        onSaveProfile={handleSaveProfile}
      />

      <ServerConfigModal
        isOpen={serverConfigOpen}
        onClose={() => setServerConfigOpen(false)}
        onReconnected={reconnect}
      />

      {queueStatus.status === 'SEARCHING' && (
        <MatchmakingOverlay
          queueLength={queueStatus.queueLength}
          onCancel={cancelMatchmaking}
        />
      )}
    </div>
  );
}

export default App;
