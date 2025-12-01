import React, { useState, useEffect, useCallback } from 'react';
import { FlashcardItem } from '../types';
import { getWordsForLevel } from '../utils';

interface TypingModeProps {
  level: string;
  onBack: () => void;
}

const TypingMode = ({ level, onBack }: TypingModeProps) => {
  const [words, setWords] = useState<FlashcardItem[]>([]);
  const [currentWord, setCurrentWord] = useState<FlashcardItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // 1. Memuat kosakata saat komponen pertama kali dijalankan
  useEffect(() => {
    const loadWords = async () => {
      try {
        const data = await getWordsForLevel(level);
        setWords(data);
      } catch (error) {
        console.error('Error loading words:', error);
      }
    };
    loadWords();
  }, [level]);

  // Fungsi untuk memilih kata acak baru
  const selectRandomWord = useCallback(() => {
    if (words.length > 0) {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
    }
  }, [words]);

  // 2. Memilih kata pertama saat kosakata sudah dimuat
  useEffect(() => {
    if (words.length > 0) {
      selectRandomWord();
    }
  }, [words, selectRandomWord]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 3. Logika untuk memeriksa jawaban saat "Enter" ditekan
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!currentWord) return;

      const romaji = ('Romaji' in currentWord ? currentWord.Romaji : currentWord.romaji) || '';

      if (inputValue.toLowerCase() === romaji.toLowerCase()) {
        // Jawaban Benar
        setScore((prev) => prev + 10);
        setInputValue('');
        selectRandomWord();
      } else {
        // Jawaban Salah
        setGameOver(true);
      }
    }
  };

  // Fungsi untuk memulai ulang permainan
  const handleReset = () => {
    setScore(0);
    setInputValue('');
    setGameOver(false);
    selectRandomWord();
  };

  // Tampilan Game Over
  if (gameOver && currentWord) {
    const highScoreKey = `highScore_typing_${level}`;
    const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || '0', 10);

    if (score > currentHighScore) {
      localStorage.setItem(highScoreKey, score.toString());
    }

    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="nes-container with-title is-centered text-center max-w-2xl w-full" style={{ backgroundColor: '#ffffff', borderColor: '#f9a825' }}>
          <p className="title" style={{ color: '#e65100', fontSize: '1.5rem' }}>Game Over</p>
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            <span className="nes-badge">
              <span className="is-primary">Score: {score}</span>
            </span>
            <span className="nes-badge">
              <span className="is-warning">High: {Math.max(score, currentHighScore)}</span>
            </span>
          </div>
          
          <div className="nes-container with-title mb-6" style={{ backgroundColor: '#e3f2fd', borderColor: '#2196f3' }}>
            <p className="title" style={{ color: '#1565c0' }}>Correct Answer</p>
            <p className="text-2xl mb-2" style={{ color: '#0d47a1', fontWeight: 'bold' }}>{'Vocabulary' in currentWord ? currentWord.Vocabulary : currentWord.kana}</p>
            <p style={{ color: '#424242' }}>Romaji: {('Romaji' in currentWord ? currentWord.Romaji : currentWord.romaji)}</p>
            <p style={{ color: '#424242' }}>Meaning: {('Meaning' in currentWord ? currentWord.Meaning : currentWord.meaning)}</p>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={handleReset} type="button" className="nes-btn is-primary">
              Play Again
            </button>
            <button onClick={onBack} type="button" className="nes-btn">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Permainan Utama
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-4">
        <span className="nes-badge">
          <span className="is-primary">Score: {score}</span>
        </span>
      </div>
      
      {currentWord ? (
        <div className="text-center w-full max-w-2xl">
          <div className="nes-container with-title is-centered mb-8" style={{ backgroundColor: '#ffffff' }}>
            <p className="title">Type the Romaji</p>
            <p className="text-6xl font-bold mb-4" style={{ fontFamily: 'monospace' }}>
            {'Vocabulary' in currentWord ? currentWord.Vocabulary : currentWord.kana}
          </p>
          </div>
          <div className="mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
              className="nes-input"
              style={{ width: '100%', maxWidth: '500px', fontSize: '1.5rem', textAlign: 'center' }}
            autoFocus
              placeholder="Type romaji and press Enter"
          />
          </div>
        </div>
      ) : (
        <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff' }}>
          <p className="title">Loading words...</p>
        </div>
      )}

      <button onClick={onBack} type="button" className="nes-btn mt-8">
        Back to Menu
      </button>
    </div>
  );
};

export default TypingMode;