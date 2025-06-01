import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorDisplay from '../components/ErrorDisplay';
import Loading from '../components/Loading';
import { fetchAllUserProgress, fetchNovels } from '../services/api';
import { RootStackParamList } from '../types';
import { getCurrentUsername } from '../utils/config';

type NovelsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Novels'>;

const NovelsScreen = () => {
  const [novels, setNovels] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ novelName: string, lastChapterRead: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NovelsScreenNavigationProp>();

  // Theme colors
  const backgroundColor = '#0A0A0A'; // Dark background
  const cardBackground = '#1A1A1A'; // Dark card background
  const textColor = '#E8E8E8'; // Light text
  const shadowColor = '#000';

  const loadNovels = async () => {
    try {
      setLoading(true);
      const data = await fetchNovels();
      setNovels(data);
      setError(null);
      const username = await getCurrentUsername();
      if (username) {
        fetchAllUserProgress(username).then(data => setProgress(data.progress));
      } else {
        setProgress([]);
      }
    } catch (err) {
      setError('Failed to fetch novels. Please try again.');
      console.error('Error loading novels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNovels();
  }, []);

  const handleNovelPress = (novelName: string) => {
    navigation.navigate('Chapters', { novelName });
  };

  const handleResumePress = (novelName: string, lastChapter: number) => {
    navigation.navigate('Chapters', { novelName, lastChapter });
  };

  const getLastReadChapter = (novelName: string) => {
    const entry = progress.find(p => p.novelName === novelName);
    return entry ? entry.lastChapterRead : null;
  };

  if (loading) {
    return <Loading message="Loading novels..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadNovels} />;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Available Novels</Text>
      <ScrollView>
        {novels.map((novel, idx) => {
          const lastRead = getLastReadChapter(novel);
          return (
            <TouchableOpacity
              key={novel + '-' + idx}
              style={[styles.novelItem, { backgroundColor: cardBackground, shadowColor }]}
              onPress={() => handleNovelPress(novel)}
              activeOpacity={0.85}
            >
              <Text style={[styles.novelTitle, { color: textColor }]}>{novel}</Text>
              {lastRead && (
                <TouchableOpacity
                  style={[styles.resumeContainer, { backgroundColor: cardBackground, borderColor: textColor }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleResumePress(novel, lastRead);
                  }}
                >
                  <Text style={[styles.resumeText, { color: textColor }]}>Continue from Chapter {lastRead}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // backgroundColor will be set dynamically
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    // color will be set dynamically
  },
  novelItem: {
    // backgroundColor will be set dynamically
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    // shadowColor will be set dynamically
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  novelTitle: {
    fontSize: 18,
    // color will be set dynamically
  },
  resumeContainer: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    marginTop: 8,
  },
  resumeText: {
    fontSize: 16,
    fontWeight: 'bold',
    // color will be set dynamically
  },
});

export default NovelsScreen;