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
import { ProfileHubModal } from './components/profile/ProfileHubModal';
import { PublicProfileModal } from './components/profile/PublicProfileModal';
import { MatchmakingOverlay } from './components/matchmaking/MatchmakingOverlay';
import { ServerConfigModal } from './components/common/ServerConfigModal';
import { LobbyView } from './components/lobby/LobbyView';
import { GameArenaView } from './components/game/GameArenaView';
import { ResultsView } from './components/results/ResultsView';
import { Send, CheckCircle, X } from 'lucide-react';

export function App() {
  const {
    connected,
    gameState,
    queueStatus,
    error,
    isSubmitting,
    profile,
    friends,
    friendRequests,
    incomingRoomInvite,
    dismissRoomInvite,
    fetchProfile,
    updateProfile,
    getPublicProfile,
    searchPlayers,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    inviteFriendToRoom,
    reportPlayer,
    deleteAccount,
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

  // Sync profile data when available
  useEffect(() => {
    if (profile?.username) {
      setNickname(profile.username);
    }
    if (profile?.customAvatar || profile?.avatar) {
      setAvatar(profile.customAvatar || profile.avatar);
    }
  }, [profile]);

  // Modal states
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [serverConfigOpen, setServerConfigOpen] = useState(false);
  const [publicProfileTargetId, setPublicProfileTargetId] = useState<string | null>(null);
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
    <div className="relative min-h-screen bg-[#070B0D] text-[#F1EBDD] flex flex-col font-sans selection:bg-[#A8C66C]/30 selection:text-[#F1EBDD]">
      {/* 3D Cinematic Interactive Background */}
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
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#101719] border border-[#E05D52]/60 text-[#E05D52] text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span>{error}</span>
          <button
            onClick={() => setServerConfigOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-[#E05D52]/40 text-[#F1EBDD] font-bold transition-all underline"
          >
            Connect Server
          </button>
          <button onClick={clearError} className="text-[#A8ADA7] hover:text-[#F1EBDD] font-bold ml-1">✕</button>
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
            onInspectPlayer={(pid) => setPublicProfileTargetId(pid)}
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
            onInspectPlayer={(pid) => setPublicProfileTargetId(pid)}
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
              onInspectPlayer={(pid) => setPublicProfileTargetId(pid)}
            />
          )
        )}
      </main>

      {/* Floating Incoming Arena Invitation Toast */}
      {incomingRoomInvite && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#101719] border border-[#293130] text-[#F1EBDD] shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-xl bg-[#151D1D] border border-[#293130] flex items-center justify-center text-[#A8C66C]">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#A8C66C] font-bold">Room Invitation</span>
            <div className="text-xs font-mono font-bold text-[#F1EBDD]">
              {incomingRoomInvite.inviter.username} invited you to Room #{incomingRoomInvite.roomCode}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => {
                joinRoom(incomingRoomInvite.roomCode, nickname, avatar);
                dismissRoomInvite();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#A8C66C] hover:bg-[#B8D47C] text-[#070B0D] font-bold text-xs font-mono shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={dismissRoomInvite}
              className="p-1.5 rounded-xl bg-[#151D1D] hover:bg-[#1E2728] text-[#A8ADA7]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      <ProfileHubModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        friends={friends}
        friendRequests={friendRequests}
        currentRoomCode={gameState?.roomCode}
        onUpdateProfile={updateProfile}
        onSearchPlayers={searchPlayers}
        onSendFriendRequest={sendFriendRequest}
        onRespondFriendRequest={respondFriendRequest}
        onRemoveFriend={removeFriend}
        onInviteToRoom={(fid) => inviteFriendToRoom(fid, gameState?.roomCode)}
        onInspectPlayer={(pid) => setPublicProfileTargetId(pid)}
        onDeleteAccount={deleteAccount}
      />

      <PublicProfileModal
        isOpen={Boolean(publicProfileTargetId)}
        onClose={() => setPublicProfileTargetId(null)}
        targetPlayerId={publicProfileTargetId}
        onGetPublicProfile={getPublicProfile}
        onSendFriendRequest={sendFriendRequest}
        onInviteToRoom={(fid) => inviteFriendToRoom(fid, gameState?.roomCode)}
        onReportPlayer={reportPlayer}
        currentRoomCode={gameState?.roomCode}
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
