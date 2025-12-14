require('dotenv').config();
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';

const MOCK_ASSESSMENT = {
    questions: [
        { id: 1, text: "What is the capital of France?", options: ["Berlin", "London", "Paris", "Madrid"], correctAnswerIndex: 2, difficulty: "beginner" },
        { id: 2, text: "Which language is used for web styling?", options: ["Python", "HTML", "CSS", "Java"], correctAnswerIndex: 2, difficulty: "beginner" },
        { id: 3, text: "What does DOM stand for?", options: ["Document Object Model", "Data Object Mode", "Digital Ordinance Model", "Desktop Orientation Module"], correctAnswerIndex: 0, difficulty: "intermediate" },
        { id: 4, text: "What is a closure in JS?", options: ["A door", "Function with preserved scope", "Variable type", "Loop end"], correctAnswerIndex: 1, difficulty: "advanced" },
        { id: 5, text: "Time complexity of binary search?", options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"], correctAnswerIndex: 1, difficulty: "advanced" }
    ]
};

const MOCK_PATH = {
    summary: "Based on your assessment, here is a tailored plan.",
    nodes: [
        { id: "node-1", title: "Introduction", description: "Basics of the topic.", estimatedTime: "10 mins" },
        { id: "node-2", title: "Core Concepts", description: "Deep dive into main ideas.", estimatedTime: "20 mins" },
        { id: "node-3", title: "Advanced Techniques", description: "Mastering complex skills.", estimatedTime: "30 mins" }
    ]
};

const MOCK_QUIZ = {
    questions: [
        { id: 1, text: "Mock Quiz Question 1", options: ["A", "B", "C", "D"], correctAnswerIndex: 0 },
        { id: 2, text: "Mock Quiz Question 2", options: ["A", "B", "C", "D"], correctAnswerIndex: 1 },
        { id: 3, text: "Mock Quiz Question 3", options: ["A", "B", "C", "D"], correctAnswerIndex: 2 }
    ]
};

const MOCK_RESOURCES = {
    resources: [
        { type: "video", title: "Mock Video Tutorial", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Great intro video." },
        { type: "article", title: "Mock Documentation", url: "https://developer.mozilla.org", description: "Official docs." }
    ]
};
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

// Rate Limiter to respect 10 RPM (6 seconds per request)
let lastRequestTime = 0;
const rateLimit = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    const minInterval = 6000; // 6 seconds
    if (timeSinceLast < minInterval) {
        const waitTime = minInterval - timeSinceLast;
        console.log(`Rate limiting: Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
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

        if (USE_MOCK_AI) {
            console.log("Using Mock AI for Assessment");
            await new Promise(r => setTimeout(r, 1000));
            return res.json(MOCK_ASSESSMENT);
        }

        const model = getModel(apiKey);
        await rateLimit(); // Throttle
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

        if (USE_MOCK_AI) {
            console.log("Using Mock AI for Path Generation");
            await new Promise(r => setTimeout(r, 1500));
            return res.json(MOCK_PATH);
        }

        const model = getModel(apiKey);
        await rateLimit(); // Throttle

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

        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 800));
            return res.json(MOCK_QUIZ);
        }

        const model = getModel(apiKey);
        await rateLimit(); // Throttle
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

        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1200));
            // Return slightly modified mock path
            return res.json({
                nodes: [
                    ...MOCK_PATH.nodes,
                    { id: "node-new", title: "Refined Topic", description: "Added based on feedback.", estimatedTime: "15 mins" }
                ]
            });
        }

        const model = getModel(apiKey);
        await rateLimit(); // Throttle

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

        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return res.json(MOCK_RESOURCES);
        }

        const model = getModel(apiKey);
        await rateLimit(); // Throttle
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
