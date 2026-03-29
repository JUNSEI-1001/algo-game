import { describe, it, expect } from 'vitest';
import {
  createDeck,
  dealCards,
  processAttack,
  isPlayerEliminated,
  checkGameOver,
  getNextPlayerIndex,
  addDrawnCardToHand,
  sortCards,
  generatePassphrase,
} from '../lib/algo/game-logic';
import { Card, GameState, Player } from '../lib/algo/types';

describe('createDeck', () => {
  it('24枚のカードを生成する', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(24);
  });

  it('白カード12枚・黒カード12枚を含む', () => {
    const deck = createDeck();
    const white = deck.filter(c => c.color === 'white');
    const black = deck.filter(c => c.color === 'black');
    expect(white).toHaveLength(12);
    expect(black).toHaveLength(12);
  });

  it('各色0〜11の数字を含む', () => {
    const deck = createDeck();
    for (const color of ['white', 'black'] as const) {
      for (let n = 0; n <= 11; n++) {
        expect(deck.some(c => c.color === color && c.number === n)).toBe(true);
      }
    }
  });
});

describe('dealCards', () => {
  it('2人対戦で各4枚配る', () => {
    const deck = createDeck();
    const { hands, remainingDeck } = dealCards(deck, 2);
    expect(hands).toHaveLength(2);
    expect(hands[0]).toHaveLength(4);
    expect(hands[1]).toHaveLength(4);
    expect(remainingDeck).toHaveLength(16);
  });

  it('4人対戦で各4枚配る', () => {
    const deck = createDeck();
    const { hands, remainingDeck } = dealCards(deck, 4);
    expect(hands).toHaveLength(4);
    hands.forEach(hand => expect(hand).toHaveLength(4));
    expect(remainingDeck).toHaveLength(8);
  });

  it('配られたカードは昇順に並んでいる', () => {
    const deck = createDeck();
    const { hands } = dealCards(deck, 2);
    for (const hand of hands) {
      for (let i = 1; i < hand.length; i++) {
        expect(hand[i].number).toBeGreaterThanOrEqual(hand[i - 1].number);
      }
    }
  });
});

describe('sortCards', () => {
  it('数字の昇順に並べる', () => {
    const cards: Card[] = [
      { id: 'b-5', number: 5, color: 'black', isRevealed: false },
      { id: 'w-3', number: 3, color: 'white', isRevealed: false },
      { id: 'w-7', number: 7, color: 'white', isRevealed: false },
    ];
    const sorted = sortCards(cards);
    expect(sorted[0].number).toBe(3);
    expect(sorted[1].number).toBe(5);
    expect(sorted[2].number).toBe(7);
  });

  it('同じ数字は白が左・黒が右', () => {
    const cards: Card[] = [
      { id: 'b-5', number: 5, color: 'black', isRevealed: false },
      { id: 'w-5', number: 5, color: 'white', isRevealed: false },
    ];
    const sorted = sortCards(cards);
    expect(sorted[0].color).toBe('white');
    expect(sorted[1].color).toBe('black');
  });
});

describe('processAttack', () => {
  const makeGameState = (): GameState => ({
    id: 'test',
    mode: 'ai',
    playerCount: 2,
    phase: 'playing',
    players: [
      {
        id: 'player-0',
        name: 'あなた',
        cards: [
          { id: 'w-3', number: 3, color: 'white', isRevealed: false },
        ],
        status: 'active',
      },
      {
        id: 'ai-1',
        name: 'AI',
        cards: [
          { id: 'b-7', number: 7, color: 'black', isRevealed: false },
        ],
        status: 'active',
        isAI: true,
      },
    ],
    currentPlayerIndex: 0,
    deck: [],
    drawnCard: null,
    lastAttack: null,
    winner: null,
    turnCount: 0,
  });

  it('正しい数字を当てると成功する', () => {
    const gs = makeGameState();
    const result = processAttack(gs, 'player-0', { playerId: 'ai-1', cardIndex: 0 }, 7);
    expect(result.success).toBe(true);
    expect(result.card?.number).toBe(7);
  });

  it('間違った数字では失敗する', () => {
    const gs = makeGameState();
    const result = processAttack(gs, 'player-0', { playerId: 'ai-1', cardIndex: 0 }, 5);
    expect(result.success).toBe(false);
  });

  it('既に表になっているカードはアタックできない', () => {
    const gs = makeGameState();
    gs.players[1].cards[0].isRevealed = true;
    const result = processAttack(gs, 'player-0', { playerId: 'ai-1', cardIndex: 0 }, 7);
    expect(result.success).toBe(false);
  });
});

describe('isPlayerEliminated', () => {
  it('全カードが表になったら脱落', () => {
    const player: Player = {
      id: 'p1',
      name: 'テスト',
      cards: [
        { id: 'w-1', number: 1, color: 'white', isRevealed: true },
        { id: 'b-2', number: 2, color: 'black', isRevealed: true },
      ],
      status: 'active',
    };
    expect(isPlayerEliminated(player)).toBe(true);
  });

  it('カードが残っていれば脱落しない', () => {
    const player: Player = {
      id: 'p1',
      name: 'テスト',
      cards: [
        { id: 'w-1', number: 1, color: 'white', isRevealed: true },
        { id: 'b-2', number: 2, color: 'black', isRevealed: false },
      ],
      status: 'active',
    };
    expect(isPlayerEliminated(player)).toBe(false);
  });
});

describe('checkGameOver', () => {
  it('アクティブプレイヤーが1人になったら終了', () => {
    const players: Player[] = [
      { id: 'p1', name: 'P1', cards: [], status: 'active' },
      { id: 'p2', name: 'P2', cards: [], status: 'eliminated' },
    ];
    expect(checkGameOver(players)).toBe('p1');
  });

  it('複数のアクティブプレイヤーがいれば継続', () => {
    const players: Player[] = [
      { id: 'p1', name: 'P1', cards: [], status: 'active' },
      { id: 'p2', name: 'P2', cards: [], status: 'active' },
    ];
    expect(checkGameOver(players)).toBeNull();
  });
});

describe('getNextPlayerIndex', () => {
  it('次のアクティブプレイヤーに移動する', () => {
    const players: Player[] = [
      { id: 'p1', name: 'P1', cards: [], status: 'active' },
      { id: 'p2', name: 'P2', cards: [], status: 'active' },
      { id: 'p3', name: 'P3', cards: [], status: 'active' },
    ];
    expect(getNextPlayerIndex(players, 0)).toBe(1);
    expect(getNextPlayerIndex(players, 1)).toBe(2);
    expect(getNextPlayerIndex(players, 2)).toBe(0);
  });

  it('脱落プレイヤーをスキップする', () => {
    const players: Player[] = [
      { id: 'p1', name: 'P1', cards: [], status: 'active' },
      { id: 'p2', name: 'P2', cards: [], status: 'eliminated' },
      { id: 'p3', name: 'P3', cards: [], status: 'active' },
    ];
    expect(getNextPlayerIndex(players, 0)).toBe(2);
  });
});

describe('addDrawnCardToHand', () => {
  it('引いたカードを手札に追加して並べ直す', () => {
    const hand: Card[] = [
      { id: 'w-3', number: 3, color: 'white', isRevealed: false },
      { id: 'b-7', number: 7, color: 'black', isRevealed: false },
    ];
    const drawn: Card = { id: 'w-5', number: 5, color: 'white', isRevealed: false };
    const result = addDrawnCardToHand(hand, drawn);
    expect(result).toHaveLength(3);
    expect(result[1].number).toBe(5);
  });
});

describe('generatePassphrase', () => {
  it('合言葉を生成する', () => {
    const passphrase = generatePassphrase();
    expect(typeof passphrase).toBe('string');
    expect(passphrase.length).toBeGreaterThan(0);
  });

  it('毎回異なる合言葉を生成する（確率的）', () => {
    const passphrases = new Set(Array.from({ length: 10 }, () => generatePassphrase()));
    expect(passphrases.size).toBeGreaterThan(1);
  });
});
