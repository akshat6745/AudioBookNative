import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorDisplay from '../components/ErrorDisplay';
import Loading from '../components/Loading';
import { fetchNovels } from '../services/api';
import { RootStackParamList } from '../types';

type NovelsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Novels'>;

const NovelsScreen = () => {
  const [novels, setNovels] = useState<string[]>([]);
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

  if (loading) {
    return <Loading message="Loading novels..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadNovels} />;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Available Novels</Text>
      <FlatList
        data={novels}
        keyExtractor={(item, index) => `novel-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.novelItem, { backgroundColor: cardBackground, shadowColor }]}
            onPress={() => handleNovelPress(item)}
          >
            <Text style={[styles.novelTitle, { color: textColor }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
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
});

export default NovelsScreen;