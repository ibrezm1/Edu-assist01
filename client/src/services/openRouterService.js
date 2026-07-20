const callOpenRouter = async (prompt, includeSearch, settings, responseJson = false) => {
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

    if (responseJson) {
        body.response_format = { type: "json_object" };
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

export const openRouterService = {
    generateAssessment: async (topic, settings) => {
        const count = settings?.assessmentQuestions || 5;
        try {
            const prompt = `
                Act as an expert educator. Create a diagnostic questionnaire to assess a student's knowledge level on the topic: "${topic}".
                Generate ${count} multiple-choice questions with increasing difficulty.
                
                CRITICAL INSTRUCTION FOR OPTIONS:
                - Randomize the position of the correct answer across options A, B, C, D (indices 0, 1, 2, 3).
                - Do NOT always place the correct answer as option A or index 0.

                Return the response in strictly valid JSON format with the following structure:
                {
                    "questions": [
                        {
                            "id": 1,
                            "text": "Question text",
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correctAnswerIndex": 2,
                            "difficulty": "beginner",
                            "reasoning": "Explanation..."
                        }
                    ]
                }
                Do not include any other text or markdown decorators.
            `;

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generateAssessment):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generatePath):", err);
            throw err;
        }
    },

    generateQuiz: async (nodeContext, settings) => {
        const count = settings?.quizQuestions || 3;
        try {
            const prompt = `
                Generate a verification quiz (${count} questions) for: "${nodeContext}".
                
                CRITICAL INSTRUCTION FOR OPTIONS:
                - Randomize the position of the correct answer across all 4 options (indices 0, 1, 2, 3).
                - Do NOT always place the correct answer as option A / index 0.

                Return strictly valid JSON:
                {
                    "questions": [{"id": 1, "text": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswerIndex": 2, "reasoning": "..."}]
                }
            `;

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generateQuiz):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (refinePath):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generateResources):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generateFlashcards):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generateResearchPapers):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("OpenRouter Service Error (generatePracticeProblems):", err);
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

            const jsonText = await callOpenRouter(prompt, false, settings, true);
            const parsed = extractJSON(jsonText);
            if (parsed.books && parsed.books.length > 0) {
                parsed.books = parsed.books.map(b => {
                    const ratingNum = typeof b.rating === 'number' ? b.rating : (parseFloat(b.rating) || 4.5);
                    return {
                        ...b,
                        rating: ratingNum
                    };
                });
            }
            return parsed;
        } catch (err) {
            console.error("OpenRouter Service Error (generateBooks):", err);
            throw err;
        }
    },

    listModels: async (apiKey) => {
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
        try {
            return await callOpenRouterChat(messages, true, settings);
        } catch (err) {
            console.error("OpenRouter Chat Error:", err);
            throw err;
        }
    }
};
