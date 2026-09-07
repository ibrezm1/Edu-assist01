import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Stack, Alert, Spinner, Collapse } from 'react-bootstrap';
import { ArrowLeft, Save, Trash2, Key, Info, RefreshCw, Sun, Moon, Plus, Pencil, RotateCcw, ChevronDown, ChevronUp, Database, Wifi, Download, FileJson, GitBranch, ExternalLink, FileText, Upload, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react';

import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { mongoService } from '../services/mongoService';
import { githubService } from '../services/githubService';
import { jsonToMarkdown, markdownToJson, singleCourseToMarkdown, generateCatalogIndexMarkdown, generateCourseSlug } from '../services/markdownConverter';


const isModelFree = (model) => {
    if (!model) return false;
    if (model.id && model.id.endsWith(':free')) return true;
    if (!model.pricing) return false;
    const prompt = parseFloat(model.pricing.prompt);
    const completion = parseFloat(model.pricing.completion);
    return prompt === 0 && completion === 0;
};


const Settings = ({ onBack, onSync }) => {

    const [settings, setSettings] = useState(storageService.getSettings());
    const [saved, setSaved] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ type: 'idle', message: '' });
    const [githubStatus, setGithubStatus] = useState({ type: 'idle', message: '' });
    const [courseStates, setCourseStates] = useState(() => storageService.getCourseSyncStates(settings.githubFolder || 'courses'));
    const [aiTestStatus, setAiTestStatus] = useState({ type: 'idle', message: '' });

    // Provider list custom editing states
    const [editingProviderId, setEditingProviderId] = useState(null);
    const [providerForm, setProviderForm] = useState({ name: '', type: 'url', url: '', customInstructions: '' });
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAskAiShortcuts, setShowAskAiShortcuts] = useState(false);
    const [showImportBox, setShowImportBox] = useState(false);
    const [importBase64Text, setImportBase64Text] = useState('');

    const handleToggleProvider = (id, enabled) => {
        const updatedProviders = settings.askAiProviders.map(p =>
            p.id === id ? { ...p, enabled } : p
        );
        setSettings({ ...settings, askAiProviders: updatedProviders });
    };

    const handleDeleteProvider = (id) => {
        if (window.confirm("Are you sure you want to delete this Ask AI shortcut?")) {
            const updatedProviders = settings.askAiProviders.filter(p => p.id !== id);
            setSettings({ ...settings, askAiProviders: updatedProviders });
            if (editingProviderId === id) {
                setEditingProviderId(null);
                setProviderForm({ name: '', type: 'url', url: '', customInstructions: '' });
            }
        }
    };

    const handleEditProviderClick = (provider) => {
        setEditingProviderId(provider.id);
        setProviderForm({
            name: provider.name,
            type: provider.type,
            url: provider.url,
            customInstructions: provider.customInstructions || ''
        });
        setShowAddForm(true);
    };

    const handleSaveProvider = (e) => {
        e.preventDefault();
        if (!providerForm.name.trim() || !providerForm.url.trim()) {
            alert("Provider Name and URL/Template are required.");
            return;
        }

        let updatedProviders;
        if (editingProviderId) {
            updatedProviders = settings.askAiProviders.map(p =>
                p.id === editingProviderId ? {
                    ...p,
                    ...providerForm,
                    name: providerForm.name.trim(),
                    url: providerForm.url.trim(),
                    customInstructions: (providerForm.customInstructions || '').trim()
                } : p
            );
            setEditingProviderId(null);
        } else {
            const newId = 'custom-' + Date.now();
            const newProvider = {
                id: newId,
                name: providerForm.name.trim(),
                type: providerForm.type,
                url: providerForm.url.trim(),
                customInstructions: (providerForm.customInstructions || '').trim(),
                enabled: true
            };
            updatedProviders = [...(settings.askAiProviders || []), newProvider];
        }

        setSettings({ ...settings, askAiProviders: updatedProviders });
        setProviderForm({ name: '', type: 'url', url: '', customInstructions: '' });
        setShowAddForm(false);
    };

    const handleCopyBase64Settings = () => {
        try {
            const jsonStr = JSON.stringify(settings);
            const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
            navigator.clipboard.writeText(base64);
            alert("Settings successfully copied to clipboard as a Base64 string!");
        } catch (err) {
            alert("Failed to export settings: " + err.message);
        }
    };

    const handleImportBase64Settings = () => {
        if (!importBase64Text.trim()) {
            alert("Please paste a Base64 string first.");
            return;
        }
        try {
            const decoded = decodeURIComponent(escape(atob(importBase64Text.trim())));
            const parsed = JSON.parse(decoded);

            if (typeof parsed !== 'object' || parsed === null) {
                throw new Error("Invalid format. Decoded string is not a JSON object.");
            }

            setSettings({
                ...settings,
                ...parsed
            });
            
            alert("Settings successfully loaded! Click 'Save Settings' at the bottom of the page to persist them permanently.");
            setShowImportBox(false);
            setImportBase64Text('');
        } catch (err) {
            alert("Failed to import settings: " + err.message + ". Please verify that you copied the correct Base64 string.");
        }
    };

    const handleResetProviders = () => {
        if (window.confirm("Are you sure you want to reset all Ask AI shortcuts to defaults? Your custom shortcuts will be lost.")) {
            const defaultProviders = [
                { id: 'chatgpt', name: 'ChatGPT', type: 'url', url: 'https://chatgpt.com/?q={query}&hints=search&temporary-chat=true', enabled: true, customInstructions: "" },
                { id: 'perplexity', name: 'Perplexity', type: 'url', url: 'https://www.perplexity.ai/search?q={query}&copilot=false', enabled: true, customInstructions: "" },
                { id: 'duck-ai', name: 'Duck.ai', type: 'url', url: 'https://duck.ai/chat?q={query}', enabled: true, customInstructions: "" },
                { id: 'meta-ai', name: 'Meta AI (WhatsApp)', type: 'url', url: 'https://wa.me/13135550002?text={query}', enabled: true, customInstructions: "" },
                { id: 'grok', name: 'Grok', type: 'url', url: 'https://grok.com/?q={query}', enabled: true, customInstructions: "" },
                { id: 'mistral', name: 'Mistral', type: 'url', url: 'https://chat.mistral.ai/chat?q={query}', enabled: true, customInstructions: "" },
                { id: 'brave-ai', name: 'Brave Search AI', type: 'url', url: 'https://search.brave.com/ask?q={query}', enabled: true, customInstructions: "" },
                { id: 'kimi', name: 'Kimi Chat', type: 'copy', url: 'https://kimi.moonshot.cn', enabled: true, customInstructions: "" },
                { id: 'longcat', name: 'Longcat Chat', type: 'copy', url: 'https://longcat.chat', enabled: true, customInstructions: "" },
                { id: 'deepseek', name: 'DeepSeek Chat', type: 'copy', url: 'https://chat.deepseek.com', enabled: true, customInstructions: "" },
                { id: 'gemini-web', name: 'Gemini Chat', type: 'copy', url: 'https://gemini.google.com', enabled: true, customInstructions: "" }
            ];
            setSettings({ ...settings, askAiProviders: defaultProviders });
            setEditingProviderId(null);
            setShowAddForm(false);
            setProviderForm({ name: '', type: 'url', url: '', customInstructions: '' });
        }
    };

    const handleTestMongoConnection = async (e) => {
        e?.preventDefault();
        const { mongoConnectionString, mongoDbName, mongoCollectionName } = settings;
        if (!mongoConnectionString || !mongoDbName || !mongoCollectionName) {
            setSyncStatus({ type: 'error', message: 'Connection String, Database Name, and Collection Name are required.' });
            return;
        }

        // Save settings first so they are stored
        storageService.saveSettings(settings);

        setSyncStatus({ type: 'syncing', message: 'Testing MongoDB connection...' });
        try {
            await mongoService.testConnection(mongoConnectionString, mongoDbName, mongoCollectionName);
            setSyncStatus({
                type: 'success',
                message: 'Success: MongoDB connection verified successfully!'
            });
        } catch (err) {
            console.error("MongoDB connection verification failed:", err);
            setSyncStatus({ type: 'error', message: `Error: ${err.message || 'Connection verification failed.'}` });
        }
    };

    const handlePushToMongo = async (e) => {
        e?.preventDefault();
        const { mongoConnectionString, mongoDbName, mongoCollectionName, mongoDocumentId } = settings;
        if (!mongoConnectionString || !mongoDbName || !mongoCollectionName || !mongoDocumentId) {
            setSyncStatus({ type: 'error', message: 'All MongoDB configuration fields are required to push.' });
            return;
        }

        const syncTime = new Date().toISOString();
        const updatedSettings = { ...settings, lastSyncedAt: syncTime };
        setSettings(updatedSettings);
        storageService.saveSettings(updatedSettings);

        setSyncStatus({ type: 'syncing', message: 'Pushing database to MongoDB...' });
        try {
            const rawData = storageService.getRawDB();
            const result = await mongoService.pushToMongo(
                mongoConnectionString,
                mongoDbName,
                mongoCollectionName,
                mongoDocumentId,
                rawData
            );

            const formatSize = (bytes) => {
                if (bytes < 1024) return `${bytes} B`;
                return `${(bytes / 1024).toFixed(2)} KB`;
            };

            let sizeInfo = `Raw: ${formatSize(result.rawSize)}`;
            if (result.wasCompressed) {
                const savings = ((1 - (result.compressedSize / result.rawSize)) * 100).toFixed(1);
                sizeInfo += ` | Compressed: ${formatSize(result.compressedSize)} (${savings}% saved)`;
            }

            setSyncStatus({
                type: 'success',
                message: `Success: Local database pushed to MongoDB successfully! (${sizeInfo})`
            });
        } catch (err) {
            console.error("MongoDB push failed:", err);
            setSyncStatus({ type: 'error', message: `Error: ${err.message || 'Push failed.'}` });
        }
    };

    const handleRetrieveFromMongo = async (e) => {
        e?.preventDefault();
        const { mongoConnectionString, mongoDbName, mongoCollectionName, mongoDocumentId } = settings;
        if (!mongoConnectionString || !mongoDbName || !mongoCollectionName || !mongoDocumentId) {
            setSyncStatus({ type: 'error', message: 'All MongoDB configuration fields are required to retrieve.' });
            return;
        }

        // Save settings first so they are stored and merged correctly
        storageService.saveSettings(settings);

        setSyncStatus({ type: 'syncing', message: 'Retrieving database from MongoDB...' });
        try {
            const remoteDB = await mongoService.retrieveFromMongo(
                mongoConnectionString,
                mongoDbName,
                mongoCollectionName,
                mongoDocumentId
            );

            if (!remoteDB || typeof remoteDB !== 'object') {
                throw new Error('Invalid remote database format.');
            }

            const formatSize = (bytes) => {
                if (bytes < 1024) return `${bytes} B`;
                return `${(bytes / 1024).toFixed(2)} KB`;
            };
            const sizeStr = formatSize(new Blob([JSON.stringify(remoteDB)]).size);

            storageService.replaceDB(remoteDB);
            setSettings(storageService.getSettings());

            setSyncStatus({
                type: 'success',
                message: `Success: Local storage merged with remote database! (Decompressed size: ${sizeStr})`
            });

            if (onSync) {
                onSync();
            }
        } catch (err) {
            console.error("MongoDB retrieve failed:", err);
            setSyncStatus({ type: 'error', message: `Error: ${err.message || 'Retrieval failed.'}` });
        }
    };

    const handleDownloadLocalJson = (e) => {
        e?.preventDefault();
        try {
            const info = storageService.downloadDB();
            const formatSize = (bytes) => {
                if (bytes < 1024) return `${bytes} B`;
                return `${(bytes / 1024).toFixed(2)} KB`;
            };
            setSyncStatus({
                type: 'success',
                message: `Success: Local JSON database downloaded successfully! (${info.filename}, ${formatSize(info.size)})`
            });
        } catch (err) {
            console.error("Local JSON download failed:", err);
            setSyncStatus({ type: 'error', message: `Error: ${err.message || 'Failed to download JSON.'}` });
        }
    };

    const refreshCourseStates = () => {
        setCourseStates(storageService.getCourseSyncStates(settings.githubFolder || 'courses'));
    };

    const handleTestGithub = async (e) => {
        e?.preventDefault();
        const { githubToken, githubRepo } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository (owner/repo) are required.' });
            return;
        }

        storageService.saveSettings(settings);
        setGithubStatus({ type: 'syncing', message: 'Testing GitHub connection...' });
        try {
            const res = await githubService.testConnection(githubToken, githubRepo);
            const canWrite = res.permissions?.push !== false;
            setGithubStatus({
                type: 'success',
                message: `Success: Connected to ${res.repoName} (Default branch: ${res.defaultBranch}). Push permission: ${canWrite ? 'Granted' : 'Read-only'}`
            });
        } catch (err) {
            console.error("GitHub test connection failed:", err);
            setGithubStatus({ type: 'error', message: `Error: ${err.message || 'Connection failed.'}` });
        }
    };

    const handlePushSingleCourse = async (topic) => {
        const { githubToken, githubRepo, githubFolder, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required to push.' });
            return;
        }

        const folder = githubFolder ? githubFolder.trim().replace(/^\/+|\/+$/g, '') : 'courses';
        const slug = generateCourseSlug(topic);
        const targetPath = folder ? `${folder}/${slug}` : slug;

        setGithubStatus({ type: 'syncing', message: `Pushing "${topic}" to GitHub (${targetPath})...` });
        try {
            const pathData = storageService.getPath(topic);
            if (!pathData) throw new Error(`Course "${topic}" not found in local storage.`);

            const mdContent = singleCourseToMarkdown(pathData);
            const result = await githubService.pushMarkdown(
                githubToken,
                githubRepo,
                targetPath,
                mdContent,
                `Update course "${topic}" via Edu-Assist [${new Date().toLocaleString()}]`,
                githubBranch || 'main'
            );

            storageService.markPathSynced(topic, result.commitSha);
            refreshCourseStates();

            setGithubStatus({
                type: 'success',
                message: `Success: Course "${topic}" pushed to ${result.filePath}! (Commit: ${result.commitSha?.substring(0, 7) || 'OK'})`
            });
            if (onSync) onSync();
        } catch (err) {
            console.error(`Failed to push course "${topic}":`, err);
            setGithubStatus({ type: 'error', message: `Push failed for "${topic}": ${err.message}` });
        }
    };

    const handlePullSingleCourse = async (topic, filePath) => {
        const { githubToken, githubRepo, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required to pull.' });
            return;
        }

        setGithubStatus({ type: 'syncing', message: `Pulling course from GitHub (${filePath})...` });
        try {
            const fileData = await githubService.pullMarkdown(
                githubToken,
                githubRepo,
                filePath,
                githubBranch || 'main'
            );

            const parsedDB = markdownToJson(fileData.content);
            if (!parsedDB || !parsedDB.paths || Object.keys(parsedDB.paths).length === 0) {
                throw new Error('No valid course data could be parsed from this Markdown file.');
            }

            const parsedTopicKey = Object.keys(parsedDB.paths)[0];
            const courseData = parsedDB.paths[parsedTopicKey];
            storageService.saveSinglePath(courseData);
            storageService.markPathSynced(courseData.topic || topic, fileData.sha);
            refreshCourseStates();

            setGithubStatus({
                type: 'success',
                message: `Success: Course "${courseData.topic || topic}" pulled and updated from GitHub!`
            });
            if (onSync) onSync();
        } catch (err) {
            console.error(`Failed to pull course from "${filePath}":`, err);
            setGithubStatus({ type: 'error', message: `Pull failed: ${err.message}` });
        }
    };

    const handleSmartSyncModifiedCourses = async (e) => {
        e?.preventDefault();
        const { githubToken, githubRepo, githubFolder, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required.' });
            return;
        }

        const folder = githubFolder ? githubFolder.trim().replace(/^\/+|\/+$/g, '') : 'courses';
        const currentStates = storageService.getCourseSyncStates(folder);
        const modifiedCourses = currentStates.filter(c => c.status === 'modified' || c.status === 'never_synced');

        if (modifiedCourses.length === 0) {
            setGithubStatus({
                type: 'success',
                message: 'All courses are already up-to-date with GitHub! No files needed to be pushed.'
            });
            return;
        }

        setGithubStatus({
            type: 'syncing',
            message: `Starting Smart Sync: Found ${modifiedCourses.length} modified course(s) to push...`
        });

        let successCount = 0;
        const failed = [];

        for (let i = 0; i < modifiedCourses.length; i++) {
            const course = modifiedCourses[i];
            setGithubStatus({
                type: 'syncing',
                message: `Pushing (${i + 1}/${modifiedCourses.length}): "${course.topic}"...`
            });

            try {
                const pathData = storageService.getPath(course.topic);
                const mdContent = singleCourseToMarkdown(pathData);
                const result = await githubService.pushMarkdown(
                    githubToken,
                    githubRepo,
                    course.filePath,
                    mdContent,
                    `Sync course "${course.topic}" [${new Date().toLocaleString()}]`,
                    githubBranch || 'main'
                );
                storageService.markPathSynced(course.topic, result.commitSha);
                successCount++;
            } catch (err) {
                console.error(`Error pushing course ${course.topic}:`, err);
                failed.push(`${course.topic} (${err.message})`);
            }
        }

        // Also update README.md catalog
        try {
            const rawDB = storageService.getRawDB();
            const catalogMd = generateCatalogIndexMarkdown(rawDB.paths, folder);
            await githubService.pushMarkdown(
                githubToken,
                githubRepo,
                'README.md',
                catalogMd,
                `Update Learning Vault catalog index (README.md) [${new Date().toLocaleString()}]`,
                githubBranch || 'main'
            );
        } catch (err) {
            console.warn("Could not update README.md catalog:", err);
        }

        const syncTime = new Date().toISOString();
        const updated = { ...settings, githubLastSyncedAt: syncTime };
        setSettings(updated);
        storageService.saveSettings(updated);
        refreshCourseStates();

        if (failed.length === 0) {
            setGithubStatus({
                type: 'success',
                message: `Success: Smart Sync completed! Pushed ${successCount} updated course(s) and updated master README.md catalog.`
            });
        } else {
            setGithubStatus({
                type: 'error',
                message: `Smart Sync partially completed: ${successCount} pushed, ${failed.length} failed: ${failed.join(', ')}`
            });
        }

        if (onSync) onSync();
    };

    const handlePullAllCoursesFromRepo = async (e) => {
        e?.preventDefault();
        const { githubToken, githubRepo, githubFolder, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required.' });
            return;
        }

        const folder = githubFolder ? githubFolder.trim().replace(/^\/+|\/+$/g, '') : 'courses';
        setGithubStatus({ type: 'syncing', message: `Scanning repository for courses in "${folder}/"...` });

        try {
            const files = await githubService.listDirectory(githubToken, githubRepo, folder, githubBranch || 'main');
            if (files.length === 0) {
                setGithubStatus({
                    type: 'error',
                    message: `No Markdown course files found in folder "${folder}/" on branch "${githubBranch || 'main'}".`
                });
                return;
            }

            let importedCount = 0;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.toLowerCase() === 'readme.md' || file.name.toLowerCase() === 'index.md') continue;

                setGithubStatus({
                    type: 'syncing',
                    message: `Pulling (${i + 1}/${files.length}): ${file.name}...`
                });

                try {
                    const fileData = await githubService.pullMarkdown(githubToken, githubRepo, file.path, githubBranch || 'main');
                    const parsedDB = markdownToJson(fileData.content);
                    if (parsedDB && parsedDB.paths) {
                        Object.values(parsedDB.paths).forEach(p => {
                            storageService.saveSinglePath(p);
                            storageService.markPathSynced(p.topic, fileData.sha);
                            importedCount++;
                        });
                    }
                } catch (err) {
                    console.warn(`Could not parse ${file.name}:`, err);
                }
            }

            refreshCourseStates();
            setSettings(storageService.getSettings());
            setGithubStatus({
                type: 'success',
                message: `Success: Scanned and imported ${importedCount} course(s) from GitHub repository!`
            });
            if (onSync) onSync();
        } catch (err) {
            console.error("Failed to pull courses from repo:", err);
            setGithubStatus({ type: 'error', message: `Pull failed: ${err.message}` });
        }
    };

    const handlePushCatalogReadme = async (e) => {
        e?.preventDefault();
        const { githubToken, githubRepo, githubFolder, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required.' });
            return;
        }

        const folder = githubFolder ? githubFolder.trim().replace(/^\/+|\/+$/g, '') : 'courses';
        setGithubStatus({ type: 'syncing', message: 'Generating and pushing master README.md catalog...' });
        try {
            const rawDB = storageService.getRawDB();
            const catalogMd = generateCatalogIndexMarkdown(rawDB.paths, folder);
            const result = await githubService.pushMarkdown(
                githubToken,
                githubRepo,
                'README.md',
                catalogMd,
                `Update master Learning Vault catalog (README.md) [${new Date().toLocaleString()}]`,
                githubBranch || 'main'
            );

            setGithubStatus({
                type: 'success',
                message: `Success: Master catalog (README.md) pushed to repository root! (Commit: ${result.commitSha?.substring(0, 7) || 'OK'})`
            });
        } catch (err) {
            console.error("Failed to push README.md catalog:", err);
            setGithubStatus({ type: 'error', message: `Failed to push README.md: ${err.message}` });
        }
    };

    const handlePushToGithub = async (e) => {
        e?.preventDefault();
        const { githubToken, githubRepo, githubFilePath, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required to push.' });
            return;
        }

        const syncTime = new Date().toISOString();
        const updated = { ...settings, githubLastSyncedAt: syncTime };
        setSettings(updated);
        storageService.saveSettings(updated);

        const targetFile = githubFilePath || 'Eduassist.md';
        setGithubStatus({ type: 'syncing', message: `Converting database to Markdown and pushing to ${githubRepo}/${targetFile}...` });
        try {
            const rawDB = storageService.getRawDB();
            const mdContent = jsonToMarkdown(rawDB);
            const result = await githubService.pushMarkdown(
                githubToken,
                githubRepo,
                targetFile,
                mdContent,
                `Update ${targetFile} via Edu-Assist [${new Date().toLocaleString()}]`,
                githubBranch || 'main'
            );

            const formatSize = (bytes) => {
                if (bytes < 1024) return `${bytes} B`;
                return `${(bytes / 1024).toFixed(2)} KB`;
            };

            setGithubStatus({
                type: 'success',
                message: `Success: Markdown file pushed to GitHub (${result.filePath}, ${formatSize(result.size)})! Commit: ${result.commitSha?.substring(0, 7) || 'Done'}`
            });
        } catch (err) {
            console.error("GitHub push failed:", err);
            setGithubStatus({ type: 'error', message: `Push failed: ${err.message || 'Error pushing to GitHub.'}` });
        }
    };

    const handlePullFromGithub = async (e) => {
        e?.preventDefault();
        const { githubToken, githubRepo, githubFilePath, githubBranch } = settings;
        if (!githubToken || !githubRepo) {
            setGithubStatus({ type: 'error', message: 'GitHub Personal Access Token and Repository are required to pull.' });
            return;
        }

        storageService.saveSettings(settings);
        const targetFile = githubFilePath || 'Eduassist.md';
        setGithubStatus({ type: 'syncing', message: `Pulling Markdown from ${githubRepo}/${targetFile}...` });
        try {
            const fileData = await githubService.pullMarkdown(
                githubToken,
                githubRepo,
                targetFile,
                githubBranch || 'main'
            );

            const parsedDB = markdownToJson(fileData.content);
            if (!parsedDB || !parsedDB.paths || Object.keys(parsedDB.paths).length === 0) {
                throw new Error('No valid learning paths could be parsed from the remote Markdown file.');
            }

            storageService.replaceDB(parsedDB);
            setSettings(storageService.getSettings());

            const pathCount = Object.keys(parsedDB.paths).length;
            setGithubStatus({
                type: 'success',
                message: `Success: Pulled and merged ${pathCount} learning path(s) from GitHub Markdown!`
            });

            if (onSync) onSync();
        } catch (err) {
            console.error("GitHub pull failed:", err);
            setGithubStatus({ type: 'error', message: `Pull failed: ${err.message || 'Error pulling from GitHub.'}` });
        }
    };

    const handleDownloadLocalMarkdown = (e) => {
        e?.preventDefault();
        try {
            const info = storageService.downloadMarkdown();
            const formatSize = (bytes) => {
                if (bytes < 1024) return `${bytes} B`;
                return `${(bytes / 1024).toFixed(2)} KB`;
            };
            setGithubStatus({
                type: 'success',
                message: `Success: Local Markdown downloaded (${info.filename}, ${formatSize(info.size)})`
            });
        } catch (err) {
            console.error("Markdown download failed:", err);
            setGithubStatus({ type: 'error', message: `Error downloading Markdown: ${err.message}` });
        }
    };

    const handleUploadMarkdown = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setGithubStatus({ type: 'syncing', message: 'Reading and parsing Markdown file...' });
            await storageService.uploadMarkdown(file);
            setSettings(storageService.getSettings());
            refreshCourseStates();
            setGithubStatus({
                type: 'success',
                message: `Success: Markdown file "${file.name}" imported and merged into database!`
            });
            if (onSync) onSync();
            e.target.value = '';
        } catch (err) {
            console.error("Markdown import failed:", err);
            setGithubStatus({ type: 'error', message: `Import failed: ${err.message}` });
            e.target.value = '';
        }
    };

    const handleTestAiConnection = async (e) => {
        e?.preventDefault();

        if (settings.provider === 'gemini' && !settings.apiKey) {
            setAiTestStatus({ type: 'error', message: 'Gemini API Key is required.' });
            return;
        }
        if (settings.provider === 'openrouter' && !settings.openrouterKey) {
            setAiTestStatus({ type: 'error', message: 'OpenRouter API Key is required.' });
            return;
        }
        if (settings.provider === 'nvidia' && !settings.nvidiaKey) {
            setAiTestStatus({ type: 'error', message: 'Nvidia API Key is required.' });
            return;
        }

        // Save settings first
        storageService.saveSettings(settings);

        setAiTestStatus({ type: 'testing', message: `Testing connection to ${settings.provider === 'nvidia' ? 'Nvidia NIM' : settings.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'}...` });
        try {
            const result = await aiService.testConnectivity(settings);
            setAiTestStatus({
                type: 'success',
                message: `Success: Connection verified successfully! Model responded with: "${result}"`
            });
        } catch (err) {
            console.error("AI connection verification failed:", err);
            setAiTestStatus({ type: 'error', message: `Error: ${err.message || 'Connection verification failed.'}` });
        }
    };

    const filteredOpenRouterModels = settings.openrouterFreeOnly
        ? availableModels.filter(isModelFree)
        : availableModels;

    const handleThemeChange = (newTheme) => {
        const updated = { ...settings, theme: newTheme };
        setSettings(updated);
        storageService.saveSettings(updated);
        console.log("Theme changed to:", newTheme);
        if (onSync) onSync();
    };


    useEffect(() => {
        const fetchModels = async () => {
            if (settings.provider === 'openrouter') {
                if (!settings.openrouterKey) {
                    setAvailableModels([]);
                    return;
                }
                setLoadingModels(true);
                try {
                    const models = await aiService.listOpenRouterModels(settings.openrouterKey);
                    const mapped = models.map(m => ({
                        id: m.id,
                        name: m.name || m.id,
                        pricing: m.pricing
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableModels(mapped);
                } catch (err) {
                    console.error("Error fetching OpenRouter models:", err);
                } finally {
                    setLoadingModels(false);
                }
            } else if (settings.provider === 'nvidia') {
                if (!settings.nvidiaKey) {
                    setAvailableModels([]);
                    return;
                }
                setLoadingModels(true);
                try {
                    const models = await aiService.listNvidiaModels(settings.nvidiaKey, settings.nvidiaBaseUrl);
                    const mapped = models.map(m => ({
                        id: m.id,
                        name: m.id
                    })).sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableModels(mapped);
                } catch (err) {
                    console.error("Error fetching Nvidia models:", err);
                } finally {
                    setLoadingModels(false);
                }
            } else {
                if (!settings.apiKey) {
                    setAvailableModels([]);
                    return;
                }
                setLoadingModels(true);
                try {
                    const models = await aiService.listModels(settings.apiKey);
                    const filtered = models
                        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                        .map(m => {
                            const name = m.name.replace('models/', '');
                            return {
                                id: name,
                                name: m.displayName || name
                            };
                        })
                        .sort((a, b) => a.name.localeCompare(b.name));
                    setAvailableModels(filtered);
                } catch (err) {
                    console.error("Error fetching Gemini models:", err);
                } finally {
                    setLoadingModels(false);
                }
            }
        };
        fetchModels();
    }, [settings.provider, settings.apiKey, settings.openrouterKey, settings.nvidiaKey, settings.nvidiaBaseUrl]);

    useEffect(() => {
        if (settings.provider === 'openrouter' && settings.openrouterFreeOnly && availableModels.length > 0) {
            const filtered = availableModels.filter(isModelFree);
            if (filtered.length > 0 && !filtered.some(m => m.id === settings.openrouterModel)) {
                const defaultFree = filtered.find(m => m.id.includes('gemini-2.5-flash-lite')) || filtered[0];
                setSettings(prev => ({ ...prev, openrouterModel: defaultFree.id }));
            }
        }
    }, [settings.openrouterFreeOnly, availableModels, settings.provider, settings.openrouterModel]);


    const handleSave = (e) => {
        e.preventDefault();
        try {
            storageService.saveSettings(settings);
            setSaved(true);
            if (onSync) {
                onSync();
            }
            if (onBack) {
                onBack();
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Failed to save settings: " + err.message);
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear all learning history? This cannot be undone.')) {
            localStorage.removeItem('getpath_db');
            window.location.reload();
        }
    };

    return (
        <div className="content-wrapper">
            {onBack && (
                <div className="mb-4">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onBack}
                        className="rounded-2 d-flex align-items-center gap-2 px-3 py-2 border-opacity-50"
                    >
                        <ArrowLeft size={16} />
                        <span>Go Back</span>
                    </Button>
                </div>
            )}

            <Card className="themed-card shadow-lg">
                <Card.Header className="bg-transparent border-secondary py-3">
                    <h4 className="mb-0">Settings</h4>
                </Card.Header>


                <Card.Body className="p-4">
                    {saved && (
                        <Alert variant="success" className="bg-success bg-opacity-10 border-success text-success mb-4">
                            Settings saved successfully!
                        </Alert>
                    )}

                    <Form onSubmit={handleSave}>
                        <h6 className="text-primary mb-3">AI Configuration</h6>

                        {aiTestStatus.type === 'testing' && (
                            <Alert variant="info" className="bg-info bg-opacity-10 border-info text-info mb-4 d-flex align-items-center gap-2">
                                <Spinner size="sm" animation="border" variant="info" />
                                <span>{aiTestStatus.message}</span>
                            </Alert>
                        )}

                        {aiTestStatus.type === 'success' && (
                            <Alert variant="success" className="bg-success bg-opacity-10 border-success text-success mb-4">
                                {aiTestStatus.message}
                            </Alert>
                        )}

                        {aiTestStatus.type === 'error' && (
                            <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-danger mb-4">
                                {aiTestStatus.message}
                            </Alert>
                        )}

                        <Form.Group className="mb-4">
                            <Form.Label>AI Provider</Form.Label>
                            <Form.Select
                                value={settings.provider || 'gemini'}
                                onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                                className="themed-input"
                            >
                                <option value="gemini">Google Gemini (Direct)</option>
                                <option value="openrouter">OpenRouter</option>
                                <option value="nvidia">Nvidia NIM</option>
                            </Form.Select>
                        </Form.Group>

                        {settings.provider === 'openrouter' && (
                            <>
                                <Form.Group className="mb-4">
                                    <Form.Label className="d-flex justify-content-between">
                                        OpenRouter API Key
                                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-decoration-none x-small" style={{ fontSize: '0.75rem' }}>
                                            Get OpenRouter Key <Key size={12} />
                                        </a>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={settings.openrouterKey || ''}
                                        onChange={(e) => setSettings({ ...settings, openrouterKey: e.target.value })}
                                        placeholder="Enter your OpenRouter API Key"
                                        className="themed-input"
                                    />
                                    <Form.Text className="text-secondary small d-flex align-items-center mt-2">
                                        <Info size={14} className="me-1" /> Your OpenRouter key is stored locally in your browser.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Check
                                        type="switch"
                                        id="openrouter-search-switch"
                                        label="Enable Web Search"
                                        checked={settings.openrouterSearch !== false}
                                        onChange={(e) => setSettings({ ...settings, openrouterSearch: e.target.checked })}
                                        className="themed-text-primary"
                                    />
                                    <Form.Text className="text-secondary small">
                                        Enables real-time web searches using OpenRouter's web search tool.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Check
                                        type="switch"
                                        id="openrouter-free-switch"
                                        label="Only Show Free Models"
                                        checked={settings.openrouterFreeOnly || false}
                                        onChange={(e) => setSettings({ ...settings, openrouterFreeOnly: e.target.checked })}
                                        className="themed-text-primary"
                                    />
                                    <Form.Text className="text-secondary small">
                                        Filters the model list to show only models that are free to use.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        OpenRouter Model
                                        {loadingModels && <Spinner size="sm" animation="border" variant="primary" />}
                                    </Form.Label>
                                    <Form.Select
                                        value={settings.openrouterModel || 'google/gemini-2.5-flash-lite'}
                                        onChange={(e) => setSettings({ ...settings, openrouterModel: e.target.value })}
                                        className="themed-input"
                                        disabled={loadingModels}
                                    >
                                        {filteredOpenRouterModels.length > 0 ? (
                                            filteredOpenRouterModels.map(model => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name || model.id} {isModelFree(model) ? ' (Free)' : ''}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Default)</option>
                                                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                                                <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B Instruct</option>
                                                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                                <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                                                <option value="openai/gpt-4o-mini">GPT-4o mini</option>
                                            </>
                                        )}
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        {filteredOpenRouterModels.length > 0 ? "Models fetched from OpenRouter API." : "Enter an OpenRouter API key to fetch available models."}
                                    </Form.Text>
                                </Form.Group>
                            </>
                        )}

                        {settings.provider === 'nvidia' && (
                            <>
                                <Form.Group className="mb-4">
                                    <Form.Label className="d-flex justify-content-between">
                                        Nvidia API Key
                                        <a href="https://build.nvidia.com/" target="_blank" rel="noreferrer" className="text-decoration-none x-small" style={{ fontSize: '0.75rem' }}>
                                            Get Nvidia Key <Key size={12} />
                                        </a>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={settings.nvidiaKey || ''}
                                        onChange={(e) => setSettings({ ...settings, nvidiaKey: e.target.value })}
                                        placeholder="Enter your Nvidia API Key"
                                        className="themed-input"
                                    />
                                    <Form.Text className="text-secondary small d-flex align-items-center mt-2">
                                        <Info size={14} className="me-1" /> Your Nvidia key is stored locally in your browser.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Nvidia API Base URL (Proxy)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={settings.nvidiaBaseUrl || ''}
                                        onChange={(e) => setSettings({ ...settings, nvidiaBaseUrl: e.target.value })}
                                        placeholder="https://nvdia-limit-0719.foldedgoat.workers.dev/"
                                        className="themed-input"
                                    />
                                    <Form.Text className="text-secondary small">
                                        Base URL of the Nvidia NIM API or custom CORS proxy worker.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        Nvidia Model
                                        {loadingModels && <Spinner size="sm" animation="border" variant="primary" />}
                                    </Form.Label>
                                    <Form.Select
                                        value={settings.nvidiaModel || 'stepfun-ai/step-3.7-flash'}
                                        onChange={(e) => setSettings({ ...settings, nvidiaModel: e.target.value })}
                                        className="themed-input"
                                        disabled={loadingModels}
                                    >
                                        {availableModels.length > 0 ? (
                                            availableModels.map(model => (
                                                <option key={model.id} value={model.id}>
                                                    {model.id}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="stepfun-ai/step-3.7-flash">stepfun-ai/step-3.7-flash (Default)</option>
                                                <option value="meta/llama-3.3-70b-instruct">meta/llama-3.3-70b-instruct</option>
                                                <option value="meta/llama-3.1-405b-instruct">meta/llama-3.1-405b-instruct</option>
                                                <option value="meta/llama-3.1-70b-instruct">meta/llama-3.1-70b-instruct</option>
                                                <option value="meta/llama-3.1-8b-instruct">meta/llama-3.1-8b-instruct</option>
                                                <option value="nvidia/llama-3.1-nemotron-70b-instruct">nvidia/llama-3.1-nemotron-70b-instruct</option>
                                            </>
                                        )}
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        {availableModels.length > 0 ? "Models fetched from Nvidia API." : "Enter a valid API key to fetch available models."}
                                    </Form.Text>
                                </Form.Group>
                            </>
                        )}

                        {settings.provider === 'gemini' && (
                            <>
                                <Form.Group className="mb-4">
                                    <Form.Label className="d-flex justify-content-between">
                                        Gemini API Key
                                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-decoration-none x-small" style={{ fontSize: '0.75rem' }}>
                                            Get Free Key <Key size={12} />
                                        </a>
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                        placeholder="Enter your Google Gemini API Key"
                                        className="themed-input"
                                    />
                                    <Form.Text className="text-secondary small d-flex align-items-center mt-2">
                                        <Info size={14} className="me-1" /> Your key is stored locally in your browser.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="d-flex justify-content-between align-items-center">
                                        Gemini Model
                                        {loadingModels && <Spinner size="sm" animation="border" variant="primary" />}
                                    </Form.Label>
                                    <Form.Select
                                        value={settings.model || 'gemini-2.5-flash-lite'}
                                        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                        className="themed-input"
                                        disabled={loadingModels}
                                    >
                                        {availableModels.length > 0 ? (
                                            availableModels.map(model => (
                                                <option key={model.id} value={model.id}>{model.name || model.id}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Default)</option>
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                            </>
                                        )}
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        {availableModels.length > 0 ? "Models fetched from your API Key." : "Enter a valid API key to fetch available models."}
                                    </Form.Text>
                                </Form.Group>
                            </>
                        )}

                        <div className="d-flex mb-4">
                            <Button
                                variant="outline-secondary"
                                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={handleTestAiConnection}
                                disabled={aiTestStatus.type === 'testing'}
                            >
                                <Wifi size={16} /> Test AI Connection
                            </Button>
                        </div>

                        <Form.Group className="mb-4">
                            <Form.Check
                                type="switch"
                                id="demo-mode-switch"
                                label="Demo Mode (Use Mock Data)"
                                checked={settings.demoMode}
                                onChange={(e) => setSettings({ ...settings, demoMode: e.target.checked })}
                                className="themed-text-primary"
                            />
                            <Form.Text className="text-secondary small">
                                Enable this to explore the app without an API key using simulated responses.
                            </Form.Text>
                        </Form.Group>



                        <hr className="border-secondary my-4" />

                        <h6 className="text-primary mb-3">Assessment & Quiz Settings</h6>

                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Assessment Questions</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={settings.assessmentQuestions}
                                        onChange={(e) => setSettings({ ...settings, assessmentQuestions: parseInt(e.target.value) })}
                                        className="themed-input"


                                    />
                                    <Form.Text className="text-muted">Questions during onboarding</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Checkpoint Questions</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={settings.quizQuestions}
                                        onChange={(e) => setSettings({ ...settings, quizQuestions: parseInt(e.target.value) })}
                                        className="themed-input"


                                    />
                                    <Form.Text className="text-muted">Questions per module</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />

                        <div 
                            className="d-flex align-items-center justify-content-between mb-3" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowAskAiShortcuts(!showAskAiShortcuts)}
                        >
                            <h6 className="text-primary mb-0">Ask AI Dropdown Shortcuts</h6>
                            <Button 
                                variant="link" 
                                className="p-0 text-primary d-flex align-items-center gap-1 text-decoration-none"
                                style={{ fontSize: '0.85rem' }}
                            >
                                {showAskAiShortcuts ? 'Hide' : 'Show'} Shortcuts
                                {showAskAiShortcuts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </Button>
                        </div>

                        <Collapse in={showAskAiShortcuts}>
                            <div>
                                <p className="text-secondary small mb-4">
                                    Manage the external AI tools displayed in "Ask AI" menus across the application. You can toggle visibility, edit, delete, or add new custom shortcuts.
                                </p>

                                <div className="d-flex flex-column gap-2 mb-4">
                                    {(settings.askAiProviders || []).map((provider) => (
                                        <div
                                            key={provider.id}
                                            className="d-flex align-items-center justify-content-between p-3 rounded-3 border"
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                borderColor: 'var(--glass-border)'
                                            }}
                                        >
                                            <div className="d-flex flex-column gap-1 text-start" style={{ overflow: 'hidden', marginRight: '1rem' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-semibold themed-text-primary text-truncate">{provider.name}</span>
                                                    <span 
                                                        className={`badge ${provider.type === 'url' ? 'bg-primary' : 'bg-info'} bg-opacity-25 text-${provider.type === 'url' ? 'primary' : 'info'} x-small`}
                                                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
                                                    >
                                                        {provider.type === 'url' ? 'Redirect URL' : 'Copy + Open'}
                                                    </span>
                                                </div>
                                                <span className="text-secondary x-small text-truncate" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                    {provider.url}
                                                </span>
                                                {provider.customInstructions && (
                                                    <span className="themed-text-accent x-small mt-0.5" style={{ fontSize: '0.7rem', opacity: 0.85, color: '#38bdf8' }}>
                                                        Custom Instructions: "{provider.customInstructions}"
                                                    </span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                                <Form.Check
                                                    type="switch"
                                                    id={`toggle-provider-${provider.id}`}
                                                    checked={provider.enabled !== false}
                                                    onChange={(e) => handleToggleProvider(provider.id, e.target.checked)}
                                                    className="themed-text-primary mb-0"
                                                />
                                                <Button
                                                    variant="link"
                                                    className="p-0 text-secondary"
                                                    onClick={() => handleEditProviderClick(provider)}
                                                    title="Edit Provider"
                                                >
                                                    <Pencil size={15} />
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    className="p-0 text-danger"
                                                    onClick={() => handleDeleteProvider(provider.id)}
                                                    title="Delete Provider"
                                                >
                                                    <Trash2 size={15} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {showAddForm ? (
                                    <Card className="p-3 mb-4 bg-secondary bg-opacity-10 border-0">
                                        <h6 className="themed-text-primary mb-3">
                                            {editingProviderId ? 'Edit Shortcut Provider' : 'Add Custom Shortcut Provider'}
                                        </h6>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small themed-text-primary">Provider Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. DeepSeek Coder"
                                                value={providerForm.name}
                                                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                                                className="themed-input"
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small themed-text-primary">Redirection Method</Form.Label>
                                            <Form.Select
                                                value={providerForm.type}
                                                onChange={(e) => setProviderForm({ ...providerForm, type: e.target.value })}
                                                className="themed-input"
                                            >
                                                <option value="url">Direct URL Redirection (Replaces {'{query}'} placeholder)</option>
                                                <option value="copy">Copy Prompt & Open Target URL (Recommended fallback)</option>
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small themed-text-primary">
                                                {providerForm.type === 'url' ? 'URL Template (Include {query})' : 'Target URL to Open'}
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder={providerForm.type === 'url' ? 'https://example.com/search?q={query}' : 'https://example.com/chat'}
                                                value={providerForm.url}
                                                onChange={(e) => setProviderForm({ ...providerForm, url: e.target.value })}
                                                className="themed-input"
                                            />
                                            {providerForm.type === 'url' && (
                                                <Form.Text className="text-secondary small">
                                                    The placeholder `{"{query}"}` will automatically be replaced by the encoded prompt text.
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small themed-text-primary">Custom Instructions (Optional)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. explain only in English, write in bullet points"
                                                value={providerForm.customInstructions}
                                                onChange={(e) => setProviderForm({ ...providerForm, customInstructions: e.target.value })}
                                                className="themed-input"
                                            />
                                            <Form.Text className="text-secondary small">
                                                These instructions will be appended to your query prompt before sending/copying.
                                            </Form.Text>
                                        </Form.Group>
                                        <div className="d-flex gap-2">
                                            <Button variant="primary" size="sm" onClick={handleSaveProvider}>
                                                Save Shortcut
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    setEditingProviderId(null);
                                                    setProviderForm({ name: '', type: 'url', url: '', customInstructions: '' });
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </Card>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2 mb-4">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="d-flex align-items-center gap-1"
                                            onClick={() => setShowAddForm(true)}
                                        >
                                            <Plus size={14} /> Add Shortcut Provider
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="d-flex align-items-center gap-1 ms-auto"
                                            onClick={handleResetProviders}
                                        >
                                            <RotateCcw size={14} /> Reset to Defaults
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Collapse>

                        <Form.Group className="mb-4">
                            <Form.Check
                                type="switch"
                                id="chat-suggestions-switch"
                                label="Enable Chat Suggestion Chips"
                                checked={settings.showChatSuggestions !== false}
                                onChange={(e) => setSettings({ ...settings, showChatSuggestions: e.target.checked })}
                                className="themed-text-primary"
                            />
                            <Form.Text className="text-secondary small">
                                Displays clickable recommendation query bubbles in the AI Chat footer for quick prompts.
                            </Form.Text>
                        </Form.Group>

                        <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />

                        <h6 className="text-primary mb-3">Appearance</h6>
                        <Form.Group className="mb-4">
                            <Form.Label>Theme Mode</Form.Label>
                            <div className="d-flex gap-3">
                                <Button
                                    variant={settings.theme === 'dark' ? 'primary' : 'outline-secondary'}
                                    className="d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                    onClick={() => handleThemeChange('dark')}
                                >
                                    <Moon size={18} /> Dark
                                </Button>
                                <Button
                                    variant={settings.theme === 'light' ? 'primary' : 'outline-secondary'}
                                    className="d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                    onClick={() => handleThemeChange('light')}
                                >
                                    <Sun size={18} /> Light
                                </Button>
                            </div>
                        </Form.Group>

                        <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-primary mb-0 d-flex align-items-center gap-2">
                                <Database size={18} className="text-primary" /> MongoDB Cloud Sync
                            </h6>
                            {settings.lastSyncedAt && (
                                <span className="text-muted text-end" style={{ fontSize: '0.75rem' }}>
                                    Last Synced: {new Date(settings.lastSyncedAt).toLocaleString()}
                                </span>
                            )}
                        </div>

                        {syncStatus.type === 'syncing' && (
                            <Alert variant="info" className="bg-info bg-opacity-10 border-info text-info mb-3 d-flex align-items-center gap-2">
                                <Spinner size="sm" animation="border" variant="info" />
                                <span>{syncStatus.message}</span>
                            </Alert>
                        )}

                        {syncStatus.type === 'success' && (
                            <Alert variant="success" className="bg-success bg-opacity-10 border-success text-success mb-3">
                                {syncStatus.message}
                            </Alert>
                        )}

                        {syncStatus.type === 'error' && (
                            <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-danger mb-3">
                                {syncStatus.message}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Connection String</Form.Label>
                            <Form.Control
                                type="password"
                                value={settings.mongoConnectionString || ''}
                                onChange={(e) => setSettings({ ...settings, mongoConnectionString: e.target.value })}
                                placeholder="mongodb+srv://user:pass@cluster.mongodb.net/?..."
                                className="themed-input"
                            />
                        </Form.Group>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Database Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={settings.mongoDbName || ''}
                                        onChange={(e) => setSettings({ ...settings, mongoDbName: e.target.value })}
                                        placeholder="e.g. test"
                                        className="themed-input"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Collection Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={settings.mongoCollectionName || ''}
                                        onChange={(e) => setSettings({ ...settings, mongoCollectionName: e.target.value })}
                                        placeholder="e.g. test"
                                        className="themed-input"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="d-flex justify-content-between">
                                Sync Document ID
                                <span className="text-secondary x-small" style={{ fontSize: '0.75rem' }}>
                                    Default: getpath_db
                                </span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={settings.mongoDocumentId || ''}
                                onChange={(e) => setSettings({ ...settings, mongoDocumentId: e.target.value })}
                                placeholder="getpath_db"
                                className="themed-input"
                            />
                        </Form.Group>

                        <div className="d-flex flex-wrap gap-2 mb-4">
                            <Button
                                variant="outline-secondary"
                                className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={handleTestMongoConnection}
                                style={{ minWidth: '120px' }}
                            >
                                <Wifi size={16} /> Test Connection
                            </Button>
                            <Button
                                variant="outline-primary"
                                className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={handlePushToMongo}
                                style={{ minWidth: '120px' }}
                            >
                                <RefreshCw size={16} /> Push to Cloud
                            </Button>
                            <Button
                                variant="outline-info"
                                className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={handleRetrieveFromMongo}
                                style={{ minWidth: '120px' }}
                            >
                                <RefreshCw size={16} className="spin-slow" /> Retrieve & Merge
                            </Button>
                            <Button
                                variant="outline-success"
                                className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={handleDownloadLocalJson}
                                style={{ minWidth: '140px' }}
                                title="Download the full JSON database payload that is passed to MongoDB"
                            >
                                <Download size={16} /> Download Local JSON
                            </Button>
                        </div>

                        <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-primary mb-0 d-flex align-items-center gap-2">
                                <GitBranch size={18} className="text-primary" /> GitHub Markdown Sync
                            </h6>
                            {settings.githubLastSyncedAt && (
                                <span className="text-muted text-end" style={{ fontSize: '0.75rem' }}>
                                    Last Synced: {new Date(settings.githubLastSyncedAt).toLocaleString()}
                                </span>
                            )}
                        </div>

                        {githubStatus.type === 'syncing' && (
                            <Alert variant="info" className="bg-info bg-opacity-10 border-info text-info mb-3 d-flex align-items-center gap-2">
                                <Spinner size="sm" animation="border" variant="info" />
                                <span>{githubStatus.message}</span>
                            </Alert>
                        )}

                        {githubStatus.type === 'success' && (
                            <Alert variant="success" className="bg-success bg-opacity-10 border-success text-success mb-3">
                                {githubStatus.message}
                            </Alert>
                        )}

                        {githubStatus.type === 'error' && (
                            <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-danger mb-3">
                                {githubStatus.message}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="d-flex justify-content-between align-items-center">
                                GitHub Personal Access Token (PAT)
                                <a 
                                    href="https://github.com/settings/tokens/new?scopes=repo&description=EduAssistSync" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-decoration-none x-small text-info d-flex align-items-center gap-1" 
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    Generate Token <ExternalLink size={12} />
                                </a>
                            </Form.Label>
                            <Form.Control
                                type="password"
                                value={settings.githubToken || ''}
                                onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
                                placeholder="github_pat_..."
                                className="themed-input"
                            />
                            <Form.Text className="text-secondary small">
                                Fine-grained token (with <code>Contents: Read and write</code>) or classic token (with <code>repo</code> scope).
                            </Form.Text>
                        </Form.Group>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>GitHub Repository (owner/repo)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={settings.githubRepo || ''}
                                        onChange={(e) => setSettings({ ...settings, githubRepo: e.target.value })}
                                        placeholder="e.g. dapaag491/Eduassist-repo"
                                        className="themed-input"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Sync Mode</Form.Label>
                                    <Form.Select
                                        value={settings.githubSyncMode || 'multi'}
                                        onChange={(e) => {
                                            const updated = { ...settings, githubSyncMode: e.target.value };
                                            setSettings(updated);
                                            storageService.saveSettings(updated);
                                        }}
                                        className="themed-input"
                                    >
                                        <option value="multi">Per-Course Files (courses/{'{name}'}.md + README.md) - Recommended</option>
                                        <option value="single">Single Monolithic File (e.g. Eduassist.md)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {settings.githubSyncMode === 'single' ? (
                            <Form.Group className="mb-3">
                                <Form.Label>Target Markdown File Path</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={settings.githubFilePath || ''}
                                    onChange={(e) => setSettings({ ...settings, githubFilePath: e.target.value })}
                                    placeholder="Eduassist.md"
                                    className="themed-input"
                                />
                            </Form.Group>
                        ) : (
                            <Form.Group className="mb-3">
                                <Form.Label className="d-flex justify-content-between">
                                    Target Courses Folder
                                    <span className="text-secondary x-small" style={{ fontSize: '0.75rem' }}>
                                        Each course is saved as {settings.githubFolder || 'courses'}/[Course_Name].md
                                    </span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    value={settings.githubFolder || 'courses'}
                                    onChange={(e) => {
                                        const updated = { ...settings, githubFolder: e.target.value };
                                        setSettings(updated);
                                        storageService.saveSettings(updated);
                                        setCourseStates(storageService.getCourseSyncStates(e.target.value));
                                    }}
                                    placeholder="courses"
                                    className="themed-input"
                                />
                            </Form.Group>
                        )}

                        {/* Action Buttons Toolbar */}
                        {settings.githubSyncMode === 'multi' ? (
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                <Button
                                    variant="outline-secondary"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleTestGithub}
                                    style={{ minWidth: '130px' }}
                                >
                                    <Wifi size={16} /> Test Connection
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                    onClick={handleSmartSyncModifiedCourses}
                                    style={{ minWidth: '180px' }}
                                    title="Pushes only courses that were modified locally since last sync"
                                >
                                    <RefreshCw size={16} /> Smart Sync (Modified Only)
                                </Button>
                                <Button
                                    variant="outline-info"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handlePullAllCoursesFromRepo}
                                    style={{ minWidth: '150px' }}
                                    title="Scan and import all courses from the repository folder"
                                >
                                    <RefreshCw size={16} className="spin-slow" /> Pull All Courses
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handlePushCatalogReadme}
                                    style={{ minWidth: '140px' }}
                                    title="Generate and update the master README.md course catalog"
                                >
                                    <FileText size={16} /> Push README Index
                                </Button>
                            </div>
                        ) : (
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                <Button
                                    variant="outline-secondary"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleTestGithub}
                                    style={{ minWidth: '120px' }}
                                >
                                    <Wifi size={16} /> Test GitHub
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handlePushToGithub}
                                    style={{ minWidth: '120px' }}
                                >
                                    <RefreshCw size={16} /> Push to GitHub (.md)
                                </Button>
                                <Button
                                    variant="outline-info"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handlePullFromGithub}
                                    style={{ minWidth: '120px' }}
                                >
                                    <RefreshCw size={16} className="spin-slow" /> Pull from GitHub (.md)
                                </Button>
                                <Button
                                    variant="outline-success"
                                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                                    onClick={handleDownloadLocalMarkdown}
                                    style={{ minWidth: '140px' }}
                                >
                                    <Download size={16} /> Download Markdown
                                </Button>
                            </div>
                        )}

                        {/* Multi-Course Differential Status Table */}
                        {settings.githubSyncMode === 'multi' && (
                            <div className="mb-4 p-3 rounded-3 border text-start" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--glass-border)' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <p className="mb-0 fw-bold d-flex align-items-center gap-2">
                                            <Layers size={16} className="text-primary" /> Individual Course Sync Status
                                        </p>
                                        <p className="small text-secondary mb-0">
                                            Each course is tracked independently. Pushing only sends files with changes.
                                        </p>
                                    </div>
                                    <Button variant="outline-secondary" size="sm" onClick={refreshCourseStates} title="Refresh sync status">
                                        <RotateCcw size={13} />
                                    </Button>
                                </div>

                                {courseStates.length === 0 ? (
                                    <p className="text-muted small text-center py-3 mb-0">No courses created yet.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-dark table-hover table-sm mb-0 align-middle" style={{ background: 'transparent', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr className="border-secondary text-secondary">
                                                    <th>Course</th>
                                                    <th>Target File</th>
                                                    <th>Progress</th>
                                                    <th>Status</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseStates.map(c => {
                                                    const pct = c.totalCount > 0 ? Math.round((c.completedCount / c.totalCount) * 100) : 0;
                                                    return (
                                                        <tr key={c.topic} className="border-secondary">
                                                            <td className="fw-semibold text-light">{c.topic}</td>
                                                            <td>
                                                                <code className="text-info" style={{ fontSize: '0.75rem' }}>{c.filePath}</code>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary bg-opacity-25 text-light x-small">
                                                                    {c.completedCount}/{c.totalCount} ({pct}%)
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {c.status === 'synced' ? (
                                                                    <span className="badge bg-success bg-opacity-20 text-success d-inline-flex align-items-center gap-1">
                                                                        <CheckCircle2 size={12} /> Synced
                                                                    </span>
                                                                ) : c.status === 'modified' ? (
                                                                    <span className="badge bg-warning bg-opacity-20 text-warning d-inline-flex align-items-center gap-1">
                                                                        <Clock size={12} /> Modified
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-secondary bg-opacity-20 text-secondary d-inline-flex align-items-center gap-1">
                                                                        <AlertCircle size={12} /> Not Synced
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="d-inline-flex gap-1">
                                                                    <Button
                                                                        variant={c.status === 'synced' ? 'outline-secondary' : 'outline-primary'}
                                                                        size="sm"
                                                                        className="py-0 px-2"
                                                                        style={{ fontSize: '0.75rem' }}
                                                                        onClick={() => handlePushSingleCourse(c.topic)}
                                                                        title={`Push ${c.topic} to GitHub`}
                                                                    >
                                                                        Push
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-info"
                                                                        size="sm"
                                                                        className="py-0 px-2"
                                                                        style={{ fontSize: '0.75rem' }}
                                                                        onClick={() => handlePullSingleCourse(c.topic, c.filePath)}
                                                                        title={`Pull ${c.topic} from GitHub`}
                                                                    >
                                                                        Pull
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />

                        <h6 className="text-primary mb-3">Data Management</h6>

                        <div className="d-flex flex-column gap-3 mb-4 p-3 rounded-3 border text-start" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--glass-border)' }}>
                            <div>
                                <p className="mb-1 fw-bold">Local Database Backup & Markdown</p>
                                <p className="small text-secondary mb-0">Download or upload your full database in JSON (raw data) or Markdown (human-readable note format for Obsidian / GitHub).</p>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                                <Button variant="outline-success" size="sm" className="d-inline-flex align-items-center gap-2" onClick={handleDownloadLocalJson}>
                                    <Download size={14} /> Download JSON Database
                                </Button>
                                <Button variant="outline-success" size="sm" className="d-inline-flex align-items-center gap-2" onClick={handleDownloadLocalMarkdown}>
                                    <FileText size={14} /> Download Markdown (.md)
                                </Button>
                                <label className="btn btn-outline-primary btn-sm mb-0 d-inline-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                                    <Upload size={14} /> Import Markdown (.md)
                                    <input type="file" hidden accept=".md,.markdown" onChange={handleUploadMarkdown} />
                                </label>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3 mb-4 p-3 rounded-3 border text-start" style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--glass-border)' }}>
                            <div>
                                <p className="mb-1 fw-bold">Backup & Share Settings</p>
                                <p className="small text-secondary mb-0">Copy your full configuration as a Base64 string to transfer it to another browser/device, or paste an encoded string below to load it.</p>
                            </div>
                            <div className="d-flex gap-2 mt-1">
                                <Button variant="outline-info" size="sm" onClick={handleCopyBase64Settings}>
                                    Copy Settings to Clipboard
                                </Button>
                                <Button variant="outline-primary" size="sm" onClick={() => setShowImportBox(!showImportBox)}>
                                    {showImportBox ? 'Close Import Panel' : 'Import from Clipboard'}
                                </Button>
                            </div>
                            <Collapse in={showImportBox}>
                                <div className="mt-3">
                                    <Form.Group className="mb-2">
                                        <Form.Label className="small text-secondary">Paste your Base64 Settings string here:</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={importBase64Text}
                                            onChange={(e) => setImportBase64Text(e.target.value)}
                                            placeholder="Paste string here..."
                                            className="themed-input small"
                                            style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '0.8rem' }}
                                        />
                                    </Form.Group>
                                    <Button variant="success" size="sm" onClick={handleImportBase64Settings}>
                                        Apply Imported Settings
                                    </Button>
                                </div>
                            </Collapse>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="text-start">
                                <p className="mb-0 fw-bold">Clear Local Data</p>
                                <p className="small text-secondary mb-0">Deletes all saved paths and history from this browser.</p>
                            </div>
                            <Button variant="outline-danger" size="sm" onClick={handleClearHistory}>
                                <Trash2 size={16} className="me-1" /> Clear All
                            </Button>
                        </div>

                        <div className="d-grid mt-5">
                            <Button variant="primary" type="submit" size="lg">
                                <Save size={18} className="me-2" /> Save Settings
                            </Button>
                        </div>
                    </Form>

                    <div className="mt-5 pt-3 border-top border-secondary text-center">
                        <p className="themed-text-secondary small mb-1">
                            <strong>Course Craft</strong> v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
                        </p>
                        <p className="themed-text-secondary x-small opacity-50 mb-0" style={{ fontSize: '0.7rem' }}>
                            Last Deployed: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Just now'}
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </div>

    );
};

export default Settings;
