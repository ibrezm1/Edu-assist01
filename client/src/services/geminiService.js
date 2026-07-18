import { GoogleGenerativeAI } from '@google/generative-ai';

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
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstIndex = cleaned.indexOf('{');
        const lastIndex = cleaned.lastIndexOf('}');

        if (firstIndex === -1 || lastIndex === -1) {
            const firstArr = cleaned.indexOf('[');
            const lastArr = cleaned.lastIndexOf(']');
            if (firstArr !== -1 && lastArr !== -1) {
                cleaned = cleaned.substring(firstArr, lastArr + 1);
                return JSON.parse(cleaned);
            }
            return JSON.parse(cleaned);
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

export const geminiService = {
    generateAssessment: async (topic, settings) => {
        const count = settings?.assessmentQuestions || 5;
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

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (generateAssessment):", err);
            throw err;
        }
    },

    generatePath: async (topic, assessmentResults, settings) => {
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

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (generatePath):", err);
            throw err;
        }
    },

    generateQuiz: async (nodeContext, settings) => {
        const count = settings?.quizQuestions || 3;
        try {
            const prompt = `
                Generate a verification quiz (${count} questions) for: "${nodeContext}".
                
                Return strictly valid JSON:
                {
                    "questions": [{"id": 1, "text": "...", "options": [...], "correctAnswerIndex": 0, "reasoning": "..."}]
                }
            `;

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (generateQuiz):", err);
            throw err;
        }
    },

    refinePath: async (topic, currentNodes, feedback, settings) => {
        try {
            const prompt = `
                Modify path for "${topic}" based on: "${feedback}".
                Current: ${JSON.stringify(currentNodes)}
                
                Return JSON: {"nodes": [...]}
            `;

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (refinePath):", err);
            throw err;
        }
    },

    generateResources: async (topic, nodeTitle, nodeDescription, settings) => {
        try {
            const prompt = `
                Find 3-5 of the best web resources (articles, video tutorials, documentation) to learn about: "${nodeTitle}" (within the context of "${topic}").
                Module Context: "${nodeDescription}"
                
                Return strictly valid JSON:
                {
                    "resources": [
                        {
                            "type": "video" or "article" or "documentation",
                            "title": "Clear Resource Title",
                            "url": "Direct url link (e.g. YouTube, MDN, Dev.to) or a Google search link if no exact URL is known",
                            "description": "Short description of what the user will learn"
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (generateResources):", err);
            throw err;
        }
    },

    generateFlashcards: async (topic, nodeTitle, nodeDescription, settings) => {
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

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (generateFlashcards):", err);
            throw err;
        }
    },

    generateResearchPapers: async (topic, nodeTitle, settings) => {
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

            const model = getModel(settings, true); // Enable search grounding
            await rateLimit();
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            let sources = [];
            try {
                const groundingMetadata = result.response.candidates[0].groundingMetadata;
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
                console.warn("Could not extract grounding sources for papers:", e);
            }

            const parsed = extractJSON(text);
            if (parsed.papers && parsed.papers.length > 0 && sources.length > 0) {
                parsed.papers = parsed.papers.map((p, idx) => {
                    if ((!p.url || p.url === "https://arxiv.org") && sources[idx]) {
                        return { ...p, url: sources[idx].url };
                    }
                    return p;
                });
            }

            return parsed;
        } catch (err) {
            console.error("Gemini Service Error (generateResearchPapers):", err);
            throw err;
        }
    },

    generatePracticeProblems: async (topic, nodeTitle, nodeDescription, settings) => {
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

            const model = getModel(settings);
            await rateLimit();
            const result = await model.generateContent(prompt);
            return extractJSON(result.response.text());
        } catch (err) {
            console.error("Gemini Service Error (generatePracticeProblems):", err);
            throw err;
        }
    },

    generateBooks: async (topic, nodeTitle, settings) => {
        try {
            const prompt = `
                Perform a search to find 3-5 of the top rated books or textbooks regarding: "${nodeTitle}" within the field of "${topic}".
                
                For each book, you must provide its title, author, rating (out of 5 stars, e.g. 4.8), a short description of what it covers and why it is recommended, and a URL link (e.g. Google Books, Amazon, or a search query link).
                
                You must return strictly valid JSON in this format:
                {
                    "books": [
                        {
                            "title": "Exact name of the book",
                            "author": "Name of the author(s)",
                            "rating": 4.7,
                            "description": "Short summary and why it is recommended",
                            "url": "Direct link or search query URL if no direct link is available"
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            const model = getModel(settings, true); // Enable search grounding
            await rateLimit();
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            let sources = [];
            try {
                const groundingMetadata = result.response.candidates[0].groundingMetadata;
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
                console.warn("Could not extract grounding sources for books:", e);
            }

            const parsed = extractJSON(text);
            if (parsed.books && parsed.books.length > 0) {
                parsed.books = parsed.books.map((b, idx) => {
                    const ratingNum = typeof b.rating === 'number' ? b.rating : (parseFloat(b.rating) || 4.5);
                    const bookUrl = ((!b.url || b.url.includes("google.com/search")) && sources[idx]) ? sources[idx].url : b.url;
                    return {
                        ...b,
                        rating: ratingNum,
                        url: bookUrl
                    };
                });
            }

            return parsed;
        } catch (err) {
            console.error("Gemini Service Error (generateBooks):", err);
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
            console.error("Failed to fetch models from Gemini:", err);
            return [];
        }
    },

    chat: async (messages, settings) => {
        try {
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
            console.error("Gemini Chat Error:", err);
            throw err;
        }
    }
};
