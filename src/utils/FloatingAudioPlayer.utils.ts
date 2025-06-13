import { Audio } from "expo-av";
import { AudioCacheType, LoadingTracker } from "types";
import { fetchAudio } from "../services/api";
// Voice options
export const VOICE_OPTIONS = [
  {
    label: "Ava (Female, US, Multilingual)",
    value: "en-US-AvaMultilingualNeural",
  },
  { label: "Christopher (Male, US)", value: "en-US-ChristopherNeural" },
  { label: "Jenny (Female, US)", value: "en-US-JennyNeural" },
  { label: "Ryan (Male, UK)", value: "en-GB-RyanNeural" },
  {
    label: "Andrew (Male, US, Multilingual)",
    value: "en-US-AndrewMultilingualNeural",
  },
  {
    label: "Emma (Female, US, Multilingual)",
    value: "en-US-EmmaMultilingualNeural",
  },
  { label: "Guy (Male, US)", value: "en-US-GuyNeural" },
  { label: "Michelle (Female, US)", value: "en-US-MichelleNeural" },
  { label: "Steffan (Male, US)", value: "en-US-SteffanNeural" },
];

// Playback speed options
export const SPEED_OPTIONS = [
  { label: "1x", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "1.75x", value: 1.75 },
  { label: "2x", value: 2 },
];

// Helper to generate a cache key based on text and voice
export const getCacheKey = (text: string, voice: string, speed?: number) => {
  // Use a consistent approach - trim text to avoid whitespace differences
  const trimmedText = text.trim();
  // Include speed in cache key if provided
  const speedSuffix = speed ? `:${speed}` : "";
  return `${voice}:${trimmedText}${speedSuffix}`;
};

// Helper to check if a sound is valid
export const isValidSound = async (sound: Audio.Sound): Promise<boolean> => {
  try {
    const status = await sound.getStatusAsync();
    return status.isLoaded;
  } catch (err) {
    console.warn("Sound validation error:", err);
    return false;
  }
};

// Helper to handle audio seeking errors
export const handleAudioSeekingErrors = async (
  sound: Audio.Sound,
  operation: string
): Promise<boolean> => {
  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) {
      console.warn(`Cannot perform ${operation} on unloaded audio`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Audio validation error before ${operation}:`, err);
    return false;
  }
};

// Debug helper function to log cache status
export const logCacheStatus = (
  message: string,
  audioCacheRef: any,
  loadingTrackerRef: any
) => {
  const cacheKeys = Object.keys(audioCacheRef.current);
  const loadingKeys = Object.keys(loadingTrackerRef.current).filter(
    (k) => loadingTrackerRef.current[k]
  );

  // Log cache keys in a more readable format
  if (cacheKeys.length > 0) {
    cacheKeys.forEach((key) => {
      // Extract paragraph number if possible
      const keyParts = key.split(":");
    });
  }
};

export const backgroundColor = "#1A1A1A";
export const textColor = "#E8E8E8";
export const primaryColor = "#4A9EFF";
export const secondaryBackground = "#2A2A2A";
export const errorBackground = "#2D1B1B";
export const errorTextColor = "#FF6B6B";
export const warningTextColor = "#FFB347";
export const shadowColor = "#000";



export const loadAudioForText = async (
  text: string,
  index: number,
  retryCount = 0,
  selectedDialogueVoice: string,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  currentSound: React.MutableRefObject<Audio.Sound | null>,
  audioCacheRef: React.MutableRefObject<AudioCacheType>,
  loadingTrackerRef: React.MutableRefObject<LoadingTracker>,
  onPlaybackStatusUpdate: (status: any) => void,
  playbackSpeed: number,
  selectedVoice: string
): Promise<boolean | undefined> => {
  if (!text || text.trim().length === 0) {
    console.warn(`Cannot load audio for empty text at index ${index}`);
    setError("Cannot play empty text");
    return false;
  }

  try {
    // Safe cleanup of current sound
    if (currentSound.current) {
      try {
        // Remove handler first to prevent callback issues
        currentSound.current.setOnPlaybackStatusUpdate(null);
        await currentSound.current.unloadAsync().catch(() => {});
      } catch (err) {
        console.warn("Error unloading current sound, continuing:", err);
      }
      currentSound.current = null;
    }

    setLoading(true);
    setError(null); // Clear any previous errors

    const cacheKey = getCacheKey(text, selectedVoice);
    // Check if audio is in cache
    if (audioCacheRef.current?.[cacheKey]) {
      try {
        const sound = audioCacheRef.current[cacheKey];

        // Basic validation before proceeding
        const status = await sound
          .getStatusAsync()
          .catch(() => ({ isLoaded: false }));
        if (status.isLoaded) {
          currentSound.current = sound;

          // Safer approach for initializing audio
          try {
            await sound.setPositionAsync(0).catch((e) => {
              console.warn(`Position reset failed: ${e}`);
              throw e;
            });

            await sound.setRateAsync(playbackSpeed, true).catch((e) => {
              console.warn(`Rate setting failed: ${e}`);
              throw e;
            });

            // Set status handler after other operations succeeded
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
            return true;
          } catch (err) {
            console.warn(`Error initializing cached sound: ${err}`);
            delete audioCacheRef.current[cacheKey];
            // Will continue to API loading path
          }
        } else {
          console.warn(`Cached audio for paragraph ${index} is not loaded`);
          delete audioCacheRef.current[cacheKey];
        }
      } catch (err) {
        console.warn(`Error accessing cached audio: ${err}`);
        delete audioCacheRef.current[cacheKey];
      }
    }

    // Check if already loading
    const inProgressKey = `loading:${cacheKey}`;
    if (loadingTrackerRef.current?.[inProgressKey]) {
      try {
        // Wait with timeout
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!loadingTrackerRef.current?.[inProgressKey]) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });

        // Check if now available after waiting
        if (audioCacheRef.current?.[cacheKey]) {
          const sound = audioCacheRef.current?.[cacheKey];
          const status = await sound
            .getStatusAsync()
            .catch(() => ({ isLoaded: false }));

          if (status.isLoaded) {
            currentSound.current = sound;
            await sound.setPositionAsync(0).catch(() => {});
            await sound.setRateAsync(playbackSpeed, true).catch(() => {});
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
            return true;
          } else {
            delete audioCacheRef.current[cacheKey];
          }
        }
      } catch (err) {
        console.warn(`Error waiting for in-progress audio: ${err}`);
        // Continue to load directly
      }
    } else {
      loadingTrackerRef.current[inProgressKey] = true;
      // Now start the async load
      try {
        // Load from API with better error handling
        const audioBlob = await fetchAudio(
          text,
          selectedVoice,
          selectedDialogueVoice
        );
        // Create a timeout promise
        // const timeoutPromise = new Promise((_, reject) => {
        //   setTimeout(() => reject(new Error("Audio loading timeout")), 10000);
        // });

        // Safer loading with explicit error handling
        let sound: Audio.Sound | null = null;
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            {
              uri: URL.createObjectURL(audioBlob),
              headers: {
                Accept: "audio/mp3",
                "Cache-Control": "no-cache",
              },
            },
            { shouldPlay: false }
          );

          sound = newSound;
        } catch (loadErr: any) {
          console.error(`Error creating sound object: ${loadErr}`);
          throw new Error(
            `Failed to load audio: ${loadErr.message || "Unknown error"}`
          );
        }

        if (!sound) {
          throw new Error("Sound creation failed");
        }

        // Configure sound
        try {
          await sound.setRateAsync(playbackSpeed, true);
          sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        } catch (configErr) {
          console.warn(`Error configuring sound: ${configErr}`);
          // Continue anyway, these aren't critical failures
        }

        // Store in cache and current reference
        audioCacheRef.current[cacheKey] = sound;
        currentSound.current = sound;

        return true;
      } finally {
        // Always clear loading flag
        loadingTrackerRef.current[inProgressKey] = false;
      }
    }
  } catch (err: any) {
    console.error(`Error loading audio for paragraph ${index}:`, err);

    // More specific error messages
    if (err.code === "E_AV_SEEKING") {
      setError("Audio seeking error. Please try again.");
    } else if (err.message && err.message.includes("timeout")) {
      setError("Audio loading timed out. Please check your connection.");
    } else {
      setError("Failed to load audio. Please try again.");
    }

    // Try to retry loading a few times before giving up
    if (retryCount < 2) {
      // Short delay before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return loadAudioForText(
        text,
        index,
        retryCount + 1,
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
    }

    return false;
  } finally {
    setLoading(false);
  }
};
