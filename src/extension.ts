import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { log } from 'console';

// Load environment variables from .env file in src/env directory
dotenv.config({ path: path.join(__dirname, '..', 'envs', '.env') });
// Create an OutputChannel
const outputChannel = vscode.window.createOutputChannel('trackyourpeas');

let gistId: string | undefined;
let startTime: Date | undefined;
let endTime: Date | undefined;
let githubUsername: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
    const { repoName, branchName } = await getRepoAndBranch();
    githubUsername = await fetchGitHubUsername();
    vscode.window.showInformationMessage(`Congratulations ${githubUsername}, your extension "trackyourpeas" is now active! Repo: ${repoName}, Branch: ${branchName}`);

    let tracking = false;
    let paused = false;
    let elapsedSeconds = 0;
    let interval: NodeJS.Timeout | undefined;
    let totalCommits = 0;

    const startStop = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    startStop.tooltip = 'Start tracking your peas...';
    startStop.command = 'trackyourpeas.startStopTracking';
    startStop.text = '$(notebook-execute) Start Tracking';
    startStop.show();

    const pause = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    pause.tooltip = 'Pause tracking your peas...';
    pause.command = 'trackyourpeas.pauseTracking';
    pause.text = '$(debug-pause) Pause';
    pause.hide();

    const startStopCommand = vscode.commands.registerCommand('trackyourpeas.startStopTracking', async () => {
        if (tracking) {
            // Stop tracking
            tracking = false;
            paused = false;
            endTime = new Date();
            const result = formatTime(elapsedSeconds);
            elapsedSeconds = 0;
            startStop.text = '$(notebook-execute) Start Tracking';
            startStop.tooltip = 'Start tracking your peas...';
            pause.hide();
            if (interval) {
                clearInterval(interval);
            }
            
            
            if (!repoName || !branchName) {
                vscode.window.showErrorMessage('Failed to get repository and branch name.');
                return;
            } 
            if (githubUsername){
                totalCommits = await countCommits(githubUsername, repoName, branchName);
                await saveResultToGist(githubUsername, result, totalCommits, repoName, branchName);
            }
        } else {
            // Start tracking
            tracking = true;
            paused = false;
            elapsedSeconds = 0;
            startTime = new Date();
            startStop.text = '$(primitive-square) Stop Tracking';
            startStop.tooltip = 'Stop tracking your peas...';
            pause.show();
            interval = setInterval(() => {
                if (!paused) {
                    elapsedSeconds++;
                    const time = formatTime(elapsedSeconds);
                    startStop.text = `$(primitive-square) Tracking... ${time}`;
                }
            }, 1000);
        }
    });

    const pauseCommand = vscode.commands.registerCommand('trackyourpeas.pauseTracking', () => {
        if (tracking) {
            if (paused) {
                // Resume tracking
                paused = false;
                pause.text = '$(debug-pause) Pause';
                pause.tooltip = 'Pause tracking your peas...';
            } else {
                // Pause tracking
                paused = true;
                pause.text = '$(debug-continue) Resume';
                pause.tooltip = 'Resume tracking your peas...';
            }
        }
    });

    context.subscriptions.push(startStopCommand);
    context.subscriptions.push(pauseCommand);
    context.subscriptions.push(startStop);
    context.subscriptions.push(pause);

    
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

async function saveResultToGist(githubUsername: string, result: string, totalCommits: number, repoName: string | null, branchName: string | null) {
    const token = process.env.GITHUB_TOKEN_TRACK_YOUR_PEAS;
    if (!token) {
        vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
        return;
    }

    const gistData = {
        description: "Track Your Peas Timer Result",
        public: true,
        files: {
            "timer-result.txt": {
				user: `${githubUsername}`,
                content: `Elapsed Time: ${result}`,
				repository: `${repoName}`,
				branch: `${branchName}`,
				totalCommits: `${totalCommits}`
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

async function fetchGitHubUsername() {
    const token = process.env.GITHUB_TOKEN_TRACK_YOUR_PEAS;
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

async function countCommits(githubUsername: string, repoName: string, branchName: string) {
    const token = process.env.GITHUB_TOKEN_TRACK_YOUR_PEAS;
    if (!token) {
        vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
        return;
    }

    if (!startTime || !endTime) {
        vscode.window.showErrorMessage('Start time or end time is not set.');
        return;
    }

    if (!githubUsername) {
        vscode.window.showErrorMessage('GitHub username is not set.');
        return;
    }

    
    const since = startTime.toISOString();
    const until = endTime.toISOString();

    try {
        const response = await axios.get(`https://api.github.com/repos/${githubUsername}/${repoName}/commits`, {
            headers: {
                'Authorization': `token ${token}`
            },
            params: {
                sha: branchName,
                since: since,
                until: until
            }
        });

        return response.data.length;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to count commits. ${error} ${repoName} ${branchName} ${githubUsername} ${token}`);
        console.error(error);
    }
}

async function getRepoAndBranch() {
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


export function deactivate() {}