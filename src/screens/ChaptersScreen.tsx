import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ErrorDisplay from '../components/ErrorDisplay';
import Loading from '../components/Loading';
import { fetchChapters } from '../services/api';
import { Chapter, PaginatedChapters, RootStackParamList } from '../types';

type ChaptersScreenRouteProp = RouteProp<RootStackParamList, 'Chapters'>;
type ChaptersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chapters'>;

const ChaptersScreen = () => {
  const [chaptersData, setChaptersData] = useState<PaginatedChapters>({
    chapters: [],
    totalPages: 1,
    currentPage: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [latestChapter, setLatestChapter] = useState<Chapter | null>(null);
  const [gotoPage, setGotoPage] = useState('');

  const route = useRoute<ChaptersScreenRouteProp>();
  const navigation = useNavigation<ChaptersScreenNavigationProp>();
  const { novelName, lastChapter } = route.params;

  // Dark theme colors
  const backgroundColor = '#0A0A0A';
  const cardBackground = '#1A1A1A';
  const textColor = '#E8E8E8';
  const subtleTextColor = '#888';
  const primaryColor = '#4A9EFF';
  const successBackground = '#1B2D1B';
  const successTextColor = '#4CAF50';
  const infoBackground = '#1B2A2D';
  const borderColor = '#333';
  const shadowColor = '#000';
  const secondaryBackground = '#2A2A2A';

  // If lastChapter is passed through navigation params, use it
  useEffect(() => {
    if (lastChapter) {
      setLastReadChapter(lastChapter);
    }
  }, [lastChapter]);

  const loadChapters = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await fetchChapters(novelName, page);

      // Extract the latest chapter (first chapter in the first page)
      if (page === 1 && data.chapters.length > 0) {
        // Check if the first chapter has the highest chapter number (indicating it's the newest)
        const possibleLatest = [...data.chapters].sort((a, b) => b.chapterNumber - a.chapterNumber)[0];
        setLatestChapter(possibleLatest);
      }

      setChaptersData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch chapters. Please try again.');
      console.error('Error loading chapters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: novelName,
    });

    loadChapters();
  }, [navigation, novelName]);

  const handleChapterPress = (chapter: Chapter) => {
    // Update last read chapter
    setLastReadChapter(chapter.chapterNumber);

    navigation.navigate('ChapterContent', {
      novelName,
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.chapterTitle,
    });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= chaptersData.totalPages && page !== chaptersData.currentPage) {
      loadChapters(page);
    }
  };

  const renderPaginationControls = () => {
    if (chaptersData.totalPages <= 1) return null;

    const currentPage = chaptersData.currentPage;
    const totalPages = chaptersData.totalPages;

    // Generate page numbers to show (current, prev, next, first, last, and some neighbors)
    let pageNumbers: number[] = [currentPage];

    // Always add first and last pages
    if (currentPage > 1) pageNumbers.push(1);
    if (currentPage < totalPages) pageNumbers.push(totalPages);

    // Add some neighbors if we have pages between
    if (currentPage > 2) pageNumbers.push(currentPage - 1);
    if (currentPage < totalPages - 1) pageNumbers.push(currentPage + 1);

    // Add additional neighbors
    if (currentPage > 3) pageNumbers.push(currentPage - 2);
    if (currentPage < totalPages - 2) pageNumbers.push(currentPage + 2);

    // Sort and deduplicate
    pageNumbers = [...new Set(pageNumbers)].sort((a, b) => a - b);

    return (
      <View style={styles.paginationControlsContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, { borderColor: primaryColor }, currentPage === 1 && [styles.paginationButtonDisabled, { borderColor: subtleTextColor }]]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? subtleTextColor : primaryColor} />
        </TouchableOpacity>

        <View style={styles.pageNumbersContainer}>
          {pageNumbers.map((page, index) => {
            // Check if we need to render ellipsis
            const prevPage = pageNumbers[index - 1];
            const showLeftEllipsis = prevPage && page - prevPage > 1;

            return (
              <React.Fragment key={`page-${page}`}>
                {showLeftEllipsis && (
                  <Text style={[styles.ellipsis, { color: subtleTextColor }]}>...</Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.pageNumberButton,
                    { backgroundColor: secondaryBackground },
                    currentPage === page && [styles.currentPageButton, { backgroundColor: primaryColor }]
                  ]}
                  onPress={() => goToPage(page)}
                >
                  <Text style={[
                    styles.pageNumberText,
                    { color: textColor },
                    currentPage === page && styles.currentPageText
                  ]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, { borderColor: primaryColor }, currentPage === totalPages && [styles.paginationButtonDisabled, { borderColor: subtleTextColor }]]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? subtleTextColor : primaryColor} />
        </TouchableOpacity>
      </View>
    );
  };

  // Add a utility function to parse the chapterTitle format
  const parseChapterTitle = (rawTitle: string): { title: string; publishedTime: string } => {
    try {
      // Format is typically: "91\nChapter 91 Escape\n2 years ago"
      const parts = rawTitle.split('\n');

      if (parts.length >= 3) {
        // First part is the chapter number, second is the actual title, third is time
        return {
          title: parts[1].trim(),
          publishedTime: parts[2].trim()
        };
      } else if (parts.length === 2) {
        // If format is different, try to extract time from the end
        return {
          title: parts[0].trim(),
          publishedTime: parts[1].trim()
        };
      } else {
        // Fallback if the format is unexpected
        return {
          title: rawTitle.trim(),
          publishedTime: '2 years ago' // Default time
        };
      }
    } catch (error) {
      console.error('Error parsing chapter title:', error);
      return {
        title: rawTitle || 'Unknown Title',
        publishedTime: '2 years ago'
      };
    }
  };

  const renderLatestChapter = () => {
    if (!latestChapter) return null;

    const { title, publishedTime } = parseChapterTitle(latestChapter.chapterTitle);

    return (
      <View style={[styles.latestChapterContainer, { backgroundColor: cardBackground, shadowColor }]}>
        <View style={[styles.latestChapterHeader, { backgroundColor: primaryColor }]}>
          <Text style={styles.latestChapterHeaderText}>Latest Chapter</Text>
          <View style={styles.newTag}>
            <Text style={styles.newTagText}>NEW</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.latestChapterCard}
          onPress={() => handleChapterPress(latestChapter)}
        >
          <View style={styles.chapterItemContent}>
            <Text style={[styles.chapterMainTitle, { color: textColor }]}>{title}</Text>
            <Text style={[styles.chapterDetailDate, { color: subtleTextColor }]}>{publishedTime}</Text>
          </View>
          <View style={styles.latestChapterAction}>
            <Ionicons name="book" size={24} color={primaryColor} />
            <Text style={[styles.readNowText, { color: primaryColor }]}>Read Now</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <Loading message="Loading chapters..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={() => loadChapters(1)} />;
  }

  // Filter out the latest chapter from the regular chapter list if it's being featured
  const regularChapters = latestChapter
    ? chaptersData.chapters.filter(c => c.chapterNumber !== latestChapter.chapterNumber)
    : chaptersData.chapters;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.title, { color: textColor }]}>{novelName}</Text>

        {renderLatestChapter()}

        {lastReadChapter && (
          <TouchableOpacity
            style={[styles.resumeContainer, { backgroundColor: infoBackground, borderColor: primaryColor }]}
            onPress={() => {
              const lastChapter = chaptersData.chapters.find(c => c.chapterNumber === lastReadChapter);
              if (lastChapter) {
                handleChapterPress(lastChapter);
              }
            }}
          >
            <Ionicons name="play-circle" size={24} color={primaryColor} />
            <Text style={[styles.resumeText, { color: primaryColor }]}>
              Resume Chapter {lastReadChapter}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TextInput
            style={{
              backgroundColor: secondaryBackground,
              color: textColor,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              width: 80,
              marginRight: 8,
              borderWidth: 1,
              borderColor: borderColor,
            }}
            placeholder="Go to page"
            placeholderTextColor={subtleTextColor}
            keyboardType="number-pad"
            value={gotoPage}
            onChangeText={setGotoPage}
            onSubmitEditing={() => {
              const pageNum = parseInt(gotoPage, 10);
              if (!isNaN(pageNum)) goToPage(pageNum);
            }}
            returnKeyType="go"
          />
          <TouchableOpacity
            style={{
              backgroundColor: primaryColor,
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
            onPress={() => {
              const pageNum = parseInt(gotoPage, 10);
              if (!isNaN(pageNum)) goToPage(pageNum);
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.chapterListContainer, { backgroundColor: cardBackground, shadowColor }]}>
          <View style={styles.chapterListHeader}>
            <Text style={[styles.chapterListTitle, { color: textColor }]}>All Chapters</Text>
            <View style={[styles.chapterCountBadge, { backgroundColor: secondaryBackground }]}>
              <Text style={[styles.chapterCountText, { color: subtleTextColor }]}>
                {chaptersData.chapters.length} chapters
              </Text>
            </View>
          </View>

          {chaptersData.totalPages > 1 && (
            <View style={[styles.paginationInfo, { backgroundColor: secondaryBackground }]}>
              <Text style={[styles.paginationText, { color: subtleTextColor }]}>
                Page {chaptersData.currentPage} of {chaptersData.totalPages}
              </Text>
            </View>
          )}

          {renderPaginationControls()}

          {regularChapters.map((item) => {
            const { title, publishedTime } = parseChapterTitle(item.chapterTitle);

            return (
              <TouchableOpacity
                key={`chapter-${item.chapterNumber}`}
                style={[
                  styles.chapterItem,
                  { backgroundColor: cardBackground, borderColor },
                  lastReadChapter === item.chapterNumber && [styles.lastReadChapterItem, { backgroundColor: infoBackground, borderColor: primaryColor }]
                ]}
                onPress={() => handleChapterPress(item)}
              >
                <View style={styles.chapterItemContent}>
                  <Text style={[styles.chapterMainTitle, { color: textColor }]}>{title}</Text>
                  <Text style={[styles.chapterDetailDate, { color: subtleTextColor }]}>{publishedTime}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={subtleTextColor}
                  style={styles.chapterItemIcon}
                />
              </TouchableOpacity>
            );
          })}

          {renderPaginationControls()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set dynamically
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    // color will be set dynamically
  },
  latestChapterContainer: {
    marginBottom: 24,
    borderRadius: 12,
    // backgroundColor will be set dynamically
    // shadowColor will be set dynamically
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  latestChapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    padding: 12,
  },
  latestChapterHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  newTag: {
    backgroundColor: '#ff3b30',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  latestChapterCard: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  latestChapterContent: {
    flex: 1,
  },
  chapterHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    // color will be set dynamically
  },
  latestChapterTitle: {
    fontSize: 16,
    // color will be set dynamically
    marginTop: 4,
  },
  chapterDate: {
    fontSize: 14,
    // color will be set dynamically
    marginTop: 4,
  },
  latestChapterAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  readNowText: {
    // color will be set dynamically
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  chapterListContainer: {
    // backgroundColor will be set dynamically
    borderRadius: 12,
    padding: 16,
    // shadowColor will be set dynamically
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chapterListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // color will be set dynamically
  },
  chapterCountBadge: {
    // backgroundColor will be set dynamically
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  chapterCountText: {
    // color will be set dynamically
    fontSize: 12,
    fontWeight: '500',
  },
  paginationInfo: {
    // backgroundColor will be set dynamically
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  paginationText: {
    // color will be set dynamically
    fontWeight: '500',
    textAlign: 'center',
  },
  paginationControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  paginationButton: {
    padding: 8,
    borderWidth: 1,
    // borderColor will be set dynamically
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationButtonDisabled: {
    // borderColor will be set dynamically
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    flex: 1,
  },
  pageNumberButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor will be set dynamically
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  currentPageButton: {
    // backgroundColor will be set dynamically
  },
  pageNumberText: {
    // color will be set dynamically
    fontSize: 14,
    fontWeight: '500',
  },
  currentPageText: {
    color: 'white',
  },
  ellipsis: {
    // color will be set dynamically
    marginHorizontal: 4,
  },
  resumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    // borderColor will be set dynamically
  },
  resumeText: {
    fontSize: 16,
    fontWeight: 'bold',
    // color will be set dynamically
    marginLeft: 8,
  },
  chapterItem: {
    // backgroundColor will be set dynamically
    padding: 16,
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    // borderColor will be set dynamically
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterItemContent: {
    flex: 1,
  },
  chapterItemIcon: {
    marginLeft: 8,
  },
  lastReadChapterItem: {
    // backgroundColor will be set dynamically
    borderWidth: 1,
    // borderColor will be set dynamically
    borderLeftWidth: 4,
    // borderLeftColor will be set dynamically
  },
  chapterMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // color will be set dynamically
    marginBottom: 8,
  },
  chapterDetailNumber: {
    fontSize: 15,
    // color will be set dynamically
  },
  chapterDetailTitle: {
    fontSize: 15,
    // color will be set dynamically
  },
  chapterDetailDate: {
    fontSize: 14,
    // color will be set dynamically
    marginTop: 2,
  },
});

export default ChaptersScreen;