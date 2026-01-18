
export interface SrtEntry {
  id: string;
  timestamp: string;
  text: string;
}

export interface TranslationState {
  isTranslating: boolean;
  progress: number;
  totalBatches: number;
  currentBatch: number;
  error: string | null;
  completed: boolean;
}

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'id', name: 'Indonesian' },
  { code: 'en', name: 'English' },
  { code: 'jp', name: 'Japanese' },
  { code: 'kr', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
];
