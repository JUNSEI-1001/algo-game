import { Card, GameState, AttackTarget, Player } from './types';

interface AIMemory {
  // 各プレイヤーの各カード位置に対する推測情報
  // playerIndex -> cardIndex -> { possibleNumbers: number[], color: 'white' | 'black' }
  knownInfo: Map<string, { min: number; max: number; color: 'white' | 'black'; guessed?: number }[]>;
}

// AIの思考：どのカードをアタックするか決定
export function aiDecideAttack(
  gameState: GameState,
  aiPlayerId: string
): { target: AttackTarget; guess: number } | null {
  const opponents = gameState.players.filter(
    p => p.id !== aiPlayerId && p.status === 'active'
  );
  
  if (opponents.length === 0) return null;
  
  // 引いたカードがある場合は使う
  const drawnCard = gameState.drawnCard;
  
  // 最も推測しやすいカードを選ぶ
  let bestTarget: AttackTarget | null = null;
  let bestGuess = -1;
  let bestConfidence = -1;
  
  for (const opponent of opponents) {
    for (let cardIndex = 0; cardIndex < opponent.cards.length; cardIndex++) {
      const card = opponent.cards[cardIndex];
      if (card.isRevealed) continue;
      
      const { guess, confidence } = inferCardNumber(
        opponent,
        cardIndex,
        gameState.players,
        aiPlayerId
      );
      
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestTarget = { playerId: opponent.id, cardIndex };
        bestGuess = guess;
      }
    }
  }
  
  if (!bestTarget || bestGuess === -1) return null;
  
  return { target: bestTarget, guess: bestGuess };
}

// カードの数字を推測する
function inferCardNumber(
  targetPlayer: Player,
  cardIndex: number,
  allPlayers: Player[],
  aiPlayerId: string
): { guess: number; confidence: number } {
  const card = targetPlayer.cards[cardIndex];
  const color = card.color;
  
  // 既に公開されているカードの情報を収集
  const revealedNumbers = new Set<number>();
  
  for (const player of allPlayers) {
    for (const c of player.cards) {
      if (c.isRevealed && c.color === color) {
        revealedNumbers.add(c.number);
      }
    }
  }
  
  // 隣接するカードから範囲を絞る
  const leftCard = cardIndex > 0 ? targetPlayer.cards[cardIndex - 1] : null;
  const rightCard = cardIndex < targetPlayer.cards.length - 1 ? targetPlayer.cards[cardIndex + 1] : null;
  
  let minNum = 0;
  let maxNum = 11;
  
  // 左のカードより大きい（または同じ数字で黒が右）
  if (leftCard?.isRevealed) {
    if (leftCard.number === card.number) {
      // 同じ数字なら左が白、右が黒のはず
    } else {
      minNum = Math.max(minNum, leftCard.number + (color === leftCard.color ? 1 : 0));
    }
  }
  
  // 右のカードより小さい
  if (rightCard?.isRevealed) {
    if (rightCard.number === card.number) {
      // 同じ数字
    } else {
      maxNum = Math.min(maxNum, rightCard.number - (color === rightCard.color ? 1 : 0));
    }
  }
  
  // 可能な数字のリスト
  const possibleNumbers: number[] = [];
  for (let n = minNum; n <= maxNum; n++) {
    if (!revealedNumbers.has(n)) {
      possibleNumbers.push(n);
    }
  }
  
  if (possibleNumbers.length === 0) {
    // フォールバック：ランダム
    const randomNum = Math.floor(Math.random() * 12);
    return { guess: randomNum, confidence: 0 };
  }
  
  // 候補が少ないほど確信度が高い
  const confidence = 1 / possibleNumbers.length;
  
  // 中央値を推測
  const middleIndex = Math.floor(possibleNumbers.length / 2);
  const guess = possibleNumbers[middleIndex];
  
  return { guess, confidence };
}

// AIがパスするかどうかを決定
export function aiShouldPass(
  gameState: GameState,
  aiPlayerId: string,
  lastAttackSuccess: boolean
): boolean {
  if (!lastAttackSuccess) {
    // アタック失敗後は常にパス（引いたカードを手札に加える）
    return true;
  }
  
  // 成功後：次のアタックの確信度が低ければパス
  const nextAttack = aiDecideAttack(gameState, aiPlayerId);
  if (!nextAttack) return true;
  
  // 確信度が低い場合はランダムにパス
  return Math.random() < 0.3;
}

// AIの思考時間（ミリ秒）
export function getAIThinkingTime(): number {
  return 800 + Math.random() * 1200; // 0.8〜2秒
}
