const DB_KEY = 'getpath_db';

const DEFAULT_SETTINGS = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    openrouterKey: localStorage.getItem('openrouter_api_key') || '',
    nvidiaKey: localStorage.getItem('nvidia_api_key') || '',
    nvidiaBaseUrl: localStorage.getItem('nvidia_base_url') || 'https://nvdia-limit-0719.foldedgoat.workers.dev/',
    nvidiaModel: 'stepfun-ai/step-3.7-flash',
    mongoConnectionString: localStorage.getItem('mongo_connection_string') || '',
    mongoDbName: localStorage.getItem('mongo_db_name') || '',
    mongoCollectionName: localStorage.getItem('mongo_collection_name') || '',
    mongoDocumentId: localStorage.getItem('mongo_document_id') || 'getpath_db',
    lastSyncedAt: localStorage.getItem('mongo_last_synced_at') || '',
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


const mergeArrays = (arr1, arr2) => {
    if (!Array.isArray(arr1)) return Array.isArray(arr2) ? [...arr2] : [];
    if (!Array.isArray(arr2)) return [...arr1];

    const merged = [...arr1];

    const getIdentifier = (item) => {
        if (!item) return '';
        if (typeof item !== 'object') return String(item).toLowerCase().trim();
        const sig = item.id || item.title || item.url || item.question || item.front || item.problem || JSON.stringify(item);
        return String(sig).toLowerCase().trim();
    };

    const existingIdentifiers = new Set(arr1.map(getIdentifier).filter(Boolean));

    arr2.forEach(item => {
        const id = getIdentifier(item);
        if (!id) {
            merged.push(item);
        } else if (!existingIdentifiers.has(id)) {
            merged.push(item);
            existingIdentifiers.add(id);
        } else {
            const idx = merged.findIndex(existing => getIdentifier(existing) === id);
            if (idx !== -1 && typeof merged[idx] === 'object' && typeof item === 'object') {
                merged[idx] = { ...item, ...merged[idx] };
            }
        }
    });

    return merged;
};


const mergeDBs = (localDB, newDB) => {
    const merged = {
        paths: { ...localDB.paths },
        settings: { ...localDB.settings }
    };

    if (!newDB || typeof newDB !== 'object') return localDB;

    // 1. Merge settings (prefer local settings if present, fallback to newDB keys)
    if (newDB.settings) {
        merged.settings = { 
            ...newDB.settings, 
            ...localDB.settings,
            lastSyncedAt: newDB.settings.lastSyncedAt || localDB.settings.lastSyncedAt
        };
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
                            // Node exists locally, merge subviews
                            const localNode = mergedPath.nodes[localNodeIdx];
                            const mergedNode = {
                                ...localNode,
                                ...uploadedNode,
                                resources: mergeArrays(localNode.resources, uploadedNode.resources),
                                flashcards: mergeArrays(localNode.flashcards, uploadedNode.flashcards),
                                researchPapers: mergeArrays(localNode.researchPapers, uploadedNode.researchPapers),
                                books: mergeArrays(localNode.books, uploadedNode.books),
                                practiceProblems: mergeArrays(localNode.practiceProblems, uploadedNode.practiceProblems),
                                quiz: mergeArrays(localNode.quiz, uploadedNode.quiz)
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
            localStorage.setItem('gemini_api_key', settings.apiKey || '');
            localStorage.setItem('openrouter_api_key', settings.openrouterKey || '');
            localStorage.setItem('nvidia_api_key', settings.nvidiaKey || '');
            localStorage.setItem('nvidia_base_url', settings.nvidiaBaseUrl || '');
            localStorage.setItem('mongo_connection_string', settings.mongoConnectionString || '');
            localStorage.setItem('mongo_db_name', settings.mongoDbName || '');
            localStorage.setItem('mongo_collection_name', settings.mongoCollectionName || '');
            localStorage.setItem('mongo_document_id', settings.mongoDocumentId || '');
            localStorage.setItem('mongo_last_synced_at', settings.lastSyncedAt || '');
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
        if (settings.nvidiaKey !== undefined) localStorage.setItem('nvidia_api_key', settings.nvidiaKey);
        if (settings.nvidiaBaseUrl !== undefined) localStorage.setItem('nvidia_base_url', settings.nvidiaBaseUrl);
        if (settings.mongoConnectionString !== undefined) localStorage.setItem('mongo_connection_string', settings.mongoConnectionString);
        if (settings.mongoDbName !== undefined) localStorage.setItem('mongo_db_name', settings.mongoDbName);
        if (settings.mongoCollectionName !== undefined) localStorage.setItem('mongo_collection_name', settings.mongoCollectionName);
        if (settings.mongoDocumentId !== undefined) localStorage.setItem('mongo_document_id', settings.mongoDocumentId);
        if (settings.lastSyncedAt !== undefined) localStorage.setItem('mongo_last_synced_at', settings.lastSyncedAt);
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

    updateNodeCompletion: (topic, nodeIdOrTitle, completed = true) => {
        const db = getDB();
        const p = db.paths[topic.toLowerCase()];
        if (p && p.nodes) {
            const node = p.nodes.find(n => n.id === nodeIdOrTitle || n.title === nodeIdOrTitle);
            if (node) {
                node.completed = completed;
                node.completedAt = completed ? Date.now() : null;
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
