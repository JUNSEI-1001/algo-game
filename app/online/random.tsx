import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useOnlineGame } from '@/lib/online/online-context';
import { PlayerCount } from '@/lib/algo/types';

export default function RandomMatchScreen() {
  const router = useRouter();
  const colors = useColors();
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [playerName, setPlayerName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const { state, connect, disconnect, joinRandomQueue, leaveRandomQueue } = useOnlineGame();
  
  // パルスアニメーション
  useEffect(() => {
    if (isSearching) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSearching]);
  
  // マッチング成立時の処理
  useEffect(() => {
    if (state.roomId && state.gameState) {
      // ゲームボードに遷移
      router.replace('/online/game-board' as any);
    }
  }, [state.gameState]);
  
  const handleStartSearch = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const name = playerName.trim() || `プレイヤー${Math.floor(Math.random() * 999) + 1}`;
    
    setIsSearching(true);
    connect();
    
    // 接続後にキューに参加
    setTimeout(() => {
      joinRandomQueue(playerCount, name);
    }, 1000);
  };
  
  const handleCancelSearch = () => {
    leaveRandomQueue(playerCount);
    disconnect();
    setIsSearching(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (isSearching) handleCancelSearch();
              router.back();
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>‹ 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>ランダムマッチ</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {!isSearching ? (
          <View style={styles.setupContent}>
            {/* 人数選択 */}
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>人数を選択</Text>
            <View style={styles.playerCountRow}>
              {([2, 4] as PlayerCount[]).map(count => (
                <Pressable
                  key={count}
                  onPress={() => setPlayerCount(count)}
                  style={({ pressed }) => [
                    styles.countButton,
                    {
                      backgroundColor: playerCount === count ? colors.primary : colors.surface,
                      borderColor: playerCount === count ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    }
                  ]}
                >
                  <Text style={[
                    styles.countButtonText,
                    { color: playerCount === count ? '#fff' : colors.foreground }
                  ]}>
                    {count}人対戦
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* 接続状態 */}
            {state.connectionStatus === 'error' && (
              <View style={[styles.errorBox, { backgroundColor: '#ef444420', borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  接続エラー: {state.errorMessage}
                </Text>
              </View>
            )}
            
            <Pressable
              onPress={handleStartSearch}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  backgroundColor: colors.success,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }
              ]}
            >
              <Text style={styles.searchButtonText}>🌐 マッチングを開始</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.searchingContent}>
            {/* 検索中アニメーション */}
            <Animated.View style={[
              styles.searchingCircle,
              {
                backgroundColor: colors.primary + '20',
                transform: [{ scale: pulseAnim }],
              }
            ]}>
              <View style={[styles.searchingInnerCircle, { backgroundColor: colors.primary + '40' }]}>
                <Text style={styles.searchingEmoji}>🌐</Text>
              </View>
            </Animated.View>
            
            <Text style={[styles.searchingTitle, { color: colors.foreground }]}>
              マッチング中...
            </Text>
            <Text style={[styles.searchingSubtitle, { color: colors.muted }]}>
              {playerCount}人対戦のプレイヤーを探しています
            </Text>
            
            {state.queuePosition !== null && (
              <Text style={[styles.queueInfo, { color: colors.muted }]}>
                待機人数: {state.queuePosition}人
              </Text>
            )}
            
            {/* マッチング成立 */}
            {state.roomId && !state.gameState && (
              <View style={[styles.matchFoundBox, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.matchFoundText, { color: colors.success }]}>
                  ✅ マッチング成立！ゲームを準備中...
                </Text>
                {state.players.map(p => (
                  <Text key={p.id} style={[styles.matchedPlayer, { color: colors.muted }]}>
                    • {p.name}
                  </Text>
                ))}
              </View>
            )}
            
            <Pressable
              onPress={handleCancelSearch}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
            >
              <Text style={[styles.cancelButtonText, { color: colors.muted }]}>
                キャンセル
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backText: {
    fontSize: 17,
    fontWeight: '600',
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  setupContent: {
    flex: 1,
    paddingTop: 20,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  playerCountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
  },
  searchButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  searchingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  searchingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingEmoji: {
    fontSize: 48,
  },
  searchingTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  searchingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  queueInfo: {
    fontSize: 13,
  },
  matchFoundBox: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  matchFoundText: {
    fontSize: 15,
    fontWeight: '700',
  },
  matchedPlayer: {
    fontSize: 13,
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
