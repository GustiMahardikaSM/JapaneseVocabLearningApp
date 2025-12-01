export interface VocabularyItem {
  Vocabulary: string;
  Furigana: string;
  Romaji: string;
  Meaning: string;
  Type: string;
}

export interface KanaItem {
  kana: string;
  romaji: string;
}

export type FlashcardItem = VocabularyItem | KanaItem;
