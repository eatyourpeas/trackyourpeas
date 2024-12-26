import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

export async function getGitHubToken(context: vscode.ExtensionContext): Promise<string | undefined> {
    const secretStorage = context.secrets;
    let token = await (secretStorage as vscode.SecretStorage).get('GITHUB_TOKEN_TRACK_YOUR_PEAS');
    if (!token) {
        token = await vscode.window.showInputBox({
            prompt: 'Enter your GitHub Personal Access Token',
            ignoreFocusOut: true,
            password: true
        });
        if (token) {
            await secretStorage?.store('GITHUB_TOKEN_TRACK_YOUR_PEAS', token);
        }
    }
    return token;
}

export async function fetchGitHubUsername(token: string|undefined): Promise<string | undefined> {

    if (!token) {
        vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
        return;
    }

    try {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        return response.data.login;
    } catch (error) {
        vscode.window.showErrorMessage('Failed to fetch GitHub username.');
        console.error(error);
    }
}

export async function getRepoAndBranch() {
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    const api = gitExtension?.getAPI(1);
    const repo = api?.repositories[0];

    if (!repo) {
        return { repoName: null, branchName: null };
    }

    const repoName = path.basename(repo.rootUri.fsPath);
    const branchName = repo.state.HEAD?.name;

    return { repoName, branchName };
}