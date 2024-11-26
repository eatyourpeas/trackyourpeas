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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('Congratulations, your extension "trackyourpeas" is now active!');
    let tracking = false;
    const pres = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    pres.tooltip = 'Start tracking your peas...';
    pres.command = 'folder-operations.statusBarHandler';
    pres.show();
    const disposable = vscode.commands.registerCommand('trackyourpeas.trackYourPeas', () => {
        pres.text = '$(notebook-execute) TRACK THEM PEAS!';
    });
    context.subscriptions.push(disposable);
    let disposable3 = vscode.commands.registerCommand('folder-operations.statusBarHandler', async (...args) => {
        if (tracking) {
            vscode.window.showInformationMessage('Tracking stopped');
            tracking = false;
            pres.text = `$(notebook-execute) TRACK THEM PEAS!`;
            return;
        }
        tracking = true;
        vscode.window.setStatusBarMessage('Start tracking your peas...', 2000);
        pres.text = '$(record) tracking...';
        pres.tooltip = 'Stop tracking your peas...';
    });
    context.subscriptions.push(disposable3);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map