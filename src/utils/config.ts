// Configuration settings for the app

// Backend API URL - change this if your server runs on a different host or port
export const API_URL = 'http://localhost:8080';
// export const API_URL = 'https://audiobookpython-200053699763.asia-south2.run.app/';

// Default TTS voice
export const DEFAULT_VOICE = 'en-US-AvaMultilingualNeural';

// App theme colors
export const COLORS = {
  primary: '#007bff',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: 'rgba(0, 0, 0, 0.1)',
  error: '#ff3b30',
};

import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOGIN_KEY = 'userLogin';

export async function getCurrentUsername(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(LOGIN_KEY);
    if (stored) {
      const { username, expiry } = JSON.parse(stored);
      if (username && expiry && Date.now() < expiry) {
        return username;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
} 