import React, { useState, useEffect } from 'react';
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
import { useOnlineGame } from '@/lib/online/online-context';
import { AlgoCard } from '@/components/algo/AlgoCard';
import { AttackModal } from '@/components/algo/AttackModal';
import { AttackTarget, Player } from '@/lib/algo/types';

export default function OnlineGameBoardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, drawCard, attack, pass, disconnect } = useOnlineGame();
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<AttackTarget | null>(null);
  const [targetCard, setTargetCard] = useState<any>(null);
  const [targetPlayerName, setTargetPlayerName] = useState('');
  
  const gs = state.gameState;
  const myPlayerId = state.yourPlayerId;
  
  // ゲーム終了時
  useEffect(() => {
    if (gs?.phase === 'finished') {
      setTimeout(() => {
        router.replace('/online/result' as any);
      }, 1500);
    }
  }, [gs?.phase]);
  
  // 切断時
  useEffect(() => {
    if (state.errorMessage?.includes('切断')) {
      Alert.alert(
        '接続が切れました',
        state.errorMessage,
        [{ text: 'ホームに戻る', onPress: () => { disconnect(); router.replace('/'); } }]
      );
    }
  }, [state.errorMessage]);
  
  if (!gs || !myPlayerId) {
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
  
  const myPlayer = gs.players.find(p => p.id === myPlayerId);
  const opponents = gs.players.filter(p => p.id !== myPlayerId);
  const currentPlayer = gs.players[gs.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  
  const handleCardSelect = (playerId: string, cardIndex: number) => {
    if (!isMyTurn) return;
    if (playerId === myPlayerId) return;
    
    const targetPlayer = gs.players.find(p => p.id === playerId);
    const card = targetPlayer?.cards[cardIndex];
    if (!card || card.isRevealed) return;
    
    setSelectedTarget({ playerId, cardIndex });
    setTargetCard(card);
    setTargetPlayerName(targetPlayer?.name || '');
    setShowAttackModal(true);
  };
  
  const handleAttack = (guess: number) => {
    if (!selectedTarget) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    attack(selectedTarget, guess);
    setShowAttackModal(false);
    setSelectedTarget(null);
    setTargetCard(null);
    setTargetPlayerName('');
  };
  
  const handleDrawCard = () => {
    if (!isMyTurn || gs.drawnCard) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    drawCard();
  };
  
  const handlePass = () => {
    if (!isMyTurn || !gs.drawnCard) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    pass();
  };
  
  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ターン表示 */}
        <View style={[
          styles.turnBanner,
          { backgroundColor: isMyTurn ? colors.primary : colors.surface }
        ]}>
          <Text style={[styles.turnText, { color: isMyTurn ? '#fff' : colors.muted }]}>
            {isMyTurn ? '🎯 あなたのターン' : `⏳ ${currentPlayer?.name}のターン`}
          </Text>
        </View>
        
        {/* 相手プレイヤーエリア */}
        {opponents.map(opponent => (
          <View key={opponent.id} style={styles.playerArea}>
            <View style={styles.playerHeader}>
              <Text style={[styles.playerName, { color: colors.foreground }]}>
                {opponent.name}
                {opponent.status === 'eliminated' ? ' 💀' : ''}
              </Text>
              <Text style={[styles.cardCount, { color: colors.muted }]}>
                {opponent.cards.length}枚
              </Text>
            </View>
            <View style={styles.cardsRow}>
              {opponent.cards.map((card, index) => (
                <AlgoCard
                  key={card.id}
                  card={card}
                  isOwn={false}
                  isTargetable={isMyTurn && !card.isRevealed && !!gs.drawnCard && opponent.status !== 'eliminated'}
                  onPress={() => handleCardSelect(opponent.id, index)}
                  size="medium"
                />
              ))}
            </View>
          </View>
        ))}
        
        {/* 中央エリア（山札・引いたカード） */}
        <View style={styles.centerArea}>
          <View style={styles.deckArea}>
            <Pressable
              onPress={handleDrawCard}
              disabled={!isMyTurn || !!gs.drawnCard || gs.deck.length === 0}
              style={({ pressed }) => [
                styles.deckButton,
                {
                  backgroundColor: isMyTurn && !gs.drawnCard ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  opacity: (!isMyTurn || !!gs.drawnCard) ? 0.5 : pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                }
              ]}
            >
              <Text style={styles.deckEmoji}>🃏</Text>
              <Text style={[styles.deckCount, { color: isMyTurn && !gs.drawnCard ? '#fff' : colors.muted }]}>
                {gs.deck.length}枚
              </Text>
              {isMyTurn && !gs.drawnCard && (
                <Text style={[styles.deckHint, { color: 'rgba(255,255,255,0.8)' }]}>
                  タップして引く
                </Text>
              )}
            </Pressable>
            
            {gs.drawnCard && (
              <View style={styles.drawnCardArea}>
                <Text style={[styles.drawnCardLabel, { color: colors.muted }]}>引いたカード</Text>
                <AlgoCard
                  card={gs.drawnCard}
                  isOwn={true}
                  size="medium"
                />
              </View>
            )}
          </View>
          
          {/* 最後のアタック結果 */}
          {gs.lastAttack && (
            <View style={[
              styles.lastAttackBox,
              {
                backgroundColor: gs.lastAttack.result.success ? colors.success + '20' : colors.error + '20',
                borderColor: gs.lastAttack.result.success ? colors.success : colors.error,
              }
            ]}>
              <Text style={[
                styles.lastAttackText,
                { color: gs.lastAttack.result.success ? colors.success : colors.error }
              ]}>
                {gs.lastAttack.result.success ? '✅ アタック成功！' : '❌ アタック失敗'}
              </Text>
            </View>
          )}
        </View>
        
        {/* 自分のカードエリア */}
        {myPlayer && (
          <View style={styles.myArea}>
            <View style={styles.playerHeader}>
              <Text style={[styles.playerName, { color: colors.foreground }]}>
                あなた ({myPlayer.name})
              </Text>
              <Text style={[styles.cardCount, { color: colors.muted }]}>
                {myPlayer.cards.length}枚
              </Text>
            </View>
            <View style={styles.cardsRow}>
              {myPlayer.cards.map(card => (
                <AlgoCard
                  key={card.id}
                  card={card}
                  isOwn={true}
                  size="medium"
                />
              ))}
            </View>
          </View>
        )}
        
        {/* アクションボタン */}
        {isMyTurn && gs.drawnCard && (
          <View style={styles.actionButtons}>
            <Pressable
              onPress={handlePass}
              style={({ pressed }) => [
                styles.passButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }
              ]}
            >
              <Text style={[styles.passButtonText, { color: colors.foreground }]}>
                パス（手札に加える）
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      
      {/* アタックモーダル */}
      {showAttackModal && (
        <AttackModal
          visible={showAttackModal}
          targetCard={targetCard}
          targetPlayerName={targetPlayerName}
          onConfirm={handleAttack}
          onCancel={() => {
            setShowAttackModal(false);
            setSelectedTarget(null);
            setTargetCard(null);
            setTargetPlayerName('');
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  turnBanner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  turnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  playerArea: {
    gap: 8,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardCount: {
    fontSize: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  centerArea: {
    gap: 12,
  },
  deckArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deckButton: {
    width: 80,
    height: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deckEmoji: {
    fontSize: 28,
  },
  deckCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  deckHint: {
    fontSize: 10,
    textAlign: 'center',
  },
  drawnCardArea: {
    alignItems: 'center',
    gap: 4,
  },
  drawnCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastAttackBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  lastAttackText: {
    fontSize: 14,
    fontWeight: '700',
  },
  myArea: {
    gap: 8,
  },
  actionButtons: {
    gap: 10,
  },
  passButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
