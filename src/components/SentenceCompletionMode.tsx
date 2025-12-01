import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JLPT_LEVELS } from '../types';
import N5 from '../data/N5.json';
import N4 from '../data/N4.json';
import N3 from '../data/N3.json';
import N2 from '../data/N2.json';
import N1 from '../data/N1.json';

const ALL_WORDS = {
    N5: [...N5],
    N4: [...N4],
    N3: [...N3],
    N2: [...N2],
    N1: [...N1],
};

const SentenceCompletionMode: React.FC = () => {
    const { level } = useParams<{ level: JLPT_LEVELS }>();
    const navigate = useNavigate();
    const [words, setWords] = useState<any[]>([]);
    const [currentWord, setCurrentWord] = useState<any>(null);
    const [inputValue, setInputValue] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        if (level && ALL_WORDS[level]) {
            setWords(ALL_WORDS[level]);
            setCurrentWord(ALL_WORDS[level][Math.floor(Math.random() * ALL_WORDS[level].length)]);
        }
    }, [level]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const checkAnswer = () => {
        if (inputValue.toLowerCase() === currentWord.romaji.toLowerCase()) {
            setFeedback('Correct!');
            setTimeout(() => {
                setFeedback(null);
                setInputValue('');
                setCurrentWord(words[Math.floor(Math.random() * words.length)]);
            }, 1000);
        } else {
            setFeedback('Incorrect. Try again.');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    };

    if (!currentWord) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Sentence Completion: {level}</h1>
            <div className="mb-4">
                <p className="text-xl">{currentWord.meaning}</p>
                <p className="text-3xl font-bold">{currentWord.text}</p>
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="border p-2 w-full mb-4"
                placeholder="Type the romaji..."
            />
            <button
                onClick={checkAnswer}
                className="bg-blue-500 text-white p-2 rounded"
            >
                Check
            </button>
            {feedback && <p className="mt-4">{feedback}</p>}
            <button
                onClick={() => navigate('/')}
                className="mt-4 bg-gray-500 text-white p-2 rounded"
            >
                Back to Home
            </button>
        </div>
    );
};

export default SentenceCompletionMode;
