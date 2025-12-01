import { useState, useEffect, useCallback, useRef } from 'react';
import { FlashcardItem } from '../types';
import { getWordsForLevel } from '../utils';

interface FallingWordsModeProps { // Menggunakan level sebagai prop
  level: string;
  onBack: () => void;
}

interface FallingWord { // Menggunakan word sebagai prop
  word: FlashcardItem;
  position: { x: number; y: number };
  speed: number;
  id: number;
}

const FallingWordsMode = ({ level, onBack }: FallingWordsModeProps) => { // Menggunakan level sebagai prop
  const [words, setWords] = useState<FlashcardItem[]>([]);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const wordIdCounter = useRef(0);
  const timeRef = useRef(time); // Ref untuk menyimpan waktu
  const [missedWords, setMissedWords] = useState<FallingWord[]>([]);
  
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

  // Selalu update ref saat state time berubah
  // misalnya saat komponen pertama kali dijalankan maka timeRef.current = time. time = 0
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  const addFallingWord = useCallback(() => { // menambahkan kata
    if (words.length > 0) {
      const randomIndex = Math.floor(Math.random() * words.length); //untuk mengacak kata
      const newWord: FallingWord = {
        word: words[randomIndex],
        position: { x: Math.random() * 80 + 10, y: 0 },
        speed: Math.random() * 0.5 + 1, // kecepatan kata
        id: wordIdCounter.current++,
      };
      setFallingWords((prev) => [...prev, newWord]);
    }
  }, [words]);

  useEffect(() => {
    if (gameOver || words.length === 0) return; // Jika game over atau belum memuat kata
    
    // Langsung tambahkan kata pertama
    addFallingWord();
    
    const timerId = setInterval(() => {
      addFallingWord();
    }, Math.max(500, 3000 - timeRef.current * 50)); // untuk menambah kata setiap 5 detik
    return () => {
      clearInterval(timerId);
    };
  }, [addFallingWord, gameOver, words.length]); // Hapus 'time' dari dependensi

  useEffect(() => {
    if (gameOver) return;

    const timerId = setInterval(() => {
      setTime((prevTime) => prevTime + 1); // untuk menambah waktu setiap detik jika game belum selesai
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameOver]);


  useEffect(() => {
    let animationFrameId: number;
    if (!gameOver) {
      const animate = () => {
        setFallingWords((prevWords) => {
          const updatedWords = prevWords.map((fw) => ({
            ...fw,
            position: { ...fw.position, y: fw.position.y + fw.speed },
          }));

          if (updatedWords.some((fw) => fw.position.y > window.innerHeight)) {
            setMissedWords(prevWords); // Simpan kata-kata yang ada di layar
            setGameOver(true);
            return [];
          }
          return updatedWords;
        });
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    if (!inputValue) return;

    const typedLower = inputValue.toLowerCase();

    setFallingWords((prevWords) => {
      const remainingWords = prevWords.filter((fw) => {
        const romaji = ('Romaji' in fw.word ? fw.word.Romaji : fw.word.romaji) || '';
        if (romaji.toLowerCase() === typedLower) {
          setScore((s) => s + 10); // Skor +10
          return false; // Hapus kata dari array
        }
        return true; // Pertahankan kata jika tidak cocok
      });

      if (remainingWords.length < prevWords.length) {
        setInputValue(''); // Reset input jika ada kata yang cocok
      }
      return remainingWords;
    });
  }, [inputValue]);

  // Fungsi untuk memulai ulang permainan
  const handleReset = () => {
    setFallingWords([]);
    setInputValue('');
    setScore(0);
    setTime(0);
    setMissedWords([]);
    setGameOver(false);
    // Kata pertama akan ditambahkan secara otomatis oleh useEffect
  };

  if (gameOver) {
    // Logika untuk High Score dan Waktu Terlama
    const highScoreKey = `highScore_falling_${level}`;
    const longestTimeKey = `longestTime_falling_${level}`;

    const highScore = parseInt(localStorage.getItem(highScoreKey) || '0', 10); // Mengambil skor tertinggi
    const longestTime = parseInt(localStorage.getItem(longestTimeKey) || '0', 10); // Mengambil waktu terlama

    if (score > highScore) {
      localStorage.setItem(highScoreKey, score.toString()); 
    }
    if (time > longestTime) {
      localStorage.setItem(longestTimeKey, time.toString());
    }

    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="nes-container with-title is-centered text-center max-w-2xl w-full" style={{ backgroundColor: '#ffffff', borderColor: '#f9a825' }}>
          <p className="title" style={{ color: '#e65100', fontSize: '1.5rem' }}>Game Over</p>
          
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            <span className="nes-badge">
              <span className="is-primary">Score: {score}</span>
            </span>
            <span className="nes-badge">
              <span className="is-warning">High: {Math.max(score, highScore)}</span>
            </span>
            <span className="nes-badge">
              <span className="is-success">Time: {time}s</span>
            </span>
            <span className="nes-badge">
              <span className="is-error">Longest: {Math.max(time, longestTime)}s</span>
            </span>
          </div>

          {missedWords.length > 0 && (
            <div className="nes-container with-title mb-6" style={{ backgroundColor: '#fce4ec', borderColor: '#e91e63' }}>
              <p className="title" style={{ color: '#c2185b' }}>Missed Words</p>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {missedWords.map(fw => (
                  <div key={fw.id} className="mb-3 p-2" style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #f8bbd0' }}>
                    <p className="text-lg font-semibold" style={{ color: '#880e4f', marginBottom: '0.25rem' }}>{'Vocabulary' in fw.word ? fw.word.Vocabulary : fw.word.kana}</p>
                    <p className="text-sm" style={{ color: '#424242' }}>Romaji: {('Romaji' in fw.word ? fw.word.Romaji : fw.word.romaji)}</p>
                    <p className="text-sm" style={{ color: '#424242' }}>Meaning: {('Meaning' in fw.word ? fw.word.Meaning : fw.word.meaning)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

  // Array icon dan style untuk variasi kata yang jatuh
  const wordStyles = [
    { icon: 'coin', balloonClass: '' }, // Default
    { icon: 'star', balloonClass: 'is-primary' }, // Biru
    { icon: 'heart', balloonClass: 'is-success' }, // Hijau
    { icon: 'trophy', balloonClass: 'is-warning' }, // Kuning
    { icon: 'like', balloonClass: 'is-error' }, // Merah
    { icon: 'coin', balloonClass: '' }, // Default lagi
  ];

  const getWordStyle = (id: number) => { //const ini untuk mengambil style kata
    return wordStyles[id % wordStyles.length];
  };

  return (
    <div className="relative" style={{ minHeight: '80vh', overflow: 'hidden', background: 'transparent' }}>
      {fallingWords.map((fw) => {
        const style = getWordStyle(fw.id);
        return (
          <div
            key={fw.id}
            className={`absolute nes-balloon ${style.balloonClass}`}
            style={{ 
              top: `${fw.position.y}px`, 
              left: `${fw.position.x}%`, 
              transform: 'translateX(-50%)',
              fontSize: '1.5rem',
              fontFamily: 'monospace',
              padding: '0.8rem 1.2rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <i className={`nes-icon ${style.icon} is-medium`}></i>
            <span style={{ fontSize: '1.8rem' }}>
              {'Vocabulary' in fw.word ? fw.word.Vocabulary : fw.word.kana}
            </span>
          </div>
        );
      })}
      <div className="fixed bottom-0 w-full p-4" style={{ backgroundColor: 'transparent' }}>
        <div className="max-w-4xl mx-auto">
          <div className="nes-container with-title is-centered mb-4" style={{ backgroundColor: '#ffffff', borderColor: '#424242', opacity: 0.95 }}>
            <p className="title" style={{ fontSize: '0.9rem' }}>Type the Romaji</p>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className="nes-input"
              style={{ width: '100%', fontSize: '1.3rem', textAlign: 'center', marginTop: '0.5rem' }}
              autoFocus
              placeholder="Type here and press Enter..."
            />
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="nes-badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              <span className="is-primary" style={{ fontSize: '0.9rem' }}>Score: {score}</span>
            </span>
            <span className="nes-badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              <span className="is-primary" style={{ fontSize: '0.9rem' }}>Time: {time}s</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallingWordsMode;