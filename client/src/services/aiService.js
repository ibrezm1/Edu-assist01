import { geminiService } from './geminiService';
import { openRouterService } from './openRouterService';

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

const MOCK_FLASHCARDS = {
    flashcards: [
        { id: 1, front: `What is the main concept?`, back: `This is a mock answer for the main concept on this topic.` },
        { id: 2, front: `Name a key detail.`, back: `A key detail is described in the main instructions.` },
        { id: 3, front: "Why is this important?", back: "It provides the foundational knowledge required for subsequent lessons." },
        { id: 4, front: "Can this concept be applied in real-world scenarios?", back: "Yes, it is widely used in modern applications and frameworks." },
        { id: 5, front: "What is a common pitfall?", back: "A common pitfall is overcomplicating the setup before understanding the core mechanics." }
    ]
};

const MOCK_PAPERS = {
    papers: [
        { title: `Recent Advances in this Field`, keyIdea: `A comprehensive survey of current methodologies and tools on the topic.`, url: "https://arxiv.org" },
        { title: `Efficient Implementation of Systems`, keyIdea: `Proposes a new algorithm that improves execution efficiency by 35% under modern workloads.`, url: "https://arxiv.org" }
    ]
};

const MOCK_BOOKS = {
    books: [
        { title: "Standard Handbook of the Topic", author: "Dr. Jane Smith", rating: 4.8, description: "A comprehensive reference manual covering fundamental principles, historical context, and modern applications.", url: "https://books.google.com" },
        { title: "Introduction to Practical Design", author: "Prof. John Doe", rating: 4.5, description: "A highly-rated textbook filled with exercises, examples, and simple breakdowns for beginners.", url: "https://books.google.com" }
    ]
};

const MOCK_PROBLEMS = {
    problems: [
        { id: 1, title: `Trivial (Group A): Basic Verification`, description: `Write a minimal snippet or configure a basic project environment to test importing and running standard components. Ensure output is printed correctly to verify setup.`, group: "A" },
        { id: 2, title: `Intermediate (Group B): Core Feature Implementation`, description: `Create a functional application that accepts user input, processes it, and renders custom updates dynamically. Add basic error boundary protection.`, group: "B" },
        { id: 3, title: `Difficult (Group C): Performance Optimization & Custom Hooks`, description: `Implement optimization strategies (such as debouncing inputs, caching results, or lazy loading modules). Benchmark rendering times or computation cycles.`, group: "C" },
        { id: 4, title: `Very Difficult (Group D): Production Architecture Design`, description: `Build a highly scalable, robust framework or micro-service demonstrating the topic. Integrate state synchronization, custom events, secure storage, and clear fallback error state displays.`, group: "D" }
    ]
};

const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let retries = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            retries++;
            const errStatus = err?.status || err?.statusCode || (err?.response && err.response.status);
            const errMsg = err?.message?.toLowerCase() || '';
            const isTransient = 
                errStatus === 429 ||
                (errStatus >= 500 && errStatus < 600) ||
                errMsg.includes('429') ||
                errMsg.includes('rate limit') ||
                errMsg.includes('quota exceeded') ||
                errMsg.includes('quota') ||
                errMsg.includes('fetch') ||
                errMsg.includes('network') ||
                errMsg.includes('timeout') ||
                errMsg.includes('failed to fetch');
                
            if (retries > maxRetries || !isTransient) {
                throw err;
            }
            const delay = baseDelay * Math.pow(2, retries - 1) * (0.8 + Math.random() * 0.4);
            console.warn(`Transient AI error encountered. Retrying in ${Math.round(delay)}ms (Attempt ${retries}/${maxRetries}):`, err);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
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

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generateAssessment(topic, settings);
            } else {
                return geminiService.generateAssessment(topic, settings);
            }
        });
    },

    generatePath: async (topic, assessmentResults, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1500));
            return MOCK_PATH;
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generatePath(topic, assessmentResults, settings);
            } else {
                return geminiService.generatePath(topic, assessmentResults, settings);
            }
        });
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

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generateQuiz(nodeContext, settings);
            } else {
                return geminiService.generateQuiz(nodeContext, settings);
            }
        });
    },

    refinePath: async (topic, currentNodes, feedback, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return MOCK_PATH;
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.refinePath(topic, currentNodes, feedback, settings);
            } else {
                return geminiService.refinePath(topic, currentNodes, feedback, settings);
            }
        });
    },

    generateResources: async (topic, nodeTitle, nodeDescription, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return MOCK_RESOURCES;
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generateResources(topic, nodeTitle, nodeDescription, settings);
            } else {
                return geminiService.generateResources(topic, nodeTitle, nodeDescription, settings);
            }
        });
    },

    generateFlashcards: async (topic, nodeTitle, nodeDescription, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                flashcards: MOCK_FLASHCARDS.flashcards.map(fc => {
                    if (fc.id === 1) return { ...fc, front: `What is the main concept of ${nodeTitle}?`, back: `This is a mock answer for the main concept of ${nodeTitle} on the topic of ${topic}.` };
                    if (fc.id === 2) return { ...fc, front: `Name a key detail of ${nodeTitle}.`, back: `A key detail is described in: ${nodeDescription}.` };
                    return fc;
                })
            };
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generateFlashcards(topic, nodeTitle, nodeDescription, settings);
            } else {
                return geminiService.generateFlashcards(topic, nodeTitle, nodeDescription, settings);
            }
        });
    },

    generateResearchPapers: async (topic, nodeTitle, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                papers: MOCK_PAPERS.papers.map(p => {
                    if (p.title.startsWith('Recent Advances')) return { ...p, title: `Recent Advances in ${nodeTitle}`, keyIdea: `A comprehensive survey of current methodologies and tools in ${topic}.` };
                    if (p.title.startsWith('Efficient Implementation')) return { ...p, title: `Efficient Implementation of ${nodeTitle} Systems` };
                    return p;
                })
            };
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generateResearchPapers(topic, nodeTitle, settings);
            } else {
                return geminiService.generateResearchPapers(topic, nodeTitle, settings);
            }
        });
    },

    generatePracticeProblems: async (topic, nodeTitle, nodeDescription, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return MOCK_PROBLEMS;
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generatePracticeProblems(topic, nodeTitle, nodeDescription, settings);
            } else {
                return geminiService.generatePracticeProblems(topic, nodeTitle, nodeDescription, settings);
            }
        });
    },

    generateBooks: async (topic, nodeTitle, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                books: MOCK_BOOKS.books.map(b => {
                    if (b.title.startsWith('Standard Handbook')) return { ...b, title: `Standard Handbook of ${nodeTitle}` };
                    if (b.title.startsWith('Introduction to Practical')) return { ...b, title: `Introduction to Practical ${nodeTitle}` };
                    return b;
                })
            };
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.generateBooks(topic, nodeTitle, settings);
            } else {
                return geminiService.generateBooks(topic, nodeTitle, settings);
            }
        });
    },

    listModels: async (apiKey) => {
        return geminiService.listModels(apiKey);
    },

    listOpenRouterModels: async (apiKey) => {
        return openRouterService.listModels(apiKey);
    },

    chat: async (messages, settings) => {
        if (settings?.demoMode || USE_MOCK_AI) {
            await new Promise(r => setTimeout(r, 1000));
            return {
                text: "This is a mock response from Course Craft (Demo Mode). How can I help you today?",
                sources: []
            };
        }

        return withRetry(() => {
            if (settings?.provider === 'openrouter') {
                return openRouterService.chat(messages, settings);
            } else {
                return geminiService.chat(messages, settings);
            }
        });
    }
};
