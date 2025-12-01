// Impor hook dari React untuk manajemen state, efek samping, dan memoization fungsi.
import { useState, useEffect, useCallback } from 'react';
// Impor tipe data dan fungsi utilitas yang diperlukan.
import { VocabularyItem } from '../types';
import { getWordsForLevel, shuffleArray } from '../utils';

/**
 * @interface MatchingModeProps
 * Mendefinisikan properti (props) yang diterima oleh komponen MatchingMode.
 */
interface MatchingModeProps {
  level: string; // Level kesulitan yang dipilih (misal: "N5").
  onBack: () => void; // Fungsi untuk kembali ke menu sebelumnya.
}

/**
 * @interface MatchingCard
 * Mendefinisikan struktur data untuk sebuah kartu dalam permainan mencocokkan.
 */
interface MatchingCard {
  id: string; // ID unik untuk setiap kartu.
  content: string; // Teks yang ditampilkan di kartu (Kanji, Furigana, atau Arti).
  type: 'kanji' | 'reading' | 'meaning'; // Tipe kartu untuk membedakan isinya.
  matchId: string; // ID bersama untuk kartu-kartu yang merupakan satu set (Kanji, Furigana, Arti dari kata yang sama).
}

/**
 * @function MatchingMode
 * Komponen utama untuk mode permainan mencocokkan set kartu (Kanji, Reading, Meaning).
 */
function MatchingMode({ level: initialLevel, onBack }: MatchingModeProps) {
  // State untuk menyimpan seluruh daftar kosakata untuk level saat ini.
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  // State untuk menyimpan kartu-kartu yang akan ditampilkan di papan permainan untuk ronde saat ini.
  const [cards, setCards] = useState<MatchingCard[]>([]);
  // State untuk menyimpan kartu yang sedang dipilih oleh pemain (maksimal 3).
  const [selectedCards, setSelectedCards] = useState<MatchingCard[]>([]);
  // State untuk menyimpan ID dari kartu-kartu yang sudah berhasil dicocokkan.
  const [matchedCards, setMatchedCards] = useState<Set<string>>(new Set());
  // State untuk status proses memuat data kosakata.
  const [loading, setLoading] = useState(true);
  // State untuk skor pemain saat ini.
  const [score, setScore] = useState(0);
  // State untuk skor tertinggi yang pernah dicapai untuk level ini, diambil dari localStorage.
  const [highScore, setHighScore] = useState(0);
  // State untuk menghitung jumlah percobaan yang dilakukan pemain.
  const [attempts, setAttempts] = useState(0);
  // State yang menandakan apakah permainan telah berakhir karena salah mencocokkan.
  const [gameOver, setGameOver] = useState(false);
  // State untuk menyimpan level permainan yang sedang berjalan.
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  // State untuk menyimpan kata-kata yang digunakan di ronde saat ini, untuk ditampilkan di layar "Game Over".
  const [currentRoundWords, setCurrentRoundWords] = useState<VocabularyItem[]>([]);

  /**
   * @const generateCards
   * Fungsi untuk membuat satu set kartu permainan baru untuk satu ronde.
   * Mengambil 6 kata acak, membuat 3 kartu (kanji, reading, meaning) untuk masing-masing, lalu mengacaknya.
   * Dibuat dengan `useCallback` agar tidak dibuat ulang di setiap render kecuali dependensinya berubah.
   */
  const generateCards = useCallback((data: VocabularyItem[]) => {
    const shuffledData = shuffleArray(data);
    // Pilih 6 kata pertama yang valid untuk dijadikan kartu.
    const selectedVocab = shuffledData.filter(item => item.Vocabulary && item.Meaning).slice(0, 6);
    setCurrentRoundWords(selectedVocab);
    const newCards: MatchingCard[] = [];

    // Buat 3 kartu untuk setiap kata yang terpilih.
    selectedVocab.forEach((item, index) => {
      const matchId = `match-${index}`;

      newCards.push({ id: `kanji-${index}`, content: item.Vocabulary, type: 'kanji', matchId });
      newCards.push({ id: `reading-${index}`, content: item.Furigana || item.Romaji, type: 'reading', matchId });
      newCards.push({ id: `meaning-${index}`, content: item.Meaning, type: 'meaning', matchId });
    });

    // Acak semua kartu yang telah dibuat dan reset state permainan untuk ronde baru.
    setCards(shuffleArray(newCards));
    setMatchedCards(new Set());
    setSelectedCards([]);
    setAttempts(0);
    setGameOver(false);
  }, []); // Dependensi kosong karena shuffleArray dari utils tidak berubah.

  /**
   * @const loadVocabulary
   * Fungsi asinkron untuk memuat data kosakata dari level yang ditentukan, lalu memanggil `generateCards`.
   * Dibuat dengan `useCallback` untuk optimasi.
   */
  const loadVocabulary = useCallback(async (level: string) => {
    try {
      setLoading(true);
      const data = await getWordsForLevel(level);
      setVocabulary(data);
      generateCards(data);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, [generateCards]);

  // useEffect untuk memuat data kosakata saat komponen pertama kali dimuat atau saat level berubah.
  useEffect(() => {
    loadVocabulary(currentLevel);
  }, [currentLevel, loadVocabulary]);

  // useEffect untuk memuat skor tertinggi dari localStorage saat level berubah.
  useEffect(() => {
    const highScoreKey = `highScore_matching_${currentLevel}`;
    const storedHighScore = localStorage.getItem(highScoreKey);
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, [currentLevel]);

  // useEffect untuk menyimpan skor tertinggi baru ke localStorage saat game over jika skor saat ini lebih tinggi.
  useEffect(() => {
    if (gameOver) {
      const highScoreKey = `highScore_matching_${currentLevel}`;
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(highScoreKey, score.toString());
      }
    }
  }, [gameOver, score, highScore, currentLevel]);

  /**
   * @const isGameComplete
   * Konstanta boolean yang bernilai `true` jika semua kartu di papan telah berhasil dicocokkan.
   */
  const isGameComplete = matchedCards.size > 0 && matchedCards.size === cards.length;

  // useEffect untuk secara otomatis memulai ronde baru setelah ronde saat ini selesai (semua kartu cocok).
  useEffect(() => {
    if (isGameComplete) {
      setTimeout(() => {
        generateCards(vocabulary);
      }, 1500); // Tunggu 1.5 detik sebelum membuat papan baru.
    }
  }, [isGameComplete, vocabulary, generateCards]);

  /**
   * @const handleCardClick
   * Fungsi yang menangani logika utama saat sebuah kartu diklik oleh pemain.
   * @param card - Objek kartu yang diklik.
   */
  const handleCardClick = (card: MatchingCard) => {
    // Abaikan klik jika kartu sudah cocok (matched)
    if (matchedCards.has(card.id)) {
      return;
    }

    // Cek apakah kartu sudah dipilih
    const isSelected = selectedCards.find(c => c.id === card.id);

    // Jika sudah dipilih, unpick (hapus dari selectedCards)
    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      return;
    }

    // Batasi pemilihan hanya 3 kartu.
    if (selectedCards.length >= 3) {
      return;
    }

    // Tambahkan kartu ke selectedCards
    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    // Jika sudah 3 kartu yang dipilih, periksa kecocokannya.
    if (newSelected.length === 3) {
      setAttempts(attempts + 1);

      const allMatch = newSelected.every(c => c.matchId === newSelected[0].matchId);
      const allDifferentTypes = new Set(newSelected.map(c => c.type)).size === 3;

      // Jika cocok, tambahkan skor dan tandai kartu sebagai "matched".
      if (allMatch && allDifferentTypes) {
        setScore(prevScore => prevScore +30);
        setMatchedCards(prev => new Set([...prev, ...newSelected.map(c => c.id)]));
        setTimeout(() => setSelectedCards([]), 500); // Kosongkan pilihan setelah 0.5 detik.
      } else {
        // Jika tidak cocok, game over.
        setGameOver(true);
      }
    }
  };

  /**
   * @const handleReset
   * Fungsi untuk mereset permainan dan memulai ronde baru dengan kosakata yang sama.
   */
  const handleReset = () => {
    setScore(0);
    generateCards(vocabulary);
  };

  // Tampilan layar "Game Over".
  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="nes-container with-title is-centered text-center max-w-2xl w-full" style={{ backgroundColor: '#ffffff', borderColor: '#f9a825' }}>
          <p className="title" style={{ color: '#e65100', fontSize: '1.5rem' }}>Game Over</p>
          
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            <span className="nes-badge"><span className="is-primary">Score: {score}</span></span>
            <span className="nes-badge"><span className="is-warning">High: {highScore}</span></span>
          </div>

          {/* Menampilkan daftar set kata yang benar dari ronde tersebut */}
          {currentRoundWords.length > 0 && (
            <div className="nes-container with-title mb-6" style={{ backgroundColor: '#e8f5e9', borderColor: '#4caf50' }}>
              <p className="title" style={{ color: '#2e7d32' }}>Correct Sets</p>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {currentRoundWords.map(item => (
                  <div key={item.Vocabulary} className="mb-3 p-2" style={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                    <p className="text-lg font-semibold" style={{ color: '#1b5e20', marginBottom: '0.25rem' }}>{item.Vocabulary}</p>
                    <p className="text-sm" style={{ color: '#424242' }}>Reading: {item.Furigana || item.Romaji}</p>
                    <p className="text-sm" style={{ color: '#424242' }}>Meaning: {item.Meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={handleReset} type="button" className="nes-btn is-primary">Play Again</button>
            <button onClick={onBack} type="button" className="nes-btn">Back to Menu</button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan layar "Loading...".
  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff' }}>
          <p className="title">Loading...</p>
        </div>
      </div>
    );
  }

  // Tampilan utama permainan.
  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header: Tombol kembali dan info skor/level */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
          <button onClick={onBack} type="button" className="nes-btn">Back</button>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="nes-badge"><span className="is-success">Score: {score}</span></span>
            <span className="nes-badge"><span className="is-warning">High: {highScore}</span></span>
            <span className="nes-badge"><span className="is-primary">Attempts: {attempts}</span></span>
            <span className="nes-badge"><span className="is-error">{currentLevel}</span></span>
          </div>
        </div>

        {/* Judul dan instruksi permainan */}
        <div className="mb-8 text-center">
          <div className="nes-container with-title is-centered" style={{ backgroundColor: '#ffffff' }}>
            <p className="title">Match the Sets!</p>
            <p>Select 3 cards: Kanji, Reading, and Meaning</p>
          </div>
        </div>

        {/* Pesan saat ronde selesai */}
        {isGameComplete && !gameOver && (
          <div className="mb-8 nes-container is-success with-title is-centered" style={{ backgroundColor: '#ffffff' }}>
            <p className="title">Round Complete!</p>
            <p>Loading next round...</p>
          </div>
        )}

        {/* Papan permainan (grid kartu) */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {cards.map((card) => {
            const isSelected = selectedCards.some(c => c.id === card.id);
            const isMatched = matchedCards.has(card.id);

            // Logika untuk mengubah gaya kartu berdasarkan statusnya (cocok, dipilih, atau normal).
            let containerClass = 'nes-container';
            let containerStyle: React.CSSProperties = { 
              padding: '1rem',
              minHeight: '120px',
              transition: 'all 0.3s ease',
              cursor: isMatched ? 'not-allowed' : 'pointer'
            };

            if (isMatched) {
              containerClass = 'nes-container is-success';
              containerStyle = { ...containerStyle, backgroundColor: '#e8f5e9', borderColor: '#4caf50', transform: 'scale(0.95)', opacity: 0.8 };
            } else if (isSelected) {
              containerClass = 'nes-container is-primary';
              containerStyle = { ...containerStyle, backgroundColor: '#e3f2fd', borderColor: '#2196f3', borderWidth: '3px', transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)' };
            } else {
              containerStyle = { ...containerStyle, backgroundColor: '#ffffff', borderColor: '#e0e0e0' };
            }

            // Logika untuk mengubah warna teks berdasarkan tipe kartu.
            let textColor = card.type === 'kanji' ? '#212121' : (card.type === 'reading' ? '#1976d2' : '#f57c00');
            if (isSelected) {
              textColor = '#0d47a1';
            }

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={isMatched}
                type="button"
                className={`${containerClass} with-rounded-edges flex flex-col items-center justify-center disabled:cursor-not-allowed`}
                style={containerStyle}
              >
                {/* Tampilkan ikon berdasarkan status */}
                {isMatched && <span className="mb-2" style={{ fontSize: '1.5rem', color: '#2e7d32' }}>✓</span>}
                {isSelected && !isMatched && <span className="mb-2" style={{ fontSize: '1.2rem', color: '#2196f3' }}>●</span>}
                <div 
                  className={`font-semibold text-center ${card.type === 'kanji' ? 'text-2xl' : 'text-base'}`}
                  style={{ color: textColor, fontWeight: isSelected ? 'bold' : 'normal' }}
                >
                  {card.content}
                </div>
                <div className="text-xs mt-2 capitalize nes-text is-disabled">
                  {card.type}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MatchingMode;