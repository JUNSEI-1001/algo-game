import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/constants/oauth';
import { GameState, PlayerCount } from '../algo/types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OnlineGameState {
  roomId: string | null;
  passphrase: string | null;
  yourPlayerId: string | null;
  players: { id: string; name: string }[];
  maxPlayers: PlayerCount | null;
  gameState: GameState | null;
  connectionStatus: ConnectionStatus;
  queuePosition: number | null;
  errorMessage: string | null;
}

interface OnlineGameContextValue {
  state: OnlineGameState;
  connect: () => void;
  disconnect: () => void;
  joinRandomQueue: (playerCount: PlayerCount, playerName: string) => void;
  leaveRandomQueue: (playerCount: PlayerCount) => void;
  createRoom: (playerCount: PlayerCount, playerName: string) => void;
  joinRoom: (passphrase: string, playerName: string) => void;
  drawCard: () => void;
  attack: (target: { playerId: string; cardIndex: number }, guess: number) => void;
  pass: () => void;
}

const initialState: OnlineGameState = {
  roomId: null,
  passphrase: null,
  yourPlayerId: null,
  players: [],
  maxPlayers: null,
  gameState: null,
  connectionStatus: 'disconnected',
  queuePosition: null,
  errorMessage: null,
};

const OnlineGameContext = createContext<OnlineGameContextValue | null>(null);

export function OnlineGameProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<OnlineGameState>(initialState);

  const updateState = useCallback((updates: Partial<OnlineGameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Socket.IO接続の初期化
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const apiUrl = getApiBaseUrl();
    updateState({ connectionStatus: 'connecting' });

    const socket = io(apiUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      updateState({ connectionStatus: 'connected', errorMessage: null });
    });

    socket.on('disconnect', () => {
      updateState({ connectionStatus: 'disconnected' });
    });

    socket.on('connect_error', (err) => {
      updateState({ connectionStatus: 'error', errorMessage: err.message });
    });

    socket.on('queue_joined', (data: { position: number }) => {
      updateState({ queuePosition: data.position });
    });

    socket.on('queue_left', () => {
      updateState({ queuePosition: null });
    });

    socket.on('match_found', (data: { roomId: string; players: { id: string; name: string }[] }) => {
      updateState({
        roomId: data.roomId,
        players: data.players,
        queuePosition: null,
      });
    });

    socket.on('room_created', (data: {
      roomId: string;
      passphrase: string;
      players: { id: string; name: string }[];
      maxPlayers: PlayerCount;
    }) => {
      updateState({
        roomId: data.roomId,
        passphrase: data.passphrase,
        players: data.players,
        maxPlayers: data.maxPlayers,
      });
    });

    socket.on('room_updated', (data: {
      roomId: string;
      passphrase: string;
      players: { id: string; name: string }[];
      maxPlayers: PlayerCount;
    }) => {
      updateState({
        roomId: data.roomId,
        passphrase: data.passphrase,
        players: data.players,
        maxPlayers: data.maxPlayers,
      });
    });

    socket.on('room_error', (data: { message: string }) => {
      updateState({ errorMessage: data.message });
    });

    socket.on('game_started', (data: { gameState: GameState; yourPlayerId: string }) => {
      updateState({
        gameState: data.gameState,
        yourPlayerId: data.yourPlayerId,
      });
    });

    socket.on('game_state_updated', (gameState: GameState) => {
      updateState({ gameState });
    });

    socket.on('player_disconnected', (data: { message: string }) => {
      updateState({ errorMessage: data.message });
    });
  }, [updateState]);

  // 切断
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState(initialState);
  }, []);

  const joinRandomQueue = useCallback((playerCount: PlayerCount, playerName: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('join_random_queue', { playerCount, playerName });
  }, []);

  const leaveRandomQueue = useCallback((playerCount: PlayerCount) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('leave_random_queue', { playerCount });
  }, []);

  const createRoom = useCallback((playerCount: PlayerCount, playerName: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('create_room', { playerCount, playerName });
  }, []);

  const joinRoom = useCallback((passphrase: string, playerName: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('join_room', { passphrase, playerName });
  }, []);

  const drawCard = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game_draw_card');
  }, []);

  const attack = useCallback((target: { playerId: string; cardIndex: number }, guess: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game_attack', { target, guess });
  }, []);

  const pass = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game_pass');
  }, []);

  // アンマウント時に切断
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <OnlineGameContext.Provider value={{
      state,
      connect,
      disconnect,
      joinRandomQueue,
      leaveRandomQueue,
      createRoom,
      joinRoom,
      drawCard,
      attack,
      pass,
    }}>
      {children}
    </OnlineGameContext.Provider>
  );
}

export function useOnlineGame(): OnlineGameContextValue {
  const ctx = useContext(OnlineGameContext);
  if (!ctx) {
    throw new Error('useOnlineGame must be used within OnlineGameProvider');
  }
  return ctx;
}
