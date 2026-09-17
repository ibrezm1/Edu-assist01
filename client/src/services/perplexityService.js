/**
 * Perplexity AI Integration Service
 * Generates context-specific prompts for collaborative JSON editing and link validation/enhancement,
 * and parses/extracts clean JSON from Perplexity responses.
 */

export const CONTEXT_TYPES = {
    PAPERS: 'papers',
    RESOURCES: 'resources',
    BOOKS: 'books',
    QUIZ: 'quiz',
    PROBLEMS: 'problems',
    FLASHCARDS: 'flashcards',
    PATH: 'path',
    GENERIC: 'generic'
};

export const CONTEXT_ACTION_PRESETS = {
    [CONTEXT_TYPES.PATH]: [
        {
            id: 'add_nodes',
            label: 'Add Missing Nodes',
            icon: 'PlusCircle',
            description: 'Search standard curricula and add any missing prerequisite or advanced nodes/milestones.'
        },
        {
            id: 'update_nodes',
            label: 'Update & Refine Nodes',
            icon: 'Sparkles',
            description: 'Refine roadmap milestone titles, descriptions, and estimated study hours.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom instructions for updating curriculum path nodes.'
        }
    ],
    [CONTEXT_TYPES.RESOURCES]: [
        {
            id: 'update_links',
            label: 'Verify & Update URLs / Links',
            icon: 'Globe',
            description: 'Search live web to test and update working URLs, replacing 404s/dead links.'
        },
        {
            id: 'add_resources',
            label: 'Add New Learning Resources',
            icon: 'PlusCircle',
            description: 'Search for top-rated documentation, interactive tutorials, and video links with live URLs.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom instructions for resource links and guides.'
        }
    ],
    [CONTEXT_TYPES.FLASHCARDS]: [
        {
            id: 'add_flashcards',
            label: 'Add More Flashcards',
            icon: 'PlusCircle',
            description: 'Generate new high-yield active recall flashcard pairs matching the schema.'
        },
        {
            id: 'correct_flashcards',
            label: 'Update & Correct Flashcards',
            icon: 'Sparkles',
            description: 'Verify accuracy of terms, definitions, and sharpen card phrasing.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom flashcard instructions.'
        }
    ],
    [CONTEXT_TYPES.PAPERS]: [
        {
            id: 'correct_papers',
            label: 'Correct Papers & Links',
            icon: 'Globe',
            description: 'Verify paper titles, authors, years, and update working arXiv/DOI links.'
        },
        {
            id: 'add_papers',
            label: 'Add Relevant Papers',
            icon: 'PlusCircle',
            description: 'Search arXiv/IEEE for seminal and recent (2022-2026) papers with valid open-access links.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom literature search instructions.'
        }
    ],
    [CONTEXT_TYPES.BOOKS]: [
        {
            id: 'correct_books',
            label: 'Correct Books & Links',
            icon: 'Globe',
            description: 'Verify book titles, authors, descriptions, and valid Goodreads/publisher URLs.'
        },
        {
            id: 'add_books',
            label: 'Add Relevant Books',
            icon: 'PlusCircle',
            description: 'Search for top-rated, standard textbooks and reference books.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom book recommendation instructions.'
        }
    ],
    [CONTEXT_TYPES.PROBLEMS]: [
        {
            id: 'add_problems',
            label: 'Add Relevant Practice Tasks',
            icon: 'PlusCircle',
            description: 'Create new graded coding/practical challenges with hints, test cases & platform links.'
        },
        {
            id: 'correct_problems',
            label: 'Correct Tasks & Links',
            icon: 'Globe',
            description: 'Calibrate difficulty, fix problem statements, and update platform challenge URLs.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom practice task instructions.'
        }
    ],
    [CONTEXT_TYPES.QUIZ]: [
        {
            id: 'add_quiz',
            label: 'Add More Quiz Questions',
            icon: 'PlusCircle',
            description: 'Generate additional multiple-choice questions with 4 options and detailed reasoning.'
        },
        {
            id: 'correct_quiz',
            label: 'Correct Questions & Answers',
            icon: 'Sparkles',
            description: 'Fact-check questions, verify answer keys, improve distractors & reasoning.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom quiz generation instructions.'
        }
    ],
    [CONTEXT_TYPES.GENERIC]: [
        {
            id: 'correct_data',
            label: 'Correct & Update Data',
            icon: 'Sparkles',
            description: 'Verify accuracy and update links while strictly preserving structure.'
        },
        {
            id: 'add_items',
            label: 'Add More Items',
            icon: 'PlusCircle',
            description: 'Generate additional entries matching the schema.'
        },
        {
            id: 'custom',
            label: 'Custom Instruction',
            icon: 'Edit3',
            description: 'Provide custom instructions.'
        }
    ]
};

/**
 * Returns action presets tailored specifically for the given context.
 */
export const getActionPresetsForContext = (contextType) => {
    return CONTEXT_ACTION_PRESETS[contextType] || CONTEXT_ACTION_PRESETS[CONTEXT_TYPES.GENERIC];
};

/**
 * Returns context metadata and default guidelines for each section.
 */
const getContextConfig = (contextType) => {
    switch (contextType) {
        case CONTEXT_TYPES.PAPERS:
            return {
                name: 'Research Papers',
                role: 'academic researcher and literature review specialist with real-time web search capability',
                goal: 'Review, verify, and update academic research papers, authors, publication years, abstracts, and live working arXiv/IEEE/ACM/Semantic Scholar/DOI links.',
                schemaDescription: `Array of Paper objects with structure:\n[\n  {\n    "title": "string (Exact official paper title)",\n    "authors": "string (Comma-separated authors)",\n    "year": "string or number (Publication year)",\n    "url": "string (Direct valid URL to arXiv/paper/DOI)",\n    "summary": "string (Concise summary of findings)"\n  }\n]`
            };
        case CONTEXT_TYPES.RESOURCES:
            return {
                name: 'Learning Resources',
                role: 'technical curriculum curator with real-time web search capability',
                goal: 'Review, verify, and enhance curated learning resources, documentation, videos, and tutorials with verified working URLs.',
                schemaDescription: `Node object containing a resources array with structure:\n{\n  "title": "string (Node title)",\n  "description": "string",\n  "resources": [\n    {\n      "title": "string (Resource title)",\n      "url": "string (Live, tested, working URL)",\n      "type": "video" | "article" | "documentation" | "course",\n      "description": "string (Short description)"\n    }\n  ]\n}`
            };
        case CONTEXT_TYPES.BOOKS:
            return {
                name: 'Recommended Books',
                role: 'technical literature specialist and domain librarian with real-time web search access',
                goal: 'Review, verify, and update recommended books, authors, publisher details, and live URLs.',
                schemaDescription: `Array of Book objects with structure:\n[\n  {\n    "title": "string (Official published book title)",\n    "author": "string (Author name(s))",\n    "description": "string (Comprehensive overview & target audience)",\n    "url": "string (Valid URL to Goodreads, O\'Reilly, publisher, or Amazon page)"\n  }\n]`
            };
        case CONTEXT_TYPES.QUIZ:
            return {
                name: 'Checkpoint Quiz Questions',
                role: 'senior educator and test-construction specialist',
                goal: 'Review, fact-check, and expand multiple-choice quiz questions with rigorous distractors and detailed step-by-step reasoning.',
                schemaDescription: `Array of Quiz Question objects with structure:\n[\n  {\n    "id": "string or number",\n    "text": "string (Clear, unambiguous question prompt)",\n    "options": ["string", "string", "string", "string"] (Exactly 4 mutually exclusive plausible options),\n    "correctAnswerIndex": 0 (Zero-based index of correct option, 0 to 3),\n    "reasoning": "string (In-depth explanation of why the correct answer is right and why others are wrong)"\n  }\n]`
            };
        case CONTEXT_TYPES.PROBLEMS:
            return {
                name: 'Practice Tasks & Problems',
                role: 'software mentor and technical interview curriculum designer',
                goal: 'Review, calibrate, and expand hands-on practice problems, test cases, hints, and platform challenge links.',
                schemaDescription: `Array of Problem objects with structure:\n[\n  {\n    "id": "string or number",\n    "title": "string (Problem title)",\n    "description": "string (Detailed problem statement with input/output expectations)",\n    "difficulty": "Easy" | "Medium" | "Hard",\n    "url": "string (Optional valid URL to LeetCode / HackerRank / Project Euler / repo)",\n    "hint": "string (Actionable hint)",\n    "solution": "string (Brief solution outline or explanation)"\n  }\n]`
            };
        case CONTEXT_TYPES.FLASHCARDS:
            return {
                name: 'Active Recall Flashcards',
                role: 'cognitive learning specialist and spaced-repetition expert',
                goal: 'Review, sharpen, and expand active recall flashcard pairs for high-retention learning.',
                schemaDescription: `Array of Flashcard objects with structure:\n[\n  {\n    "id": "string or number",\n    "front": "string (Clear question, prompt, or term)",\n    "back": "string (Concise, accurate, structured answer/definition)"\n  }\n]`
            };
        case CONTEXT_TYPES.PATH:
            return {
                name: 'Curriculum Path & Milestones',
                role: 'master curriculum architect and pedagogical designer',
                goal: 'Review, structure, and refine the roadmap milestone progression, descriptions, and time estimates.',
                schemaDescription: `Curriculum Path object with structure:\n{\n  "topic": "string",\n  "summary": "string",\n  "nodes": [\n    {\n      "id": "string",\n      "title": "string (Milestone title)",\n      "description": "string (Concise summary of learning goals)",\n      "estimatedTime": "string (e.g., '2-3 hours')"\n    }\n  ]\n}`
            };
        default:
            return {
                name: 'JSON Data',
                role: 'expert data assistant with live web search access',
                goal: 'Review, verify, and enhance the provided JSON data while strictly preserving schema.',
                schemaDescription: 'Follow the exact schema and data types present in the original JSON.'
            };
    }
};

/**
 * Builds a tailored prompt for Perplexity AI based on the context and action.
 */
export const buildPerplexityPrompt = ({
    contextType = CONTEXT_TYPES.GENERIC,
    topic = '',
    nodeTitle = '',
    currentJson = '',
    action = '',
    customInstruction = ''
}) => {
    const config = getContextConfig(contextType);
    const contextHeader = [
        topic ? `Topic: "${topic}"` : '',
        nodeTitle ? `Section / Milestone: "${nodeTitle}"` : '',
        `Data Type: ${config.name}`
    ].filter(Boolean).join(' | ');

    let actionInstructions = '';

    switch (action) {
        // Path actions
        case 'add_nodes':
            actionInstructions = `1. Search standard curricula, university syllabi, and industry roadmaps for '${topic}'.\n2. Identify any missing prerequisites, foundational topics, or advanced milestones that should be included.\n3. Add the missing nodes in their proper progression order while preserving all existing nodes.\n4. Ensure each node has a unique 'id', 'title', 'description', and realistic 'estimatedTime'.`;
            break;
        case 'update_nodes':
            actionInstructions = `1. Review and refine all milestone titles, descriptions, and estimated study hours for '${topic}'.\n2. Ensure clear pedagogical progression and technical accuracy.\n3. Keep existing node IDs intact.`;
            break;

        // Resources actions
        case 'update_links':
            actionInstructions = `1. Perform a live web search to verify that every URL in this resources list is a live, working, 200 OK link.\n2. Fix or replace any broken, dead, placeholder, or outdated links with official documentation, top-rated YouTube tutorials, or authoritative guides.\n3. Verify resource titles and descriptions are accurate and current.`;
            break;
        case 'add_resources':
            actionInstructions = `1. Search the live web for the best modern official documentation, interactive tutorials, and acclaimed video courses for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Add 3-5 new high-quality resources with verified working URLs, accurate types (video/article/documentation/course), and concise descriptions.\n3. Preserve all existing valid resources.`;
            break;

        // Flashcards actions
        case 'add_flashcards':
            actionInstructions = `1. Generate 6-10 new high-yield active-recall flashcard pairs (front/back) covering fundamental definitions, key formulas, architecture patterns, and common pitfalls for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Ensure front prompts are clear and back answers are concise, accurate, and easy to memorize.\n3. Preserve existing flashcards.`;
            break;
        case 'correct_flashcards':
            actionInstructions = `1. Review and fact-check all existing flashcards for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Sharpen definitions, correct any technical inaccuracies or ambiguities, and optimize for spaced repetition retention.`;
            break;

        // Papers actions
        case 'correct_papers':
            actionInstructions = `1. Search the live web (arXiv.org, Semantic Scholar, IEEE, ACM) to verify and correct official research paper titles, author lists, publication years, and abstract summaries for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Verify that every paper has a real, working, open-access arXiv or DOI URL. Replace broken or placeholder links with real ones.`;
            break;
        case 'add_papers':
            actionInstructions = `1. Search arXiv, Semantic Scholar, IEEE Xplore, and ACM for seminal foundational papers and recent breakthroughs (2022-2026) for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Add 3-5 new relevant research papers with verified open-access URLs/DOIs, author names, years, and summaries.\n3. Preserve existing valid papers.`;
            break;

        // Books actions
        case 'correct_books':
            actionInstructions = `1. Search the live web to verify book titles, authors, and valid Goodreads, O'Reilly, publisher, or Amazon URLs for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Correct descriptions and replace broken or placeholder URLs with working links.`;
            break;
        case 'add_books':
            actionInstructions = `1. Search for widely acclaimed, highly-rated textbooks and practical domain guides for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Add 2-4 verified published books with accurate authors, Goodreads/publisher URLs, and comprehensive target-audience descriptions.\n3. Preserve existing valid books.`;
            break;

        // Problems actions
        case 'add_problems':
            actionInstructions = `1. Create 3-5 new graded practice challenges (Easy, Medium, Hard) for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Include clear problem statements, test cases, actionable hints, solution outlines, and real coding platform links (LeetCode, HackerRank, Project Euler) where applicable.\n3. Preserve existing problems.`;
            break;
        case 'correct_problems':
            actionInstructions = `1. Review, fact-check, and calibrate all practice problems for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Calibrate difficulty ratings, clarify problem statements/test cases, improve hints/solutions, and verify real platform challenge URLs.`;
            break;

        // Quiz actions
        case 'add_quiz':
            actionInstructions = `1. Generate 5 additional challenging, high-yield multiple-choice questions for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Ensure each question has a clear prompt, exactly 4 mutually exclusive plausible options, a valid zero-based correctAnswerIndex (0-3), and detailed reasoning.\n3. Preserve existing quiz questions.`;
            break;
        case 'correct_quiz':
            actionInstructions = `1. Fact-check all quiz questions for '${topic}'${nodeTitle ? ` -> '${nodeTitle}'` : ''}.\n2. Verify that the correctAnswerIndex is 100% correct.\n3. Ensure distractors (wrong options) are plausible and unambiguous.\n4. Expand and improve the reasoning field to thoroughly explain why the correct option is right and others are incorrect.`;
            break;

        // Generic / Fallback
        case 'correct_data':
            actionInstructions = `1. Fact-check and polish all existing content for technical accuracy and working links.\n2. Preserve the exact schema and data types.`;
            break;
        case 'add_items':
            actionInstructions = `1. Add complementary high-quality entries matching the schema.\n2. Preserve existing valid items.`;
            break;
        case 'custom':
            actionInstructions = `User Instructions: ${customInstruction || 'Refine and improve the dataset while strictly preserving the schema.'}`;
            break;
        default:
            actionInstructions = `1. Review, fact-check, and update the data using live web search verification.\n2. Preserve the exact JSON schema.`;
    }

    if (action !== 'custom' && customInstruction && customInstruction.trim()) {
        actionInstructions += `\n\nAdditional User Request: "${customInstruction.trim()}"`;
    }

    return `You are a ${config.role}.

CONTEXT:
${contextHeader}

TASK:
${config.goal}

SPECIFIC ACTIONS TO PERFORM:
${actionInstructions}

REQUIRED SCHEMA FORMAT:
${config.schemaDescription}

STRICT JSON OUTPUT RULES (MANDATORY):
1. You MUST respond with ONLY the updated JSON data.
2. Do NOT include any conversational introduction, greetings, explanations, or conclusion text.
3. Your output must be 100% parseable by JSON.parse().
4. Retain all necessary schema keys and correct data types (arrays, strings, numbers, booleans).
5. Wrap the JSON in a standard markdown code block:
\`\`\`json
<YOUR_JSON_HERE>
\`\`\`

CURRENT JSON TO REVIEW AND UPDATE:
\`\`\`json
${currentJson || '[]'}
\`\`\``;
};

/**
 * Extracts and parses JSON from raw Perplexity text (even if wrapped in markdown code blocks or with conversational text).
 * @param {string} rawText
 * @returns {{ success: boolean, parsedData: any, jsonString: string, error: string|null }}
 */
export const cleanAndExtractJson = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
        return { success: false, parsedData: null, jsonString: '', error: 'Input is empty.' };
    }

    const trimmed = rawText.trim();

    // 1. Direct JSON parse attempt
    try {
        const parsed = JSON.parse(trimmed);
        return {
            success: true,
            parsedData: parsed,
            jsonString: JSON.stringify(parsed, null, 2),
            error: null
        };
    } catch (e) {
        // Continue to extraction strategies
    }

    // 2. Extract from markdown code fence ```json ... ``` or ``` ... ```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        const candidate = codeBlockMatch[1].trim();
        try {
            const parsed = JSON.parse(candidate);
            return {
                success: true,
                parsedData: parsed,
                jsonString: JSON.stringify(parsed, null, 2),
                error: null
            };
        } catch (e) {
            // Continue to fallback
        }
    }

    // 3. Extract outermost array [...] or object {...}
    const firstBracket = trimmed.indexOf('[');
    const lastBracket = trimmed.lastIndexOf(']');
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    let candidate = '';
    if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        candidate = trimmed.substring(firstBracket, lastBracket + 1);
    } else if (firstBrace !== -1 && lastBrace !== -1) {
        candidate = trimmed.substring(firstBrace, lastBrace + 1);
    }

    if (candidate) {
        try {
            const parsed = JSON.parse(candidate);
            return {
                success: true,
                parsedData: parsed,
                jsonString: JSON.stringify(parsed, null, 2),
                error: null
            };
        } catch (e) {
            return {
                success: false,
                parsedData: null,
                jsonString: trimmed,
                error: `Failed to parse extracted JSON: ${e.message}`
            };
        }
    }

    return {
        success: false,
        parsedData: null,
        jsonString: trimmed,
        error: 'No valid JSON structure (array or object) detected in the provided text.'
    };
};

/**
 * Generates the Perplexity URL.
 */
export const getPerplexityUrl = (prompt) => {
    // If prompt is short enough for URL params (<1500 chars), pass it as query; otherwise direct to homepage
    if (prompt && prompt.length < 1500) {
        return `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    }
    return 'https://www.perplexity.ai/';
};
