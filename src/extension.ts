import * as vscode from 'vscode';
import axios from 'axios';

let gistId: string | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "trackyourpeas" is now active!');

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
            const result = formatTime(elapsedSeconds);
            elapsedSeconds = 0;
            startStop.text = '$(notebook-execute) Start Tracking';
            startStop.tooltip = 'Start tracking your peas...';
            pause.hide();
            if (interval) {
                clearInterval(interval);
            }
            await saveResultToGist(result);
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

async function saveResultToGist(result: string) {
    const token = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN';
    const gistData = {
        description: "Track Your Peas Timer Result",
        public: false,
        files: {
            "timer-result.txt": {
                content: `Elapsed Time: ${result}`
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

export function deactivate() {}