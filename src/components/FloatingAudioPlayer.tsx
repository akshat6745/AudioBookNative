import { FontAwesome5 } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { fetchAudio } from "../services/api";
import { styles } from "../styles/FloatingAudioPlayer.styles";
import {
    AudioCacheType,
    FloatingAudioPlayerProps,
    LoadingTracker,
} from "../types";
import { DEFAULT_PARAGRAPH_VOICE, DEFAULT_VOICE } from "../utils/config";
import {
    SPEED_OPTIONS,
    VOICE_OPTIONS,
    backgroundColor,
    errorBackground,
    errorTextColor,
    getCacheKey,
    isValidSound,
    loadAudioForText,
    logCacheStatus,
    primaryColor,
    secondaryBackground,
    shadowColor,
    textColor,
    warningTextColor,
} from "../utils/FloatingAudioPlayer.utils";

const FloatingAudioPlayer = ({
  paragraphs,
  initialParagraphIndex,
  setActiveParagraphIndex,
  onParagraphComplete,
  onChapterComplete,
  isVisible,
  onClose,
  selectedVoice: propSelectedVoice,
  onVoiceChange,
  playbackSpeed: propPlaybackSpeed,
  onSpeedChange,
}: FloatingAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(
    propSelectedVoice || DEFAULT_VOICE
  );

  const [playbackSpeed, setPlaybackSpeed] = useState(propPlaybackSpeed || 1);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [showDialogueVoiceDropdown, setShowDialogueVoiceDropdown] =
    useState(false);
  const [selectedDialogueVoice, setSelectedDialogueVoice] = useState(
    DEFAULT_PARAGRAPH_VOICE
  );
  const [error, setError] = useState<string | null>(null);
  const [isLastParagraph, setIsLastParagraph] = useState(false);

  // Animation for the player
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Audio references
  const currentSound = useRef<Audio.Sound | null>(null);
  const audioCacheRef = useRef<AudioCacheType>({});
  const isTransitioning = useRef(false);
  const loadingTrackerRef = useRef<LoadingTracker>({});

  // Track the last update time to prevent duplicate calls
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (isVisible) {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      // Load initial audio
      loadAudio();
    } else {
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 100,
        useNativeDriver: true,
      }).start();

      // Pause and unload audio when hidden
      if (currentSound.current) {
        try {
          currentSound.current
            .pauseAsync()
            .catch((err) => console.warn("Error pausing sound on hide:", err));
          setIsPlaying(false);
        } catch (err) {
          console.warn("Error in component hide cleanup:", err);
        }
      }
    }

    return () => {
      // Cleanup all audio when component unmounts
      cleanupAudio();
    };
  }, [isVisible]);

  // Update when initialParagraphIndex changes from parent
  useEffect(() => {
    // Only proceed if the index is valid
    if (
      initialParagraphIndex >= 0 &&
      initialParagraphIndex < paragraphs.length
    ) {
      logCacheStatus(
        "Before paragraph index change",
        audioCacheRef,
        loadingTrackerRef
      );

      // Check if this is the last paragraph in the chapter
      setIsLastParagraph(initialParagraphIndex === paragraphs.length - 1);

      // Reset error state when paragraph changes
      setError(null);

      // Stop current audio
      if (currentSound.current) {
        currentSound.current
          .pauseAsync()
          .catch((err) =>
            console.warn("Error pausing sound during paragraph change:", err)
          );
      }

      // Handle auto-play when transitioning to index 0 (new chapter)
      const isNewChapter = initialParagraphIndex === 0;

      // Don't immediately load audio if not visible
      if (isVisible) {
        // Use setTimeout to avoid state update collisions
        setTimeout(() => {
          const paragraphText = paragraphs[initialParagraphIndex];

          if (paragraphText && paragraphText.trim().length > 0) {
            // Check if we have this paragraph in cache
            const cacheKey = getCacheKey(paragraphText, selectedVoice);

            if (audioCacheRef.current[cacheKey]) {
              try {
                // Get from cache and prepare it
                currentSound.current = audioCacheRef.current[cacheKey];

                // Reset position and update handlers
                currentSound.current
                  .setPositionAsync(0)
                  .then(() =>
                    currentSound.current?.setRateAsync(playbackSpeed, true)
                  )
                  .then(() => {
                    // Set the playback status update handler
                    if (currentSound.current) {
                      currentSound.current.setOnPlaybackStatusUpdate(
                        onPlaybackStatusUpdate
                      );

                      // Auto-play if we were already playing or if this is a new chapter
                      if ((isPlaying || isNewChapter) && currentSound.current) {
                        currentSound.current
                          .playAsync()
                          .then(() => {
                            // Ensure isPlaying state is updated
                            setIsPlaying(true);
                          })
                          .catch((err) =>
                            console.warn(
                              "Error auto-playing after paragraph change:",
                              err
                            )
                          );
                      }

                      // Preload next paragraphs
                      setTimeout(() => {
                        preloadNextParagraphs();
                      }, 300);
                    }
                  })
                  .catch((err) => {
                    console.warn("Error setting up cached audio:", err);
                    // If there's an error with cached audio, fall back to fresh load
                    delete audioCacheRef.current[cacheKey];
                    loadAudioForText(
                      paragraphText,
                      initialParagraphIndex,
                      3,
                      selectedDialogueVoice,
                      setError,
                      setLoading,
                      currentSound,
                      audioCacheRef,
                      loadingTrackerRef,
                      onPlaybackStatusUpdate,
                      playbackSpeed,
                      selectedVoice
                    ).then(() => {
                      // Auto-play the new paragraph if we were already playing or if this is a new chapter
                      if ((isPlaying || isNewChapter) && currentSound.current) {
                        currentSound.current
                          .playAsync()
                          .then(() => {
                            setIsPlaying(true);
                          })
                          .catch((err) =>
                            console.warn(
                              "Error auto-playing after paragraph change:",
                              err
                            )
                          );
                      }
                    });
                  });
              } catch (err) {
                console.warn("Error using cached audio:", err);
                loadAudioForText(
                  paragraphText,
                  initialParagraphIndex,
                  3,
                  selectedDialogueVoice,
                  setError,
                  setLoading,
                  currentSound,
                  audioCacheRef,
                  loadingTrackerRef,
                  onPlaybackStatusUpdate,
                  playbackSpeed,
                  selectedVoice
                ).then(() => {
                  // Auto-play the new paragraph if we were already playing or if this is a new chapter
                  if ((isPlaying || isNewChapter) && currentSound.current) {
                    currentSound.current
                      .playAsync()
                      .then(() => {
                        setIsPlaying(true);
                      })
                      .catch((err) =>
                        console.warn(
                          "Error auto-playing after paragraph change:",
                          err
                        )
                      );
                  }
                });
              }
            } else {
              loadAudioForText(
                paragraphText,
                initialParagraphIndex,
                3,
                selectedDialogueVoice,
                setError,
                setLoading,
                currentSound,
                audioCacheRef,
                loadingTrackerRef,
                onPlaybackStatusUpdate,
                playbackSpeed,
                selectedVoice
              ).then(() => {
                // Auto-play the new paragraph if we were already playing or if this is a new chapter
                if ((isPlaying || isNewChapter) && currentSound.current) {
                  currentSound.current
                    .playAsync()
                    .then(() => {
                      setIsPlaying(true);
                    })
                    .catch((err) =>
                      console.warn(
                        "Error auto-playing after paragraph change:",
                        err
                      )
                    );
                }
              });
            }
          } else {
            console.warn(
              `Cannot load audio for paragraph ${initialParagraphIndex}: invalid or empty text`
            );
            setError("Cannot play this paragraph: empty or invalid text");
          }
        }, 100);
      }
    }
  }, [initialParagraphIndex, isVisible, paragraphs]);

  // Update internal state when props change
  useEffect(() => {
    if (propSelectedVoice && propSelectedVoice !== selectedVoice) {
      setSelectedVoice(propSelectedVoice);
    }
  }, [propSelectedVoice]);

  useEffect(() => {
    if (propPlaybackSpeed && propPlaybackSpeed !== playbackSpeed) {
      setPlaybackSpeed(propPlaybackSpeed);

      // Apply new speed to current sound if it exists
      if (currentSound.current) {
        currentSound.current
          .setRateAsync(propPlaybackSpeed, true)
          .catch((err) =>
            console.warn("Error updating playback speed from props:", err)
          );
      }
    }
  }, [propPlaybackSpeed]);

  const cleanupAudio = async () => {
    // Set flags first to prevent callbacks from firing during cleanup
    isTransitioning.current = true;
    setIsPlaying(false);

    try {
      // First, stop any currently playing audio
      if (currentSound.current) {
        try {
          // Remove the callback first to prevent unexpected behavior
          currentSound.current.setOnPlaybackStatusUpdate(null);
          await currentSound.current.stopAsync().catch(() => {});
          await currentSound.current.unloadAsync().catch(() => {});
        } catch (err) {
          console.warn("Error unloading current sound:", err);
        }
        currentSound.current = null;
      }

      // Clear loading trackers
      loadingTrackerRef.current = {};

      // Clean up cache one by one to prevent overwhelming the audio system
      const cacheKeys = Object.keys(audioCacheRef.current);

      for (const key of cacheKeys) {
        try {
          const sound = audioCacheRef.current[key];
          if (sound) {
            // Try to unload this sound
            await sound.unloadAsync().catch(() => {});
            delete audioCacheRef.current[key];
          }
        } catch (err) {
          console.warn(`Error unloading cached audio ${key}:`, err);
        }
      }

      audioCacheRef.current = {};
    } catch (err) {
      console.error("Error in audio cleanup:", err);
    } finally {
      // Reset transition flag
      isTransitioning.current = false;
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    // Skip if status update is not relevant or too frequent
    if (!status || !status.isLoaded) return;

    // Prevent multiple rapid status updates from causing multiple transitions
    const now = Date.now();
    if (now - lastUpdateRef.current < 300) return; // Throttle updates

    if (status.didJustFinish && !status.isLooping) {
      lastUpdateRef.current = now;

      // Check if we can move to next paragraph
      const nextIndex = initialParagraphIndex + 1;
      if (nextIndex < paragraphs.length && !isTransitioning.current) {
        // If we have more paragraphs, move to the next
        handleNextParagraph();
      } else if (nextIndex >= paragraphs.length) {
        // If we're at the end of all paragraphs, trigger chapter complete
        setIsPlaying(false);
        if (onChapterComplete) {
          onChapterComplete();
        }
        setIsLastParagraph(true);
      }
    }
  };

  const loadAudio = async () => {
    if (isTransitioning.current) return;

    try {
      setLoading(true);

      if (
        initialParagraphIndex >= paragraphs.length ||
        initialParagraphIndex < 0
      ) {
        console.warn(`Invalid paragraph index: ${initialParagraphIndex}`);
        setLoading(false);
        setError("Invalid paragraph index");
        return;
      }

      const currentText = paragraphs[initialParagraphIndex];

      if (!currentText || currentText.trim().length === 0) {
        console.warn(`Empty text for paragraph ${initialParagraphIndex}`);
        setLoading(false);
        setError("Cannot play: empty paragraph text");
        return;
      }

      const success = await loadAudioForText(
        currentText,
        initialParagraphIndex,
        3,
        selectedDialogueVoice,
        setError,
        setLoading,
        currentSound,
        audioCacheRef,
        loadingTrackerRef,
        onPlaybackStatusUpdate,
        playbackSpeed,
        selectedVoice
      );

      // Auto-play if this is the first paragraph (likely a new chapter)
      if (success && currentSound.current && initialParagraphIndex === 0) {
        await currentSound.current.playAsync();
        setIsPlaying(true);
      }

      // Preload next paragraphs if available
      if (initialParagraphIndex < paragraphs.length - 1) {
        // Use setTimeout to not block the main audio loading
        setTimeout(() => {
          preloadNextParagraphs();
        }, 500);
      }
    } catch (err) {
      console.error("Error in loadAudio:", err);
      setError("Failed to load audio");
    } finally {
      setLoading(false);
    }
  };

  // Refactored: Preload next paragraphs until at least 1500 characters are preloaded (current chapter only)
  const preloadNextParagraphs = async () => {
    try {
      logCacheStatus("Before preload", audioCacheRef, loadingTrackerRef);

      const CHAR_THRESHOLD = 1500;
      let uncachedCharCount = 0; // Only count characters of paragraphs that aren't cached
      let i = 1;
      const paragraphsToPreload: { index: number; text: string }[] = [];

      // Accumulate paragraphs after the current one until threshold or end
      while (true) {
        const nextIndex = initialParagraphIndex + i;
        if (nextIndex >= paragraphs.length) break;
        
        const nextText = paragraphs[nextIndex];
        if (!nextText || nextText.trim().length === 0) {
          i++;
          continue;
        }

        const cacheKey = getCacheKey(nextText, selectedVoice);
        const inProgressKey = `loading:${cacheKey}`;
        
        // Only add to preload list if not already cached or being loaded
        if (
          !audioCacheRef.current[cacheKey] &&
          !loadingTrackerRef.current[inProgressKey]
        ) {
          paragraphsToPreload.push({ index: nextIndex, text: nextText });
          uncachedCharCount += nextText.length;
        }

        // Always increment i to move to next paragraph
        i++;
        
        // Break if we have enough uncached characters to preload
        if (uncachedCharCount >= CHAR_THRESHOLD) break;
      }

      console.log(`Preloading ${paragraphsToPreload.length} paragraphs (${uncachedCharCount} characters)`);

      // Process all preloads in parallel for better performance
      const preloadPromises = paragraphsToPreload.map(async ({ index: nextIndex, text: nextText }) => {
        const cacheKey = getCacheKey(nextText, selectedVoice);
        const inProgressKey = `loading:${cacheKey}`;
        
        // Double-check in case another preload started this paragraph
        if (
          audioCacheRef.current[cacheKey] ||
          loadingTrackerRef.current[inProgressKey]
        ) {
          return;
        }

        loadingTrackerRef.current[inProgressKey] = true;
        try {
          const audioBlob = await fetchAudio(
            nextText,
            selectedVoice,
            selectedDialogueVoice
          );
          const loadPromise = Audio.Sound.createAsync(
            {
              uri: URL.createObjectURL(audioBlob),
              headers: {
                Accept: "audio/mp3",
                "Cache-Control": "no-cache",
              },
            },
            { shouldPlay: false }
          );
          const { sound } = (await loadPromise) as { sound: Audio.Sound };
          await sound.setRateAsync(playbackSpeed, true);
          audioCacheRef.current[cacheKey] = sound;
          console.log(`Successfully preloaded paragraph ${nextIndex} (${nextText.length} chars)`);
        } catch (err) {
          console.warn(`Error preloading paragraph ${nextIndex}:`, err);
        } finally {
          // Clean up loading tracker properly
          delete loadingTrackerRef.current[inProgressKey];
        }
      });

      // Wait for all preloads to complete (or fail)
      await Promise.allSettled(preloadPromises);

      logCacheStatus("After preload", audioCacheRef, loadingTrackerRef);
    } catch (err) {
      console.warn("Error during preload:", err);
    }
  };

  const handlePlayPause = async () => {
    if (!currentSound.current) {
      await loadAudio();
      if (!currentSound.current) return;
    }

    try {
      if (isPlaying) {
        await currentSound.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await currentSound.current.playAsync();
        setIsPlaying(true);

        // When starting playback, ensure next paragraphs are preloaded
        setTimeout(() => {
          preloadNextParagraphs();
        }, 300);
      }
    } catch (err) {
      console.error("Error playing/pausing audio:", err);
      setError("Failed to play audio");
    }
  };

  const handleRestart = async () => {
    if (!currentSound.current) {
      await loadAudio();
      if (!currentSound.current) return;
    }

    try {
      await currentSound.current.stopAsync();
      await currentSound.current.playFromPositionAsync(0);
      setIsPlaying(true);
    } catch (err) {
      console.error("Error restarting audio:", err);
      setError("Failed to restart audio");
    }
  };

  const handleRetry = async () => {
    setError(null); // Clear error when retrying

    if (
      initialParagraphIndex >= 0 &&
      initialParagraphIndex < paragraphs.length
    ) {
      const text = paragraphs[initialParagraphIndex];
      // Reset transition state in case we got stuck
      isTransitioning.current = false;

      // Clear all caches for this text to force a fresh load
      const cacheKey = getCacheKey(text, selectedVoice);

      try {
        // Clean up any existing audio objects for current paragraph
        if (audioCacheRef.current[cacheKey]) {
          const existingSound = audioCacheRef.current[cacheKey];
          existingSound.setOnPlaybackStatusUpdate(null);
          await existingSound.unloadAsync().catch(() => {});
          delete audioCacheRef.current[cacheKey];
        }

        // Clear any in-progress flags
        const inProgressKey = `loading:${cacheKey}`;
        loadingTrackerRef.current[inProgressKey] = false;

        // Force a completely fresh load
        if (currentSound.current) {
          currentSound.current.setOnPlaybackStatusUpdate(null);
          await currentSound.current.unloadAsync().catch(() => {});
          currentSound.current = null;
        }

        setLoading(true);
        const success = await loadAudioForText(
          text,
          initialParagraphIndex,
          3,
          selectedDialogueVoice,
          setError,
          setLoading,
          currentSound,
          audioCacheRef,
          loadingTrackerRef,
          onPlaybackStatusUpdate,
          playbackSpeed,
          selectedVoice
        );

        if (success && currentSound.current) {
          try {
            // Only play if we were previously playing
            if (isPlaying) {
              await (currentSound.current as Audio.Sound)
                .playAsync()
                .catch((playErr: any) => {
                  console.warn(`Error playing after retry: ${playErr}`);
                  // If play fails, at least we loaded the audio successfully
                });
            }
          } catch (err) {
            console.error("Error playing audio after retry:", err);
            setError("Audio loaded but failed to play. Try again.");
          }
        }
      } catch (err) {
        console.error("Error during retry operation:", err);
        setError("Retry failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNextParagraph = async () => {
    if (isTransitioning.current) {
      return;
    }

    try {
      const nextIndex = initialParagraphIndex + 1;
      if (nextIndex >= paragraphs.length) {
        setIsPlaying(false);
        return;
      }

      // Check if the next paragraph has valid text
      const nextText = paragraphs[nextIndex];
      if (!nextText || nextText.trim().length === 0) {
        console.warn(
          `Cannot transition to paragraph ${nextIndex}: empty or invalid text`
        );
        setError("Cannot play next paragraph: empty text");
        return;
      }

      isTransitioning.current = true;
      logCacheStatus("Before transition", audioCacheRef, loadingTrackerRef);

      // First safely stop current audio
      if (currentSound.current) {
        try {
          // Remove handler first to prevent callback triggering during transition
          currentSound.current.setOnPlaybackStatusUpdate(null);
          await currentSound.current.stopAsync().catch(() => {});
        } catch (stopErr) {
          console.warn(
            "Error stopping current audio, continuing with transition:",
            stopErr
          );
          // Continue with transition even if stopping fails
        }

        // Reference cleanup in case of errors
        const oldSound = currentSound.current;
        currentSound.current = null;

        // First update the parent's index by calling the setter directly
        setActiveParagraphIndex(nextIndex);

        // Then notify parent about completion
        onParagraphComplete(nextIndex);

        // Set loading state to give visual feedback
        setLoading(true);
        setError(null);
      } else {
        // No current sound, just update indices
        setActiveParagraphIndex(nextIndex);
        onParagraphComplete(nextIndex);
        setLoading(true);
        setError(null);
      }

      // Track playback state
      const wasPlaying = isPlaying;

      // Check if we already have this audio in cache
      const cacheKey = getCacheKey(nextText, selectedVoice);
      const inProgressKey = `loading:${cacheKey}`;

      // If audio is already in the cache, use it directly without loading
      if (audioCacheRef.current[cacheKey]) {
        try {
          const sound = audioCacheRef.current[cacheKey];

          // Verify the sound is still valid before using
          const isValid = await isValidSound(sound);
          if (isValid) {
            // Get from cache and prepare it with safe error handling
            currentSound.current = sound;

            try {
              // Use safe error handling for audio seeking operations
              await currentSound.current.setPositionAsync(0).catch((err) => {
                console.warn(`Error seeking position: ${err}`);
                throw err;
              });

              await currentSound.current
                .setRateAsync(playbackSpeed, true)
                .catch((err) => {
                  console.warn(`Error setting playback rate: ${err}`);
                  throw err;
                });

              currentSound.current.setOnPlaybackStatusUpdate(
                onPlaybackStatusUpdate
              );

              // Play it if we were playing before
              if (wasPlaying) {
                await currentSound.current.playAsync().catch((err) => {
                  console.warn(`Error playing audio: ${err}`);
                  throw err;
                });
              }

              setLoading(false);

              // Try to preload next paragraphs
              setTimeout(() => {
                preloadNextParagraphs();
              }, 300);

              return;
            } catch (seekErr) {
              // If seeking/playing fails, remove from cache and try API load
              console.warn(
                `Audio operation failed for paragraph ${nextIndex}, will reload:`,
                seekErr
              );
              delete audioCacheRef.current[cacheKey];
              currentSound.current = null;
            }
          } else {
            console.warn(
              `Cached audio for paragraph ${nextIndex} is invalid, will reload`
            );
            delete audioCacheRef.current[cacheKey];
          }
        } catch (err) {
          console.warn(
            `Error using cached audio for paragraph ${nextIndex}:`,
            err
          );
          delete audioCacheRef.current[cacheKey];
        }
      }

      // Rest of the function continues as before, attempting API load...
      // Instead of directly handling waiting logic here, let's simplify by using loadAudioForText

      const success = await loadAudioForText(
        nextText,
        nextIndex,
        3,
        selectedDialogueVoice,
        setError,
        setLoading,
        currentSound,
        audioCacheRef,
        loadingTrackerRef,
        onPlaybackStatusUpdate,
        playbackSpeed,
        selectedVoice
      );

      // Play it if we were playing before and loading was successful
      if (success && wasPlaying && currentSound.current) {
        try {
          await currentSound.current.playAsync();
        } catch (err) {
          console.error("Error playing next paragraph:", err);
          setError("Error playing audio");
        }
      }

      logCacheStatus("After transition", audioCacheRef, loadingTrackerRef);
    } catch (err) {
      console.error("Error transitioning to next paragraph:", err);
      setError("Failed to play next paragraph. Please try again.");
    } finally {
      setLoading(false);

      // Ensure transition flag gets cleared even if errors occur
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    }
  };

  const handleVoiceChange = async (voice: string) => {
    if (voice === selectedVoice) {
      setShowVoiceDropdown(false);
      return;
    }

    setSelectedVoice(voice);
    setShowVoiceDropdown(false);

    // Notify parent component about the voice change
    if (onVoiceChange) {
      onVoiceChange(voice);
    }

    // Clear the audio cache since voice changed
    try {
      // Unload all cached audio with previous voice
      for (const key of Object.keys(audioCacheRef.current)) {
        if (key.startsWith(selectedVoice)) {
          try {
            const sound = audioCacheRef.current[key];
            await sound.unloadAsync().catch(() => {});
            delete audioCacheRef.current[key];
          } catch (err) {
            console.warn(`Error unloading cached audio ${key}:`, err);
          }
        }
      }
    } catch (err) {
      console.warn("Error clearing cache for voice change:", err);
    }

    // Reload audio with new voice
    await loadAudio();
  };

  const handleSpeedChange = async (speed: number) => {
    if (speed === playbackSpeed) {
      setShowSpeedDropdown(false);
      return;
    }

    setPlaybackSpeed(speed);
    setShowSpeedDropdown(false);

    if (onSpeedChange) {
      onSpeedChange(speed);
    }

    if (currentSound.current) {
      try {
        await currentSound.current.setRateAsync(speed, true);
      } catch (err) {
        console.error("Error changing playback speed:", err);
      }
    }
  };

  const handleDialogueVoiceChange = async (voice: string) => {
    setSelectedDialogueVoice(voice);
    setShowDialogueVoiceDropdown(false);
  };

  // Render dropdown options in a modal
  const renderDropdownModal = (
    visible: boolean,
    options: any[],
    onSelect: (value: any) => void,
    onClose: () => void,
    title: string
  ) => {
    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <View style={[styles.modalContainer, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {title}
            </Text>
            <ScrollView
              style={styles.optionsScrollView}
              contentContainerStyle={styles.optionsContainer}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    { backgroundColor: secondaryBackground },
                    option.value ===
                      (title.includes("Voice")
                        ? selectedVoice
                        : playbackSpeed) && [
                      styles.selectedOption,
                      {
                        backgroundColor: primaryColor + "20",
                        borderColor: primaryColor,
                      },
                    ],
                  ]}
                  onPress={() => onSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, { color: textColor }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: secondaryBackground },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeButtonText, { color: textColor }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  // Add a failsafe mechanism at the component level
  useEffect(() => {
    // Create a periodic check for stuck transitions
    let stuckTransitionTimer: NodeJS.Timeout;

    const checkForStuckTransitions = () => {
      // If we've been in a transition state for too long (5+ seconds), reset it
      if (isTransitioning.current) {
        // Get the timestamp from a ref if it exists, or add one
        const transitionStartTime =
          (isTransitioning as any).startTime || Date.now();
        const transitionDuration = Date.now() - transitionStartTime;

        // If stuck for more than 5 seconds, force reset
        if (transitionDuration > 5000) {
          console.warn(
            `Transition appears stuck for ${transitionDuration}ms, resetting state`
          );
          isTransitioning.current = false;
          setLoading(false);
          setError("Playback stopped. Please try again.");
        }
      }
    };

    // Run check every 2 seconds
    stuckTransitionTimer = setInterval(checkForStuckTransitions, 2000);

    return () => {
      clearInterval(stuckTransitionTimer);
    };
  }, []);

  // Track when transition starts for timeout detection
  useEffect(() => {
    // When setting isTransitioning.current to true, also set a timestamp
    let originalValue = isTransitioning.current;

    // Override with getter/setter to track transition start time
    Object.defineProperty(isTransitioning, "current", {
      get: function () {
        return originalValue;
      },
      set: function (value) {
        // When setting to true, record the start time
        if (value === true && originalValue === false) {
          (this as any).startTime = Date.now();
        }
        // When setting to false, clear the timer
        if (value === false) {
          (this as any).startTime = undefined;
        }
        originalValue = value;
      },
    });

    // Cleanup on component unmount
    return () => {
      isTransitioning.current = false;
    };
  }, []);

  // Add a useEffect to handle chapter (paragraphs) change and auto-play first paragraph with current settings
  useEffect(() => {
    if (!isVisible) return;
    if (!paragraphs || paragraphs.length === 0) return;

    // When paragraphs change, auto-play the first paragraph with current settings
    // Only trigger if paragraphs array reference changes (i.e., new chapter loaded)
    // This will not interfere with normal paragraph navigation
    (async () => {
      // Stop any current audio
      if (currentSound.current) {
        try {
          currentSound.current.setOnPlaybackStatusUpdate(null);
          await currentSound.current.stopAsync().catch(() => {});
          await currentSound.current.unloadAsync().catch(() => {});
        } catch (err) {
          console.warn(
            "Error stopping/unloading audio during chapter transition:",
            err
          );
        }
        currentSound.current = null;
      }
      setIsPlaying(false);
      setError(null);
      setLoading(true);
      // Load and play the first paragraph
      const firstText = paragraphs[0];
      if (firstText && firstText.trim().length > 0) {
        const success = await loadAudioForText(
          firstText,
          0,
          3,
          selectedDialogueVoice,
          setError,
          setLoading,
          currentSound,
          audioCacheRef,
          loadingTrackerRef,
          onPlaybackStatusUpdate,
          playbackSpeed,
          selectedVoice
        );
        if (success && currentSound.current) {
          try {
            await (currentSound.current as Audio.Sound).playAsync();
            setIsPlaying(true);
          } catch (err) {
            setError("Failed to auto-play new chapter");
          }
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraphs]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          shadowColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <FontAwesome5 name="times" size={24} color={textColor} solid />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Now Playing
        </Text>
      </View>

      {isLastParagraph && (
        <View style={styles.chapterStatusContainer}>
          <Text style={[styles.lastParagraphText, { color: warningTextColor }]}>
            Last paragraph in this chapter
          </Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        {/* Voice and Speed Settings */}
        <View style={styles.settingsContainer}>
          {/* Voice Dropdown */}
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              { backgroundColor: secondaryBackground, shadowColor },
            ]}
            onPress={() => {
              setShowVoiceDropdown(true);
              setShowSpeedDropdown(false);
              setShowDialogueVoiceDropdown(false);
            }}
          >
            <FontAwesome5
              name="user"
              size={18}
              color={primaryColor}
              style={styles.buttonIcon}
              solid
            />
            <Text style={[styles.dropdownButtonText, { color: primaryColor }]}>
              {
                VOICE_OPTIONS.find(
                  (v) => v.value === selectedVoice
                )?.label.split(" ")[0]
              }
            </Text>
            <FontAwesome5
              name="chevron-down"
              size={18}
              color={primaryColor}
              solid
            />
          </TouchableOpacity>

          {/* Dialogue Voice Dropdown */}
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              { backgroundColor: secondaryBackground, shadowColor },
            ]}
            onPress={() => {
              setShowDialogueVoiceDropdown(true);
              setShowVoiceDropdown(false);
              setShowSpeedDropdown(false);
            }}
          >
            <FontAwesome5
              name="comments"
              size={18}
              color={primaryColor}
              style={styles.buttonIcon}
              solid
            />
            <Text style={[styles.dropdownButtonText, { color: primaryColor }]}>
              {
                VOICE_OPTIONS.find(
                  (v) => v.value === selectedDialogueVoice
                )?.label.split(" ")[0]
              }
            </Text>
            <FontAwesome5
              name="chevron-down"
              size={18}
              color={primaryColor}
              solid
            />
          </TouchableOpacity>

          {/* Speed Dropdown */}
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              { backgroundColor: secondaryBackground, shadowColor },
            ]}
            onPress={() => {
              setShowSpeedDropdown(true);
              setShowVoiceDropdown(false);
              setShowDialogueVoiceDropdown(false);
            }}
          >
            <FontAwesome5
              name="tachometer-alt"
              size={18}
              color={primaryColor}
              style={styles.buttonIcon}
              solid
            />
            <Text style={[styles.dropdownButtonText, { color: primaryColor }]}>
              {SPEED_OPTIONS.find((s) => s.value === playbackSpeed)?.label}
            </Text>
            <FontAwesome5
              name="chevron-down"
              size={18}
              color={primaryColor}
              solid
            />
          </TouchableOpacity>
        </View>

        {/* Playback Controls */}
        <View style={styles.playerContainer}>
          {/* Restart Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
            ]}
            onPress={handleRestart}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="redo" size={18} color={primaryColor} solid />
          </TouchableOpacity>

          {/* Play/Pause Button */}
          <TouchableOpacity
            style={[
              styles.playButton,
              { width: 48, height: 48, borderRadius: 24, marginHorizontal: 10 },
            ]}
            onPress={handlePlayPause}
            disabled={loading}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name={isPlaying ? "pause" : "play"}
              size={22}
              color="#fff"
              solid
            />
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
              initialParagraphIndex < paragraphs.length - 1
                ? {}
                : styles.disabledButton,
            ]}
            onPress={handleNextParagraph}
            disabled={
              !(initialParagraphIndex < paragraphs.length - 1) || loading
            }
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="step-forward"
              size={18}
              color={
                initialParagraphIndex < paragraphs.length - 1
                  ? primaryColor
                  : "#666"
              }
              solid
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Selection Modal */}
      {renderDropdownModal(
        showVoiceDropdown,
        VOICE_OPTIONS,
        handleVoiceChange,
        () => setShowVoiceDropdown(false),
        "Select Voice"
      )}

      {/* Dialogue Voice Selection Modal */}
      {renderDropdownModal(
        showDialogueVoiceDropdown,
        VOICE_OPTIONS,
        handleDialogueVoiceChange,
        () => setShowDialogueVoiceDropdown(false),
        "Select Dialogue Voice"
      )}

      {/* Speed Selection Modal */}
      {renderDropdownModal(
        showSpeedDropdown,
        SPEED_OPTIONS,
        handleSpeedChange,
        () => setShowSpeedDropdown(false),
        "Select Speed"
      )}

      {loading && (
        <View style={styles.loadingIndicator}>
          <Text style={{ color: textColor }}>Loading audio...</Text>
        </View>
      )}

      {error && (
        <View
          style={[styles.errorContainer, { backgroundColor: errorBackground }]}
        >
          <Text style={[styles.errorText, { color: errorTextColor }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: errorTextColor, shadowColor },
            ]}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

export default FloatingAudioPlayer;
