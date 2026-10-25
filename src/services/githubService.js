// GitHub REST API Service

const encodeBase64Utf8 = (str) => {
    return btoa(unescape(encodeURIComponent(str)));
};

const decodeBase64Utf8 = (base64) => {
    return decodeURIComponent(escape(atob(base64.replace(/\s/g, ''))));
};

const cleanRepoName = (repo) => {
    if (!repo) return '';
    let cleaned = repo.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
    cleaned = cleaned.replace(/^\/+|\/+$/g, '');
    return cleaned;
};

const cleanFilePath = (path) => {
    if (!path) return 'Eduassist.md';
    return path.trim().replace(/^\/+/, '');
};

export const githubService = {
    testConnection: async (token, repo) => {
        const cleanedRepo = cleanRepoName(repo);
        if (!cleanedRepo || !cleanedRepo.includes('/')) {
            throw new Error('Repository format must be "owner/repo" (e.g. dapaag491/Eduassist-repo)');
        }
        if (!token) {
            throw new Error('GitHub Personal Access Token is required.');
        }

        const response = await fetch(`https://api.github.com/repos/${cleanedRepo}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.trim()}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let parsedErr;
            try {
                parsedErr = JSON.parse(errorText);
            } catch (e) {
                parsedErr = { message: errorText };
            }
            throw new Error(`GitHub connection failed (${response.status}): ${parsedErr.message || errorText}`);
        }

        const data = await response.json();
        return {
            success: true,
            repoName: data.full_name,
            defaultBranch: data.default_branch || 'main',
            permissions: data.permissions
        };
    },

    getFile: async (token, repo, filePath, branch = 'main') => {
        const cleanedRepo = cleanRepoName(repo);
        const cleanedPath = cleanFilePath(filePath);

        const url = `https://api.github.com/repos/${cleanedRepo}/contents/${cleanedPath}?ref=${encodeURIComponent(branch || 'main')}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.trim()}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return null; // File does not exist yet
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch file from GitHub (${response.status}): ${errorText}`);
        }

        const fileData = await response.json();
        return fileData;
    },

    pushMarkdown: async (token, repo, filePath, markdownContent, commitMessage, branch = 'main') => {
        const cleanedRepo = cleanRepoName(repo);
        const cleanedPath = cleanFilePath(filePath);
        const effectiveBranch = branch?.trim() || 'main';

        if (!token) throw new Error('GitHub Personal Access Token is required.');
        if (!cleanedRepo) throw new Error('GitHub repository (owner/repo) is required.');
        if (!markdownContent) throw new Error('Markdown content cannot be empty.');

        // 1. Check if the file already exists to obtain its current SHA
        let existingSha = null;
        try {
            const existingFile = await githubService.getFile(token, cleanedRepo, cleanedPath, effectiveBranch);
            if (existingFile && existingFile.sha) {
                existingSha = existingFile.sha;
            }
        } catch (err) {
            // Ignore if file doesn't exist
            console.warn("Could not retrieve existing file SHA, creating new file:", err);
        }

        // 2. Base64 encode the markdown content
        const base64Content = encodeBase64Utf8(markdownContent);
        const message = commitMessage || `Update ${cleanedPath} via Edu-Assist [${new Date().toISOString()}]`;

        const bodyPayload = {
            message,
            content: base64Content,
            branch: effectiveBranch
        };

        if (existingSha) {
            bodyPayload.sha = existingSha;
        }

        const response = await fetch(`https://api.github.com/repos/${cleanedRepo}/contents/${cleanedPath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let parsedErr;
            try {
                parsedErr = JSON.parse(errorText);
            } catch (e) {
                parsedErr = { message: errorText };
            }
            throw new Error(`GitHub push failed (${response.status}): ${parsedErr.message || errorText}`);
        }

        const result = await response.json();
        const byteSize = new Blob([markdownContent]).size;

        return {
            success: true,
            commitSha: result.commit?.sha,
            commitHtmlUrl: result.commit?.html_url,
            contentHtmlUrl: result.content?.html_url,
            filePath: cleanedPath,
            size: byteSize
        };
    },

    pullMarkdown: async (token, repo, filePath, branch = 'main') => {
        const fileData = await githubService.getFile(token, repo, filePath, branch);
        if (!fileData) {
            throw new Error(`File "${filePath}" was not found in ${repo} (branch: ${branch || 'main'}).`);
        }

        if (fileData.encoding === 'base64' && fileData.content) {
            const decodedMarkdown = decodeBase64Utf8(fileData.content);
            return {
                content: decodedMarkdown,
                sha: fileData.sha,
                size: fileData.size,
                htmlUrl: fileData.html_url
            };
        } else if (fileData.download_url) {
            const rawResponse = await fetch(fileData.download_url);
            if (!rawResponse.ok) {
                throw new Error(`Failed to download raw markdown content (${rawResponse.status})`);
            }
            const text = await rawResponse.text();
            return {
                content: text,
                sha: fileData.sha,
                size: fileData.size,
                htmlUrl: fileData.html_url
            };
        }

        throw new Error('Unsupported GitHub file content encoding.');
    },

    listDirectory: async (token, repo, folderPath = '', branch = 'main') => {
        const cleanedRepo = cleanRepoName(repo);
        const cleanedPath = folderPath ? cleanFilePath(folderPath) : '';

        const url = `https://api.github.com/repos/${cleanedRepo}/contents/${cleanedPath ? cleanedPath : ''}?ref=${encodeURIComponent(branch || 'main')}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.trim()}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return []; // Directory doesn't exist yet
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to list directory from GitHub (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            return [data];
        }

        return data.filter(item => item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.markdown')));
    }
};
