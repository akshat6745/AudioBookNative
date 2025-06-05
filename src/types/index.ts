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