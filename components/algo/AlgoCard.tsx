import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Card } from '@/lib/algo/types';
import { useColors } from '@/hooks/use-colors';

interface AlgoCardProps {
  card: Card;
  isOwn?: boolean;        // 自分のカードかどうか（表示制御）
  isSelected?: boolean;   // 選択中かどうか
  isTargetable?: boolean; // アタック対象として選択可能か
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const CARD_SIZES = {
  small: { width: 36, height: 52, fontSize: 16, borderRadius: 6 },
  medium: { width: 48, height: 68, fontSize: 22, borderRadius: 8 },
  large: { width: 64, height: 90, fontSize: 30, borderRadius: 10 },
};

export function AlgoCard({
  card,
  isOwn = false,
  isSelected = false,
  isTargetable = false,
  onPress,
  size = 'medium',
}: AlgoCardProps) {
  const colors = useColors();
  const flipAnim = useSharedValue(card.isRevealed ? 1 : 0);
  const cardSize = CARD_SIZES[size];
  
  useEffect(() => {
    if (card.isRevealed) {
      flipAnim.value = withTiming(1, { duration: 400 });
    }
  }, [card.isRevealed, flipAnim]);
  
  // 数字を表示すべきかどうか：自分のカード OR 表になったカード
  const shouldShowNumber = isOwn || card.isRevealed;
  // 表示する数字：有効な数字があれば表示、なければ「？」
  const displayNumber = (card.number === undefined || card.number === null || card.number === -1) 
    ? '?' 
    : String(card.number);
  
  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipAnim.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [180, 360])}deg` }],
  }));
  
  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipAnim.value, [0, 0.5, 1], [1, 0, 0]),
    transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [0, 180])}deg` }],
  }));

  const isWhite = card.color === 'white';
  
  const cardContent = (
    <View style={[
      styles.cardContainer,
      {
        width: cardSize.width,
        height: cardSize.height,
        borderRadius: cardSize.borderRadius,
      }
    ]}>
      {/* 裏面 */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          {
            width: cardSize.width,
            height: cardSize.height,
            borderRadius: cardSize.borderRadius,
            backgroundColor: isWhite ? '#e8e8e8' : '#2a2a3e',
            borderColor: isSelected ? '#4a9eff' : isTargetable ? '#f59e0b' : (isWhite ? '#ccc' : '#444'),
            borderWidth: isSelected || isTargetable ? 2.5 : 1.5,
          },
          backStyle,
        ]}
      >
        <Text style={[
          styles.cardBackPattern,
          { color: isWhite ? '#bbb' : '#444', fontSize: cardSize.fontSize * 0.6 }
        ]}>
          ?
        </Text>
      </Animated.View>
      
      {/* 表面 */}
      <Animated.View
        style={[
          styles.cardFace,
          {
            width: cardSize.width,
            height: cardSize.height,
            borderRadius: cardSize.borderRadius,
            backgroundColor: isWhite ? '#f8f8f8' : '#1a1a2e',
            borderColor: isSelected ? '#4a9eff' : isTargetable ? '#f59e0b' : (isWhite ? '#ddd' : '#3a3a5e'),
            borderWidth: isSelected || isTargetable ? 2.5 : 1.5,
          },
          frontStyle,
        ]}
      >
        {shouldShowNumber ? (
          <Text style={[
            styles.cardNumber,
            {
              fontSize: cardSize.fontSize,
              color: isWhite ? '#1a1a2e' : '#f8f8f8',
            }
          ]}>
            {displayNumber}
          </Text>
        ) : (
          <Text style={[
            styles.cardBackPattern,
            { color: isWhite ? '#bbb' : '#444', fontSize: cardSize.fontSize * 0.6 }
          ]}>
            ?
          </Text>
        )}
      </Animated.View>
      
      {/* 選択インジケーター */}
      {isSelected && (
        <View style={[styles.selectedIndicator, { borderRadius: cardSize.borderRadius + 2 }]} />
      )}
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : (isSelected ? 1.05 : 1) }] }
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }
  
  return cardContent;
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFace: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: '#2a2a3e',
  },
  cardNumber: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardBackPattern: {
    fontWeight: '700',
  },
  selectedIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4a9eff',
    width: '100%',
    height: '100%',
  },
});
