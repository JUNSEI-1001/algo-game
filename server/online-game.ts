import { Server as SocketIOServer, Socket } from 'socket.io';
import { createDeck, dealCards, processAttack, isPlayerEliminated, checkGameOver, getNextPlayerIndex, addDrawnCardToHand, sortCards, generatePassphrase } from '../lib/algo/game-logic';
import { GameState, Player, AttackTarget, PlayerCount, Card } from '../lib/algo/types';

// ルーム管理
interface Room {
  id: string;
  passphrase: string;
  playerCount: PlayerCount;
  players: RoomPlayer[];
  gameState: GameState | null;
  isStarted: boolean;
  createdAt: number;
}

interface RoomPlayer {
  socketId: string;
  playerId: string;
  name: string;
}

// マッチングキュー
interface QueueEntry {
  socketId: string;
  playerId: string;
  name: string;
  playerCount: PlayerCount;
  joinedAt: number;
}

const rooms = new Map<string, Room>();
const matchQueues = new Map<PlayerCount, QueueEntry[]>();
const socketToRoom = new Map<string, string>(); // socketId -> roomId

// マッチングキューを初期化
matchQueues.set(2, []);
matchQueues.set(4, []);

function createGameState(room: Room): GameState {
  const deck = createDeck();
  const { hands, remainingDeck } = dealCards(deck, room.playerCount);
  
  const players: Player[] = room.players.map((rp, index) => ({
    id: rp.playerId,
    name: rp.name,
    cards: hands[index] || [],
    status: 'active' as const,
  }));
  
  return {
    id: room.id,
    mode: room.passphrase ? 'room' : 'random',
    playerCount: room.playerCount,
    phase: 'playing',
    players,
    currentPlayerIndex: 0,
    deck: remainingDeck,
    drawnCard: null,
    lastAttack: null,
    winner: null,
    turnCount: 0,
  };
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlayerId(socketId: string): string {
  return `player-${socketId.substring(0, 8)}`;
}

export function setupOnlineGame(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Online] Player connected: ${socket.id}`);
    
    // ランダムマッチキューに参加
    socket.on('join_random_queue', (data: { playerCount: PlayerCount; playerName: string }) => {
      const { playerCount, playerName } = data;
      const queue = matchQueues.get(playerCount) || [];
      
      // 既にキューにいる場合は削除
      const existingIndex = queue.findIndex(e => e.socketId === socket.id);
      if (existingIndex !== -1) {
        queue.splice(existingIndex, 1);
      }
      
      const entry: QueueEntry = {
        socketId: socket.id,
        playerId: generatePlayerId(socket.id),
        name: playerName || `プレイヤー${Math.floor(Math.random() * 1000)}`,
        playerCount,
        joinedAt: Date.now(),
      };
      
      queue.push(entry);
      matchQueues.set(playerCount, queue);
      
      socket.emit('queue_joined', { position: queue.length });
      
      // マッチング試行
      tryMatch(io, playerCount);
    });
    
    // ランダムマッチキューから離脱
    socket.on('leave_random_queue', (data: { playerCount: PlayerCount }) => {
      const { playerCount } = data;
      const queue = matchQueues.get(playerCount) || [];
      const index = queue.findIndex(e => e.socketId === socket.id);
      if (index !== -1) {
        queue.splice(index, 1);
        matchQueues.set(playerCount, queue);
      }
      socket.emit('queue_left');
    });
    
    // 合言葉ルーム作成
    socket.on('create_room', (data: { playerCount: PlayerCount; playerName: string }) => {
      const { playerCount, playerName } = data;
      const roomId = generateRoomId();
      const passphrase = generatePassphrase();
      
      const room: Room = {
        id: roomId,
        passphrase,
        playerCount,
        players: [{
          socketId: socket.id,
          playerId: generatePlayerId(socket.id),
          name: playerName || 'ホスト',
        }],
        gameState: null,
        isStarted: false,
        createdAt: Date.now(),
      };
      
      rooms.set(roomId, room);
      socketToRoom.set(socket.id, roomId);
      socket.join(roomId);
      
      socket.emit('room_created', {
        roomId,
        passphrase,
        players: room.players.map(p => ({ id: p.playerId, name: p.name })),
        maxPlayers: playerCount,
      });
    });
    
    // 合言葉でルームに参加
    socket.on('join_room', (data: { passphrase: string; playerName: string }) => {
      const { passphrase, playerName } = data;
      
      // 合言葉でルームを検索
      let targetRoom: Room | null = null;
      for (const room of rooms.values()) {
        if (room.passphrase === passphrase && !room.isStarted) {
          targetRoom = room;
          break;
        }
      }
      
      if (!targetRoom) {
        socket.emit('room_error', { message: '合言葉が正しくないか、ルームが見つかりません' });
        return;
      }
      
      if (targetRoom.players.length >= targetRoom.playerCount) {
        socket.emit('room_error', { message: 'ルームが満員です' });
        return;
      }
      
      // 既に参加していないか確認
      if (targetRoom.players.some(p => p.socketId === socket.id)) {
        socket.emit('room_error', { message: '既にこのルームに参加しています' });
        return;
      }
      
      targetRoom.players.push({
        socketId: socket.id,
        playerId: generatePlayerId(socket.id),
        name: playerName || `プレイヤー${targetRoom.players.length + 1}`,
      });
      
      socketToRoom.set(socket.id, targetRoom.id);
      socket.join(targetRoom.id);
      
      const roomInfo = {
        roomId: targetRoom.id,
        passphrase: targetRoom.passphrase,
        players: targetRoom.players.map(p => ({ id: p.playerId, name: p.name })),
        maxPlayers: targetRoom.playerCount,
      };
      
      // 全員に更新を通知
      io.to(targetRoom.id).emit('room_updated', roomInfo);
      
      // 全員揃ったらゲーム開始
      if (targetRoom.players.length === targetRoom.playerCount) {
        startGame(io, targetRoom);
      }
    });
    
    // ゲームアクション：カードを引く
    socket.on('game_draw_card', () => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (!room?.gameState) return;
      
      const gs = room.gameState;
      const currentPlayer = gs.players[gs.currentPlayerIndex];
      
      // 自分のターンか確認
      const roomPlayer = room.players.find(p => p.socketId === socket.id);
      if (!roomPlayer || roomPlayer.playerId !== currentPlayer.id) return;
      
      if (gs.drawnCard || gs.deck.length === 0) return;
      
      const [drawnCard, ...remainingDeck] = gs.deck;
      gs.deck = remainingDeck;
      gs.drawnCard = drawnCard;
      
      io.to(roomId).emit('game_state_updated', sanitizeGameState(gs, room));
    });
    
    // ゲームアクション：アタック
    socket.on('game_attack', (data: { target: AttackTarget; guess: number }) => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (!room?.gameState) return;
      
      const gs = room.gameState;
      const currentPlayer = gs.players[gs.currentPlayerIndex];
      
      const roomPlayer = room.players.find(p => p.socketId === socket.id);
      if (!roomPlayer || roomPlayer.playerId !== currentPlayer.id) return;
      
      const result = processAttack(gs, currentPlayer.id, data.target, data.guess);
      
      if (result.success) {
        // カードを表にする
        const targetPlayer = gs.players.find(p => p.id === data.target.playerId);
        if (targetPlayer) {
          targetPlayer.cards[data.target.cardIndex].isRevealed = true;
          if (isPlayerEliminated(targetPlayer)) {
            targetPlayer.status = 'eliminated';
          }
        }
      }
      
      gs.lastAttack = {
        attackerId: currentPlayer.id,
        target: data.target,
        guess: data.guess,
        result,
      };
      
      const winner = checkGameOver(gs.players);
      if (winner) {
        gs.winner = winner;
        gs.phase = 'finished';
      }
      
      io.to(roomId).emit('game_state_updated', sanitizeGameState(gs, room));
      io.to(roomId).emit('attack_result', {
        attackerId: currentPlayer.id,
        target: data.target,
        guess: data.guess,
        success: result.success,
        card: result.success ? result.card : null,
      });
    });
    
    // ゲームアクション：パス
    socket.on('game_pass', () => {
      const roomId = socketToRoom.get(socket.id);
      if (!roomId) return;
      
      const room = rooms.get(roomId);
      if (!room?.gameState) return;
      
      const gs = room.gameState;
      const currentPlayer = gs.players[gs.currentPlayerIndex];
      
      const roomPlayer = room.players.find(p => p.socketId === socket.id);
      if (!roomPlayer || roomPlayer.playerId !== currentPlayer.id) return;
      
      // 引いたカードを手札に追加
      if (gs.drawnCard) {
        const playerIndex = gs.currentPlayerIndex;
        gs.players[playerIndex].cards = addDrawnCardToHand(
          gs.players[playerIndex].cards,
          gs.drawnCard
        );
        gs.drawnCard = null;
      }
      
      gs.currentPlayerIndex = getNextPlayerIndex(gs.players, gs.currentPlayerIndex);
      gs.lastAttack = null;
      gs.turnCount++;
      
      io.to(roomId).emit('game_state_updated', sanitizeGameState(gs, room));
    });
    
    // 切断処理
    socket.on('disconnect', () => {
      console.log(`[Online] Player disconnected: ${socket.id}`);
      
      // キューから削除
      for (const [count, queue] of matchQueues.entries()) {
        const index = queue.findIndex(e => e.socketId === socket.id);
        if (index !== -1) {
          queue.splice(index, 1);
          matchQueues.set(count, queue);
        }
      }
      
      // ルームから削除
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          if (room.isStarted && room.gameState) {
            // ゲーム中の切断：相手に通知
            io.to(roomId).emit('player_disconnected', {
              message: '相手が切断しました',
            });
          }
          // ルームのプレイヤーを削除
          room.players = room.players.filter(p => p.socketId !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          }
        }
        socketToRoom.delete(socket.id);
      }
    });
  });
}

function tryMatch(io: SocketIOServer, playerCount: PlayerCount) {
  const queue = matchQueues.get(playerCount) || [];
  
  if (queue.length < playerCount) return;
  
  // マッチング成立
  const matched = queue.splice(0, playerCount);
  matchQueues.set(playerCount, queue);
  
  const roomId = generateRoomId();
  const room: Room = {
    id: roomId,
    passphrase: '',
    playerCount,
    players: matched.map(e => ({
      socketId: e.socketId,
      playerId: e.playerId,
      name: e.name,
    })),
    gameState: null,
    isStarted: false,
    createdAt: Date.now(),
  };
  
  rooms.set(roomId, room);
  
  // 全プレイヤーをルームに追加
  for (const entry of matched) {
    socketToRoom.set(entry.socketId, roomId);
    const socket = io.sockets.sockets.get(entry.socketId);
    if (socket) {
      socket.join(roomId);
    }
  }
  
  io.to(roomId).emit('match_found', {
    roomId,
    players: room.players.map(p => ({ id: p.playerId, name: p.name })),
  });
  
  // 少し待ってからゲーム開始
  setTimeout(() => {
    startGame(io, room);
  }, 2000);
}

function startGame(io: SocketIOServer, room: Room) {
  room.isStarted = true;
  room.gameState = createGameState(room);
  
  // 各プレイヤーに自分のカードのみ見えるゲーム状態を送信
  for (const roomPlayer of room.players) {
    const socket = io.sockets.sockets.get(roomPlayer.socketId);
    if (socket) {
      socket.emit('game_started', {
        gameState: sanitizeGameStateForPlayer(room.gameState, roomPlayer.playerId),
        yourPlayerId: roomPlayer.playerId,
      });
    }
  }
}

// ゲーム状態をサニタイズ（各プレイヤーに送る際に相手のカードを隠す）
function sanitizeGameState(gs: GameState, room: Room): GameState {
  return gs; // サーバーサイドでは全情報を保持
}

function sanitizeGameStateForPlayer(gs: GameState, playerId: string): GameState {
  return {
    ...gs,
    players: gs.players.map(player => ({
      ...player,
      cards: player.cards.map(card => {
        // 自分のカードは見える、相手の未公開カードは隠す
        if (player.id === playerId || card.isRevealed) {
          return card;
        }
        return {
          ...card,
          number: -1, // 隠す
        };
      }),
    })),
  };
}

// 定期的に古いルームをクリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > 3600000) { // 1時間以上経過
      rooms.delete(roomId);
    }
  }
}, 300000); // 5分ごと
