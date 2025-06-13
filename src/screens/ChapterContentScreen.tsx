import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useNavigation as useRawNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import ApiMonitor from '../components/ApiMonitor';
import ErrorDisplay from '../components/ErrorDisplay';
import FloatingAudioPlayer from '../components/FloatingAudioPlayer';
import Loading from '../components/Loading';
import { fetchChapterContent, fetchChapters, logTtsMetrics, saveUserProgress } from '../services/api';
import { styles } from '../styles/ChapterContentScreen.styles';
import { Chapter, RootStackParamList } from '../types';
import { DEFAULT_VOICE, getCurrentUsername } from '../utils/config';

type ChapterContentScreenRouteProp = RouteProp<RootStackParamList, 'ChapterContent'>;
type ChapterContentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChapterContent'>;

// Interface for audio settings that should persist between chapters
interface AudioSettings {
  voice: string;
  playbackSpeed: number;
}

const ChapterContentScreen = () => {
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [loadingNextChapter, setLoadingNextChapter] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    voice: DEFAULT_VOICE,
    playbackSpeed: 1
  });
  const [latestChapterNumber, setLatestChapterNumber] = useState<number | null>(null);

  // Dark theme colors
  const backgroundColor = '#0A0A0A';
  const cardBackground = '#1A1A1A';
  const textColor = '#E8E8E8';
  const subtleTextColor = '#888';
  const primaryColor = '#4A9EFF';
  const successBackground = '#1B2D1B';
  const successTextColor = '#4CAF50';
  const borderColor = '#333';
  const shadowColor = '#000';
  const [showApiMonitor, setShowApiMonitor] = useState(false);
  const [parsedChapterInfo, setParsedChapterInfo] = useState<{
    chapterNumber: number;
    title: string;
    publishedTime: string;
  }>({ chapterNumber: 0, title: '', publishedTime: '' });

  // Use ref to track last active paragraph index to prevent unnecessary scrolling
  const lastActiveIndexRef = useRef(-1);

  const route = useRoute<ChapterContentScreenRouteProp>();
  const navigation = useRawNavigation();
  const typedNavigation = useNavigation<ChapterContentScreenNavigationProp>();
  const { novelName, chapterNumber, chapterTitle } = route.params;
  const flatListRef = useRef<FlatList>(null);

  // Parse the chapter title to extract number, title and published date
  const parseChapterTitle = (rawTitle: string): { chapterNumber: number; title: string; publishedTime: string } => {
    try {
      // Format is typically: "91\nChapter 91 Escape\n2 years ago"
      const parts = rawTitle.split('\n');

      if (parts.length >= 3) {
        // First part is the chapter number, second is the actual title, third is time
        return {
          chapterNumber: parseInt(parts[0], 10) || chapterNumber,
          title: parts[1].trim(),
          publishedTime: parts[2].trim()
        };
      } else if (parts.length === 2) {
        // If format is different, try to extract time from the end
        return {
          chapterNumber: chapterNumber,
          title: parts[0].trim(),
          publishedTime: parts[1].trim()
        };
      } else {
        // Fallback if the format is unexpected
        return {
          chapterNumber: chapterNumber,
          title: rawTitle.trim(),
          publishedTime: ''
        };
      }
    } catch (error) {
      console.error('Error parsing chapter title:', error);
      return {
        chapterNumber: chapterNumber,
        title: rawTitle || `Chapter ${chapterNumber}`,
        publishedTime: ''
      };
    }
  };

  const loadChapterContent = async (novel: string = novelName, chapter: number = chapterNumber) => {
    try {
      setLoading(true);
      const response = await fetchChapterContent(novel, chapter);

      // Update the parsed chapter info with the API response
      const fullTitle = response.chapterTitle;
      const titleParts = fullTitle.split('-');
      const extractedTitle = titleParts.length > 1 ? titleParts[1].trim() : fullTitle.trim();

      setParsedChapterInfo({
        chapterNumber: response.chapterNumber,
        title: extractedTitle,
        publishedTime: '' // This is no longer provided in the new API
      });

      // Add the extracted title as the first paragraph
      
      // Update navigation title
      typedNavigation.setOptions({
        title: `Chapter ${response.chapterNumber}`,
      });
      
      // Handle the content array
      let paragraphArray: string[] = [];
      if (Array.isArray(response.content)) {
        // Filter valid paragraphs
        paragraphArray = response.content.filter((para: any) => 
          typeof para === 'string' && para.trim().length > 0
      );
    }

      if (paragraphArray.length === 0) {
        setError('No readable content found in this chapter.');
      } else {
        setParagraphs([extractedTitle, ...paragraphArray]);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch chapter content. Please try again.');
      console.error('Error loading chapter content:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllChapters = async () => {
    try {
      const paginated = await fetchChapters(novelName);
      setAvailableChapters(paginated.chapters);
      if (paginated.chapters.length > 0) {
        setLatestChapterNumber(paginated.chapters[0].chapterNumber);
      }
      return paginated.chapters;
    } catch (err) {
      console.error('Error loading all chapters:', err);
      return [] as typeof availableChapters;
    }
  };

  useEffect(() => {
    // Parse the chapter title
    const parsedInfo = parseChapterTitle(chapterTitle);
    setParsedChapterInfo(parsedInfo);

    // Set the navigation title
    typedNavigation.setOptions({
      title: `Chapter ${parsedInfo.chapterNumber}`,
    });

    // Load current chapter content
    loadChapterContent(novelName, chapterNumber);

    // Load all available chapters for navigation
    loadAllChapters();
  }, [typedNavigation, novelName, chapterNumber, chapterTitle]);

  // Add a custom back handler
  useEffect(() => {
    // Add a custom handler for when the user presses the back button
    const unsubscribe = typedNavigation.addListener('beforeRemove', (e) => {
      // Navigate back to chapters screen with the current chapter number
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        typedNavigation.navigate('Chapters', {
          novelName,
          lastChapter: chapterNumber
        });
      }
    });

    return unsubscribe;
  }, [typedNavigation, novelName, chapterNumber]);

  const handleParagraphPress = (index: number) => {

    // Validate paragraph index
    if (index < 0 || index >= paragraphs.length) {
      console.warn(`Invalid paragraph index: ${index}`);
      return;
    }

    // Validate paragraph text
    const paragraphText = paragraphs[index];
    if (!paragraphText || paragraphText.trim().length === 0) {
      console.warn(`Empty paragraph at index ${index}`);
      return;
    }

    lastActiveIndexRef.current = index;
    setActiveParagraphIndex(index);
    setShowAudioPlayer(true);
  };

  const handleParagraphComplete = useCallback((newIndex: number) => {

    // Validate new index
    if (newIndex < 0 || newIndex >= paragraphs.length) {
      console.warn(`Invalid next paragraph index: ${newIndex}`);
      return;
    }

    // Only scroll if the index is different from our last scrolled position
    if (newIndex !== lastActiveIndexRef.current) {
      lastActiveIndexRef.current = newIndex;

      // Use a small timeout to ensure the UI updates before scrolling
      setTimeout(() => {
        if (flatListRef.current && paragraphs.length > newIndex) {
          flatListRef.current.scrollToIndex({
            index: newIndex,
            animated: true,
            viewPosition: 0.3 // Position the item closer to the top (0 = top, 1 = bottom)
          });
        }
      }, 100);
    }
  }, [paragraphs.length]);

  const handleChapterComplete = useCallback(async () => {
    if (loadingNextChapter) return;

    if (latestChapterNumber !== null && chapterNumber >= latestChapterNumber) {
      return;
    }

    try {
      setLoadingNextChapter(true);

      // Stop and unload current audio
      setShowAudioPlayer(false);
      setActiveParagraphIndex(-1);

      const nextChapterNumber = chapterNumber + 1;
      try {
        const nextContent = await fetchChapterContent(novelName, nextChapterNumber);

        const nextParagraphs = nextContent.content.filter((para: string) => para.trim().length > 0);

        if (nextParagraphs.length === 0) {
          console.warn('Next chapter has no readable content');
          return;
        }

        // Update navigation title first to give user feedback
        typedNavigation.setOptions({
          title: `Chapter ${nextContent.chapterNumber}`,
        });

        // Update the parsed chapter info state with data from the API
        setParsedChapterInfo({
          chapterNumber: nextContent.chapterNumber,
          title: nextContent.chapterTitle,
          publishedTime: ''
        });

        // Update route params to match the new chapter
        typedNavigation.setParams({
          novelName,
          chapterNumber: nextChapterNumber,
          chapterTitle: `Chapter ${nextChapterNumber}`,
        });

        // Update state with new chapter content
        setParagraphs(nextParagraphs);

        // Save user progress
        const username = await getCurrentUsername();
        if (username) {
          try {
            await saveUserProgress(username, novelName, nextChapterNumber);
          } catch (e) {
            console.error('Failed to save user progress:', e);
          }
        }

        // Start playing from the beginning
        lastActiveIndexRef.current = 0;

        // Important: Use a setTimeout to ensure the component has time to update before we trigger playback
        setTimeout(() => {
          // Set the active paragraph index which will trigger the audio to load
          setActiveParagraphIndex(0);
          // This ensures the audio player remains visible
          setShowAudioPlayer(true);

          // Scroll to top
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
          }
        }, 100);
      } catch (err) {
        console.log('No more chapters available');
      }
    } catch (err) {
      console.error('Error loading next chapter:', err);
    } finally {
      setLoadingNextChapter(false);
    }
  }, [novelName, chapterNumber, typedNavigation, loadingNextChapter, latestChapterNumber]);

  const handleCloseAudioPlayer = () => {
    setShowAudioPlayer(false);
    setActiveParagraphIndex(-1);
    lastActiveIndexRef.current = -1;
  };

  // Handle voice change from the audio player
  const handleVoiceChange = useCallback((voice: string) => {
    setAudioSettings(prev => ({
      ...prev,
      voice
    }));
  }, []);

  // Handle speed change from the audio player
  const handleSpeedChange = useCallback((speed: number) => {
    setAudioSettings(prev => ({
      ...prev,
      playbackSpeed: speed
    }));
  }, []);

  // Add a function to show the API monitor
  const handleShowApiMonitor = () => {
    // Log metrics to console
    logTtsMetrics();
    // Show the monitor UI
    setShowApiMonitor(true);
  };

  // Add function to handle play button press
  const handlePlay = () => {
    if (paragraphs.length > 0) {
      setActiveParagraphIndex(0);
      setShowAudioPlayer(true);
    }
  };

  if (loading) {
    return <Loading message="Loading chapter content..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadChapterContent} />;
  }

  const renderParagraph = ({ item, index }: { item: string, index: number }) => {
    const isActive = index === activeParagraphIndex;

    return (
      <TouchableOpacity
        style={[
          styles.paragraphItem,
          { backgroundColor: cardBackground, shadowColor },
          isActive && [styles.activeParagraphItem, { backgroundColor: successBackground, borderColor: primaryColor }]
        ]}
        onPress={() => handleParagraphPress(index)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.paragraphText,
          { color: textColor },
          isActive && [styles.activeParagraphText, { color: successTextColor }]
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Updated title display to match the format in the screenshot */}
      <View style={styles.chapterTitleContainer}>
        <Text style={[styles.chapterTitle, { color: textColor }]}>{parsedChapterInfo.title}</Text>
        <Text style={[styles.publishedTime, { color: subtleTextColor }]}>{parsedChapterInfo.publishedTime}</Text>
      </View>

      {/* Add the green chapter title card shown in the screenshot */}
      <View style={[styles.chapterTitleCard, { backgroundColor: successBackground, borderColor }]}>
        <Text style={[styles.chapterTitleCardText, { color: successTextColor }]}>{parsedChapterInfo.title}</Text>
      </View>

      {loadingNextChapter && (
        <Text style={[styles.loadingNextChapter, { color: primaryColor }]}>Loading next chapter...</Text>
      )}
      <FlatList
        ref={flatListRef}
        data={paragraphs}
        keyExtractor={(_, index) => `paragraph-${index}`}
        renderItem={renderParagraph}
        contentContainerStyle={styles.contentContainer}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
          // Handle the error with a more robust approach
          setTimeout(() => {
            if (flatListRef.current && paragraphs.length > 0) {
              // Try to scroll to a nearby item instead
              const offset = Math.min(info.index, paragraphs.length - 1);
              flatListRef.current.scrollToIndex({
                index: Math.max(0, offset - 1),
                animated: false
              });

              // Then after a small delay, try the actual index
              setTimeout(() => {
                if (flatListRef.current) {
                  flatListRef.current.scrollToIndex({
                    index: Math.min(info.index, paragraphs.length - 1),
                    animated: true
                  });
                }
              }, 100);
            }
          }, 100);
        }}
        initialNumToRender={10}
        windowSize={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
      />

      <FloatingAudioPlayer
        paragraphs={paragraphs}
        initialParagraphIndex={activeParagraphIndex}
        setActiveParagraphIndex={setActiveParagraphIndex}
        onParagraphComplete={handleParagraphComplete}
        onChapterComplete={handleChapterComplete}
        isVisible={showAudioPlayer}
        onClose={handleCloseAudioPlayer}
        selectedVoice={audioSettings.voice}
        onVoiceChange={handleVoiceChange}
        playbackSpeed={audioSettings.playbackSpeed}
        onSpeedChange={handleSpeedChange}
      />

      {/* Use absolute positioning for buttons */}
      {!showAudioPlayer && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: primaryColor, shadowColor }]}
          onPress={handlePlay}
        >
          <Ionicons name="play" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Debug button */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={handleShowApiMonitor}
      >
        <Ionicons name="analytics-outline" size={20} color="#fff" />
        <Text style={styles.debugButtonText}>API Stats</Text>
      </TouchableOpacity>

      {/* API Monitor */}
      <ApiMonitor
        visible={showApiMonitor}
        onClose={() => setShowApiMonitor(false)}
      />
    </View>
  );
};

export default ChapterContentScreen;