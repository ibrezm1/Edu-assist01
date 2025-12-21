const DB_KEY = 'getpath_db';

const DEFAULT_SETTINGS = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    assessmentQuestions: 5,
    quizQuestions: 3,
    theme: 'dark',
    model: 'gemini-2.0-flash'
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
    getSettings: () => {
        return getDB().settings;
    },

    saveSettings: (settings) => {
        const db = getDB();
        db.settings = { ...db.settings, ...settings };
        if (settings.apiKey) localStorage.setItem('gemini_api_key', settings.apiKey);
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
