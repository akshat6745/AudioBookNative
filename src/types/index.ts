import { Audio } from "expo-av";
export interface Novel {
  id: string | null;
  title: string;
  author: string | null;
  chapterCount: number | null;
  source: 'google_doc' | 'epub_upload';
}

export interface BaseChapter {
  chapterNumber: number;
  chapterTitle: string;
}

export interface WebNovelChapter extends BaseChapter {
  link: string;
}

export interface EpubChapter extends BaseChapter {
  id: string;
}

export type Chapter = WebNovelChapter | EpubChapter;

export interface PaginatedChapters {
  chapters: Chapter[];
  totalPages: number;
  currentPage: number;
}

export type RootStackParamList = {
  Home: undefined;
  Novels: undefined;
  Chapters: { 
    novelName: string; 
    lastChapter?: number;
  };
  ChapterContent: { 
    novelName: string; 
    chapterNumber: number; 
    chapterTitle: string;
  };
  AudioPlayer: { text: string; title: string, paragraphs: string[], paragraphIndex: number };
  [key: string]: undefined | object;
} 


export type FloatingAudioPlayerProps = {
  paragraphs: string[];
  initialParagraphIndex: number;
  setActiveParagraphIndex: (index: number) => void;
  onParagraphComplete: (index: number) => void;
  onChapterComplete?: () => void; // Callback when all paragraphs in chapter are finished
  isVisible: boolean;
  onClose: () => void;
  selectedVoice?: string; // Optional prop to control the voice from parent
  onVoiceChange?: (voice: string) => void; // Callback when voice changes
  playbackSpeed?: number; // Optional prop to control the speed from parent
  onSpeedChange?: (speed: number) => void; // Callback when speed changes
};

export type AudioCacheType = {
  [key: string]: Audio.Sound;
};

export interface LoadingTracker {
  [key: string]: boolean;
}