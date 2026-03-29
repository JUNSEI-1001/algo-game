import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeContext } from '@/lib/theme-provider';
import { getPlayerName, savePlayerName, getSoundEnabled, saveSoundEnabled } from '@/lib/storage/player-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const loadSettings = async () => {
      const name = await getPlayerName();
      const soundEnabled = await getSoundEnabled();
      if (name) setPlayerName(name);
      setSoundEnabled(soundEnabled);
    };
    loadSettings();
  }, []);

  const handleSavePlayerName = async (name: string) => {
    setPlayerName(name);
    if (name.trim()) {
      await savePlayerName(name.trim());
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    await saveSoundEnabled(value);
  };

  return (
    <ScreenContainer>
      <ScrollView>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>‹ 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>設定</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* 設定項目 */}
        <View style={styles.settingsList}>
          {/* プレイヤー名 */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>プレイヤー</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>ニックネーム</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  ゲームで使用する名前
                </Text>
              </View>
            </View>
            <TextInput
              value={playerName}
              onChangeText={handleSavePlayerName}
              placeholder="ニックネームを入力"
              placeholderTextColor={colors.muted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                }
              ]}
              maxLength={20}
              returnKeyType="done"
            />
          </View>

          {/* 外観 */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>外観</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>ダークモード</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  {isDark ? 'ダーク' : 'ライト'}テーマを使用中
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* サウンド・触覚 */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>サウンド・触覚</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>サウンド</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  ゲーム効果音のON/OFF
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>ハプティクス</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  振動フィードバックのON/OFF
                </Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
                disabled={Platform.OS === 'web'}
              />
            </View>
          </View>

          {/* アプリ情報 */}
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>アプリ情報</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>バージョン</Text>
              <Text style={[styles.settingValue, { color: colors.muted }]}>1.0.0</Text>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
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
  settingsList: {
    gap: 8,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  settingsGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
  },
  settingValue: {
    fontSize: 15,
  },
  divider: {
    height: 0.5,
    marginHorizontal: 16,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
});
