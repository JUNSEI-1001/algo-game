import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// シンプルなサウンド再生ユーティリティ
class SoundManager {
  private isEnabled = true;

  async initialize() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
      });
    } catch (error) {
      console.error('[SoundManager] Failed to set audio mode:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

export const soundManager = new SoundManager();

// 便利関数
export async function initializeSounds() {
  await soundManager.initialize();
}

// サウンド再生関数（ダミー実装 - 実際のサウンドはゲーム画面で直接再生）
// 各画面でサウンドを再生する場合は、useAudioPlayerフックを使用してください
// 例：
// const cardDrawPlayer = useAudioPlayer(require('@/assets/sounds/card-draw.mp3'));
// await cardDrawPlayer.playAsync();
