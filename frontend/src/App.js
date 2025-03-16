import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function App() {
    const [lyric, setLyric] = useState("");
    const [correctTitle, setCorrectTitle] = useState("");
    const [userGuess, setUserGuess] = useState("");
    const [result, setResult] = useState("");
    const [error, setError] = useState("");
    const [hints, setHints] = useState([]);
    const [hintCount, setHintCount] = useState(0);
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    const [gameOver, setGameOver] = useState(false);

    // ✅ Fetch a new lyric snippet
    const fetchLyric = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/lyrics`);
            setLyric(response.data.snippet);
            setCorrectTitle(response.data.title);
            resetGame();
        } catch (err) {
            setError("Failed to fetch lyrics. Check your connection.");
        }
    };

    // ✅ Reset Game Without Changing the Song
    const resetGame = () => {
        setUserGuess("");
        setResult("");
        setHints([]);
        setHintCount(0);
        setAttemptsLeft(3);
        setGameOver(false);
        setError("");
    };

    // ✅ Get one hint at a time
    const getHint = async () => {
        if (!lyric) {
            setError("Please generate a lyric snippet first!");
            return;
        }
        if (hintCount >= 3) {
            setError("No more hints available!");
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/hint`);
            setHints([...hints, response.data.hint]);
            setHintCount(hintCount + 1);
        } catch (err) {
            setError("Failed to fetch hint.");
        }
    };

    // ✅ Check user's answer
    const checkAnswer = async () => {
        if (!lyric) {
            setError("Please generate a lyric snippet first!");
            return;
        }
        if (!userGuess) {
            setError("Please enter a guess!");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/check`, { userGuess });

            if (response.data.correct) {
                setResult("Correct Answer! ");
                setGameOver(true);
            } else {
                const remaining = attemptsLeft - 1;
                setAttemptsLeft(remaining);

                if (remaining === 0) {
                    setResult(`Out of chances! The correct song was: "${correctTitle}".`);
                    setGameOver(true);
                } else {
                    setResult(`Incorrect! ${remaining} attempts left.`);
                }
            }
        } catch (err) {
            setError("Failed to check answer. Please try again.");
        }
    };

    return (
        <div className="container">
            <h1 className="title">🎶 Lyric Match 🎶</h1>

            {/* ✅ Show "Start New Game" button only after correct answer */}
            {gameOver ? (
                <button className="button new-game-btn" onClick={resetGame}>🔄 Start New Game</button>
            ) : (
                <button className="button generate-btn" onClick={fetchLyric}>🎼 Generate Lyric Snippet</button>
            )}

            {lyric && <p className="lyric-box"><strong>Snippet:</strong> {lyric}</p>}

            {/* ✅ User Input for Answer */}
            <input 
                type="text" 
                className="input-field" 
                placeholder="Enter song title..." 
                value={userGuess} 
                onChange={(e) => setUserGuess(e.target.value)} 
                disabled={attemptsLeft === 0 || gameOver} 
            />

            {/* ✅ Buttons for Answer Checking & Hints */}
            <button className="button check-btn" onClick={checkAnswer} disabled={attemptsLeft === 0 || gameOver}>
                ✔ Check Answer
            </button>
            <button className="button hint-btn" onClick={getHint} disabled={hintCount >= 3 || gameOver}>
                 Get Hint ({3 - hintCount} left)
            </button>

            {/* ✅ Display Hints, Results, and Errors */}
            {hints.map((hint, index) => <p key={index} className="hint">{hint}</p>)}
            {result && <p className="result">{result}</p>}
            {error && <p className="error">{error}</p>}

            {/* ✅ Display Remaining Attempts in a Separate Box */}
            <div className="attempts-box">
                <h3>Attempts Left: {attemptsLeft}</h3>
            </div>
        </div>
    );
}

export default App;
