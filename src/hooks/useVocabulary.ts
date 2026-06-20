import { useCallback, useState } from 'react';
import type { VocabularyWord } from '../types';

const STORAGE_KEY = 'sv-vocabulary';

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((next: VocabularyWord[]) => {
    setWords(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be full or unavailable
    }
  }, []);

  const addWord = useCallback(
    (word: Omit<VocabularyWord, 'id' | 'createdAt'>) => {
      const entry: VocabularyWord = {
        ...word,
        id: `vw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
      };
      persist([...words, entry]);
      return entry;
    },
    [words, persist]
  );

  const removeWord = useCallback(
    (id: string) => {
      persist(words.filter(w => w.id !== id));
    },
    [words, persist]
  );

  const hasWord = useCallback(
    (text: string) => words.some(w => w.word === text),
    [words]
  );

  return { words, addWord, removeWord, hasWord };
}
