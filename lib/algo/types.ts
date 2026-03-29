// アルゴゲームの型定義

export type CardColor = 'white' | 'black';

export interface Card {
  id: string;
  number: number; // 0〜11
  color: CardColor;
  isRevealed: boolean;
}

export type PlayerStatus = 'active' | 'eliminated';

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  status: PlayerStatus;
  isAI?: boolean;
}

export type GameMode = 'ai' | 'random' | 'room';
export type PlayerCount = 2 | 4;
export type GamePhase = 'waiting' | 'dealing' | 'playing' | 'finished';

export interface AttackTarget {
  playerId: string;
  cardIndex: number;
}

export interface AttackResult {
  success: boolean;
  card?: Card;
}

export interface GameState {
  id: string;
  mode: GameMode;
  playerCount: PlayerCount;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  drawnCard: Card | null;
  lastAttack: {
    attackerId: string;
    target: AttackTarget;
    guess: number;
    result: AttackResult;
  } | null;
  winner: string | null;
  turnCount: number;
}

export interface RoomInfo {
  roomId: string;
  passphrase: string;
  playerCount: PlayerCount;
  players: { id: string; name: string }[];
  maxPlayers: PlayerCount;
}
