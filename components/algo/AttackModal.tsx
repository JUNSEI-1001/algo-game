import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card, AttackTarget } from '@/lib/algo/types';
import { AlgoCard } from './AlgoCard';
import { useColors } from '@/hooks/use-colors';

interface AttackModalProps {
  visible: boolean;
  targetCard: Card | null;
  targetPlayerName: string;
  onConfirm: (guess: number) => void;
  onCancel: () => void;
  isFirstAttack?: boolean; // 1回目のアタックかどうか
}

export function AttackModal({
  visible,
  targetCard,
  targetPlayerName,
  onConfirm,
  onCancel,
  isFirstAttack = false,
}: AttackModalProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const colors = useColors();
  
  const handleNumberSelect = (num: number) => {
    setSelectedNumber(num);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handleConfirm = () => {
    if (selectedNumber === null) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm(selectedNumber);
    setSelectedNumber(null);
  };
  
  const handleCancel = () => {
    setSelectedNumber(null);
    onCancel();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            アタック
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {targetPlayerName} のカードの数字を当てよう！
          </Text>
          
          {/* ターゲットカード表示 */}
          {targetCard && (
            <View style={styles.targetCardContainer}>
              <AlgoCard
                card={{ ...targetCard, isRevealed: false }}
                isOwn={false}
                size="large"
              />
              <Text style={[styles.cardColorLabel, { color: colors.muted }]}>
                {targetCard.color === 'white' ? '白カード' : '黒カード'}
              </Text>
            </View>
          )}
          
          {/* 数字選択グリッド */}
          <Text style={[styles.selectLabel, { color: colors.foreground }]}>
            数字を選択：
          </Text>
          <View style={styles.numberGrid}>
            {Array.from({ length: 12 }, (_, i) => i).map(num => (
              <Pressable
                key={num}
                onPress={() => handleNumberSelect(num)}
                style={({ pressed }) => [
                  styles.numberButton,
                  {
                    backgroundColor: selectedNumber === num
                      ? colors.primary
                      : colors.background,
                    borderColor: selectedNumber === num
                      ? colors.primary
                      : colors.border,
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  }
                ]}
              >
                <Text style={[
                  styles.numberButtonText,
                  {
                    color: selectedNumber === num
                      ? (colors.primary === '#1a1a2e' ? '#fff' : '#fff')
                      : colors.foreground,
                    fontWeight: selectedNumber === num ? '700' : '500',
                  }
                ]}>
                  {num}
                </Text>
              </Pressable>
            ))}
          </View>
          
          {/* 1回目のアタック時の注記 */}
          {isFirstAttack && (
            <Text style={[styles.firstAttackNote, { color: colors.warning || '#f59e0b' }]}>
              ※ 1回目のアタックはパスできません
            </Text>
          )}
          
          {/* ボタン */}
          <View style={styles.buttonRow}>
            {!isFirstAttack && (
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.cancelButton,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.cancelButtonText, { color: colors.muted }]}>
                  パス
                </Text>
              </Pressable>
            )}
            
            <Pressable
              onPress={handleConfirm}
              disabled={selectedNumber === null}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: selectedNumber !== null ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
            >
              <Text style={[
                styles.confirmButtonText,
                { color: selectedNumber !== null ? '#fff' : colors.muted }
              ]}>
                アタック！
              </Text>
            </Pressable>
            {isFirstAttack && <View style={{ flex: 1 }} />}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  targetCardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardColorLabel: {
    marginTop: 8,
    fontSize: 13,
  },
  selectLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  numberButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    fontSize: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  firstAttackNote: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
});
