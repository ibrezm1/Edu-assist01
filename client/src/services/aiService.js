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

    let modelName = settings?.model || "gemini-2.5-flash-lite";

    const config = { model: modelName };

    if (includeSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    return genAI.getGenerativeModel(config);
};

const callOpenRouter = async (prompt, includeSearch, settings) => {
    const key = settings?.openrouterKey || import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) throw new Error("OpenRouter API Key is missing. Please provide it in settings or .env");
    const model = settings?.openrouterModel || "google/gemini-2.5-flash-lite";

    const body = {
        model: model,
        messages: [
            { role: "user", content: prompt }
        ]
    };

    if (includeSearch && settings?.openrouterSearch) {
        body.tools = [{ type: "openrouter:web_search" }];
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ibrezm1.github.io/Edu-assist01/",
            "X-Title": "Course Craft"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

const callOpenRouterChat = async (messages, includeSearch, settings) => {
    const key = settings?.openrouterKey || import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) throw new Error("OpenRouter API Key is missing. Please provide it in settings or .env");
    const model = settings?.openrouterModel || "google/gemini-2.5-flash-lite";

    const formattedMessages = messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'object' ? m.content.text : m.content
    }));

    const body = {
        model: model,
        messages: formattedMessages
    };

    if (includeSearch && settings?.openrouterSearch) {
        body.tools = [{ type: "openrouter:web_search" }];
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ibrezm1.github.io/Edu-assist01/",
            "X-Title": "Course Craft"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let sources = [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    const uniqueUrls = new Set();
    while ((match = linkRegex.exec(content)) !== null) {
        const title = match[1];
        const url = match[2];
        if (!uniqueUrls.has(url)) {
            uniqueUrls.add(url);
            sources.push({ title, url });
        }
    }

    return {
        text: content,
        sources: sources
    };
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
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e2) { }
        throw new Error("Failed to parse AI response. " + e.message);
    }
};


export const aiService = {
    generateAssessment: async (topic, settings) => {
        if (!topic) return { questions: [] };
        const count = settings?.assessmentQuestions || 5;
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                ...MOCK_ASSESSMENT,
                questions: MOCK_ASSESSMENT.questions.slice(0, count)
            };
        }

        try {
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

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, false, settings);
            } else {
                const model = getModel(settings);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    generatePath: async (topic, assessmentResults, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1500));
            return MOCK_PATH;
        }

        try {
            const prompt = `
                Based on these results for "${topic}": ${JSON.stringify(assessmentResults)}
                Create a personalized learning path with 10-15 nodes.
                
                Return strictly valid JSON:
                {
                    "summary": "...",
                    "nodes": [{"id": "node-1", "title": "...", "description": "...", "estimatedTime": "..."}]
                }
            `;

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, false, settings);
            } else {
                const model = getModel(settings);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    generateQuiz: async (nodeContext, settings) => {
        const count = settings?.quizQuestions || 3;
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 800));
            return {
                ...MOCK_QUIZ,
                questions: MOCK_QUIZ.questions.slice(0, count)
            };
        }

        try {
            const prompt = `
                Generate a verification quiz (${count} questions) for: "${nodeContext}".
                
                Return strictly valid JSON:
                {
                    "questions": [{"id": 1, "text": "...", "options": [...], "correctAnswerIndex": 0, "reasoning": "..."}]
                }
            `;

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, false, settings);
            } else {
                const model = getModel(settings);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    refinePath: async (topic, currentNodes, feedback, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return MOCK_PATH;
        }

        try {
            const prompt = `
                Modify path for "${topic}" based on: "${feedback}".
                Current: ${JSON.stringify(currentNodes)}
                
                Return JSON: {"nodes": [...]}
            `;

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, false, settings);
            } else {
                const model = getModel(settings);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error:", err);
            throw err;
        }
    },

    generateResources: async (topic, nodeTitle, nodeDescription, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return MOCK_RESOURCES;
        }

        try {
            const prompt = `
                Find 3-5 high-quality, direct learning resources (videos, tutorials, or official documentation) for the module "${nodeTitle}" within the topic "${topic}".
                Module Description: "${nodeDescription}"
                
                Search for the BEST resources. 
                Focus on:
                1. Official Documentation (MDN, Microsoft, GitHub)
                2. Trusted Tutorial platforms (FreeCodeCamp, etc.)
                3. High-quality Video tutorials
                
                You must return strictly valid JSON in this format:
                {
                    "resources": [
                        {
                            "type": "video" | "article",
                            "title": "Title of the resource",
                            "url": "Direct URL to the resource",
                            "description": "Short description of the resource"
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            let resources = [];
            if (settings?.provider === 'openrouter') {
                const jsonText = await callOpenRouter(prompt, true, settings);
                try {
                    const data = extractJSON(jsonText);
                    if (data && data.resources) {
                        resources = data.resources;
                    }
                } catch (err) {
                    console.warn("OpenRouter resource search JSON extraction failed:", err);
                    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
                    let match;
                    while ((match = linkRegex.exec(jsonText)) !== null) {
                        resources.push({
                            type: match[2].includes('youtube.com') || match[2].includes('youtu.be') ? 'video' : 'article',
                            title: match[1],
                            url: match[2],
                            description: `Found resource: ${match[1]}`
                        });
                    }
                }
            } else {
                const model = getModel(settings, true);
                await rateLimit();
                const result = await model.generateContent(prompt);
                const response = result.response;

                try {
                    const groundingMetadata = response.candidates[0].groundingMetadata;
                    if (groundingMetadata && groundingMetadata.groundingChunks) {
                        const uniqueSources = new Map();
                        groundingMetadata.groundingChunks.forEach(chunk => {
                            if (chunk.web && chunk.web.uri && chunk.web.title) {
                                if (!uniqueSources.has(chunk.web.uri)) {
                                    uniqueSources.set(chunk.web.uri, {
                                        title: chunk.web.title,
                                        url: chunk.web.uri
                                    });
                                }
                            }
                        });

                        resources = Array.from(uniqueSources.values()).map(source => ({
                            type: source.url.includes('youtube.com') || source.url.includes('youtu.be') ? 'video' : 'article',
                            title: source.title,
                            url: source.url,
                            description: `A highly relevant resource for ${nodeTitle} found via Google Search.`
                        }));
                    }
                } catch (e) {
                    console.warn("Could not extract grounding resources:", e);
                }

                if (resources.length === 0) {
                    try {
                        const fallbackData = extractJSON(response.text());
                        if (fallbackData && fallbackData.resources) {
                            resources = fallbackData.resources;
                        }
                    } catch (err) {
                        console.warn("Fallback JSON extraction failed:", err);
                    }
                }
            }

            return { resources };
        } catch (err) {
            console.error("AI Service Error (generateResources):", err);
            throw err;
        }
    },

    generateFlashcards: async (topic, nodeTitle, nodeDescription, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                flashcards: [
                    { id: 1, front: `What is the main concept of ${nodeTitle}?`, back: `This is a mock answer for the main concept of ${nodeTitle} on the topic of ${topic}.` },
                    { id: 2, front: `Name a key detail of ${nodeTitle}.`, back: `A key detail is described in: ${nodeDescription}.` },
                    { id: 3, front: "Why is this important?", back: "It provides the foundational knowledge required for subsequent lessons." },
                    { id: 4, front: "Can this concept be applied in real-world scenarios?", back: "Yes, it is widely used in modern applications and frameworks." },
                    { id: 5, front: "What is a common pitfall?", back: "A common pitfall is overcomplicating the setup before understanding the core mechanics." }
                ]
            };
        }

        try {
            const prompt = `
                Generate a set of 5-8 flashcards to help study: "${nodeTitle}" within the topic "${topic}".
                Module Description: "${nodeDescription}"
                
                Each flashcard must have a front (question or concept to define) and a back (clear, concise answer or explanation).
                
                Return strictly valid JSON in this format:
                {
                    "flashcards": [
                        {
                            "id": 1,
                            "front": "Question/Concept",
                            "back": "Answer/Definition"
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, false, settings);
            } else {
                const model = getModel(settings);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error (generateFlashcards):", err);
            throw err;
        }
    },

    generateResearchPapers: async (topic, nodeTitle, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                papers: [
                    { title: `Recent Advances in ${nodeTitle}`, keyIdea: `A comprehensive survey of current methodologies and tools in ${topic}.`, url: "https://arxiv.org" },
                    { title: `Efficient Implementation of ${nodeTitle} Systems`, keyIdea: `Proposes a new algorithm that improves execution efficiency by 35% under modern workloads.`, url: "https://arxiv.org" }
                ]
            };
        }

        try {
            const prompt = `
                Perform a search to find 3-5 of the latest research papers, academic articles, or scholarly publications regarding: "${nodeTitle}" within the field of "${topic}".
                
                You must return strictly valid JSON in this format:
                {
                    "papers": [
                        {
                            "title": "Exact name of the research paper",
                            "keyIdea": "A one-sentence summary of the main concept or key idea of the paper",
                            "url": "Direct academic link (e.g. ArXiv, Google Scholar, IEEE) or search query URL if no direct link is available"
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, true, settings);
            } else {
                const model = getModel(settings, true);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error (generateResearchPapers):", err);
            throw err;
        }
    },

    generatePracticeProblems: async (topic, nodeTitle, nodeDescription, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                problems: [
                    { id: 1, title: `Trivial (Group A): Basic Verification`, description: `Write a minimal snippet or configure a basic project environment to test importing and running standard components of ${nodeTitle}. Ensure output is printed correctly to verify setup.`, group: "A" },
                    { id: 2, title: `Intermediate (Group B): Core Feature Implementation`, description: `Create a functional application using ${nodeTitle} that accepts user input, processes it, and renders custom updates dynamically. Add basic error boundary protection.`, group: "B" },
                    { id: 3, title: `Difficult (Group C): Performance Optimization & Custom Hooks`, description: `Implement optimization strategies for ${nodeTitle} (such as debouncing inputs, caching results, or lazy loading modules). Benchmark rendering times or computation cycles.`, group: "C" },
                    { id: 4, title: `Very Difficult (Group D): Production Architecture Design`, description: `Build a highly scalable, robust framework or micro-service demonstrating ${nodeTitle}. Integrate state synchronization, custom events, secure storage, and clear fallback error state displays.`, group: "D" }
                ]
            };
        }

        try {
            const prompt = `
                Act as an expert practical coding instructor. Generate a set of 4 to 8 hands-on practical tasks or real-life problems the user can solve to gain practical, experiential knowledge of the topic "${nodeTitle}" (within the field of "${topic}").
                Module Context: "${nodeDescription}"
                
                You must categorize the problems into four difficulty levels:
                - Group A (Trivial): Extremely simple, basic verification tasks.
                - Group B (Easy/Intermediate): Practical tasks requiring typical implementation.
                - Group C (Difficult): Complex, multi-layered challenges.
                - Group D (Very Difficult): Extremely challenging, open-ended architecture/optimization problems.

                Ensure there is at least one problem for each group (A, B, C, D).
                Do not provide code solutions or answers, ONLY the problem titles and instructions.
                
                Return strictly valid JSON in this format:
                {
                    "problems": [
                        {
                            "id": 1,
                            "title": "Short Descriptive Title of the Task",
                            "description": "Clear step-by-step description of the real-world problem or program to write, specifying requirements and challenges.",
                            "group": "A"
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            let jsonText;
            if (settings?.provider === 'openrouter') {
                jsonText = await callOpenRouter(prompt, false, settings);
            } else {
                const model = getModel(settings);
                await rateLimit();
                const result = await model.generateContent(prompt);
                jsonText = result.response.text();
            }

            return extractJSON(jsonText);
        } catch (err) {
            console.error("AI Service Error (generatePracticeProblems):", err);
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
    },

    listOpenRouterModels: async (apiKey) => {
        const key = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
        try {
            const headers = key ? { "Authorization": `Bearer ${key}` } : {};
            const response = await fetch("https://openrouter.ai/api/v1/models", { headers });
            if (!response.ok) throw new Error("Failed to fetch models");
            const data = await response.json();
            return data.data || [];
        } catch (err) {
            console.error("Failed to fetch OpenRouter models:", err);
            return [];
        }
    },

    chat: async (messages, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                text: "This is a mock response from Course Craft (Demo Mode). How can I help you today?",
                sources: []
            };
        }

        try {
            if (settings?.provider === 'openrouter') {
                return await callOpenRouterChat(messages, true, settings);
            }

            const model = getModel(settings, true); // Enable search
            const firstUserIdx = messages.findIndex(m => m.role === 'user');
            const validHistory = firstUserIdx === -1 ? [] : messages.slice(firstUserIdx, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: typeof m.content === 'object' ? m.content.text : m.content }]
            }));

            const chatSession = model.startChat({
                history: validHistory,
            });

            const lastMessage = messages[messages.length - 1].content;
            const result = await chatSession.sendMessage(lastMessage);
            const response = result.response;

            let sources = [];
            try {
                const groundingMetadata = response.candidates[0].groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingChunks) {
                    const uniqueSources = new Map();
                    groundingMetadata.groundingChunks.forEach(chunk => {
                        if (chunk.web && chunk.web.uri && chunk.web.title) {
                            if (!uniqueSources.has(chunk.web.uri)) {
                                uniqueSources.set(chunk.web.uri, {
                                    title: chunk.web.title,
                                    url: chunk.web.uri
                                });
                            }
                        }
                    });
                    sources = Array.from(uniqueSources.values());
                }
            } catch (e) {
                console.warn("Could not extract grounding sources:", e);
            }

            return {
                text: response.text(),
                sources: sources
            };
        } catch (err) {
            console.error("Chat Error:", err);
            throw err;
        }
    }
};




