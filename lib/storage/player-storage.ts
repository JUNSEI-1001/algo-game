import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYER_NAME_KEY = 'algo_player_name';
const SOUND_ENABLED_KEY = 'algo_sound_enabled';

export async function savePlayerName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAYER_NAME_KEY, name);
  } catch (error) {
    console.error('[PlayerStorage] Failed to save player name:', error);
  }
}

export async function getPlayerName(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('[PlayerStorage] Failed to get player name:', error);
    return null;
  }
}

export async function clearPlayerName(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('[PlayerStorage] Failed to clear player name:', error);
  }
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('[PlayerStorage] Failed to save sound enabled:', error);
  }
}

export async function getSoundEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    return value === null ? true : JSON.parse(value);
  } catch (error) {
    console.error('[PlayerStorage] Failed to get sound enabled:', error);
    return true;
  }
}
