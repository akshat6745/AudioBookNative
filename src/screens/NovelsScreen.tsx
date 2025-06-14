import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import ErrorDisplay from "../components/ErrorDisplay";
import Loading from "../components/Loading";
import { fetchAllUserProgress, fetchNovels, uploadEpub } from "../services/api";
import { styles } from "../styles/NovelScreen.styles";
import { Novel, RootStackParamList } from "../types";
import { getCurrentUsername } from "../utils/config";

type NovelsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Novels"
>;

const NovelsScreen = () => {
  const [novels, setNovels] = useState<Novel[]>([]);
  interface ReadingProgress {
    novelName: string;
    lastChapterRead: number | undefined;
  }
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NovelsScreenNavigationProp>();

  // Theme colors
  const backgroundColor = "#0A0A0A"; // Dark background
  const cardBackground = "#1A1A1A"; // Dark card background
  const textColor = "#E8E8E8"; // Light text
  const subtleTextColor = "#888888"; // Subtle text for metadata
  const shadowColor = "#000";

  const loadNovels = async () => {
    try {
      setLoading(true);
      const data = await fetchNovels();
      setNovels(data);
      setError(null);
      const username = await getCurrentUsername();
      if (username) {
        const progressData = await fetchAllUserProgress(username);
        setProgress(
          progressData.progress.map((p) => ({
            ...p,
            lastChapterRead: p.lastChapterRead || undefined,
          }))
        );
      } else {
        setProgress([]);
      }
    } catch (err) {
      setError("Failed to fetch novels. Please try again.");
      console.error("Error loading novels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEpub = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/epub+zip",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setLoading(true);

        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          type: "application/epub+zip",
          name: result.assets[0].name,
        } as any);

        const uploadResult = await uploadEpub(formData);
        await loadNovels();

        Alert.alert(
          "Success",
          `${uploadResult.title} was successfully uploaded`,
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("EPUB upload error:", err);
      Alert.alert(
        "Upload Failed",
        "There was an error uploading the EPUB file. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadNovels();
      // @ts-ignore: Custom event type workaround
      const unsubscribe = (navigation as any).addListener(
        "progressUpdated",
        () => {
          loadNovels();
        }
      );
      return unsubscribe;
    }, [navigation])
  );

  const handleNovelPress = (novelName: string) => {
    navigation.navigate("Chapters", { novelName });
  };

  const handleResumePress = (novelName: string, lastChapter: number) => {
    navigation.navigate("Chapters", { novelName, lastChapter });
  };

  const getLastReadChapter = (novelName: string) => {
    const entry = progress.find((p) => p.novelName === novelName);
    return entry ? entry.lastChapterRead : null;
  };

  const renderNovelItem = (novel: Novel) => {
    const lastRead = getLastReadChapter(novel.title);
    return (
      <TouchableOpacity
        key={novel.title}
        style={[
          styles.novelItem,
          { backgroundColor: cardBackground, shadowColor },
        ]}
        onPress={() =>
          navigation.navigate("Chapters", {
            novelName: novel.title,
            lastChapter: lastRead,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.novelInfo}>
          <Text style={[styles.novelTitle, { color: textColor }]}>
            {novel.title}
          </Text>
          {novel.author && (
            <Text style={[styles.novelAuthor, { color: subtleTextColor }]}>
              by {novel.author}
            </Text>
          )}
          {novel.chapterCount && (
            <Text style={[styles.novelChapters, { color: subtleTextColor }]}>
              {novel.chapterCount} chapters
            </Text>
          )}
          <Text style={[styles.novelSource, { color: subtleTextColor }]}>
            Source: {novel.source === "google_doc" ? "Web Novel" : "EPUB"}
          </Text>
        </View>
        {lastRead && (
          <TouchableOpacity
            style={[styles.resumeButton, { borderColor: textColor }]}
            onPress={() =>
              navigation.navigate("Chapters", {
                novelName: novel.title,
                lastChapter: lastRead,
              })
            }
          >
            <Text style={[styles.resumeText, { color: textColor }]}>
              Continue Ch. {lastRead}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading message="Loading novels..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadNovels} />;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          Available Novels
        </Text>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: "#007AFF" }]}
          onPress={handleUploadEpub}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadButtonText}>Upload EPUB</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>{novels.map((novel) => renderNovelItem(novel))}</ScrollView>
    </View>
  );
};

export default NovelsScreen;
