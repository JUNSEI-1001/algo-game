import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useGame } from '@/lib/algo/game-context';
import { AlgoCard } from '@/components/algo/AlgoCard';
import { AttackModal } from '@/components/algo/AttackModal';
import { AttackTarget, Card, Player } from '@/lib/algo/types';
import { aiDecideAttack, getAIThinkingTime } from '@/lib/algo/ai-logic';

export default function GameBoardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { gameState, drawCard, attack, pass } = useGame();
  
  const [selectedTarget, setSelectedTarget] = useState<AttackTarget | null>(null);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [attackResult, setAttackResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const humanPlayerId = 'player-0';
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === humanPlayerId;
  const humanPlayer = gameState.players.find(p => p.id === humanPlayerId);
  
  // ゲーム終了チェック
  useEffect(() => {
    if (gameState.phase === 'finished' && gameState.winner) {
      const winner = gameState.players.find(p => p.id === gameState.winner);
      const isWinner = gameState.winner === humanPlayerId;
      
      if (Platform.OS !== 'web') {
        if (isWinner) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      
      setTimeout(() => {
        router.replace('/game/result' as any);
      }, 1500);
    }
  }, [gameState.phase, gameState.winner]);
  
  // AIターンの処理
  useEffect(() => {
    if (!currentPlayer?.isAI || gameState.phase !== 'playing') return;
    
    setIsAIThinking(true);
    
    const thinkingTime = getAIThinkingTime();
    
    const timer = setTimeout(() => {
      // AIがカードを引く
      if (!gameState.drawnCard) {
        drawCard();
        setHasDrawn(true);
        return;
      }
      
      // AIがアタックを決定
      const aiDecision = aiDecideAttack(gameState, currentPlayer.id);
      
      if (aiDecision) {
        attack(aiDecision.target, aiDecision.guess);
        
        // アタック結果を確認してパスするか継続するか
        setTimeout(() => {
          const lastAttack = gameState.lastAttack;
          if (!lastAttack?.result.success) {
            pass();
            setHasDrawn(false);
          }
          setIsAIThinking(false);
        }, 800);
      } else {
        pass();
        setHasDrawn(false);
        setIsAIThinking(false);
      }
    }, thinkingTime);
    
    return () => clearTimeout(timer);
  }, [currentPlayer, gameState.drawnCard, gameState.phase]);
  
  // ターンが変わったらhasDrawnをリセット
  useEffect(() => {
    setHasDrawn(false);
    setAttackResult(null);
  }, [gameState.currentPlayerIndex]);
  
  // アタック結果の表示
  useEffect(() => {
    if (gameState.lastAttack) {
      const { result, target, guess } = gameState.lastAttack;
      const targetPlayer = gameState.players.find(p => p.id === target.playerId);
      
      if (result.success) {
        setAttackResult({
          success: true,
          message: `✅ 正解！${targetPlayer?.name}の${result.card?.color === 'white' ? '白' : '黒'}${guess}を当てた！`,
        });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setAttackResult({
          success: false,
          message: `❌ 不正解... ${targetPlayer?.name}のカードは${guess}ではなかった`,
        });
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      
      // 3秒後にメッセージを消す
      const timer = setTimeout(() => setAttackResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.lastAttack]);
  
  const handleDrawCard = () => {
    if (!isMyTurn || gameState.drawnCard || hasDrawn) return;
    drawCard();
    setHasDrawn(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  const handleCardPress = (playerId: string, cardIndex: number) => {
    if (!isMyTurn) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.id === humanPlayerId) return;
    const card = player.cards[cardIndex];
    if (!card || card.isRevealed) return;
    
    setSelectedTarget({ playerId, cardIndex });
    setShowAttackModal(true);
  };
  
  const handleAttack = (guess: number) => {
    if (!selectedTarget) return;
    setShowAttackModal(false);
    attack(selectedTarget, guess);
    setSelectedTarget(null);
  };
  
  const handlePass = () => {
    if (!isMyTurn) return;
    pass();
    setHasDrawn(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const getTargetCard = (): Card | null => {
    if (!selectedTarget) return null;
    const player = gameState.players.find(p => p.id === selectedTarget.playerId);
    return player?.cards[selectedTarget.cardIndex] || null;
  };
  
  const getTargetPlayerName = (): string => {
    if (!selectedTarget) return '';
    const player = gameState.players.find(p => p.id === selectedTarget.playerId);
    return player?.name || '';
  };
  
  const renderPlayerArea = (player: Player, position: 'top' | 'left' | 'right' | 'bottom') => {
    const isHuman = player.id === humanPlayerId;
    const isCurrent = player.id === currentPlayer?.id;
    const isEliminated = player.status === 'eliminated';
    
    return (
      <View
        key={player.id}
        style={[
          styles.playerArea,
          position === 'top' && styles.playerAreaTop,
          position === 'bottom' && styles.playerAreaBottom,
          position === 'left' && styles.playerAreaLeft,
          position === 'right' && styles.playerAreaRight,
        ]}
      >
        {/* プレイヤー名 */}
        <View style={[
          styles.playerNameBadge,
          {
            backgroundColor: isCurrent ? colors.primary : colors.surface,
            borderColor: isCurrent ? colors.primary : colors.border,
          }
        ]}>
          <Text style={[
            styles.playerNameText,
            { color: isCurrent ? '#fff' : colors.foreground }
          ]}>
            {isEliminated ? '💀 ' : (isCurrent ? '▶ ' : '')}{player.name}
          </Text>
          {isAIThinking && isCurrent && (
            <Text style={[styles.thinkingText, { color: isCurrent ? 'rgba(255,255,255,0.8)' : colors.muted }]}>
              考え中...
            </Text>
          )}
        </View>
        
        {/* カード */}
        <View style={[
          styles.cardsRow,
          isEliminated && styles.eliminatedCards,
        ]}>
          {player.cards.map((card, index) => (
            <AlgoCard
              key={card.id}
              card={card}
              isOwn={isHuman}
              isTargetable={isMyTurn && !isHuman && !card.isRevealed && !isEliminated}
              isSelected={
                selectedTarget?.playerId === player.id &&
                selectedTarget?.cardIndex === index
              }
              onPress={
                !isHuman && !card.isRevealed && !isEliminated
                  ? () => handleCardPress(player.id, index)
                  : undefined
              }
              size={isHuman ? 'medium' : 'small'}
            />
          ))}
        </View>
      </View>
    );
  };
  
  if (gameState.phase === 'waiting' || gameState.players.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            ゲームを準備中...
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  
  const opponents = gameState.players.filter(p => p.id !== humanPlayerId);
  const is4Player = gameState.playerCount === 4;
  
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* ターン表示 */}
        <View style={[styles.turnBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.turnText, { color: colors.foreground }]}>
            {isMyTurn ? '🎯 あなたのターン' : `⏳ ${currentPlayer?.name}のターン`}
          </Text>
          <Text style={[styles.deckCount, { color: colors.muted }]}>
            山札: {gameState.deck.length}枚
          </Text>
        </View>
        
        {/* アタック結果メッセージ */}
        {attackResult && (
          <View style={[
            styles.resultBanner,
            { backgroundColor: attackResult.success ? '#22c55e20' : '#ef444420' }
          ]}>
            <Text style={[
              styles.resultText,
              { color: attackResult.success ? '#22c55e' : '#ef4444' }
            ]}>
              {attackResult.message}
            </Text>
          </View>
        )}
        
        {/* ゲームエリア */}
        <View style={styles.gameArea}>
          {/* 相手エリア（上） */}
          {opponents.length >= 1 && renderPlayerArea(opponents[0], 'top')}
          
          {/* 4人対戦の場合の左右プレイヤー */}
          {is4Player && (
            <View style={styles.middleRow}>
              {opponents.length >= 2 && renderPlayerArea(opponents[1], 'left')}
              
              {/* 中央エリア（山札・引いたカード） */}
              <View style={styles.centerArea}>
                {gameState.drawnCard && (
                  <View style={styles.drawnCardContainer}>
                    <Text style={[styles.drawnCardLabel, { color: colors.muted }]}>引いたカード</Text>
                    <AlgoCard
                      card={gameState.drawnCard}
                      isOwn={true}
                      size="medium"
                    />
                  </View>
                )}
                {!gameState.drawnCard && (
                  <View style={[styles.deckPile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.deckPileText, { color: colors.muted }]}>山札</Text>
                  </View>
                )}
              </View>
              
              {opponents.length >= 3 && renderPlayerArea(opponents[2], 'right')}
            </View>
          )}
          
          {/* 2人対戦の場合の中央エリア */}
          {!is4Player && (
            <View style={styles.centerArea2P}>
              {gameState.drawnCard && (
                <View style={styles.drawnCardContainer}>
                  <Text style={[styles.drawnCardLabel, { color: colors.muted }]}>引いたカード</Text>
                  <AlgoCard
                    card={gameState.drawnCard}
                    isOwn={true}
                    size="medium"
                  />
                </View>
              )}
              {!gameState.drawnCard && (
                <View style={[styles.deckPile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.deckPileText, { color: colors.muted }]}>山札</Text>
                  <Text style={[styles.deckCountSmall, { color: colors.muted }]}>{gameState.deck.length}枚</Text>
                </View>
              )}
            </View>
          )}
          
          {/* 自分のエリア（下） */}
          {humanPlayer && renderPlayerArea(humanPlayer, 'bottom')}
        </View>
        
        {/* アクションボタン */}
        {isMyTurn && (
          <View style={styles.actionButtons}>
            {/* カードを引くボタン */}
            {!hasDrawn && (
              <Pressable
                onPress={handleDrawCard}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={styles.actionButtonText}>カードを引く</Text>
              </Pressable>
            )}
            
            {/* パスボタン（カードを引いた後） */}
            {hasDrawn && (
              <Pressable
                onPress={handlePass}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.passButton,
                  {
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={[styles.passButtonText, { color: colors.foreground }]}>
                  パス（手札に加える）
                </Text>
              </Pressable>
            )}
          </View>
        )}
        
        {/* AIターン中の表示 */}
        {!isMyTurn && isAIThinking && (
          <View style={[styles.aiThinkingBanner, { backgroundColor: colors.surface }]}>
            <Text style={[styles.aiThinkingText, { color: colors.muted }]}>
              🤖 AIが考えています...
            </Text>
          </View>
        )}
      </View>
      
      {/* アタックモーダル */}
      <AttackModal
        visible={showAttackModal}
        targetCard={getTargetCard()}
        targetPlayerName={getTargetPlayerName()}
        onConfirm={handleAttack}
        onCancel={() => {
          setShowAttackModal(false);
          setSelectedTarget(null);
        }}
        isFirstAttack={!gameState.drawnCard && !gameState.lastAttack}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  turnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deckCount: {
    fontSize: 13,
  },
  resultBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  gameArea: {
    flex: 1,
    gap: 8,
  },
  playerArea: {
    alignItems: 'center',
    gap: 6,
  },
  playerAreaTop: {
    paddingTop: 4,
  },
  playerAreaBottom: {
    paddingBottom: 4,
  },
  playerAreaLeft: {
    flex: 1,
  },
  playerAreaRight: {
    flex: 1,
  },
  playerNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  playerNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  thinkingText: {
    fontSize: 11,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  eliminatedCards: {
    opacity: 0.4,
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerArea2P: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawnCardContainer: {
    alignItems: 'center',
    gap: 4,
  },
  drawnCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  deckPile: {
    width: 60,
    height: 84,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deckPileText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deckCountSmall: {
    fontSize: 10,
  },
  actionButtons: {
    gap: 8,
  },
  actionButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  passButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  passButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  aiThinkingBanner: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiThinkingText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
