"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load environment variables from .env file in src/env directory
dotenv.config({ path: path.join(__dirname, 'env', '.env') });
let gistId;
let startTime;
let endTime;
let githubUsername;
async function activate(context) {
    vscode.window.showInformationMessage('Congratulations, your extension "trackyourpeas" is now active!');
    let tracking = false;
    let paused = false;
    let elapsedSeconds = 0;
    let interval;
    // Fetch GitHub username
    const githubUsername = await fetchGitHubUsername();
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
            await fetchGitHubUsername();
            const { repoName, branchName } = await getRepoAndBranch();
            const totalCommits = await countCommits(`${repoName}/${branchName}`);
            await saveResultToGist(githubUsername, result, totalCommits, repoName, branchName);
        }
        else {
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
            }
            else {
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
exports.activate = activate;
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}
async function saveResultToGist(githubUsername, result, totalCommits, repoName, branchName) {
    const token = process.env.GITHUB_TOKEN_TRACK_YOUR_PEAS;
    if (!token) {
        vscode.window.showErrorMessage('GitHub token is not set. Please set the GITHUB_TOKEN_TRACK_YOUR_PEAS environment variable.');
        return;
    }
    const gistData = {
        description: "Track Your Peas Timer Result",
        public: false,
        files: {
            "timer-result.txt": {
                user: `${githubUsername}`,
                content: `Elapsed Time: ${result}`,
                repository: `${branchName}`,
                branch: `${branchName}`,
                totalCommits: `${totalCommits}`
            }
        }
    };
    try {
        let response;
        if (gistId) {
            // Update existing Gist
            response = await axios_1.default.patch(`https://api.github.com/gists/${gistId}`, gistData, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
        }
        else {
            // Create new Gist
            response = await axios_1.default.post('https://api.github.com/gists', gistData, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            gistId = response.data.id;
        }
        vscode.window.showInformationMessage('Timer result saved to GitHub Gist!');
    }
    catch (error) {
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
        const response = await axios_1.default.get('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        return response.data.login;
    }
    catch (error) {
        vscode.window.showErrorMessage('Failed to fetch GitHub username.');
        console.error(error);
    }
}
async function countCommits(repositoryAndBranchName) {
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
    const repoName = repositoryAndBranchName;
    const since = startTime.toISOString();
    const until = endTime.toISOString();
    try {
        const response = await axios_1.default.get(`https://api.github.com/repos/${githubUsername}/${repoName}/commits`, {
            headers: {
                'Authorization': `token ${token}`
            },
            params: {
                since: since,
                until: until
            }
        });
        return response.data.length;
    }
    catch (error) {
        vscode.window.showErrorMessage('Failed to count commits.');
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
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map