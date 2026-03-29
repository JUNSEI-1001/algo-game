import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const handlePress = (haptic = true) => {
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const modes = [
    {
      id: 'ai',
      title: 'AI対戦',
      subtitle: 'コンピュータと対戦',
      icon: '🤖',
      color: '#4a9eff',
      route: '/game/ai-setup',
    },
    {
      id: 'random',
      title: 'ランダムマッチ',
      subtitle: 'オンラインで見知らぬ人と対戦',
      icon: '🌐',
      color: '#22c55e',
      route: '/online/random',
    },
    {
      id: 'room',
      title: '合言葉ルーム',
      subtitle: '友達と対戦',
      icon: '🔑',
      color: '#f59e0b',
      route: '/online/room',
    },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {/* カードアイコン */}
            <View style={styles.cardStack}>
              <View style={[styles.cardDecor, styles.cardDecorWhite]}>
                <Text style={[styles.cardDecorNumber, { color: '#1a1a2e' }]}>7</Text>
              </View>
              <View style={[styles.cardDecor, styles.cardDecorBlack]}>
                <Text style={[styles.cardDecorNumber, { color: '#f8f8f8' }]}>3</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.appTitle, { color: colors.foreground }]}>ALGO</Text>
          <Text style={[styles.appSubtitle, { color: colors.muted }]}>
            数字推理カードゲーム
          </Text>
        </View>

        {/* モード選択 */}
        <View style={styles.modesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            モードを選択
          </Text>
          {modes.map(mode => (
            <Pressable
              key={mode.id}
              onPress={() => {
                handlePress();
                router.push(mode.route as any);
              }}
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
              <View style={[styles.modeIconContainer, { backgroundColor: mode.color + '20' }]}>
                <Text style={styles.modeIcon}>{mode.icon}</Text>
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={[styles.modeTitle, { color: colors.foreground }]}>
                  {mode.title}
                </Text>
                <Text style={[styles.modeSubtitle, { color: colors.muted }]}>
                  {mode.subtitle}
                </Text>
              </View>
              <Text style={[styles.modeArrow, { color: colors.muted }]}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* フッターリンク */}
        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              handlePress();
              router.push('/how-to-play' as any);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              遊び方を見る
            </Text>
          </Pressable>
          <Text style={[styles.footerDivider, { color: colors.border }]}>|</Text>
          <Pressable
            onPress={() => {
              handlePress();
              router.push('/settings' as any);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              設定
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  cardStack: {
    width: 80,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDecor: {
    position: 'absolute',
    width: 52,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardDecorWhite: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1.5,
    borderColor: '#ddd',
    transform: [{ rotate: '-8deg' }, { translateX: -10 }],
  },
  cardDecorBlack: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: '#3a3a5e',
    transform: [{ rotate: '8deg' }, { translateX: 10 }],
  },
  cardDecorNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
  },
  appSubtitle: {
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 4,
  },
  modesContainer: {
    flex: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIcon: {
    fontSize: 26,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: 13,
  },
  modeArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerDivider: {
    fontSize: 14,
  },
});
