// src/hooks/useSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  GameState,
  GameMessage,
  Answer,
  Player,
  UserProfile,
  PublicUserProfile,
  FriendSummary,
  FriendRequest
} from '../types/game';
import { getServerUrl } from '../config/serverUrl';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [queueStatus, setQueueStatus] = useState<{ status: 'IDLE' | 'SEARCHING' | 'MATCHED'; queueLength?: number; matchedRoomCode?: string }>({ status: 'IDLE' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [connectNonce, setConnectNonce] = useState<number>(0);

  // Profile & Progression State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: []
  });
  const [incomingRoomInvite, setIncomingRoomInvite] = useState<{ roomCode: string; inviter: UserProfile } | null>(null);

  // Session persistence in localStorage (NEVER generates a new player on reload!)
  const getSession = useCallback(() => {
    let sid = localStorage.getItem('hn_session_id');
    let pid = localStorage.getItem('hn_player_id');
    let nick = localStorage.getItem('hn_nickname');
    let avatar = localStorage.getItem('hn_avatar');

    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('hn_session_id', sid);
    }
    if (!pid) {
      pid = crypto.randomUUID();
      localStorage.setItem('hn_player_id', pid);
    }
    if (!nick) {
      nick = `Player_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('hn_nickname', nick);
    }
    if (!avatar) {
      avatar = 'avatar-1';
      localStorage.setItem('hn_avatar', avatar);
    }
    return { sessionId: sid, playerId: pid, nickname: nick, avatar };
  }, []);

  const refreshFriends = useCallback(async (playerId: string) => {
    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/api/friends/${playerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFriends(data.friends || []);
          setFriendRequests(data.requests || { incoming: [], outgoing: [] });
        }
      }
    } catch {
      // Graceful network fail
    }
  }, []);

  useEffect(() => {
    const serverUrl = getServerUrl();
    const session = getSession();
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Initialize session & retrieve profile
      socket.emit('session:init', session, (res: { success: boolean; profile?: UserProfile }) => {
        if (res?.profile) {
          setProfile(res.profile);
        }
        refreshFriends(session.playerId);

        // Attempt to resume previous room if present
        socket.emit('session:resume', {
          sessionId: session.sessionId,
          playerId: session.playerId,
          nickname: session.nickname,
          avatar: session.avatar
        }, (resumeRes: { success: boolean; state?: GameState }) => {
          if (resumeRes?.success && resumeRes.state) {
            setGameState(resumeRes.state);
          }
        });
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setError('Connection to server lost. Retrying...');
    });

    // Game events
    socket.on('game:state', (state: GameState) => {
      setGameState(state);
      setError(null);
    });

    socket.on('game:state-restored', (state: GameState) => {
      setGameState(state);
    });

    socket.on('game:question', (msg: GameMessage) => {
      setGameState(prev => {
        if (!prev) return prev;
        const exists = prev.messages.some(m => m.id === msg.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg]
        };
      });
    });

    socket.on('game:answer', (ans: Answer) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => {
            if (m.id === ans.questionId) {
              const currentAnswers = m.answers || [];
              const exists = currentAnswers.some(a => a.id === ans.id);
              if (exists) return m;
              return { ...m, answers: [...currentAnswers, ans] };
            }
            return m;
          })
        };
      });
    });

    socket.on('game:message', (msg: GameMessage) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg]
        };
      });
    });

    socket.on('game:player-guessed', ({ playerId }: { playerId: string }) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p => p.id === playerId ? { ...p, hasGuessed: true } : p)
        };
      });
    });

    socket.on('room:player-joined', ({ player }: { player: Player }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const exists = prev.players.some(p => p.id === player.id);
        if (exists) return prev;
        return {
          ...prev,
          players: [...prev.players, player]
        };
      });
    });

    socket.on('room:player-left', ({ playerId, newHostId }: { playerId: string; newHostId?: string }) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          hostId: newHostId || prev.hostId,
          players: prev.players.map(p => {
            if (p.id === playerId) return { ...p, connected: false };
            if (newHostId && p.id === newHostId) return { ...p, isHost: true };
            return p;
          }).filter(p => prev.phase === 'LOBBY' ? p.id !== playerId : true)
        };
      });
    });

    socket.on('matchmaking:status', (status: { status: 'IDLE' | 'SEARCHING' | 'MATCHED'; queueLength?: number; matchedRoomCode?: string }) => {
      setQueueStatus(status);
    });

    // Real-Time Social Notifications
    socket.on('friend:incoming-request', () => {
      refreshFriends(session.playerId);
    });

    socket.on('friend:accepted', () => {
      refreshFriends(session.playerId);
    });

    socket.on('friend:room-invited', (invite: { roomCode: string; inviter: UserProfile }) => {
      setIncomingRoomInvite(invite);
    });

    return () => {
      socket.disconnect();
    };
  }, [connectNonce, getSession, refreshFriends]);

  const reconnect = useCallback(() => {
    setConnectNonce(n => n + 1);
  }, []);

  // Profile and Social API hooks
  const fetchProfile = useCallback((targetPlayerId?: string) => {
    return new Promise<UserProfile | null>((resolve) => {
      if (!socketRef.current) return resolve(null);
      const session = getSession();
      const pid = targetPlayerId || session.playerId;
      socketRef.current.emit('profile:get', { playerId: pid }, (res: { success: boolean; profile?: UserProfile }) => {
        if (res?.success && res.profile) {
          if (!targetPlayerId || targetPlayerId === session.playerId) {
            setProfile(res.profile);
          }
          resolve(res.profile);
        } else {
          resolve(null);
        }
      });
    });
  }, [getSession]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    return new Promise<{ success: boolean; profile?: UserProfile; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      const session = getSession();
      socketRef.current.emit('profile:update', {
        playerId: session.playerId,
        updates
      }, (res: { success: boolean; profile?: UserProfile; error?: string }) => {
        if (res.success && res.profile) {
          setProfile(res.profile);
          if (res.profile.username) localStorage.setItem('hn_nickname', res.profile.username);
          if (res.profile.avatar) localStorage.setItem('hn_avatar', res.profile.avatar);
        }
        resolve(res);
      });
    });
  }, [getSession]);

  const getPublicProfile = useCallback((targetPlayerId: string) => {
    return new Promise<{ success: boolean; profile?: PublicUserProfile; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      const session = getSession();
      socketRef.current.emit('profile:public', {
        targetPlayerId,
        requesterPlayerId: session.playerId
      }, (res: { success: boolean; profile?: PublicUserProfile; error?: string }) => {
        resolve(res);
      });
    });
  }, [getSession]);

  const searchPlayers = useCallback((query: string) => {
    return new Promise<FriendSummary[]>((resolve) => {
      if (!socketRef.current) return resolve([]);
      socketRef.current.emit('profile:search', { query }, (res: { success: boolean; results?: FriendSummary[] }) => {
        resolve(res?.results || []);
      });
    });
  }, []);

  const sendFriendRequest = useCallback((targetPlayerId: string) => {
    return new Promise<{ success: boolean; error?: string; status?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      socketRef.current.emit('friend:request', { targetPlayerId }, (res: { success: boolean; error?: string; status?: string }) => {
        const session = getSession();
        refreshFriends(session.playerId);
        resolve(res);
      });
    });
  }, [getSession, refreshFriends]);

  const respondFriendRequest = useCallback((senderPlayerId: string, accept: boolean) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      socketRef.current.emit('friend:respond', { senderPlayerId, accept }, (res: { success: boolean; error?: string }) => {
        const session = getSession();
        refreshFriends(session.playerId);
        resolve(res);
      });
    });
  }, [getSession, refreshFriends]);

  const removeFriend = useCallback((friendPlayerId: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      socketRef.current.emit('friend:remove', { friendPlayerId }, (res: { success: boolean; error?: string }) => {
        const session = getSession();
        refreshFriends(session.playerId);
        resolve(res);
      });
    });
  }, [getSession, refreshFriends]);

  const blockPlayer = useCallback((targetPlayerId: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      socketRef.current.emit('friend:block', { targetPlayerId }, (res: { success: boolean; error?: string }) => {
        const session = getSession();
        refreshFriends(session.playerId);
        resolve(res);
      });
    });
  }, [getSession, refreshFriends]);

  const inviteFriendToRoom = useCallback((friendPlayerId: string, roomCode?: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Disconnected' });
      socketRef.current.emit('friend:invite-room', { friendPlayerId, roomCode }, (res: { success: boolean; error?: string }) => {
        resolve(res);
      });
    });
  }, []);

  const reportPlayer = useCallback(async (reportedId: string, reason: string, details?: string) => {
    try {
      const serverUrl = getServerUrl();
      const session = getSession();
      const res = await fetch(`${serverUrl}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: session.playerId,
          reportedId,
          reason,
          details
        })
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Network error submitting report' };
    }
  }, [getSession]);

  const deleteAccount = useCallback(async () => {
    try {
      const serverUrl = getServerUrl();
      const session = getSession();
      const res = await fetch(`${serverUrl}/api/account/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: session.playerId })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.clear();
        window.location.reload();
      }
      return data;
    } catch {
      return { success: false, error: 'Network error deleting account' };
    }
  }, [getSession]);

  // Actions
  const createRoom = useCallback((nickname: string, avatar: string, settings = {}) => {
    return new Promise<{ success: boolean; roomCode?: string; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      localStorage.setItem('hn_nickname', nickname);
      localStorage.setItem('hn_avatar', avatar);
      const session = getSession();

      socketRef.current.emit('room:create', {
        nickname,
        avatar,
        settings,
        playerId: session.playerId,
        sessionId: session.sessionId
      }, (res: { success: boolean; roomCode?: string; room?: GameState; error?: string }) => {
        if (res.success && res.room) {
          setGameState(res.room);
          resolve({ success: true, roomCode: res.roomCode });
        } else {
          setError(res.error || 'Failed to create room');
          resolve({ success: false, error: res.error });
        }
      });
    });
  }, [getSession]);

  const joinRoom = useCallback((roomCode: string, nickname: string, avatar: string, password?: string) => {
    return new Promise<{ success: boolean; roomCode?: string; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      localStorage.setItem('hn_nickname', nickname);
      localStorage.setItem('hn_avatar', avatar);
      const session = getSession();

      socketRef.current.emit('room:join', {
        roomCode,
        nickname,
        avatar,
        password,
        playerId: session.playerId,
        sessionId: session.sessionId
      }, (res: { success: boolean; roomCode?: string; room?: GameState; error?: string }) => {
        if (res.success && res.room) {
          setGameState(res.room);
          resolve({ success: true, roomCode: res.roomCode });
        } else {
          setError(res.error || 'Failed to join room');
          resolve({ success: false, error: res.error });
        }
      });
    });
  }, [getSession]);

  const leaveRoom = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!socketRef.current) return resolve();
      socketRef.current.emit('room:leave', () => {
        setGameState(null);
        resolve();
      });
    });
  }, []);

  const setReady = useCallback((isReady: boolean) => {
    if (!socketRef.current) return;
    const session = getSession();

    // Optimistic UI update so the button immediately toggles!
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p =>
          (p.id === session.playerId || p.nickname === session.nickname) ? { ...p, isReady } : p
        )
      };
    });

    socketRef.current.emit('room:ready', {
      isReady,
      roomCode: gameState?.roomCode,
      playerId: session.playerId
    });
  }, [getSession, gameState?.roomCode]);

  const startGame = useCallback(() => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      const session = getSession();
      socketRef.current.emit('room:start', {
        roomCode: gameState?.roomCode,
        playerId: session.playerId
      }, (res: { success: boolean; error?: string }) => {
        if (!res?.success) {
          setError(res?.error || 'Cannot start game');
        }
        resolve(res || { success: false });
      });
    });
  }, [getSession, gameState?.roomCode]);

  const joinMatchmaking = useCallback((nickname: string, avatar: string) => {
    return new Promise<{ success: boolean }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false });
      localStorage.setItem('hn_nickname', nickname);
      localStorage.setItem('hn_avatar', avatar);
      socketRef.current.emit('matchmaking:join', { nickname, avatar }, (res: { success: boolean }) => {
        if (res.success) {
          setQueueStatus({ status: 'SEARCHING' });
        }
        resolve(res);
      });
    });
  }, []);

  const cancelMatchmaking = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!socketRef.current) return resolve();
      socketRef.current.emit('matchmaking:cancel', () => {
        setQueueStatus({ status: 'IDLE' });
        resolve();
      });
    });
  }, []);

  const askQuestion = useCallback((content: string, targetPlayerId?: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      socketRef.current.emit('game:ask-question', { content, targetPlayerId }, (res: { success: boolean; error?: string }) => {
        if (!res.success) setError(res.error || 'Failed to ask question');
        resolve(res);
      });
    });
  }, []);

  const submitAnswer = useCallback((questionId: string, answer: string, targetPlayerId?: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      socketRef.current.emit('game:submit-answer', { questionId, answer, targetPlayerId }, (res: { success: boolean; error?: string }) => {
        resolve(res);
      });
    });
  }, []);

  const submitGuess = useCallback((guess: number) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      setIsSubmitting(true);
      socketRef.current.emit('game:submit-guess', { guess }, (res: { success: boolean; error?: string }) => {
        setIsSubmitting(false);
        if (res.success) {
          setGameState(prev => prev ? { ...prev, mySubmittedGuess: guess } : prev);
        } else {
          setError(res.error || 'Failed to submit guess');
        }
        resolve(res);
      });
    });
  }, []);

  const nextRound = useCallback(() => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      socketRef.current.emit('game:next-round', (res: { success: boolean; error?: string }) => {
        if (!res.success) setError(res.error || 'Cannot start next round');
        resolve(res);
      });
    });
  }, []);

  const returnToLobby = useCallback(() => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socketRef.current) return resolve({ success: false, error: 'Socket disconnected' });
      socketRef.current.emit('game:return-lobby', (res: { success: boolean; error?: string }) => {
        resolve(res);
      });
    });
  }, []);

  return {
    connected,
    gameState,
    queueStatus,
    error,
    isSubmitting,
    profile,
    friends,
    friendRequests,
    incomingRoomInvite,
    dismissRoomInvite: () => setIncomingRoomInvite(null),
    fetchProfile,
    updateProfile,
    getPublicProfile,
    searchPlayers,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    blockPlayer,
    inviteFriendToRoom,
    reportPlayer,
    deleteAccount,
    clearError: () => setError(null),
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
  };
}

