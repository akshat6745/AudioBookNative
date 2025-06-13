import ky from "ky";
import { PaginatedChapters } from "../types";
import {
  API_URL,
  DEFAULT_PARAGRAPH_VOICE,
  DEFAULT_VOICE,
} from "../utils/config";

// Define interface types for API responses
export interface Novel {
  id: string | null;
  title: string;
  author: string | null;
  chapterCount: number | null;
  source: "google_doc" | "epub_upload";
  coverImage?: string;
}

export interface EpubUploadResponse {
  title: string;
  author: string;
  chapterCount: number;
  message: string;
}

export interface ChapterContent {
  content: string[];
}

export interface UserProgress {
  novelName: string;
  lastChapterRead: number;
}

// API response interfaces for different chapter types
interface BaseChapter {
  chapterNumber: number;
  chapterTitle: string;
}

interface WebNovelChapter extends BaseChapter {
  link: string;
}

interface EpubChapter extends BaseChapter {
  id: string;
}

type ChapterResponse = WebNovelChapter | EpubChapter;

// API response interfaces
interface PaginatedChaptersResponse {
  chapters: ChapterResponse[];
  total_pages: number;
  current_page: number;
}

// Add a counter to track TTS API calls
// This will be used for monitoring and debugging
export const apiMetrics = {
  ttsCallCount: 0,
  ttsCallHistory: [] as {
    timestamp: number;
    textLength: number;
    voice: string;
    paragraph: number;
    url?: string;
    success?: boolean;
    duration?: number;
  }[],
  resetCounters: () => {
    apiMetrics.ttsCallCount = 0;
    apiMetrics.ttsCallHistory = [];
  },
  getCallCount: () => apiMetrics.ttsCallCount,
  getCallHistory: () => apiMetrics.ttsCallHistory,
  getCallsSummary: () => {
    return {
      totalCalls: apiMetrics.ttsCallCount,
      callsIn5Min: apiMetrics.ttsCallHistory.filter(
        (call) => Date.now() - call.timestamp < 5 * 60 * 1000
      ).length,
      callsIn1Hour: apiMetrics.ttsCallHistory.filter(
        (call) => Date.now() - call.timestamp < 60 * 60 * 1000
      ).length,
      successRate:
        apiMetrics.ttsCallHistory.length > 0
          ? apiMetrics.ttsCallHistory.filter((call) => call.success).length /
            apiMetrics.ttsCallHistory.length
          : 0,
    };
  },
};

// Create a ky instance with improved configuration
const api = ky.create({
  prefixUrl: API_URL,
  timeout: false, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeRequest: [
      (request) => {
        console.log(`API Request: ${request.method} ${request.url}`);
      },
    ],
    afterResponse: [
      (request, options, response) => {
        if (!response.ok) {
          console.error("API Error Response:", response.status);
        }
        return response;
      },
    ],
    beforeError: [
      (error) => {
        console.error("API Request Error:", error.message);
        return error;
      },
    ],
  },
});

// API functions
export const fetchNovels = async (): Promise<Novel[]> => {
  try {
    const response = await api.get("novels").json<Novel[]>();
    return response;
  } catch (error) {
    console.error("Error fetching novels:", error);
    throw error;
  }
};

export const uploadEpub = async (
  file: FormData
): Promise<EpubUploadResponse> => {
  try {
    const response = await api
      .post("upload-epub", {
        body: file,
        headers: {
          // Remove Content-Type header to let browser set it with boundary
          "Content-Type": undefined,
        },
      })
      .json<EpubUploadResponse>();
    return response;
  } catch (error) {
    console.error("Error uploading EPUB:", error);
    throw error;
  }
};

// Helper function to determine if a chapter is from web novel
const isWebNovelChapter = (
  chapter: ChapterResponse
): chapter is WebNovelChapter => {
  return "link" in chapter;
};

// Update the fetchChapters function to handle both types
export const fetchChapters = async (
  novelName: string,
  page: number = 1
): Promise<PaginatedChapters> => {
  try {
    const response = await api
      .get(`chapters-with-pages/${encodeURIComponent(novelName)}`, {
        searchParams: { page },
      })
      .json<PaginatedChaptersResponse>();

    return {
      chapters: response.chapters.map((chapter) => ({
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.chapterTitle,
        ...(isWebNovelChapter(chapter)
          ? { link: chapter.link }
          : { id: (chapter as EpubChapter).id }),
      })),
      totalPages: response.total_pages,
      currentPage: response.current_page,
    };
  } catch (error) {
    console.error("Error fetching chapters:", error);
    throw error;
  }
};

export const fetchChapterContent = async (
  novelName: string,
  chapterNumber: number
) => {
  try {
    const response = await api
      .get("chapter", {
        searchParams: {
          novelName,
          chapterNumber,
        },
      })
      .json<{
        chapterTitle: string;
        chapterNumber: number;
        content: string[];
      }>();
    console.log(
      `Fetched content for ${novelName} Chapter ${chapterNumber}: `,
      response
    );
    return response;
  } catch (error) {
    console.error(`Error fetching chapter content:`, error);
    throw error;
  }
};

export const getAudioUrl = (text: string, voice: string = DEFAULT_VOICE) => {
  return `${API_URL}/tts`;
};

export const fetchAudio = async (
  text: string,
  voice: string = DEFAULT_VOICE,
  dialogueVoice: string = DEFAULT_PARAGRAPH_VOICE
) => {
  try {
    const startTime = Date.now();

    // Track API call
    apiMetrics.ttsCallCount++;
    const callIndex = apiMetrics.ttsCallHistory.length;
    apiMetrics.ttsCallHistory.push({
      timestamp: startTime,
      textLength: text.length,
      voice,
      paragraph: -1,
    });

    const response = await api
      .post(`tts-dual-voice`, {
        json: { text, paragraphVoice: voice, dialogueVoice },
      })
      .blob();

    // Update with success
    apiMetrics.ttsCallHistory[callIndex].success = true;
    apiMetrics.ttsCallHistory[callIndex].duration = Date.now() - startTime;

    return response;
  } catch (error) {
    // Update with failure if we have a history entry
    if (apiMetrics.ttsCallHistory.length > 0) {
      const lastIndex = apiMetrics.ttsCallHistory.length - 1;
      apiMetrics.ttsCallHistory[lastIndex].success = false;
    }

    console.error("Error fetching audio:", error);
    throw error;
  }
};

// Get a direct streaming URL for the TTS API (using GET method)
export const getTtsStreamUrl = (text: string, voice: string = DEFAULT_VOICE, paragraphIndex?: number) => {
  // Increment the counter each time a TTS URL is generated
  apiMetrics.ttsCallCount++;
  
  // Create a URL with query parameters for the streaming TTS endpoint
  // Make sure to use GET endpoint as expo-av works better with direct GET URLs
  const url = new URL(`${API_URL}/tts`);
  
  // Add text directly without encoding - the API expects unencoded text
  url.searchParams.append('text', text);
  url.searchParams.append('voice', voice);
  
  // Add cache busting to prevent browsers from caching the audio
  // Use a unique timestamp for each request
  const timestamp = Date.now();
  url.searchParams.append('_cb', timestamp.toString());
  
  // Record the API call in our history
  apiMetrics.ttsCallHistory.push({
    timestamp,
    textLength: text.length,
    voice,
    paragraph: paragraphIndex ?? -1,
    url: url.toString()
  });
  
  return url.toString();
};

// Helper function to log TTS call metrics
export const logTtsMetrics = () => {
  const summary = apiMetrics.getCallsSummary();

  return summary;
};

// Fetch all progress for a user
export async function fetchAllUserProgress(username: string) {
  const res = await fetch(`${API_URL}/user/progress?username=${username}`);
  if (!res.ok) throw new Error("Failed to fetch user progress");
  return res.json();
}

// Fetch progress for a specific novel
export async function fetchUserProgressForNovel(
  username: string,
  novelName: string
) {
  const res = await fetch(
    `${API_URL}/user/progress/${encodeURIComponent(
      novelName
    )}?username=${username}`
  );
  if (!res.ok) throw new Error("Failed to fetch novel progress");
  return res.json();
}

// Save user progress
export async function saveUserProgress(
  username: string,
  novelName: string,
  lastChapterRead: number
) {
  const res = await fetch(`${API_URL}/user/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, novelName, lastChapterRead }),
  });
  if (!res.ok) throw new Error("Failed to save progress");
  return res.json();
}

export default api;