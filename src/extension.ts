import * as vscode from 'vscode';
// import * as dotenv from 'dotenv';
import { fetchGitHubUsername, getGitHubToken, updateGitHubToken } from './credentials';
import { getRepoAndBranch } from './credentials';
import { saveResultToGist } from './gist';

let endTime: Date | undefined;
let githubUsername: string | undefined;
let token: string | undefined;



export async function activate(context: vscode.ExtensionContext) {
    try {
        const { repoName, branchName } = await getRepoAndBranch();
        token = await getGitHubToken(context=context);
        githubUsername = await fetchGitHubUsername(token=token);
        if (!token) {
            vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
            return;
        }
        vscode.window.showInformationMessage(`Congratulations ${githubUsername}, your extension "trackyourpeas" is now active! Repo: ${repoName}, Branch: ${branchName}`);

        let tracking = false;
        let paused = false;
        let elapsedSeconds = 0;
        let interval: NodeJS.Timeout | undefined;

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
                    await saveResultToGist(token, githubUsername, endTime, result, repoName, branchName);
                }
            } else {
                // Start tracking
                tracking = true;
                paused = false;
                elapsedSeconds = 0;
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

        context.subscriptions.push(vscode.commands.registerCommand('trackyourpeas.updatePAT', async () => {
            await updateGitHubToken(context);
        }));

        context.subscriptions.push(startStopCommand);
        context.subscriptions.push(pauseCommand);
        context.subscriptions.push(startStop);
        context.subscriptions.push(pause);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
    
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

export function deactivate() {}

module.exports = {
    activate,
    deactivate
};