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

const RULES = [
  {
    step: '1',
    title: 'カードの配布',
    description: '白カード（0〜11）と黒カード（0〜11）の計24枚から、各プレイヤーに4枚ずつ配ります。残りは山札になります。',
    emoji: '🃏',
  },
  {
    step: '2',
    title: 'カードの並べ方',
    description: '手札を数字の小さい順に並べます。同じ数字の場合は白カードを左、黒カードを右に置きます。自分のカードは見えますが、相手のカードは見えません。',
    emoji: '📊',
  },
  {
    step: '3',
    title: 'ターンの進行',
    description: '自分のターンになったら山札から1枚引きます。引いたカードを使って相手のカードをアタックするか、手札に加えてターンを終了します。',
    emoji: '🎯',
  },
  {
    step: '4',
    title: 'アタック',
    description: '相手のカードを1枚選び、数字を予想します。正解なら相手のカードが表になり、もう一度アタックできます。不正解なら引いたカードを手札に加えてターン終了です。',
    emoji: '⚔️',
  },
  {
    step: '5',
    title: '脱落',
    description: '自分の全てのカードが表になったプレイヤーは脱落します。最後まで生き残ったプレイヤーの勝利です！',
    emoji: '🏆',
  },
];

const TIPS = [
  '相手のカードの位置から、数字の範囲を絞り込もう',
  '公開されたカードの情報を活用して推理しよう',
  '同じ数字は白と黒で1枚ずつしかない',
  'パスして手札を増やすのも戦略のうち',
];

export default function HowToPlayScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>‹ 戻る</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>遊び方</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* ゲーム概要 */}
          <View style={[styles.overviewCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.overviewTitle}>ALGO とは？</Text>
            <Text style={styles.overviewText}>
              相手の持つ数字カードを推理して当てるゲームです。
              論理的思考と記憶力を駆使して、相手より先に全カードを解明しよう！
            </Text>
          </View>

          {/* ルール */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ゲームの流れ</Text>
          {RULES.map(rule => (
            <View
              key={rule.step}
              style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumber}>{rule.step}</Text>
              </View>
              <View style={styles.ruleContent}>
                <View style={styles.ruleTitleRow}>
                  <Text style={styles.ruleEmoji}>{rule.emoji}</Text>
                  <Text style={[styles.ruleTitle, { color: colors.foreground }]}>{rule.title}</Text>
                </View>
                <Text style={[styles.ruleDesc, { color: colors.muted }]}>{rule.description}</Text>
              </View>
            </View>
          ))}

          {/* カード説明 */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>カードについて</Text>
          <View style={[styles.cardInfoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardInfoRow}>
              <View style={[styles.cardSample, styles.cardSampleWhite]}>
                <Text style={[styles.cardSampleNum, { color: '#1a1a2e' }]}>5</Text>
              </View>
              <View style={styles.cardInfoText}>
                <Text style={[styles.cardInfoTitle, { color: colors.foreground }]}>白カード</Text>
                <Text style={[styles.cardInfoDesc, { color: colors.muted }]}>0〜11の12枚</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.cardInfoRow}>
              <View style={[styles.cardSample, styles.cardSampleBlack]}>
                <Text style={[styles.cardSampleNum, { color: '#f8f8f8' }]}>5</Text>
              </View>
              <View style={styles.cardInfoText}>
                <Text style={[styles.cardInfoTitle, { color: colors.foreground }]}>黒カード</Text>
                <Text style={[styles.cardInfoDesc, { color: colors.muted }]}>0〜11の12枚</Text>
              </View>
            </View>
          </View>

          {/* 攻略ヒント */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>攻略ヒント</Text>
          <View style={[styles.tipsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {TIPS.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={[styles.tipBullet, { color: colors.primary }]}>💡</Text>
                <Text style={[styles.tipText, { color: colors.muted }]}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 20 }} />
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
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  overviewText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  ruleCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  ruleContent: {
    flex: 1,
    gap: 6,
  },
  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ruleEmoji: {
    fontSize: 16,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  ruleDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  cardInfoBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardSample: {
    width: 44,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSampleWhite: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  cardSampleBlack: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: '#3a3a5e',
  },
  cardSampleNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  cardInfoText: {
    gap: 2,
  },
  cardInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardInfoDesc: {
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  tipsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 14,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
