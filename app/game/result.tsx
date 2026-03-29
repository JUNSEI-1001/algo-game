import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useGame } from '@/lib/algo/game-context';
import { AlgoCard } from '@/components/algo/AlgoCard';

export default function ResultScreen() {
  const router = useRouter();
  const colors = useColors();
  const { gameState, resetGame } = useGame();
  
  const humanPlayerId = 'player-0';
  const isWinner = gameState.winner === humanPlayerId;
  const winner = gameState.players.find(p => p.id === gameState.winner);
  
  const handlePlayAgain = () => {
    resetGame();
    router.replace('/game/ai-setup' as any);
  };
  
  const handleGoHome = () => {
    resetGame();
    router.replace('/');
  };
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 結果ヘッダー */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultEmoji}>
            {isWinner ? '🎉' : '😔'}
          </Text>
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>
            {isWinner ? '勝利！' : '敗北...'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.muted }]}>
            {isWinner
              ? 'おめでとうございます！'
              : `${winner?.name}の勝利です`}
          </Text>
          <Text style={[styles.turnCount, { color: colors.muted }]}>
            {gameState.turnCount}ターン
          </Text>
        </View>
        
        {/* 全プレイヤーのカード公開 */}
        <View style={[styles.cardsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardsSectionTitle, { color: colors.foreground }]}>
            全カード公開
          </Text>
          {gameState.players.map(player => (
            <View key={player.id} style={styles.playerResult}>
              <View style={styles.playerResultHeader}>
                <Text style={[styles.playerResultName, { color: colors.foreground }]}>
                  {player.id === gameState.winner ? '👑 ' : ''}{player.name}
                </Text>
                <Text style={[
                  styles.playerResultStatus,
                  { color: player.status === 'eliminated' ? colors.error : colors.success }
                ]}>
                  {player.status === 'eliminated' ? '脱落' : '生存'}
                </Text>
              </View>
              <View style={styles.playerResultCards}>
                {player.cards.map(card => (
                  <AlgoCard
                    key={card.id}
                    card={{ ...card, isRevealed: true }}
                    isOwn={true}
                    size="small"
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
        
        {/* ボタン */}
        <View style={styles.buttons}>
          <Pressable
            onPress={handlePlayAgain}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }
            ]}
          >
            <Text style={styles.buttonText}>もう一度プレイ</Text>
          </Pressable>
          
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              ホームに戻る
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  resultEmoji: {
    fontSize: 64,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '900',
  },
  resultSubtitle: {
    fontSize: 16,
  },
  turnCount: {
    fontSize: 13,
    marginTop: 4,
  },
  cardsSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  cardsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerResult: {
    gap: 8,
  },
  playerResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerResultName: {
    fontSize: 15,
    fontWeight: '700',
  },
  playerResultStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  playerResultCards: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  buttons: {
    gap: 12,
  },
  button: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
