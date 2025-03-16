require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const songs = require("./songs"); // Ensure you have a songs.js file

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://lyricmatch-0cxu.onrender.com" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let currentSong = null;
let hintStep = 0;

async function generateLyrics() {
    currentSong = songs[Math.floor(Math.random() * songs.length)];
    const prompt = `Generate a short (2-4 lines) lyric snippet for the song "${currentSong.title}" by ${currentSong.artist}, without revealing the title.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        hintStep = 0;
        return { snippet: text, title: currentSong.title, artist: currentSong.artist };
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        return { snippet: "Error fetching lyrics.", title: null, artist: null };
    }
}

async function generateHint() {
    if (!currentSong) {
        return { hint: "No song has been generated yet! Please generate a lyric first." };
    }

    hintStep++;
    if (hintStep === 1) {
        const titleWords = currentSong.title.split(" ");
        let hint = titleWords.length === 1 ? `First letter: "${currentSong.title.charAt(0)}"` : `🎶 First word: "${titleWords[0]}"`;
        return { hint };
    } else if (hintStep === 2) {
        return { hint: `Artist: "${currentSong.artist}"` };
    } else if (hintStep === 3) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const response = await model.generateContent(
                `Only return the genre and theme of the song "${currentSong.title}" by ${currentSong.artist}. Example: "Pop, Love & Relationships"`
            );
            return { hint: `Genre & Theme: ${response.response.text()}` };
        } catch (error) {
            console.error("Gemini API Error:", error.message);
            return { hint: "Could not generate genre & theme." };
        }
    } else {
        return { hint: "No more hints available!" };
    }
}

app.get("/api/lyrics", async (req, res) => {
    try {
        const data = await generateLyrics();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch lyrics." });
    }
});

app.get("/api/hint", async (req, res) => {
    try {
        const hintData = await generateHint();
        res.json(hintData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch hint." });
    }
});

app.post("/api/check", (req, res) => {
    if (!currentSong) {
        return res.status(400).json({ error: "No song has been generated yet. Please generate a lyric first!" });
    }

    const { userGuess } = req.body;
    if (!userGuess) {
        return res.status(400).json({ error: "Invalid input. Please enter a guess." });
    }

    const isCorrect = userGuess.toLowerCase().trim() === currentSong.title.toLowerCase().trim();
    res.json({ correct: isCorrect, correctTitle: currentSong.title });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🎶 Server running on port ${PORT}`));