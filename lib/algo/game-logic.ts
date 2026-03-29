import { Card, CardColor, GameState, Player, AttackTarget, AttackResult, PlayerCount } from './types';

// 24枚のデッキを生成（白0〜11、黒0〜11）
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const colors: CardColor[] = ['white', 'black'];
  
  for (const color of colors) {
    for (let number = 0; number <= 11; number++) {
      deck.push({
        id: `${color}-${number}`,
        number,
        color,
        isRevealed: false,
      });
    }
  }
  
  return shuffleDeck(deck);
}

// デッキをシャッフル
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// カードを昇順に並べる（同じ数字は黒が右）
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    // 同じ数字の場合：白が左、黒が右
    if (a.color === 'white' && b.color === 'black') return -1;
    if (a.color === 'black' && b.color === 'white') return 1;
    return 0;
  });
}

// 各プレイヤーに4枚ずつ配布
export function dealCards(deck: Card[], playerCount: PlayerCount): { hands: Card[][], remainingDeck: Card[] } {
  const cardsPerPlayer = 4;
  const hands: Card[][] = [];
  let deckIndex = 0;
  
  for (let i = 0; i < playerCount; i++) {
    const hand = deck.slice(deckIndex, deckIndex + cardsPerPlayer);
    hands.push(sortCards(hand));
    deckIndex += cardsPerPlayer;
  }
  
  return {
    hands,
    remainingDeck: deck.slice(deckIndex),
  };
}

// アタック処理
export function processAttack(
  gameState: GameState,
  attackerId: string,
  target: AttackTarget,
  guess: number
): AttackResult {
  const targetPlayer = gameState.players.find(p => p.id === target.playerId);
  if (!targetPlayer) return { success: false };
  
  const targetCard = targetPlayer.cards[target.cardIndex];
  if (!targetCard || targetCard.isRevealed) return { success: false };
  
  if (targetCard.number === guess) {
    return { success: true, card: targetCard };
  }
  
  return { success: false };
}

// プレイヤーが脱落しているか確認（全カードが表になっている）
export function isPlayerEliminated(player: Player): boolean {
  return player.cards.length > 0 && player.cards.every(card => card.isRevealed);
}

// ゲームが終了しているか確認
export function checkGameOver(players: Player[]): string | null {
  const activePlayers = players.filter(p => p.status === 'active');
  
  if (activePlayers.length === 1) {
    return activePlayers[0].id;
  }
  
  return null;
}

// 次のアクティブプレイヤーのインデックスを取得
export function getNextPlayerIndex(players: Player[], currentIndex: number): number {
  const total = players.length;
  let next = (currentIndex + 1) % total;
  
  // アクティブなプレイヤーを探す
  let attempts = 0;
  while (players[next].status !== 'active' && attempts < total) {
    next = (next + 1) % total;
    attempts++;
  }
  
  return next;
}

// 引いたカードを手札に追加して並べ直す
export function addDrawnCardToHand(hand: Card[], drawnCard: Card): Card[] {
  return sortCards([...hand, drawnCard]);
}

// プレイヤー名の生成
export function generatePlayerName(index: number): string {
  const names = ['あなた', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4'];
  return names[index] || `プレイヤー${index + 1}`;
}

// ランダムな合言葉を生成
export function generatePassphrase(): string {
  const adjectives = ['赤い', '青い', '速い', '強い', '賢い', '楽しい', '大きな', '小さな'];
  const nouns = ['ネコ', 'イヌ', 'トリ', 'サカナ', 'クマ', 'キツネ', 'ウサギ', 'タヌキ'];
  const numbers = Math.floor(Math.random() * 999) + 1;
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj}${noun}${numbers}`;
}
