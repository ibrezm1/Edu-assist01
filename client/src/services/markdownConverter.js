// Markdown <-> JSON Converter for Edu-Assist Learning Paths

const METADATA_START_TAG = '<!-- EDU_ASSIST_METADATA_START';
const METADATA_END_TAG = 'EDU_ASSIST_METADATA_END -->';

export const sanitizeSettingsForExport = (settingsObj) => {
    if (!settingsObj || typeof settingsObj !== 'object') return {};
    const safe = {};
    for (const [k, v] of Object.entries(settingsObj)) {
        const lower = k.toLowerCase();
        if (
            lower.includes('key') ||
            lower.includes('token') ||
            lower.includes('secret') ||
            lower.includes('password') ||
            lower.includes('connectionstring') ||
            lower.includes('credentials')
        ) {
            continue; // Skip secret fields
        }
        safe[k] = v;
    }
    return safe;
};

/**
 * Generates a clean, safe filename slug for a course.
 */
export const generateCourseSlug = (topic) => {
    if (!topic) return 'untitled_course.md';
    let clean = topic
        .trim()
        .replace(/[\/\?<>\\:\*\|":]/g, '') // remove illegal path chars
        .replace(/&/g, 'and')
        .replace(/\+/g, 'plus')
        .replace(/[\s\-_]+/g, '_')
        .replace(/^_+|_+$/g, '');
    if (!clean) clean = 'course';
    return `${clean}.md`;
};

/**
 * Formats practice problems for markdown rendering.
 */
const formatPracticeProblemsMarkdown = (practiceProblems) => {
    if (!practiceProblems || !Array.isArray(practiceProblems) || practiceProblems.length === 0) return '';
    let md = `### ✏️ Practice Problems\n\n`;

    const groupLabels = {
        'A': 'Tier A: Baby Level (Trivial)',
        'B': 'Tier B: Novice Level (Intermediate)',
        'C': 'Tier C: Warrior Level (Difficult)',
        'D': 'Tier D: Soldier Level (Expert)'
    };

    const hasGroups = practiceProblems.some(p => p.group && groupLabels[p.group]);

    if (hasGroups) {
        ['A', 'B', 'C', 'D'].forEach(g => {
            const tierProblems = practiceProblems.filter(p => p.group === g);
            if (tierProblems.length > 0) {
                md += `#### ${groupLabels[g]}\n\n`;
                tierProblems.forEach((prob, pIdx) => {
                    const title = prob.title || `Task ${pIdx + 1}`;
                    const desc = prob.description || prob.problem || prob.question || '';
                    md += `##### 🔹 ${title}\n`;
                    if (desc) {
                        md += `> ${desc.replace(/\n/g, '\n> ')}\n\n`;
                    }
                    if (prob.hint) {
                        md += `- **💡 Hint:** ${prob.hint}\n`;
                    }
                    if (prob.solution) {
                        md += `- **✅ Solution:** ${prob.solution}\n`;
                    }
                    md += `\n`;
                });
            }
        });

        const otherProblems = practiceProblems.filter(p => !p.group || !groupLabels[p.group]);
        if (otherProblems.length > 0) {
            md += `#### Other Practice Tasks\n\n`;
            otherProblems.forEach((prob, pIdx) => {
                const title = prob.title || `Task ${pIdx + 1}`;
                const desc = prob.description || prob.problem || prob.question || '';
                md += `##### 🔹 ${title}\n`;
                if (desc) {
                    md += `> ${desc.replace(/\n/g, '\n> ')}\n\n`;
                }
                if (prob.hint) {
                    md += `- **💡 Hint:** ${prob.hint}\n`;
                }
                if (prob.solution) {
                    md += `- **✅ Solution:** ${prob.solution}\n`;
                }
                md += `\n`;
            });
        }
    } else {
        practiceProblems.forEach((prob, pIdx) => {
            const title = prob.title || `Problem ${pIdx + 1}`;
            const diff = prob.difficulty ? ` (${prob.difficulty})` : '';
            const desc = prob.description || prob.problem || prob.question || '';
            md += `#### 🔹 ${title}${diff}\n`;
            if (desc) {
                md += `> ${desc.replace(/\n/g, '\n> ')}\n\n`;
            }
            if (prob.hint) {
                md += `- **💡 Hint:** ${prob.hint}\n`;
            }
            if (prob.solution) {
                md += `- **✅ Solution:** ${prob.solution}\n`;
            }
            md += `\n`;
        });
    }

    return md;
};

/**
 * Formats a single node into markdown.
 */
const formatNodeMarkdown = (node, nodeIdx) => {
    const isCompleted = !!node.completed;
    const check = isCompleted ? '[x]' : '[ ]';
    const completedText = isCompleted ? ` (Completed: ${node.completedAt ? new Date(node.completedAt).toISOString().split('T')[0] : 'Yes'})` : '';

    let md = `## 🔹 Module ${nodeIdx + 1}: ${node.title || `Module ${nodeIdx + 1}`}\n`;
    md += `- **ID:** \`${node.id || `node-${nodeIdx + 1}`}\`\n`;
    md += `- **Progress:** ${check} Completed${completedText}\n\n`;

    if (node.description) {
        md += `**Description:**\n${node.description.trim()}\n\n`;
    }

    // Resources
    if (node.resources && Array.isArray(node.resources) && node.resources.length > 0) {
        md += `### 🔗 Resources\n`;
        node.resources.forEach(res => {
            const typeBadge = res.type ? ` \`[${res.type}]\`` : '';
            const title = res.title || res.name || 'Resource';
            const url = res.url ? `(${res.url})` : '';
            const desc = res.description ? ` - ${res.description}` : '';
            md += `- [${title}]${url}${typeBadge}${desc}\n`;
        });
        md += `\n`;
    }

    // Research Papers
    if (node.researchPapers && Array.isArray(node.researchPapers) && node.researchPapers.length > 0) {
        md += `### 📑 Research Papers\n`;
        node.researchPapers.forEach(paper => {
            const title = paper.title || 'Paper';
            const authors = paper.authors ? ` (*${paper.authors}*)` : '';
            const year = paper.year ? ` - ${paper.year}` : '';
            const link = paper.url ? ` - [View Paper](${paper.url})` : '';
            md += `- **${title}**${authors}${year}${link}\n`;
            if (paper.summary) {
                md += `  > ${paper.summary.replace(/\n/g, ' ')}\n`;
            }
        });
        md += `\n`;
    }

    // Books
    if (node.books && Array.isArray(node.books) && node.books.length > 0) {
        md += `### 📖 Recommended Books\n`;
        node.books.forEach(book => {
            const title = book.title || 'Book';
            const author = book.author ? ` by *${book.author}*` : '';
            const link = book.url ? ` - [Link](${book.url})` : '';
            md += `- **${title}**${author}${link}\n`;
            if (book.description) {
                md += `  > ${book.description.replace(/\n/g, ' ')}\n`;
            }
        });
        md += `\n`;
    }

    // Flashcards
    if (node.flashcards && Array.isArray(node.flashcards) && node.flashcards.length > 0) {
        md += `### 💡 Flashcards\n\n`;
        md += `| Front (Question) | Back (Answer) |\n`;
        md += `| :--- | :--- |\n`;
        node.flashcards.forEach(card => {
            const front = (card.front || '').replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
            const back = (card.back || '').replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
            md += `| ${front} | ${back} |\n`;
        });
        md += `\n`;
    }

    // Practice Problems
    md += formatPracticeProblemsMarkdown(node.practiceProblems);

    // Checkpoint Quiz
    if (node.quiz && Array.isArray(node.quiz) && node.quiz.length > 0) {
        md += `### ❓ Checkpoint Quiz\n\n`;
        node.quiz.forEach((q, qIdx) => {
            const question = q.question || `Question ${qIdx + 1}`;
            md += `**${qIdx + 1}. ${question}**\n`;
            const options = Array.isArray(q.options) ? q.options : [];
            const correct = q.correctAnswer;
            options.forEach((opt, oIdx) => {
                const isCorrect = (typeof correct === 'number' && correct === oIdx) || opt === correct;
                const check = isCorrect ? '[x]' : '[ ]';
                const badge = isCorrect ? ' *(Correct)*' : '';
                md += `- ${check} ${opt}${badge}\n`;
            });
            if (q.explanation) {
                md += `> *Explanation:* ${q.explanation}\n`;
            }
            md += `\n`;
        });
    }

    md += `---\n\n`;
    return md;
};

/**
 * Converts a single path object into an individual course Markdown document.
 */
export const singleCourseToMarkdown = (pathData) => {
    if (!pathData || typeof pathData !== 'object') {
        throw new Error('Invalid path data for single course Markdown.');
    }

    const topicTitle = pathData.topic || 'Learning Path';
    const now = new Date().toISOString().split('T')[0];
    const totalModules = (pathData.nodes || []).length;
    const completedModules = (pathData.nodes || []).filter(n => n.completed).length;
    const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    let md = `# 📚 ${topicTitle}\n\n`;
    if (pathData.summary) {
        md += `> **Summary:** ${pathData.summary}\n`;
    }
    md += `> **Status:** ${pathData.isFinalized ? 'Finalized' : 'In Progress'} | **Progress:** ${completedModules}/${totalModules} Modules (${progressPct}%) | **Last Updated:** ${now}\n\n`;
    md += `---\n\n`;

    (pathData.nodes || []).forEach((node, nodeIdx) => {
        md += formatNodeMarkdown(node, nodeIdx);
    });

    // Embed single-course metadata
    const singlePayload = {
        topic: pathData.topic,
        path: pathData
    };
    md += `${METADATA_START_TAG}\n${JSON.stringify(singlePayload, null, 2)}\n${METADATA_END_TAG}\n`;

    return md;
};

/**
 * Generates the master README.md / catalog index document linking to all individual courses.
 */
export const generateCatalogIndexMarkdown = (pathsMap, folder = 'courses') => {
    const keys = Object.keys(pathsMap || {});
    const now = new Date().toISOString().split('T')[0];

    let totalModules = 0;
    let completedModules = 0;
    let totalFlashcards = 0;
    let totalProblems = 0;
    let totalQuizzes = 0;

    keys.forEach(k => {
        const p = pathsMap[k];
        if (!p) return;
        (p.nodes || []).forEach(n => {
            totalModules++;
            if (n.completed) completedModules++;
            totalFlashcards += (n.flashcards || []).length;
            totalProblems += (n.practiceProblems || []).length;
            totalQuizzes += (n.quiz || []).length;
        });
    });

    const overallPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    let md = `# 🎓 Edu-Assist Learning Vault\n\n`;
    md += `> Welcome to your synchronized learning roadmap vault. Each course is maintained in a dedicated Markdown document in the \`${folder}/\` folder.\n\n`;

    md += `### 📊 Learning Progress Dashboard\n\n`;
    md += `| Metric | Count |\n`;
    md += `| :--- | :--- |\n`;
    md += `| 📚 **Total Courses** | **${keys.length}** |\n`;
    md += `| 🧩 **Total Modules** | **${totalModules}** |\n`;
    md += `| ✅ **Completed Modules** | **${completedModules}** (${overallPct}%) |\n`;
    md += `| 💡 **Total Flashcards** | **${totalFlashcards}** |\n`;
    md += `| ✏️ **Practice Tasks** | **${totalProblems}** |\n`;
    md += `| ❓ **Checkpoint Quizzes** | **${totalQuizzes}** |\n`;
    md += `| 🕒 **Last Synced** | *${now}* |\n\n`;

    md += `---\n\n`;
    md += `### 📚 Course Roadmaps Catalog\n\n`;
    md += `| Course | Modules | Status | File Link |\n`;
    md += `| :--- | :---: | :---: | :--- |\n`;

    keys.forEach(k => {
        const p = pathsMap[k];
        if (!p) return;
        const topic = p.topic || k;
        const slug = generateCourseSlug(topic);
        const relPath = folder ? `${folder}/${slug}` : slug;
        const mods = (p.nodes || []).length;
        const comp = (p.nodes || []).filter(n => n.completed).length;
        const pct = mods > 0 ? Math.round((comp / mods) * 100) : 0;
        const statusBadge = pct === 100 ? '✅ Completed' : pct > 0 ? `🟡 In Progress (${pct}%)` : '⚪ Not Started';

        md += `| **${topic}** | ${comp}/${mods} | ${statusBadge} | [📖 Open Course](${relPath}) |\n`;
    });

    md += `\n---\n`;
    md += `*Generated automatically by [Edu-Assist](https://github.com/dapaag491/Eduassist-repo).*`;

    return md;
};

/**
 * Converts local database or path object into monolithic GitHub-flavored Markdown.
 */
export const jsonToMarkdown = (dbOrPath) => {
    if (!dbOrPath || typeof dbOrPath !== 'object') {
        throw new Error('Invalid data provided for Markdown conversion.');
    }

    let pathsMap = {};
    let settings = {};

    if (dbOrPath.paths && typeof dbOrPath.paths === 'object') {
        pathsMap = dbOrPath.paths;
        settings = dbOrPath.settings || {};
    } else if (dbOrPath.topic && dbOrPath.nodes) {
        // Single path passed
        return singleCourseToMarkdown(dbOrPath);
    } else {
        pathsMap = dbOrPath;
    }

    const pathKeys = Object.keys(pathsMap);
    const now = new Date().toISOString().split('T')[0];

    let md = `# 🎓 Edu-Assist Learning Vault\n\n`;
    md += `> **Exported:** ${now} | **Total Learning Paths:** ${pathKeys.length}\n\n`;
    md += `---\n\n`;

    pathKeys.forEach((key) => {
        const path = pathsMap[key];
        if (!path) return;

        const topicTitle = path.topic || key;
        md += `# 📚 Path: ${topicTitle}\n\n`;
        if (path.summary) {
            md += `> **Summary:** ${path.summary}\n`;
        }
        md += `> **Status:** ${path.isFinalized ? 'Finalized' : 'In Progress'} | **Modules:** ${(path.nodes || []).length}\n\n`;

        (path.nodes || []).forEach((node, nodeIdx) => {
            md += formatNodeMarkdown(node, nodeIdx);
        });
    });

    // Embed lossless sync data comment at the bottom (with secrets stripped)
    const safeSettings = sanitizeSettingsForExport(settings);
    const rawDataPayload = {
        paths: pathsMap,
        settings: safeSettings
    };
    md += `${METADATA_START_TAG}\n${JSON.stringify(rawDataPayload, null, 2)}\n${METADATA_END_TAG}\n`;

    return md;
};

/**
 * Parses Markdown content back into valid Edu-Assist JSON database.
 */
export const markdownToJson = (markdownString) => {
    if (!markdownString || typeof markdownString !== 'string') {
        throw new Error('Markdown content is empty or invalid.');
    }

    // 1. Check for embedded lossless metadata
    const metadataRegex = new RegExp(`${METADATA_START_TAG}[\\s\\S]*?([\\{\\[][\\s\\S]*?[\\}\\]])[\\s\\S]*?${METADATA_END_TAG}`);
    const match = markdownString.match(metadataRegex);
    if (match && match[1]) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed && typeof parsed === 'object') {
                if (parsed.topic && (parsed.path || parsed.nodes)) {
                    // Single course metadata
                    const pathData = parsed.path || parsed;
                    return {
                        paths: { [parsed.topic.toLowerCase()]: pathData },
                        settings: {}
                    };
                }
                const paths = parsed.paths || (parsed.topic ? { [parsed.topic.toLowerCase()]: parsed } : {});
                const settings = parsed.settings || {};
                return { paths, settings };
            }
        } catch (e) {
            console.warn("Could not parse embedded metadata JSON, falling back to structural parser:", e);
        }
    }

    // 2. Structural Markdown fallback parser
    return parseStructuralMarkdown(markdownString);
};

/**
 * Structural parser that parses pure Markdown text into paths, nodes, resources, etc.
 */
export const parseStructuralMarkdown = (md) => {
    const paths = {};
    const lines = md.split('\n');

    let currentTopic = null;
    let currentPath = null;
    let currentNode = null;
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Path Header: "# Path: Quantum Computing" or "# 📚 Path: Quantum Computing" or "# Quantum Computing"
        const pathMatch = line.match(/^#\s+(?:📚\s*(?:Path:\s*)?|Path:\s*)?(.+)$/i);
        if (pathMatch && !line.includes('Edu-Assist Learning Vault')) {
            const topicName = pathMatch[1].trim();
            if (topicName) {
                currentTopic = topicName;
                currentPath = {
                    topic: currentTopic,
                    summary: '',
                    isFinalized: true,
                    lastUsedAt: Date.now(),
                    nodes: []
                };
                paths[currentTopic.toLowerCase()] = currentPath;
                currentNode = null;
                currentSection = null;
                continue;
            }
        }

        if (!currentPath) {
            if (line.startsWith('## ')) {
                currentTopic = 'Imported Learning Path';
                currentPath = {
                    topic: currentTopic,
                    summary: '',
                    isFinalized: true,
                    lastUsedAt: Date.now(),
                    nodes: []
                };
                paths[currentTopic.toLowerCase()] = currentPath;
            } else {
                continue;
            }
        }

        // Summary: "> **Summary:** ..."
        const summaryMatch = line.match(/^>\s*\*\*Summary:\*\*\s*(.+)$/i);
        if (summaryMatch) {
            currentPath.summary = summaryMatch[1].trim();
            continue;
        }

        // Node Header: "## Module 1: Introduction" or "## 🔹 Module 1: Introduction"
        const nodeMatch = line.match(/^##\s+(?:🔹\s*)?(?:Module\s*\d*:\s*)?(.+)$/i);
        if (nodeMatch) {
            const nodeTitle = nodeMatch[1].trim();
            currentNode = {
                id: `node-${Date.now()}-${currentPath.nodes.length + 1}`,
                title: nodeTitle,
                description: '',
                completed: false,
                completedAt: null,
                resources: [],
                flashcards: [],
                researchPapers: [],
                books: [],
                practiceProblems: [],
                quiz: []
            };
            currentPath.nodes.push(currentNode);
            currentSection = null;
            continue;
        }

        if (!currentNode) continue;

        // Node ID
        const idMatch = line.match(/-\s+\*\*ID:\*\*\s*`([^`]+)`/i);
        if (idMatch) {
            currentNode.id = idMatch[1].trim();
            continue;
        }

        // Completion status: "- **Progress:** [x] Completed" or "- [x] Completed"
        if (line.includes('[x]')) {
            currentNode.completed = true;
            currentNode.completedAt = Date.now();
        } else if (line.includes('[ ]') && line.toLowerCase().includes('completed')) {
            currentNode.completed = false;
        }

        // Section Headers
        if (line.startsWith('### 🔗 Resources') || line.startsWith('### Resources')) {
            currentSection = 'resources';
            continue;
        } else if (line.startsWith('### 📑 Research Papers') || line.startsWith('### Research Papers')) {
            currentSection = 'papers';
            continue;
        } else if (line.startsWith('### 📖 Recommended Books') || line.startsWith('### Recommended Books') || line.startsWith('### Books')) {
            currentSection = 'books';
            continue;
        } else if (line.startsWith('### 💡 Flashcards') || line.startsWith('### Flashcards')) {
            currentSection = 'flashcards';
            continue;
        } else if (line.startsWith('### ✏️ Practice Problems') || line.startsWith('### Practice Problems') || line.startsWith('### Problems')) {
            currentSection = 'problems';
            continue;
        } else if (line.startsWith('### ❓ Checkpoint Quiz') || line.startsWith('### Quiz')) {
            currentSection = 'quiz';
            continue;
        } else if (line.startsWith('**Description:**')) {
            currentSection = 'description';
            continue;
        }

        // Parse section contents
        if (currentSection === 'description' && line) {
            currentNode.description = (currentNode.description ? currentNode.description + '\n' : '') + line;
        } else if (currentSection === 'resources' && line.startsWith('- [')) {
            const resMatch = line.match(/^-\s+\[([^\]]+)\]\(([^)]*)\)(?:\s+`\[([^\]]+)\]`)?(?:\s+-\s+(.+))?$/);
            if (resMatch) {
                currentNode.resources.push({
                    title: resMatch[1].trim(),
                    url: resMatch[2].trim(),
                    type: resMatch[3] ? resMatch[3].trim() : 'article',
                    description: resMatch[4] ? resMatch[4].trim() : ''
                });
            }
        } else if (currentSection === 'flashcards' && line.startsWith('|') && !line.includes('---') && !line.includes('Front (Question)')) {
            const cols = line.split('|').map(c => c.trim()).filter(Boolean);
            if (cols.length >= 2) {
                currentNode.flashcards.push({
                    front: cols[0].replace(/<br\/>/g, '\n'),
                    back: cols[1].replace(/<br\/>/g, '\n')
                });
            }
        } else if (currentSection === 'papers' && line.startsWith('- **')) {
            const paperMatch = line.match(/^-\s+\*\*([^*]+)\*\*(?:\s+\(\*([^*]+)\*\))?(?:\s+-\s+(\d{4}))?(?:\s+-\s+\[View Paper\]\(([^)]+)\))?/);
            if (paperMatch) {
                currentNode.researchPapers.push({
                    title: paperMatch[1].trim(),
                    authors: paperMatch[2] ? paperMatch[2].trim() : '',
                    year: paperMatch[3] ? paperMatch[3].trim() : '',
                    url: paperMatch[4] ? paperMatch[4].trim() : '',
                    summary: ''
                });
            }
        } else if (currentSection === 'books' && line.startsWith('- **')) {
            const bookMatch = line.match(/^-\s+\*\*([^*]+)\*\*(?:\s+by\s+\*([^*]+)\*)?(?:\s+-\s+\[Link\]\(([^)]+)\))?/);
            if (bookMatch) {
                currentNode.books.push({
                    title: bookMatch[1].trim(),
                    author: bookMatch[2] ? bookMatch[2].trim() : '',
                    url: bookMatch[3] ? bookMatch[3].trim() : '',
                    description: ''
                });
            }
        }
    }

    return { paths, settings: {} };
};
