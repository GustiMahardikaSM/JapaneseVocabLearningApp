import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Use CORS to allow requests from the frontend
app.use(cors());
// Use express.json() to parse JSON request bodies
app.use(express.json());

const progressFilePath = path.join(__dirname, 'src', 'data', 'progress.json');

// Endpoint to get progress
app.get('/api/progress', async (req, res) => {
  try {
    const data = await fs.readFile(progressFilePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    // If the file doesn't exist, return an empty object
    if (error.code === 'ENOENT') {
      return res.json({});
    }
    console.error('Error reading progress file:', error);
    res.status(500).json({ message: 'Error reading progress data' });
  }
});

// Endpoint to save progress
app.post('/api/progress', async (req, res) => {
  try {
    const newProgress = req.body;
    await fs.writeFile(progressFilePath, JSON.stringify(newProgress, null, 2));
    res.status(200).json({ message: 'Progress saved successfully' });
  } catch (error) {
    console.error('Error saving progress file:', error);
    res.status(500).json({ message: 'Error saving progress data' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
