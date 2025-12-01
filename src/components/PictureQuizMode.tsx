import { useState, useEffect } from 'react';
import quizData from '../data/picture-quiz.json';
import { shuffleArray } from '../utils'; // Assuming a utils file with a shuffle function exists

interface PictureQuizItem {
  id: number;
  image: string;
  sound: string;
  answer: string;
  choices: string[];
}

interface PictureQuizModeProps {
  onBack: () => void;
}

const PictureQuizMode = ({ onBack }: PictureQuizModeProps) => {
  const [questions, setQuestions] = useState<PictureQuizItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Load and shuffle questions on component mount
    setQuestions(shuffleArray(quizData));
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    // Play sound when a new question appears
    if (currentQuestion) {
      const audio = new Audio(currentQuestion.sound);
      audio.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [currentQuestion]);

  const handleAnswerSelect = (choice: string) => {
    if (selectedAnswer) return; // Prevent changing answer

    setSelectedAnswer(choice);
    const correct = choice === currentQuestion.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }

    // Move to the next question after a delay
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // End of the quiz
        alert(`Quiz finished! Your score: ${score + (correct ? 1 : 0)} / ${questions.length}`);
        onBack();
      }
    }, 1500);
  };

  if (!currentQuestion) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">What is this?</h2>
        
        {/* Image Display */}
        <div className="mb-6">
          <img 
            src={currentQuestion.image} 
            alt="Quiz item" 
            className="mx-auto w-64 h-64 object-cover rounded-lg shadow-md"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/256'; e.currentTarget.onerror = null; }} // Placeholder on error
          />
        </div>

        {/* Answer Choices */}
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.choices.map((choice) => {
            const isSelected = selectedAnswer === choice;
            let buttonClass = 'bg-blue-500 hover:bg-blue-600';
            if (isSelected) {
              buttonClass = isCorrect ? 'bg-green-500' : 'bg-red-500';
            } else if (selectedAnswer && choice === currentQuestion.answer) {
              buttonClass = 'bg-green-500';
            }

            return (
              <button
                key={choice}
                onClick={() => handleAnswerSelect(choice)}
                disabled={!!selectedAnswer}
                className={`p-4 text-white font-bold text-2xl rounded-lg transition-colors duration-300 ${buttonClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 font-bold text-xl">
            Score: {score}
        </div>

      </div>
      <button onClick={onBack} className="mt-8 px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
        Back to Menu
      </button>
      <div className="mt-4 text-sm text-gray-500">
        <p>Note: Please create `public/assets/images` and `public/assets/sounds` directories.</p>
        <p>Place your assets there as defined in `src/data/picture-quiz.json`.</p>
      </div>
    </div>
  );
};

export default PictureQuizMode;
