// Impor hook useState dan useEffect dari React untuk manajemen state dan efek samping.
import { useState, useEffect } from 'react';
// Impor tipe data yang akan digunakan dari file types.ts.
import { VocabularyItem, KanaItem, FlashcardItem } from '../types';
// Impor tipe FlashcardType dari komponen utama App.
import { FlashcardType } from '../App';
// Impor fungsi utilitas untuk mendapatkan data kosakata.
import { getWordsForLevel } from '../utils';

// Mendefinisikan properti (props) yang diterima oleh komponen FlashcardMode.
interface FlashcardModeProps {
  level: string; // Level kesulitan (misal: "N5")
  type: FlashcardType; // Tipe kartu (misal: "vocabulary", "hiragana")
  onBack: () => void; // Fungsi untuk kembali ke menu sebelumnya.
}

/**
 * Fungsi 'type guard' untuk memeriksa apakah sebuah item adalah VocabularyItem.
 * @param item - Item yang akan diperiksa.
 * @returns {boolean} - True jika item adalah VocabularyItem, selain itu false.
 */
function isVocabularyItem(item: FlashcardItem): item is VocabularyItem {
  // Memeriksa apakah item memiliki properti 'Vocabulary'.
  return (item as VocabularyItem).Vocabulary !== undefined;
}

// Konstanta untuk menentukan jumlah kartu dalam satu "chapter" atau bab.
const CARDS_PER_CHAPTER = 10;

/**
 * Komponen utama untuk mode belajar Flashcard.
 * Mengelola tampilan kartu, navigasi, dan progres belajar pengguna.
 */
function FlashcardMode({ level, type, onBack }: FlashcardModeProps) {
  // State untuk menyimpan semua data kartu (kosakata/kana) yang telah dimuat.
  const [data, setData] = useState<FlashcardItem[]>([]);
  // State untuk menyimpan indeks dari kartu yang sedang ditampilkan dalam chapter saat ini.
  const [currentIndex, setCurrentIndex] = useState(0);
  // State untuk menyimpan status kartu (terbalik atau tidak).
  const [isFlipped, setIsFlipped] = useState(false);
  // State untuk menyimpan status proses pemuatan data (true jika sedang memuat).
  const [loading, setLoading] = useState(true);

  // State untuk menyimpan indeks chapter yang sedang aktif.
  const [currentChapter, setCurrentChapter] = useState(0);
  // State untuk menyimpan daftar chapter yang telah diselesaikan oleh pengguna.
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(
    new Set()
  );

  // Menghitung total jumlah chapter berdasarkan total data dan kartu per chapter.
  const totalChapters = Math.ceil(data.length / CARDS_PER_CHAPTER);
  // Menentukan indeks awal dari data untuk chapter yang sedang aktif.
  const chapterStartIndex = currentChapter * CARDS_PER_CHAPTER;
  // Mengambil sebagian data yang sesuai untuk chapter yang sedang aktif.
  const chapterData = data.slice(
    chapterStartIndex,
    chapterStartIndex + CARDS_PER_CHAPTER
  );

  // useEffect untuk memuat data saat komponen pertama kali dimuat atau saat `level` dan `type` berubah.
  useEffect(() => {
    loadData();
  }, [level, type]);

  /**
   * Fungsi untuk menyimpan progres belajar ke file `progress.json` via backend.
   * @param chaptersToSave - Set yang berisi chapter yang sudah selesai untuk disimpan.
   */
  const saveProgress = async (chaptersToSave: Set<number>) => {
    try {
      // 1. Ambil objek progres lengkap saat ini dari server.
      const response = await fetch('http://localhost:3001/api/progress');
      const allProgress = response.ok ? await response.json() : {};

      // 2. Perbarui progres untuk mode saat ini (level dan tipe).
      const progressKey = `${level}_${type}`;
      const updatedProgress = {
        ...allProgress,
        [progressKey]: Array.from(chaptersToSave),
      };

      // 3. Kirim objek progres yang sudah diperbarui kembali ke server.
      await fetch('http://localhost:3001/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProgress, null, 2),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  /**
   * Fungsi asinkron untuk memuat data kartu (kosakata/kana) dan progres belajar dari backend.
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Ambil data progres dari backend.
      const progressResponse = await fetch('http://localhost:3001/api/progress');
      if (progressResponse.ok) {
        const allProgress = await progressResponse.json();
        const progressKey = `${level}_${type}`;
        const savedCompletedChapters = allProgress[progressKey] || [];
        setCompletedChapters(new Set(savedCompletedChapters));
      } else if (progressResponse.status === 404) {
        // File progress.json belum ada, jadi mulai dengan set kosong.
        setCompletedChapters(new Set());
      } else {
        throw new Error('Failed to fetch progress');
      }

      // 2. Muat data kartu (kosakata atau kana).
      let loadedData;
      if (type === 'vocabulary') {
        loadedData = await getWordsForLevel(level);
      } else if (type === 'hiragana') {
        const module = await import('../data/hiragana.json');
        loadedData = module.default;
      } else if (type === 'katakana') {
        const module = await import('../data/katakana.json');
        loadedData = module.default;
      }
      setData(loadedData || []);

      // 3. Reset state komponen.
      setCurrentIndex(0);
      setCurrentChapter(0);
      setIsFlipped(false);

    } catch (error) {
      console.error('Error loading data:', error);
      // Opsional: tampilkan pesan error kepada pengguna.
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fungsi untuk pindah ke kartu sebelumnya dalam chapter yang sama.
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false); // Balikkan kartu ke depan saat berganti.
    }
  };

  /**
   * Fungsi untuk membalik kartu (dari depan ke belakang atau sebaliknya).
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  /**
   * Fungsi untuk mengganti chapter yang sedang aktif.
   * @param chapterIndex - Indeks dari chapter yang akan ditampilkan.
   */
  const handleChapterChange = (chapterIndex: number) => {
    setCurrentChapter(chapterIndex);
    setCurrentIndex(0); // Selalu mulai dari kartu pertama di chapter baru.
    setIsFlipped(false);
  };

  /**
   * Fungsi untuk menandai chapter saat ini sebagai "selesai" dan menyimpan progres.
   */
  const handleMarkComplete = () => {
    const newCompleted = new Set(completedChapters).add(currentChapter);
    setCompletedChapters(newCompleted);
    saveProgress(newCompleted);
  };

  /**
   * Fungsi untuk membatalkan status "selesai" pada chapter saat ini dan menyimpan progres.
   */
  const handleUndoCompletion = () => {
    const newCompleted = new Set(completedChapters);
    newCompleted.delete(currentChapter);
    setCompletedChapters(newCompleted);
    saveProgress(newCompleted);
  };

  /**
   * Fungsi untuk pindah ke kartu berikutnya. Jika sudah di kartu terakhir,
   * maka chapter akan ditandai sebagai selesai.
   */
  const handleNextOrFinish = () => {
    if (currentIndex < chapterData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false); // Balikkan kartu ke depan saat berganti.
    } else {
      handleMarkComplete(); // Tandai selesai jika ini kartu terakhir.
    }
  };

  // Tampilkan pesan "Loading..." jika data sedang dimuat.
  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="nes-container with-title is-centered">
          <p className="title">Loading...</p>
        </div>
      </div>
    );
  }

  // Tampilkan pesan "No data found" jika data tidak berhasil dimuat atau kosong.
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="nes-container with-title is-centered">
          <p className="title">No data found</p>
        </div>
      </div>
    );
  }

  // Konstanta untuk mempermudah akses ke data dan status saat ini.
  const currentCard = chapterData[currentIndex]; // Kartu yang sedang ditampilkan.
  const isChapterComplete = completedChapters.has(currentChapter); // Apakah chapter ini sudah selesai.
  const onLastCard = currentIndex === chapterData.length - 1; // Apakah ini kartu terakhir di chapter.

  /**
   * Fungsi untuk merender tampilan depan kartu.
   * Tampilannya berbeda tergantung apakah kartu itu kosakata atau kana.
   */
  const renderCardFront = () => {
    if (isVocabularyItem(currentCard)) {
      // Tampilan untuk kartu kosakata.
      return (
        <>
          <div className="text-7xl font-bold mb-4 text-gray-800 text-center">
            {currentCard.Vocabulary}
          </div>
          {currentCard.Furigana && (
            <div className="text-2xl text-gray-600 mb-4">
              {currentCard.Furigana}
            </div>
          )}
          <div className="text-xl text-gray-500">
            {currentCard.Romaji}
          </div>
          <div className="mt-8">
            <span className="nes-text is-disabled">Click to reveal meaning</span>
          </div>
        </>
      );
    } else {
      // Tampilan untuk kartu Hiragana/Katakana.
      return (
        <>
          <div className="text-9xl font-bold mb-4 text-gray-800 text-center">
            {currentCard.kana}
          </div>
          <div className="mt-8">
            <span className="nes-text is-disabled">Click to reveal romaji</span>
          </div>
        </>
      );
    }
  };

  /**
   * Fungsi untuk merender tampilan belakang kartu.
   * Menampilkan arti (untuk kosakata) atau romaji (untuk kana).
   */
  const renderCardBack = () => {
    if (isVocabularyItem(currentCard)) {
      // Tampilan belakang untuk kartu kosakata.
      return (
        <>
          <div className="text-5xl font-bold mb-4 text-center">
            {currentCard.Meaning}
          </div>
          {currentCard.Type && (
            <div className="text-xl bg-white/20 px-4 py-2 rounded-lg">
              {currentCard.Type}
            </div>
          )}
        </>
      );
    } else {
      // Tampilan belakang untuk kartu Hiragana/Katakana.
      return (
        <div className="text-7xl font-bold mb-4 text-center">
          {currentCard.romaji}
        </div>
      );
    }
  };

  // Render UI utama komponen.
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header: Tombol kembali, badge level, dan tombol batalkan selesai */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <button
            onClick={onBack}
            type="button"
            className="nes-btn"
          >
            Back
          </button>
          {isChapterComplete && (
             <button
             onClick={handleUndoCompletion}
             type="button"
             className="nes-btn is-error"
           >
             Undo Completion
           </button>
          )}
          <span className="nes-badge">
            <span className="is-primary">{level} - {type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </span>
        </div>

        {/* Pemilihan Chapter */}
        <div className="nes-container with-title is-centered mb-8" style={{ backgroundColor: '#ffffff' }}>
          <p className="title">Chapters</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: totalChapters }, (_, i) => {
              const isCompleted = completedChapters.has(i);
              const isCurrent = currentChapter === i;
              
              // Jika chapter sudah selesai dan bukan chapter saat ini, tampilkan tanda centang.
              if (isCompleted && !isCurrent) {
                return (
                  <button
                    key={i}
                    onClick={() => handleChapterChange(i)}
                    type="button"
                    className="nes-btn is-success"
                    style={{ minWidth: '48px' }}
                  >
                    ✓
                  </button>
                );
              }
              
              // Tombol chapter standar.
              return (
                <button
                  key={i}
                  onClick={() => handleChapterChange(i)}
                  type="button"
                  className={`nes-btn ${isCurrent ? 'is-primary' : ''}`}
                  style={{ minWidth: '48px' }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Indikator posisi kartu */}
        <div className="flex items-center justify-center mb-4">
          <span className="nes-text">
          Card {currentIndex + 1} / {chapterData.length}
          </span>
        </div>

        {/* Area Kartu Flashcard yang bisa dibalik */}
        <div className="perspective-1000 mb-8">
          <div
            onClick={handleFlip}
            className={`relative w-full h-96 cursor-pointer transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Tampilan Depan Kartu */}
            <div className="absolute inset-0 backface-hidden">
              <div className="h-full nes-container with-rounded-edges flex flex-col items-center justify-center p-8" style={{ backgroundColor: '#ffffff' }}>
                {renderCardFront()}
              </div>
            </div>

            {/* Tampilan Belakang Kartu */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <div 
                className="h-full nes-container with-rounded-edges flex flex-col items-center justify-center p-8"
                style={{ 
                  backgroundColor: '#4caf50', 
                  borderColor: '#2e7d32',
                  color: '#ffffff'
                }}
              >
                {renderCardBack()}
                <div className="mt-8">
                  <span style={{ color: '#ffffff', opacity: 0.9 }}>Click to see front</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Navigasi Kartu */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            type="button"
            className="nes-btn"
          >
            Previous
          </button>

          <button
            onClick={handleFlip}
            type="button"
            className="nes-btn is-primary"
          >
            Flip
          </button>
          
          <button
            onClick={handleNextOrFinish}
            disabled={onLastCard && isChapterComplete} // Nonaktifkan jika kartu terakhir dan chapter sudah selesai.
            type="button"
            className={`nes-btn ${onLastCard && !isChapterComplete ? 'is-success' : ''}`}
          >
            {/* Ganti teks tombol di kartu terakhir */}
            {onLastCard && !isChapterComplete ? 'Mark Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FlashcardMode;
