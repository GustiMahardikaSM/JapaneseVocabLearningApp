import { useState } from 'react';
import { FlashcardType } from '../App';

interface HomeProps {
  onModeSelect: (
    mode: 'flashcard' | 'matching' | 'typing' | 'falling-words',
    level: string,
    type?: FlashcardType
  ) => void;
}

function Home({ onModeSelect }: HomeProps) {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [homeView, setHomeView] = useState<'main' | 'flashcard_options'>('main');

  const handleFlashcardClick = () => {
    if (selectedLevel === 'N5') {
      setHomeView('flashcard_options');
    } else {
      onModeSelect('flashcard', selectedLevel, 'vocabulary');
    }
  };

  if (homeView === 'flashcard_options') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-xl w-full text-center">
          <div className="nes-container with-title is-centered mb-8" style={{ backgroundColor: '#ffffff', borderColor: '#1976d2' }}>
            <p className="title" style={{ color: '#1976d2' }}>N5 Flashcards</p>
          </div>
          <div className="flex flex-col gap-4">
              <button
                onClick={() => onModeSelect('flashcard', selectedLevel, 'vocabulary')}
                type="button"
                className="nes-btn is-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
              >
                Vocabulary
              </button>
              <button
                onClick={() => onModeSelect('flashcard', selectedLevel, 'hiragana')}
                type="button"
                className="nes-btn is-warning"
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
              >
                Hiragana
              </button>
              <button
                onClick={() => onModeSelect('flashcard', selectedLevel, 'katakana')}
                type="button"
                className="nes-btn is-error"
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
              >
                Katakana
              </button>
          </div>
          <button
            onClick={() => setHomeView('main')}
            type="button"
            className="nes-btn mt-8"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
          <div className="nes-container with-title is-centered mb-8" style={{ backgroundColor: '#ffffff', borderColor: '#f9a825' }}>
            <p className="title" style={{ color: '#f57f17' }}>Select JLPT Level</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                type="button"
                className={`nes-btn ${selectedLevel === level ? 'is-success' : 'is-primary'}`}
                style={selectedLevel === level ? { transform: 'scale(1.1)', boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)' } : {}}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff', borderColor: '#8e24aa' }}>
            <p className="title" style={{ color: '#6a1b9a', fontSize: '1.2rem' }}>日本語学習</p>
            <p style={{ color: '#4a148c' }}>Japanese Vocabulary Learning Game</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff', borderColor: '#1976d2' }}>
            <p className="title" style={{ color: '#1976d2' }}>Flashcard</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#424242' }}>
              Study vocabulary with interactive flashcards
            </p>
          <button
            onClick={handleFlashcardClick}
              type="button"
              className="nes-btn is-primary"
              style={{ width: '100%' }}
          >
              Start
            </button>
              </div>

          <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff', borderColor: '#f57c00' }}>
            <p className="title" style={{ color: '#e65100' }}>Matching</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#424242' }}>
              Match kanji with readings and meanings
            </p>
          <button
            onClick={() => onModeSelect('matching', selectedLevel)}
              type="button"
              className="nes-btn is-warning"
              style={{ width: '100%' }}
          >
              Start
            </button>
              </div>

          <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff', borderColor: '#388e3c' }}>
            <p className="title" style={{ color: '#2e7d32' }}>Typing</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#424242' }}>
              Type the romaji for the vocabulary
            </p>
          <button
            onClick={() => onModeSelect('typing', selectedLevel)}
              type="button"
              className="nes-btn is-success"
              style={{ width: '100%' }}
            >
              Start
            </button>
            </div>
          
          <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff', borderColor: '#c2185b' }}>
            <p className="title" style={{ color: '#ad1457' }}>Falling Words</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#424242' }}>
              Type the words before they fall
            </p>
          <button
            onClick={() => onModeSelect('falling-words', selectedLevel)}
              type="button"
              className="nes-btn is-error"
              style={{ width: '100%' }}
            >
              Start
            </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
