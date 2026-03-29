import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useOnlineGame } from '@/lib/online/online-context';
import { PlayerCount } from '@/lib/algo/types';

type RoomMode = 'select' | 'create' | 'join' | 'waiting';

export default function RoomScreen() {
  const router = useRouter();
  const colors = useColors();
  const [mode, setMode] = useState<RoomMode>('select');
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [playerName, setPlayerName] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  
  const { state, connect, disconnect, createRoom, joinRoom } = useOnlineGame();
  
  // ゲーム開始時の処理
  useEffect(() => {
    if (state.gameState) {
      router.replace('/online/game-board' as any);
    }
  }, [state.gameState]);
  
  // ルーム作成成功時
  useEffect(() => {
    if (state.roomId && state.passphrase && mode === 'create') {
      setMode('waiting');
    }
  }, [state.roomId, state.passphrase]);
  
  // ルーム参加成功時
  useEffect(() => {
    if (state.roomId && mode === 'join') {
      setMode('waiting');
    }
  }, [state.roomId]);
  
  const handleCreateRoom = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const name = playerName.trim() || 'ホスト';
    connect();
    setTimeout(() => {
      createRoom(playerCount, name);
    }, 1000);
  };
  
  const handleJoinRoom = () => {
    if (!passphraseInput.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const name = playerName.trim() || `ゲスト${Math.floor(Math.random() * 99) + 1}`;
    connect();
    setTimeout(() => {
      joinRoom(passphraseInput.trim(), name);
    }, 1000);
  };
  
  const handleBack = () => {
    if (mode === 'select') {
      disconnect();
      router.back();
    } else if (mode === 'waiting') {
      disconnect();
      setMode('select');
    } else {
      setMode('select');
    }
  };
  
  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>‹ 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>合言葉ルーム</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* モード選択 */}
          {mode === 'select' && (
            <View style={styles.selectContent}>
              <Text style={[styles.description, { color: colors.muted }]}>
                友達と一緒に遊ぶには、ルームを作成するか、合言葉でルームに参加してください。
              </Text>
              
              <Pressable
                onPress={() => setMode('create')}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={styles.modeCardEmoji}>🏠</Text>
                <View style={styles.modeCardText}>
                  <Text style={[styles.modeCardTitle, { color: colors.foreground }]}>
                    ルームを作成
                  </Text>
                  <Text style={[styles.modeCardDesc, { color: colors.muted }]}>
                    合言葉を発行して友達を招待
                  </Text>
                </View>
                <Text style={[styles.modeCardArrow, { color: colors.muted }]}>›</Text>
              </Pressable>
              
              <Pressable
                onPress={() => setMode('join')}
                style={({ pressed }) => [
                  styles.modeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={styles.modeCardEmoji}>🔑</Text>
                <View style={styles.modeCardText}>
                  <Text style={[styles.modeCardTitle, { color: colors.foreground }]}>
                    ルームに参加
                  </Text>
                  <Text style={[styles.modeCardDesc, { color: colors.muted }]}>
                    合言葉を入力してルームに入る
                  </Text>
                </View>
                <Text style={[styles.modeCardArrow, { color: colors.muted }]}>›</Text>
              </Pressable>
            </View>
          )}
          
          {/* ルーム作成 */}
          {mode === 'create' && (
            <View style={styles.formContent}>
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
              
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>ニックネーム（任意）</Text>
              <TextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="ニックネームを入力"
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
                maxLength={20}
                returnKeyType="done"
              />
              
              {state.errorMessage && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {state.errorMessage}
                </Text>
              )}
              
              <Pressable
                onPress={handleCreateRoom}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={styles.actionButtonText}>ルームを作成する</Text>
              </Pressable>
            </View>
          )}
          
          {/* ルーム参加 */}
          {mode === 'join' && (
            <View style={styles.formContent}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>合言葉を入力</Text>
              <TextInput
                value={passphraseInput}
                onChangeText={setPassphraseInput}
                placeholder="例：赤いネコ123"
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  styles.passphraseInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
                autoCapitalize="none"
                returnKeyType="done"
              />
              
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>ニックネーム（任意）</Text>
              <TextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="ニックネームを入力"
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }
                ]}
                maxLength={20}
                returnKeyType="done"
              />
              
              {state.errorMessage && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {state.errorMessage}
                </Text>
              )}
              
              <Pressable
                onPress={handleJoinRoom}
                disabled={!passphraseInput.trim()}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: passphraseInput.trim() ? colors.warning : colors.border,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }
                ]}
              >
                <Text style={styles.actionButtonText}>ルームに参加する</Text>
              </Pressable>
            </View>
          )}
          
          {/* 待機中 */}
          {mode === 'waiting' && (
            <View style={styles.waitingContent}>
              {/* 合言葉表示（作成者のみ） */}
              {state.passphrase && (
                <View style={[styles.passphraseBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.passphraseLabel, { color: colors.muted }]}>合言葉</Text>
                  <Text style={[styles.passphraseValue, { color: colors.foreground }]}>
                    {state.passphrase}
                  </Text>
                  <Text style={[styles.passphraseHint, { color: colors.muted }]}>
                    この合言葉を友達に教えてください
                  </Text>
                </View>
              )}
              
              {/* 参加者リスト */}
              <View style={[styles.playersBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.playersTitle, { color: colors.foreground }]}>
                  参加者 ({state.players.length}/{state.maxPlayers || '?'})
                </Text>
                {state.players.map((player, index) => (
                  <View key={player.id} style={styles.playerRow}>
                    <View style={[styles.playerDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.playerName, { color: colors.foreground }]}>
                      {player.name}
                      {index === 0 ? ' (ホスト)' : ''}
                    </Text>
                  </View>
                ))}
                
                {/* 空きスロット */}
                {state.maxPlayers && Array.from({ length: state.maxPlayers - state.players.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.playerRow}>
                    <View style={[styles.playerDot, { backgroundColor: colors.border }]} />
                    <Text style={[styles.playerName, { color: colors.muted }]}>
                      待機中...
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={[styles.waitingHint, { color: colors.muted }]}>
                全員揃うと自動的にゲームが始まります
              </Text>
            </View>
          )}
        </ScrollView>
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
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  selectContent: {
    gap: 12,
    paddingTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  modeCardEmoji: {
    fontSize: 28,
  },
  modeCardText: {
    flex: 1,
    gap: 2,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeCardDesc: {
    fontSize: 13,
  },
  modeCardArrow: {
    fontSize: 24,
  },
  formContent: {
    gap: 12,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
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
  textInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passphraseInput: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  waitingContent: {
    gap: 16,
    paddingTop: 8,
  },
  passphraseBox: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  passphraseLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  passphraseValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  passphraseHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  playersBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  playersTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  waitingHint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
