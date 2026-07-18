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


export const storageService = {
    getRawDB: () => {
        return getDB();
    },

    replaceDB: (newData) => {
        if (newData && typeof newData === 'object') {
            saveDB(newData);
            const settings = newData.settings || {};
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
                        saveDB(db);
                        resolve(db);
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
