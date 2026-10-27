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
    returnToLobby
  } = useSocket();

  // Local user profile
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('hn_nickname') || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('hn_avatar') || 'avatar-1';
  });

  // Modal states
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Check URL parameters for invitation links (?room=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && !gameState) {
      joinRoom(roomFromUrl.toUpperCase(), nickname, avatar);
    }
  }, [joinRoom, nickname, avatar, gameState]);

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
    <div className="relative min-h-screen bg-[#06080F] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
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
      />

      {/* Error alert toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-mono shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-200">
          <span>{error}</span>
          <button onClick={clearError} className="text-white hover:text-rose-400 font-bold">✕</button>
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

