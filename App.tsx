import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RootStackParamList } from './src/types';
import './src/utils/polyfills';

// Import screens
import AudioPlayerScreen from './src/screens/AudioPlayerScreen';
import ChapterContentScreen from './src/screens/ChapterContentScreen';
import ChaptersScreen from './src/screens/ChaptersScreen';
import LoginScreen from './src/screens/LoginScreen';
import NovelsScreen from './src/screens/NovelsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007bff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Sign In' }}
        />
        <Stack.Screen 
          name="Novels" 
          component={NovelsScreen} 
          options={{ title: 'Audiobook Library' }}
        />
        <Stack.Screen 
          name="Chapters" 
          component={ChaptersScreen} 
        />
        <Stack.Screen 
          name="ChapterContent" 
          component={ChapterContentScreen} 
        />
        <Stack.Screen 
          name="AudioPlayer" 
          component={AudioPlayerScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 