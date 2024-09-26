import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

let codeLensProvider: vscode.Disposable | undefined;
let cache: Map<string, string[]> = new Map();

export function activate(context: vscode.ExtensionContext) {
    console.log('Flutter Dependency Platform Checker is now active');

    codeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'yaml', pattern: '**/pubspec.yaml' },
        new DependencyCodeLensProvider()
    );

    context.subscriptions.push(codeLensProvider);

    let disposable = vscode.commands.registerCommand('extension.checkFlutterDependencies', () => checkDependencies(true));
    context.subscriptions.push(disposable);

    // Trigger CodeLens refresh when the document is saved or opened
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.fileName.endsWith('pubspec.yaml')) {
            vscode.commands.executeCommand('vscode.executeCodeLensProvider', document.uri);
        }
    });

    vscode.workspace.onDidOpenTextDocument(document => {
        if (document.fileName.endsWith('pubspec.yaml')) {
            vscode.commands.executeCommand('vscode.executeCodeLensProvider', document.uri);
        }
    });
}

class DependencyCodeLensProvider implements vscode.CodeLensProvider {
    async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();

        try {
            const parsedYaml = yaml.load(text) as any;
            const dependencies = { ...parsedYaml.dependencies, ...parsedYaml.dev_dependencies };

            for (const [packageName, version] of Object.entries(dependencies)) {
                const line = document.lineAt(document.positionAt(text.indexOf(packageName)).line);
                const platformSupport = await checkPlatformSupport(packageName, false);

                const lens = new vscode.CodeLens(line.range, {
                    title: `Supported platforms: ${platformSupport.join(', ')}`,
                    command: ''
                });
                codeLenses.push(lens);
            }
        } catch (error) {
            console.error('Error parsing pubspec.yaml:', error);
        }

        return codeLenses;
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
        await vscode.commands.executeCommand('vscode.executeCodeLensProvider', editor.document.uri);
        vscode.window.showInformationMessage('Flutter dependencies checked');
    }
}

export function deactivate() {
    if (codeLensProvider) {
        codeLensProvider.dispose();
    }
}