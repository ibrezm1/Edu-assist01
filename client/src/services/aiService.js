import { GoogleGenerativeAI } from '@google/generative-ai';

const USE_MOCK_AI = import.meta.env.VITE_USE_MOCK_AI === 'true';

const MOCK_ASSESSMENT = {
    questions: [
        { id: 1, text: "What is the capital of France?", options: ["Berlin", "London", "Paris", "Madrid"], correctAnswerIndex: 2, difficulty: "beginner", reasoning: "Paris is the capital and largest city of France." },
        { id: 2, text: "Which language is used for web styling?", options: ["Python", "HTML", "CSS", "Java"], correctAnswerIndex: 2, difficulty: "beginner", reasoning: "CSS (Cascading Style Sheets) is the standard language for defining the visual presentation of web pages." },
        { id: 3, text: "What does DOM stand for?", options: ["Document Object Model", "Data Object Mode", "Digital Ordinance Model", "Desktop Orientation Module"], correctAnswerIndex: 0, difficulty: "intermediate", reasoning: "DOM stands for Document Object Model, which represents the page so that programs can change the document structure, style, and content." },
        { id: 4, text: "What is a closure in JS?", options: ["A door", "Function with preserved scope", "Variable type", "Loop end"], correctAnswerIndex: 1, difficulty: "advanced", reasoning: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment)." },
        { id: 5, text: "Time complexity of binary search?", options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"], correctAnswerIndex: 1, difficulty: "advanced", reasoning: "Binary search works by repeatedly halving the search interval, resulting in logarithmic time complexity." }
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
        { id: 1, text: "Mock Quiz Question 1", options: ["A", "B", "C", "D"], correctAnswerIndex: 0, reasoning: "Option A is correct because of X." },
        { id: 2, text: "Mock Quiz Question 2", options: ["A", "B", "C", "D"], correctAnswerIndex: 1, reasoning: "Option B is correct because of Y." },
        { id: 3, text: "Mock Quiz Question 3", options: ["A", "B", "C", "D"], correctAnswerIndex: 2, reasoning: "Option C is correct because of Z." }
    ]
};

const MOCK_RESOURCES = {
    resources: [
        { type: "video", title: "Mock Video Tutorial", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Great intro video." },
        { type: "article", title: "Mock Documentation", url: "https://developer.mozilla.org", description: "Official docs." }
    ]
};

const getModel = (settings, includeSearch = false) => {
    const key = settings?.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error("API Key is missing. Please provide it in settings or .env");
    const genAI = new GoogleGenerativeAI(key);

    const modelName = settings?.model || "gemini-2.5-flash-lite";
    const config = { model: modelName };
    if (includeSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    return genAI.getGenerativeModel(config);
};




let lastRequestTime = 0;
const rateLimit = async () => {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    const minInterval = 6000;
    if (timeSinceLast < minInterval) {
        const waitTime = minInterval - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
};

const extractJSON = (text) => {
    try {
        // Remove markdown code blocks if present
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find the first '{' and last '}'
        const firstIndex = cleaned.indexOf('{');
        const lastIndex = cleaned.lastIndexOf('}');

        if (firstIndex === -1 || lastIndex === -1) {
            // Try to find [ ] if it's an array response (though our prompts ask for { })
            const firstArr = cleaned.indexOf('[');
            const lastArr = cleaned.lastIndexOf(']');
            if (firstArr !== -1 && lastArr !== -1) {
                cleaned = cleaned.substring(firstArr, lastArr + 1);
                return JSON.parse(cleaned);
            }
            return JSON.parse(cleaned); // Fallback
        }

        const jsonContent = cleaned.substring(firstIndex, lastIndex + 1);
        return JSON.parse(jsonContent);
    } catch (e) {
        console.error("JSON Parse Error. Original text:", text);
        // Fallback: try regex for anything that looks like JSON if simple slicing fails
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e2) { }
        throw new Error("Failed to parse AI response. " + e.message);
    }
};


export const aiService = {
    generateAssessment: async (topic, settings) => {
        const count = settings?.assessmentQuestions || 5;
        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                ...MOCK_ASSESSMENT,
                questions: MOCK_ASSESSMENT.questions.slice(0, count)
            };
        }

        try {
            const model = getModel(settings);

            await rateLimit();
            const prompt = `
                Act as an expert educator. Create a diagnostic questionnaire to assess a student's knowledge level on the topic: "${topic}".
                Generate ${count} multiple-choice questions with increasing difficulty.
                
                Return the response in strictly valid JSON format with the following structure:
                {
                    "questions": [
                        {
                            "id": 1,
                            "text": "Question text",
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correctAnswerIndex": 0,
                            "difficulty": "beginner",
                            "reasoning": "Explanation..."
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    generatePath: async (topic, assessmentResults, settings) => {
        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1500));
            return MOCK_PATH;
        }

        try {
            const model = getModel(settings);

            await rateLimit();
            const prompt = `
                Based on these results for "${topic}": ${JSON.stringify(assessmentResults)}
                Create a personalized learning path with 10-15 nodes.
                
                Return strictly valid JSON:
                {
                    "summary": "...",
                    "nodes": [{"id": "node-1", "title": "...", "description": "...", "estimatedTime": "..."}]
                }
            `;

            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    generateQuiz: async (nodeContext, settings) => {
        const count = settings?.quizQuestions || 3;
        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 800));
            return {
                ...MOCK_QUIZ,
                questions: MOCK_QUIZ.questions.slice(0, count)
            };
        }

        try {
            const model = getModel(settings);

            await rateLimit();
            const prompt = `
                Generate a verification quiz (${count} questions) for: "${nodeContext}".
                
                Return strictly valid JSON:
                {
                    "questions": [{"id": 1, "text": "...", "options": [...], "correctAnswerIndex": 0, "reasoning": "..."}]
                }
            `;

            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    refinePath: async (topic, currentNodes, feedback, settings) => {
        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1200));
            return { nodes: [...currentNodes, { id: Date.now().toString(), title: "Refined", description: "...", estimatedTime: "..." }] };
        }

        try {
            const model = getModel(settings);

            await rateLimit();
            const prompt = `
                Modify path for "${topic}" based on: "${feedback}".
                Current: ${JSON.stringify(currentNodes)}
                
                Return JSON: {"nodes": [...]}
            `;

            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    generateResources: async (topic, nodeTitle, nodeDescription, settings) => {
        if (USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return MOCK_RESOURCES;
        }

        try {
            const model = getModel(settings, true);

            await rateLimit();
            const prompt = `
                Find 3-5 high-quality learning resources for the module "${nodeTitle}" within the topic "${topic}".
                Module Description: "${nodeDescription}"
                
                You MUST use the GOOGLE SEARCH TOOL to find LIVE, DIRECT, and WORKING URLs.
                Prefer official documentation, reputable educational sites (MDN, w3schools, etc.), and popular tutorials.
                
                Return ONLY a strictly valid JSON object with this structure:
                {
                    "resources": [
                        {
                            "type": "video" | "article",
                            "title": "Clear Resource Title",
                            "url": "https://...",
                            "description": "Short explanation of why this is relevant"
                        }
                    ]
                }
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            console.log("AI Resource Response:", text);
            const data = extractJSON(text);
            console.log("Extracted Resource Data:", data);
            return data;
        } catch (err) {
            console.error("AI Service Error (generateResources):", err);
            throw err;
        }
    },

    listModels: async (apiKey) => {
        const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!key) return [];
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const data = await response.json();
            return data.models || [];
        } catch (err) {
            console.error("Failed to fetch models:", err);
            return [];
        }
    }
};


