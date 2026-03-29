import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameRecord {
  id: string;
  mode: 'ai' | 'random' | 'room';
  playerCount: 2 | 4;
  playerName: string;
  result: 'win' | 'lose';
  turnCount: number;
  timestamp: number;
  opponentNames?: string[];
}

const GAME_HISTORY_KEY = 'algo_game_history';
const MAX_RECORDS = 100;

export async function saveGameRecord(record: Omit<GameRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    const history = await getGameHistory();
    const newRecord: GameRecord = {
      ...record,
      id: `game_${Date.now()}`,
      timestamp: Date.now(),
    };
    
    const updated = [newRecord, ...history].slice(0, MAX_RECORDS);
    await AsyncStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[GameHistory] Failed to save game record:', error);
  }
}

export async function getGameHistory(): Promise<GameRecord[]> {
  try {
    const data = await AsyncStorage.getItem(GAME_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[GameHistory] Failed to get game history:', error);
    return [];
  }
}

export async function clearGameHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GAME_HISTORY_KEY);
  } catch (error) {
    console.error('[GameHistory] Failed to clear game history:', error);
  }
}

export async function getGameStats() {
  try {
    const history = await getGameHistory();
    
    const totalGames = history.length;
    const wins = history.filter(r => r.result === 'win').length;
    const losses = history.filter(r => r.result === 'lose').length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    const aiGames = history.filter(r => r.mode === 'ai');
    const randomGames = history.filter(r => r.mode === 'random');
    const roomGames = history.filter(r => r.mode === 'room');
    
    const avgTurns = totalGames > 0 
      ? Math.round(history.reduce((sum, r) => sum + r.turnCount, 0) / totalGames)
      : 0;
    
    return {
      totalGames,
      wins,
      losses,
      winRate,
      avgTurns,
      modeStats: {
        ai: {
          total: aiGames.length,
          wins: aiGames.filter(r => r.result === 'win').length,
        },
        random: {
          total: randomGames.length,
          wins: randomGames.filter(r => r.result === 'win').length,
        },
        room: {
          total: roomGames.length,
          wins: roomGames.filter(r => r.result === 'win').length,
        },
      },
    };
  } catch (error) {
    console.error('[GameHistory] Failed to get game stats:', error);
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgTurns: 0,
      modeStats: {
        ai: { total: 0, wins: 0 },
        random: { total: 0, wins: 0 },
        room: { total: 0, wins: 0 },
      },
    };
  }
}
