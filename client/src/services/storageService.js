const DB_KEY = 'getpath_db';

const DEFAULT_SETTINGS = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    openrouterKey: localStorage.getItem('openrouter_api_key') || '',
    jsonbinApiKey: localStorage.getItem('jsonbin_api_key') || '',
    jsonbinBinId: localStorage.getItem('jsonbin_bin_id') || '',
    provider: 'gemini',
    assessmentQuestions: 5,
    quizQuestions: 3,
    theme: 'dark',
    model: 'gemini-2.5-flash-lite',
    openrouterModel: 'google/gemini-2.5-flash-lite',
    openrouterSearch: true,
    openrouterFreeOnly: false,
    demoMode: false,
    enableMetaAI: true,
    enableChatGPT: true,
    enablePerplexity: true
};


const getDB = () => {
    const data = localStorage.getItem(DB_KEY);
    const db = data ? JSON.parse(data) : { paths: {}, settings: DEFAULT_SETTINGS };

    // Ensure settings exists and has all current default keys
    db.settings = { ...DEFAULT_SETTINGS, ...db.settings };

    return db;
};


const saveDB = (db) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db, null, 2));
};


const mergeDBs = (localDB, newDB) => {
    const merged = {
        paths: { ...localDB.paths },
        settings: { ...localDB.settings }
    };

    if (!newDB || typeof newDB !== 'object') return localDB;

    // 1. Merge settings (prefer local settings if present, fallback to newDB keys)
    if (newDB.settings) {
        merged.settings = { ...newDB.settings, ...localDB.settings };
    }

    // 2. Merge paths
    if (newDB.paths) {
        Object.keys(newDB.paths).forEach(topicKey => {
            const uploadedPath = newDB.paths[topicKey];
            const localPath = localDB.paths[topicKey];

            if (!localPath) {
                // Topic doesn't exist locally, add it completely
                merged.paths[topicKey] = uploadedPath;
            } else {
                // Topic exists locally, merge summaries and nodes
                const mergedPath = {
                    ...localPath,
                    topic: localPath.topic || uploadedPath.topic,
                    summary: localPath.summary || uploadedPath.summary,
                    isFinalized: localPath.isFinalized || uploadedPath.isFinalized,
                    nodes: [...(localPath.nodes || [])]
                };

                // Merge nodes
                if (uploadedPath.nodes && Array.isArray(uploadedPath.nodes)) {
                    uploadedPath.nodes.forEach(uploadedNode => {
                        const localNodeIdx = mergedPath.nodes.findIndex(n => n.id === uploadedNode.id || n.title === uploadedNode.title);
                        if (localNodeIdx === -1) {
                            // Node doesn't exist locally, append it
                            mergedPath.nodes.push(uploadedNode);
                        } else {
                            // Node exists locally, merge subviews taking the larger set of generated content
                            const localNode = mergedPath.nodes[localNodeIdx];
                            const mergedNode = {
                                ...localNode,
                                ...uploadedNode,
                                resources: (uploadedNode.resources?.length > (localNode.resources?.length || 0)) ? uploadedNode.resources : (localNode.resources || uploadedNode.resources),
                                flashcards: (uploadedNode.flashcards?.length > (localNode.flashcards?.length || 0)) ? uploadedNode.flashcards : (localNode.flashcards || uploadedNode.flashcards),
                                researchPapers: (uploadedNode.researchPapers?.length > (localNode.researchPapers?.length || 0)) ? uploadedNode.researchPapers : (localNode.researchPapers || uploadedNode.researchPapers),
                                books: (uploadedNode.books?.length > (localNode.books?.length || 0)) ? uploadedNode.books : (localNode.books || uploadedNode.books),
                                practiceProblems: (uploadedNode.practiceProblems?.length > (localNode.practiceProblems?.length || 0)) ? uploadedNode.practiceProblems : (localNode.practiceProblems || uploadedNode.practiceProblems),
                                quiz: (uploadedNode.quiz?.length > (localNode.quiz?.length || 0)) ? uploadedNode.quiz : (localNode.quiz || uploadedNode.quiz)
                            };
                            mergedPath.nodes[localNodeIdx] = mergedNode;
                        }
                    });
                }
                merged.paths[topicKey] = mergedPath;
            }
        });
    }

    return merged;
};


export const storageService = {
    getRawDB: () => {
        return getDB();
    },

    replaceDB: (newData) => {
        if (newData && typeof newData === 'object') {
            const currentDB = getDB();
            const merged = mergeDBs(currentDB, newData);
            saveDB(merged);
            const settings = merged.settings || {};
            if (settings.apiKey) localStorage.setItem('gemini_api_key', settings.apiKey);
            if (settings.openrouterKey) localStorage.setItem('openrouter_api_key', settings.openrouterKey);
            if (settings.jsonbinApiKey) localStorage.setItem('jsonbin_api_key', settings.jsonbinApiKey);
            if (settings.jsonbinBinId) localStorage.setItem('jsonbin_bin_id', settings.jsonbinBinId);
        }
    },

    getSettings: () => {
        return getDB().settings;
    },

    saveSettings: (settings) => {
        const db = getDB();
        db.settings = { ...db.settings, ...settings };
        if (settings.apiKey !== undefined) localStorage.setItem('gemini_api_key', settings.apiKey);
        if (settings.openrouterKey !== undefined) localStorage.setItem('openrouter_api_key', settings.openrouterKey);
        if (settings.jsonbinApiKey !== undefined) localStorage.setItem('jsonbin_api_key', settings.jsonbinApiKey);
        if (settings.jsonbinBinId !== undefined) localStorage.setItem('jsonbin_bin_id', settings.jsonbinBinId);
        saveDB(db);
    },

    getHistory: () => {

        const db = getDB();
        return Object.values(db.paths).map(p => ({
            topic: p.topic,
            summary: p.summary,
            nodeCount: p.nodes?.length || 0,
            isFinalized: p.isFinalized || false
        }));
    },

    getPath: (topic) => {
        const db = getDB();
        return db.paths[topic.toLowerCase()];
    },

    savePath: (topic, pathData) => {
        const db = getDB();
        db.paths[topic.toLowerCase()] = { ...pathData, topic };
        saveDB(db);
    },

    deletePath: (topic) => {
        const db = getDB();
        delete db.paths[topic.toLowerCase()];
        saveDB(db);
    },


    finalizePath: (topic, finalized) => {
        const db = getDB();
        if (db.paths[topic.toLowerCase()]) {
            db.paths[topic.toLowerCase()].isFinalized = finalized;
            saveDB(db);
            return true;
        }
        return false;
    },

    updateResources: (topic, nodeTitle, resources) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.title === nodeTitle);
            if (node) {
                node.resources = resources;
                saveDB(db);
                return true;
            }
        }
        return false;
    },

    updateFlashcards: (topic, nodeTitle, flashcards) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.title === nodeTitle);
            if (node) {
                node.flashcards = flashcards;
                saveDB(db);
                return true;
            }
        }
        return false;
    },

    updateResearchPapers: (topic, nodeTitle, researchPapers) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.title === nodeTitle);
            if (node) {
                node.researchPapers = researchPapers;
                saveDB(db);
                return true;
            }
        }
        return false;
    },

    updateBooks: (topic, nodeTitle, books) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.title === nodeTitle);
            if (node) {
                node.books = books;
                saveDB(db);
                return true;
            }
        }
        return false;
    },

    updatePracticeProblems: (topic, nodeTitle, practiceProblems) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.title === nodeTitle);
            if (node) {
                node.practiceProblems = practiceProblems;
                saveDB(db);
                return true;
            }
        }
        return false;
    },

    updateQuiz: (topic, nodeTitle, quiz) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.title === nodeTitle);
            if (node) {
                node.quiz = quiz;
                saveDB(db);
                return true;
            }
        }
        return false;
    },

    downloadDB: () => {
        const db = getDB();
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'getpath_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    uploadDB: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const db = JSON.parse(e.target.result);
                    if (db && db.paths) {
                        const currentDB = getDB();
                        const merged = mergeDBs(currentDB, db);
                        saveDB(merged);
                        resolve(merged);
                    } else {
                        reject(new Error('Invalid JSON structure'));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
};
