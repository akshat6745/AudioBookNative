import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { styles } from '../styles/LoginScreen.styles';
import { RootStackParamList } from '../types';
import { API_URL } from '../utils/config';

const LOGIN_KEY = 'userLogin';
const LOGIN_EXPIRY_DAYS = 30;

// Helper to get expiry timestamp
const getExpiryTimestamp = () => {
  const now = new Date();
  now.setDate(now.getDate() + LOGIN_EXPIRY_DAYS);
  return now.getTime();
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // On mount, check for valid login
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOGIN_KEY);
        if (stored) {
          const { username, expiry } = JSON.parse(stored);
          if (username && expiry && Date.now() < expiry) {
            navigation.replace('Novels');
            return;
          } else {
            await AsyncStorage.removeItem(LOGIN_KEY);
          }
        }
      } catch (e) {
        // ignore
      }
      setLoading(false);
    };
    checkLogin();
  }, [navigation]);

  const handleSubmit = async () => {
    try {
      const endpoint = isLogin ? '/userLogin' : '/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        if (isLogin) {
          // Store login info for 30 days
          await AsyncStorage.setItem(
            LOGIN_KEY,
            JSON.stringify({ username, expiry: getExpiryTimestamp() })
          );
          navigation.replace('Novels');
        } else {
          setIsLogin(true);
        }
      } else {
        Alert.alert('Error', data.detail || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server');
    }
  };

  if (loading) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
