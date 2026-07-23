const getNvidiaUrl = (endpointPath, settings) => {
    const baseUrl = settings?.nvidiaBaseUrl || 'https://nvdia-limit-0719.foldedgoat.workers.dev/';
    if (baseUrl.includes('foldedgoat.workers.dev') || baseUrl.includes('?url=')) {
        const cleanBase = baseUrl.split('?url=')[0];
        const targetEndpoint = `https://integrate.api.nvidia.com/v1${endpointPath}`;
        return `${cleanBase}?url=${encodeURIComponent(targetEndpoint)}`;
    }
    return `${baseUrl.replace(/\/$/, '')}${endpointPath}`;
};

const schemas = {
    assessment: {
        type: "object",
        properties: {
            questions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        text: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correctAnswerIndex: { type: "number" },
                        difficulty: { type: "string" },
                        reasoning: { type: "string" }
                    },
                    required: ["id", "text", "options", "correctAnswerIndex", "difficulty", "reasoning"]
                }
            }
        },
        required: ["questions"]
    },
    path: {
        type: "object",
        properties: {
            summary: { type: "string" },
            nodes: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        estimatedTime: { type: "string" }
                    },
                    required: ["id", "title", "description", "estimatedTime"]
                }
            }
        },
        required: ["summary", "nodes"]
    },
    quiz: {
        type: "object",
        properties: {
            questions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        text: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correctAnswerIndex: { type: "number" },
                        reasoning: { type: "string" }
                    },
                    required: ["id", "text", "options", "correctAnswerIndex", "reasoning"]
                }
            }
        },
        required: ["questions"]
    },
    refine: {
        type: "object",
        properties: {
            nodes: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        estimatedTime: { type: "string" }
                    },
                    required: ["id", "title", "description", "estimatedTime"]
                }
            }
        },
        required: ["nodes"]
    },
    resources: {
        type: "object",
        properties: {
            resources: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        type: { type: "string" },
                        title: { type: "string" },
                        url: { type: "string" },
                        description: { type: "string" }
                    },
                    required: ["type", "title", "url", "description"]
                }
            }
        },
        required: ["resources"]
    },
    flashcards: {
        type: "object",
        properties: {
            flashcards: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        front: { type: "string" },
                        back: { type: "string" }
                    },
                    required: ["id", "front", "back"]
                }
            }
        },
        required: ["flashcards"]
    },
    papers: {
        type: "object",
        properties: {
            papers: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        keyIdea: { type: "string" },
                        url: { type: "string" }
                    },
                    required: ["title", "keyIdea", "url"]
                }
            }
        },
        required: ["papers"]
    },
    problems: {
        type: "object",
        properties: {
            problems: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "number" },
                        title: { type: "string" },
                        description: { type: "string" },
                        group: { type: "string" }
                    },
                    required: ["id", "title", "description", "group"]
                }
            }
        },
        required: ["problems"]
    },
    books: {
        type: "object",
        properties: {
            books: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        author: { type: "string" },
                        rating: { type: "number" },
                        description: { type: "string" },
                        url: { type: "string" }
                    },
                    required: ["title", "author", "rating", "description", "url"]
                }
            }
        },
        required: ["books"]
    }
};

const callNvidia = async (prompt, settings, schema = null) => {
    const key = settings?.nvidiaKey || import.meta.env.VITE_NVIDIA_API_KEY;
    if (!key) throw new Error("Nvidia API Key is missing. Please provide it in settings.");
    const model = settings?.nvidiaModel || "stepfun-ai/step-3.7-flash";

    const body = {
        model: model,
        messages: [
            { role: "user", content: prompt }
        ]
    };

    if (schema) {
        if (typeof schema === 'object') {
            body.response_format = {
                type: "json_schema",
                json_schema: {
                    name: "structured_output",
                    schema: schema
                }
            };
            body.nvext = {
                guided_json: schema
            };
        } else {
            body.response_format = { type: "json_object" };
        }
    }

    const url = getNvidiaUrl('/chat/completions', settings);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Nvidia API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error("Empty response from Nvidia NIM API");
    }
    return data.choices[0].message.content;
};

const callNvidiaChat = async (messages, settings) => {
    const key = settings?.nvidiaKey || import.meta.env.VITE_NVIDIA_API_KEY;
    if (!key) throw new Error("Nvidia API Key is missing. Please provide it in settings.");
    const model = settings?.nvidiaModel || "stepfun-ai/step-3.7-flash";

    const formattedMessages = messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'object' ? m.content.text : m.content
    }));

    const body = {
        model: model,
        messages: formattedMessages
    };

    const url = getNvidiaUrl('/chat/completions', settings);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Nvidia API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error("Empty response from Nvidia NIM API");
    }
    const content = data.choices[0].message.content;

    return {
        text: content,
        sources: [] // Nvidia NIM does not natively support web search sources
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

export const nvidiaService = {
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

            const jsonText = await callNvidia(prompt, settings, schemas.assessment);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generateAssessment):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.path);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generatePath):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.quiz);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generateQuiz):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.refine);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (refinePath):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.resources);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generateResources):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.flashcards);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generateFlashcards):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.papers);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generateResearchPapers):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.problems);
            return extractJSON(jsonText);
        } catch (err) {
            console.error("Nvidia Service Error (generatePracticeProblems):", err);
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

            const jsonText = await callNvidia(prompt, settings, schemas.books);
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
            console.error("Nvidia Service Error (generateBooks):", err);
            throw err;
        }
    },

    listModels: async (apiKey, nvidiaBaseUrl) => {
        const key = apiKey || import.meta.env.VITE_NVIDIA_API_KEY;
        const settings = { nvidiaKey: key, nvidiaBaseUrl };
        try {
            const url = getNvidiaUrl('/models', settings);
            const headers = key ? { "Authorization": `Bearer ${key}` } : {};
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error("Failed to fetch Nvidia models");
            const data = await response.json();
            return data.data || [];
        } catch (err) {
            console.error("Failed to fetch Nvidia models:", err);
            return [];
        }
    },

    chat: async (messages, settings) => {
        try {
            return await callNvidiaChat(messages, settings);
        } catch (err) {
            console.error("Nvidia Chat Error:", err);
            throw err;
        }
    }
};
