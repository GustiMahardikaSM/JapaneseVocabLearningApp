import { useState, useEffect } from 'react';
import Home from './components/Home';
import FlashcardMode from './components/FlashcardMode';
import MatchingMode from './components/MatchingMode';
import TypingMode from './components/TypingMode';
import FallingWordsMode from './components/FallingWordsMode';
import backgroundImage from './asset/Background.png';
import easterEggVideo from './asset/Underdog.mp4';

export type FlashcardType = 'vocabulary' | 'hiragana' | 'katakana';

function App() {
  const [mode, setMode] = useState<'home' | 'flashcard' | 'matching' | 'typing' | 'falling-words'>('home');
  const [selectedLevel, setSelectedLevel] = useState<string>('N5');
  const [flashcardType, setFlashcardType] = useState<FlashcardType>('vocabulary');
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'x') {
        setShowEasterEgg(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleModeSelect = (
    selectedMode: 'flashcard' | 'matching' | 'typing' | 'falling-words',
    level: string,
    type: FlashcardType = 'vocabulary'
  ) => {
    setSelectedLevel(level);
    setFlashcardType(type);
    setMode(selectedMode);
  };

  const handleBack = () => {
    setMode('home');
  };

  const handleVideoEnd = () => {
    setShowEasterEgg(false);
  };

  if (showEasterEgg) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <video
          src={easterEggVideo}
          autoPlay
          muted
          onEnded={handleVideoEnd}
          className="w-screen h-screen object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        padding: '20px'
      }}
    >
      {mode === 'home' && <Home onModeSelect={handleModeSelect} />}
      {mode === 'flashcard' && <FlashcardMode level={selectedLevel} type={flashcardType} onBack={handleBack} />}
      {mode === 'matching' && <MatchingMode level={selectedLevel} onBack={handleBack} />}
      {mode === 'typing' && <TypingMode level={selectedLevel} onBack={handleBack} />}
      {mode === 'falling-words' && <FallingWordsMode level={selectedLevel} onBack={handleBack} />}
    </div>
  );
}

export default App;
