import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { GameState, Player, AttackTarget, PlayerCount, GameMode, Card } from './types';
import {
  createDeck,
  dealCards,
  processAttack,
  isPlayerEliminated,
  checkGameOver,
  getNextPlayerIndex,
  addDrawnCardToHand,
  sortCards,
} from './game-logic';

type GameAction =
  | { type: 'START_GAME'; payload: { mode: GameMode; playerCount: PlayerCount; players: Player[] } }
  | { type: 'DRAW_CARD' }
  | { type: 'ATTACK'; payload: { target: AttackTarget; guess: number } }
  | { type: 'PASS' }
  | { type: 'REVEAL_CARD'; payload: { playerId: string; cardIndex: number } }
  | { type: 'RESET_GAME' }
  | { type: 'SET_STATE'; payload: GameState };

function createInitialState(): GameState {
  return {
    id: '',
    mode: 'ai',
    playerCount: 2,
    phase: 'waiting',
    players: [],
    currentPlayerIndex: 0,
    deck: [],
    drawnCard: null,
    lastAttack: null,
    winner: null,
    turnCount: 0,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const { mode, playerCount, players } = action.payload;
      const deck = createDeck();
      const { hands, remainingDeck } = dealCards(deck, playerCount);
      
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        cards: hands[index] || [],
        status: 'active' as const,
      }));
      
      return {
        ...state,
        id: Date.now().toString(),
        mode,
        playerCount,
        phase: 'playing',
        players: updatedPlayers,
        currentPlayerIndex: 0,
        deck: remainingDeck,
        drawnCard: null,
        lastAttack: null,
        winner: null,
        turnCount: 0,
      };
    }
    
    case 'DRAW_CARD': {
      if (state.deck.length === 0 || state.drawnCard) return state;
      
      const [drawnCard, ...remainingDeck] = state.deck;
      return {
        ...state,
        deck: remainingDeck,
        drawnCard,
      };
    }
    
    case 'ATTACK': {
      const { target, guess } = action.payload;
      const result = processAttack(state, state.players[state.currentPlayerIndex].id, target, guess);
      
      let updatedPlayers = [...state.players];
      
      if (result.success) {
        // カードを表にする
        updatedPlayers = updatedPlayers.map(player => {
          if (player.id === target.playerId) {
            const updatedCards = player.cards.map((card, index) => {
              if (index === target.cardIndex) {
                return { ...card, isRevealed: true };
              }
              return card;
            });
            const isEliminated = updatedCards.every(c => c.isRevealed);
            return {
              ...player,
              cards: updatedCards,
              status: isEliminated ? 'eliminated' as const : player.status,
            };
          }
          return player;
        });
      }
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      const winner = checkGameOver(updatedPlayers);
      
      return {
        ...state,
        players: updatedPlayers,
        lastAttack: {
          attackerId: currentPlayer.id,
          target,
          guess,
          result,
        },
        winner,
        phase: winner ? 'finished' : 'playing',
      };
    }
    
    case 'PASS': {
      // 引いたカードを手札に追加
      let updatedPlayers = [...state.players];
      
      if (state.drawnCard) {
        updatedPlayers = updatedPlayers.map((player, index) => {
          if (index === state.currentPlayerIndex) {
            const newCards = addDrawnCardToHand(player.cards, state.drawnCard!);
            return { ...player, cards: newCards };
          }
          return player;
        });
      }
      
      const nextIndex = getNextPlayerIndex(updatedPlayers, state.currentPlayerIndex);
      
      return {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        drawnCard: null,
        lastAttack: null,
        turnCount: state.turnCount + 1,
      };
    }
    
    case 'REVEAL_CARD': {
      const { playerId, cardIndex } = action.payload;
      const updatedPlayers = state.players.map(player => {
        if (player.id === playerId) {
          const updatedCards = player.cards.map((card, index) => {
            if (index === cardIndex) {
              return { ...card, isRevealed: true };
            }
            return card;
          });
          return { ...player, cards: updatedCards };
        }
        return player;
      });
      
      return { ...state, players: updatedPlayers };
    }
    
    case 'RESET_GAME':
      return createInitialState();
    
    case 'SET_STATE':
      return action.payload;
    
    default:
      return state;
  }
}

interface GameContextValue {
  gameState: GameState;
  startGame: (mode: GameMode, playerCount: PlayerCount, players: Player[]) => void;
  drawCard: () => void;
  attack: (target: AttackTarget, guess: number) => void;
  pass: () => void;
  resetGame: () => void;
  setState: (state: GameState) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState());
  
  const startGame = useCallback((mode: GameMode, playerCount: PlayerCount, players: Player[]) => {
    dispatch({ type: 'START_GAME', payload: { mode, playerCount, players } });
  }, []);
  
  const drawCard = useCallback(() => {
    dispatch({ type: 'DRAW_CARD' });
  }, []);
  
  const attack = useCallback((target: AttackTarget, guess: number) => {
    dispatch({ type: 'ATTACK', payload: { target, guess } });
  }, []);
  
  const pass = useCallback(() => {
    dispatch({ type: 'PASS' });
  }, []);
  
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);
  
  const setState = useCallback((state: GameState) => {
    dispatch({ type: 'SET_STATE', payload: state });
  }, []);
  
  return (
    <GameContext.Provider value={{ gameState, startGame, drawCard, attack, pass, resetGame, setState }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
