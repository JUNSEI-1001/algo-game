import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useGame } from '@/lib/algo/game-context';
import { PlayerCount } from '@/lib/algo/types';

export default function AISetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const { startGame } = useGame();
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const players = [];
    // プレイヤー0：人間
    players.push({
      id: 'player-0',
      name: 'あなた',
      cards: [],
      status: 'active' as const,
      isAI: false,
    });

    // 残りはAI
    for (let i = 1; i < playerCount; i++) {
      players.push({
        id: `ai-${i}`,
        name: `AI ${i}`,
        cards: [],
        status: 'active' as const,
        isAI: true,
      });
    }

    startGame('ai', playerCount, players);
    router.push('/game/board' as any);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>‹ 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>AI対戦</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>人数を選択</Text>

          <View style={styles.playerCountContainer}>
            {([2, 4] as PlayerCount[]).map(count => (
              <Pressable
                key={count}
                onPress={() => {
                  setPlayerCount(count);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={({ pressed }) => [
                  styles.countCard,
                  {
                    backgroundColor: playerCount === count ? colors.primary : colors.surface,
                    borderColor: playerCount === count ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={[
                  styles.countNumber,
                  { color: playerCount === count ? '#fff' : colors.foreground }
                ]}>
                  {count}人
                </Text>
                <Text style={[
                  styles.countDesc,
                  { color: playerCount === count ? 'rgba(255,255,255,0.8)' : colors.muted }
                ]}>
                  {count === 2 ? 'あなた vs AI 1体' : 'あなた vs AI 3体'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ゲーム説明 */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>🤖 AI対戦について</Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              AIは相手のカードを論理的に推理してアタックします。
              初心者から上級者まで楽しめる難易度です。
            </Text>
          </View>
        </View>

        {/* スタートボタン */}
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }
          ]}
        >
          <Text style={styles.startButtonText}>ゲーム開始</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingTop: 20,
    gap: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  playerCountContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
  },
  countNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  countDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  infoBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
