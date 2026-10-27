// src/hooks/useSocket.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameMessage, Answer, Player } from '../types/game';
import { getServerUrl } from '../config/serverUrl';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [queueStatus, setQueueStatus] = useState<{ status: 'IDLE' | 'SEARCHING' | 'MATCHED'; queueLength?: number; matchedRoomCode?: string }>({ status: 'IDLE' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [connectNonce, setConnectNonce] = useState<number>(0);

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

      // Initialize session
      socket.emit('session:init', session, () => {
        // Attempt to resume previous room if present
        socket.emit('session:resume', {
          sessionId: session.sessionId,
          playerId: session.playerId,
          nickname: session.nickname,
          avatar: session.avatar
        }, (res: { success: boolean; state?: GameState }) => {
          if (res?.success && res.state) {
            setGameState(res.state);
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
      if (status.status === 'MATCHED' && status.matchedRoomCode) {
        // Automatic joining will trigger state restoration
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [connectNonce]);

  const reconnect = useCallback(() => {
    setConnectNonce(n => n + 1);
  }, []);

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

