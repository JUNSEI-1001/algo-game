import { useEffect, useRef, useState, useCallback } from 'react';
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

export function useOnlineGame() {
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
    
    // キュー関連
    socket.on('queue_joined', (data: { position: number }) => {
      updateState({ queuePosition: data.position });
    });
    
    socket.on('queue_left', () => {
      updateState({ queuePosition: null });
    });
    
    // マッチング成立
    socket.on('match_found', (data: { roomId: string; players: { id: string; name: string }[] }) => {
      updateState({
        roomId: data.roomId,
        players: data.players,
        queuePosition: null,
      });
    });
    
    // ルーム作成
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
    
    // ルーム更新
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
    
    // ルームエラー
    socket.on('room_error', (data: { message: string }) => {
      updateState({ errorMessage: data.message });
    });
    
    // ゲーム開始
    socket.on('game_started', (data: { gameState: GameState; yourPlayerId: string }) => {
      updateState({
        gameState: data.gameState,
        yourPlayerId: data.yourPlayerId,
      });
    });
    
    // ゲーム状態更新
    socket.on('game_state_updated', (gameState: GameState) => {
      updateState({ gameState });
    });
    
    // アタック結果
    socket.on('attack_result', (data: {
      attackerId: string;
      target: { playerId: string; cardIndex: number };
      guess: number;
      success: boolean;
      card: any;
    }) => {
      // ゲーム状態の更新はgame_state_updatedで行われる
    });
    
    // プレイヤー切断
    socket.on('player_disconnected', (data: { message: string }) => {
      updateState({ errorMessage: data.message });
    });
    
    return socket;
  }, [updateState]);
  
  // 切断
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState(initialState);
  }, []);
  
  // ランダムマッチキューに参加
  const joinRandomQueue = useCallback((playerCount: PlayerCount, playerName: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('join_random_queue', { playerCount, playerName });
  }, []);
  
  // ランダムマッチキューから離脱
  const leaveRandomQueue = useCallback((playerCount: PlayerCount) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('leave_random_queue', { playerCount });
  }, []);
  
  // ルーム作成
  const createRoom = useCallback((playerCount: PlayerCount, playerName: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('create_room', { playerCount, playerName });
  }, []);
  
  // ルームに参加
  const joinRoom = useCallback((passphrase: string, playerName: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('join_room', { passphrase, playerName });
  }, []);
  
  // カードを引く
  const drawCard = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game_draw_card');
  }, []);
  
  // アタック
  const attack = useCallback((target: { playerId: string; cardIndex: number }, guess: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game_attack', { target, guess });
  }, []);
  
  // パス
  const pass = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game_pass');
  }, []);
  
  return {
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
  };
}
