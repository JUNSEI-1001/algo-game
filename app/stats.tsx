import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { getGameStats, getGameHistory, GameRecord } from '@/lib/storage/game-history';

export default function StatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getGameStats();
        const historyData = await getGameHistory();
        setStats(statsData);
        setHistory(historyData.slice(0, 10)); // 最新10件
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (loading || !stats) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            読み込み中...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>‹ 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>戦績</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* 統計情報 */}
        <View style={[styles.statsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.totalGames}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              総ゲーム数
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {stats.wins}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              勝利
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.error }]}>
              {stats.losses}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              敗北
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.winRate}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              勝率
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.avgTurns}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              平均ターン
            </Text>
          </View>
        </View>

        {/* モード別統計 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            モード別成績
          </Text>
          
          {[
            { mode: 'AI対戦', key: 'ai' },
            { mode: 'ランダムマッチ', key: 'random' },
            { mode: '合言葉ルーム', key: 'room' },
          ].map(({ mode, key }) => (
            <View
              key={key}
              style={[
                styles.modeStatBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }
              ]}
            >
              <Text style={[styles.modeStatTitle, { color: colors.foreground }]}>
                {mode}
              </Text>
              <Text style={[styles.modeStatText, { color: colors.muted }]}>
                {stats.modeStats[key].total}ゲーム · {stats.modeStats[key].wins}勝
              </Text>
            </View>
          ))}
        </View>

        {/* 最近のゲーム */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              最近のゲーム
            </Text>
            
            {history.map(record => (
              <View
                key={record.id}
                style={[
                  styles.historyBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: record.result === 'win' ? colors.success : colors.error,
                  }
                ]}
              >
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyMode, { color: colors.foreground }]}>
                    {record.mode === 'ai' ? '🤖 AI対戦' : record.mode === 'random' ? '🌐 ランダムマッチ' : '🔑 合言葉ルーム'}
                  </Text>
                  <Text
                    style={[
                      styles.historyResult,
                      { color: record.result === 'win' ? colors.success : colors.error }
                    ]}
                  >
                    {record.result === 'win' ? '勝利' : '敗北'}
                  </Text>
                </View>
                <Text style={[styles.historyDetail, { color: colors.muted }]}>
                  {record.playerCount}人対戦 · {record.turnCount}ターン · {new Date(record.timestamp).toLocaleDateString('ja-JP')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ゲーム数0の場合 */}
        {stats.totalGames === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateEmoji, { fontSize: 48 }]}>📊</Text>
            <Text style={[styles.emptyStateText, { color: colors.foreground }]}>
              まだゲームをプレイしていません
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.muted }]}>
              ゲームをプレイすると統計が表示されます
            </Text>
          </View>
        )}
      </ScrollView>
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
    padding: 20,
    gap: 20,
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
    fontSize: 22,
    fontWeight: '700',
  },
  statsGrid: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '30%',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeStatBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  modeStatTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeStatText: {
    fontSize: 13,
  },
  historyBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyMode: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyResult: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyDetail: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateEmoji: {
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
});
