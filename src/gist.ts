import * as vscode from 'vscode';
import axios from 'axios';
import { markdownSummary } from './markdown-summary';

const GITHUB_API_URL = 'https://api.github.com';

export async function saveResultToGist(token: string|undefined, githubUsername: string, endTime: Date, result: string, repoName: string | null, branchName: string | null) {
    if (!token) {
        vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
        return;
    }

    let gistId: string | null = null;
    let existingGistContent: string | null = null;

    //  Fetch all Gists
    try {
        // Fetch existing gists
        const response = await axios.get(`${GITHUB_API_URL}/gists`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });

        const gists = response.data;

        // Check if a gist with the specified filename exists
        for (const gist of gists) {
            if (gist.files && gist.files["Track Your Peas Summary.md"]) {
                gistId = gist.id;
                break;
            }
        }

        // Fetch existing gist content
        if (gistId) {
            // Fetch existing Gist content
                const gistResponse = await axios.get(`${GITHUB_API_URL}/gists/${gistId}`, {
                    headers: {
                        'Authorization': `token ${token}`
                    }
                });
                existingGistContent = gistResponse.data.files["Track Your Peas Summary.md"].content;
            }
    } catch (error) {
        vscode.window.showErrorMessage('Failed to fetch GitHub Gists.');
        console.error(error);
        return;
    }

    const newGistContent = markdownSummary(endTime, result, repoName, branchName, gistId ? true : false);
    const combinedContent = gistId ? `${existingGistContent}${newGistContent}` : newGistContent;

    let gistData = {
        description: "Track Your Peas Summary",
        public: true,
        files: {
            "Track Your Peas Summary.md": {
                user: `${githubUsername}`,
                content: combinedContent,
                repository: `${repoName}`,
                branch: `${branchName}`,
            }
        }
    };

    try {
        let response;
        if (gistId) {
            // Update existing Gist
            response = await axios.patch(`https://api.github.com/gists/${gistId}`, gistData, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
        } else {
            // Create new Gist
            response = await axios.post('https://api.github.com/gists', gistData, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            gistId = response.data.id;
        }
        vscode.window.showInformationMessage('Timer result saved to GitHub Gist!');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to save timer result to GitHub Gist.');
        console.error(error);
    }
}