import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

let codeLensProvider: vscode.Disposable | undefined;
let cache: Map<string, string[]> = new Map();

export function activate(context: vscode.ExtensionContext) {
    console.log('Flutter Dependency Platform Checker is now active');

    const provider = new DependencyCodeLensProvider();
    codeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'yaml', pattern: '**/pubspec.yaml' },
        provider
    );

    context.subscriptions.push(codeLensProvider);

    let disposable = vscode.commands.registerCommand('extension.checkFlutterDependencies', () => checkDependencies(true));
    context.subscriptions.push(disposable);

    // Trigger CodeLens refresh when the document is saved or opened
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.fileName.endsWith('pubspec.yaml')) {
            refreshCodeLens(document);
        }
    });

    vscode.workspace.onDidOpenTextDocument(document => {
        if (document.fileName.endsWith('pubspec.yaml')) {
            refreshCodeLens(document);
        }
    });

    // Clear CodeLenses when document is closed
    vscode.workspace.onDidCloseTextDocument(document => {
        if (document.fileName.endsWith('pubspec.yaml')) {
            provider.clearCodeLenses();
            refreshCodeLens(document);
        }
    });
}
class DependencyCodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        if (document.fileName.endsWith('pubspec.yaml')) {
            const text = document.getText();
            try {
                const parsedYaml = yaml.load(text) as any;
                const dependencies = { ...parsedYaml.dependencies, ...parsedYaml.dev_dependencies };

                this.codeLenses = [];

                for (const [packageName, version] of Object.entries(dependencies)) {
                    const line = document.lineAt(document.positionAt(text.indexOf(packageName)).line);
                    const platformSupport = await checkPlatformSupport(packageName, false);

                    const lens = new vscode.CodeLens(line.range, {
                        title: `Supported platforms: ${platformSupport.join(', ')}`,
                        command: ''
                    });
                    this.codeLenses.push(lens);
                }
            } catch (error) {
                console.error('Error parsing pubspec.yaml:', error);
            }
        }
        return this.codeLenses;
    }

    clearCodeLenses() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses.fire();
    }
}

async function checkPlatformSupport(packageName: string, forceRefresh: boolean): Promise<string[]> {
    if (!forceRefresh && cache.has(packageName)) {
        return cache.get(packageName)!;
    }

    return new Promise((resolve) => {
        https.get(`https://pub.dev/packages/${packageName}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const supportedPlatforms = extractPlatforms(data);
                cache.set(packageName, supportedPlatforms);
                console.log(`Supported platforms for ${packageName}:`, supportedPlatforms);
                resolve(supportedPlatforms);
            });
        }).on('error', (error) => {
            console.error(`Error fetching data for ${packageName}:`, error);
            resolve(['Error checking platform support']);
        });
    });
}

function extractPlatforms(html: string): string[] {
    const platforms: string[] = [];
    const platformRegex = /<a\s+class="tag-badge-sub"[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = platformRegex.exec(html)) !== null) {
        platforms.push(match[1]);
    }
    return platforms;
}

async function checkDependencies(forceRefresh: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName.endsWith('pubspec.yaml')) {
        refreshCodeLens(editor.document);
        vscode.window.showInformationMessage('Flutter dependencies checked');
    }
}
function refreshCodeLens(document: vscode.TextDocument) {
    vscode.commands.executeCommand('vscode.executeCodeLensProvider', document.uri);
}



export function deactivate() {
    if (codeLensProvider) {
        codeLensProvider.dispose();
    }
}