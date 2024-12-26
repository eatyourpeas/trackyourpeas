import * as vscode from 'vscode';
import axios from 'axios';
import { markdownSummary } from './markdown-summary';
import { getGitHubToken } from './credentials';


let gistId: string | undefined;

export async function saveResultToGist(token: string|undefined, githubUsername: string, endTime: Date, result: string, repoName: string | null, branchName: string | null) {
    if (!token) {
        vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
        return;
    }

    let gistData = {
        description: "Track Your Peas Summary",
        public: true,
        files: {
            "summary.md": {
                user: `${githubUsername}`,
                content: markdownSummary(endTime, result, repoName, branchName, gistId ? true : false),
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