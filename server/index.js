require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Helper to get AI model with user provided key
const getModel = (apiKey) => {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("API Key is missing (both header and env)");
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
};

app.get('/api/config', (req, res) => {
    res.json({ hasServerKey: !!process.env.GEMINI_API_KEY });
});

app.get('/', (req, res) => {
    res.send('GetPath API is running');
});

// Generate Assessment Questionnaire
app.post('/api/assess', async (req, res) => {
    try {
        const { apiKey } = req.headers;
        const { topic } = req.body;

        if (!apiKey && !process.env.GEMINI_API_KEY) return res.status(401).json({ error: "API Key required" });
        if (!topic) return res.status(400).json({ error: "Topic required" });

        const model = getModel(apiKey);
        const prompt = `
            Act as an expert educator. Create a diagnostic questionnaire to assess a student's knowledge level on the topic: "${topic}".
            Generate 5 multiple-choice questions with increasing difficulty.
            
            Return the response in strictly valid JSON format with the following structure:
            {
                "questions": [
                    {
                        "id": 1,
                        "text": "Question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswerIndex": 0, // index of the correct option
                        "difficulty": "beginner" // beginner, intermediate, advanced
                    }
                ]
            }
            Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch (e) {
            console.error("JSON Parse Error:", text);
            res.status(500).json({ error: "Failed to parse AI response", raw: text, details: e.message });
        }

    } catch (error) {
        console.error("Assessment Error:", error);
        res.status(500).json({ error: error.message, details: error.toString() });
    }
});

// Generate Learning Path based on results
app.post('/api/generate-path', async (req, res) => {
    try {
        const { apiKey } = req.headers;
        const { topic, assessmentResults } = req.body;
        // assessmentResults: [{ questionId, correct: boolean, difficulty: string }]

        if (!apiKey && !process.env.GEMINI_API_KEY) return res.status(401).json({ error: "API Key required" });

        const model = getModel(apiKey);

        const prompt = `
            Based on the following assessment results for the topic "${topic}":
            ${JSON.stringify(assessmentResults)}

            Analysis the user's skill level.
            Create a personalized learning path with 10-15 distinct learning nodes.
            Each node should focus on a specific sub-topic.
            
            Return strictly valid JSON:
            {
                "summary": "Brief summary of the user's level and the plan.",
                "nodes": [
                    {
                        "id": "node-1",
                        "title": "Module Title",
                        "description": "What they will learn",
                        "estimatedTime": "15 mins"
                    }
                ]
            }
            NO Markdown. Raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch (e) {
            console.error("JSON Parse Error:", text);
            res.status(500).json({ error: "Failed to parse AI response", raw: text, details: e.message });
        }

    } catch (error) {
        console.error("Assessment Error:", error);
        res.status(500).json({ error: error.message, details: error.toString() });
    }
});

// Generate Checkpoint Quiz
app.post('/api/quiz', async (req, res) => {
    try {
        const { apiKey } = req.headers;
        const { nodeContext } = req.body; // Title/Description of what they just learned

        if (!apiKey && !process.env.GEMINI_API_KEY) return res.status(401).json({ error: "API Key required" });

        const model = getModel(apiKey);
        const prompt = `
            The student just completed a module on: "${nodeContext}".
            Generate a short verification quiz (3 questions) to ensure understanding.
            
            Return strictly valid JSON:
            {
                "questions": [
                    {
                        "id": 1,
                        "text": "Question...",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswerIndex": 0
                    }
                ]
            }
            NO Markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch (e) {
            res.status(500).json({ error: "Failed to parse AI", raw: text });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Refine Learning Path (Add/Modify items)
app.post('/api/refine-path', async (req, res) => {
    try {
        const { apiKey } = req.headers;
        const { currentNodes, feedback, topic } = req.body;
        // currentNodes: Array of nodes
        // feedback: User wants to add/change something

        if (!apiKey && !process.env.GEMINI_API_KEY) return res.status(401).json({ error: "API Key required" });

        const model = getModel(apiKey);

        const prompt = `
            Current Learning Path for "${topic}":
            ${JSON.stringify(currentNodes)}

            User Feedback/Request: "${feedback}"

            Please modify the learning path based on the user's feedback. 
            You can add new nodes, remove nodes, or re-order them.
            Ensure the flow remains logical.
            
            Return strictly valid JSON with the updated structure:
            {
                "nodes": [
                     {
                        "id": "node-1", // preserve IDs if possible, or generate new ones
                        "title": "Module Title",
                        "description": "What they will learn",
                        "estimatedTime": "15 mins"
                    }
                ]
            }
            NO Markdown. Raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch (e) {
            console.error("JSON Parse Error:", text);
            res.status(500).json({ error: "Failed to parse AI response", raw: text, details: e.message });
        }

    } catch (error) {
        console.error("Assessment Error:", error);
        res.status(500).json({ error: error.message, details: error.toString() });
    }
});

// Generate Resources for a specific node
app.post('/api/generate-resources', async (req, res) => {
    try {
        const { apiKey } = req.headers;
        const { nodeTitle, nodeDescription, topic } = req.body;

        if (!apiKey && !process.env.GEMINI_API_KEY) return res.status(401).json({ error: "API Key required" });

        const model = getModel(apiKey);
        const prompt = `
            For the learning module "${nodeTitle}" (part of the topic "${topic}"):
            Description: "${nodeDescription}"

            Curate a list of 3-5 high-quality learning resources (YouTube videos, Articles, Documentation).
            
            Return strictly valid JSON:
            {
                "resources": [
                    {
                        "type": "video", // or 'article'
                        "title": "Resource Title",
                        "url": "Search query or URL", 
                        "description": "Brief reason for this resource"
                    }
                ]
            }
             For the 'url', provide a specific search query (like "React hooks introduction video") or a direct URL if known.
             NO Markdown. Raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const json = JSON.parse(text);
            res.json(json);
        } catch (e) {
            console.error("JSON Parse Error:", text);
            res.status(500).json({ error: "Failed to parse AI response", raw: text });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
