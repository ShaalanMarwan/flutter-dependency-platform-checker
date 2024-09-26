import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as https from 'https';

export function activate(context: vscode.ExtensionContext) {
    console.log('Flutter Dependency Platform Checker is now active');

    let disposable = vscode.commands.registerCommand('extension.checkFlutterDependencies', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        if (document.fileName.endsWith('pubspec.yaml')) {
            try {
                const yamlContent = document.getText();
                const parsedYaml = yaml.load(yamlContent) as any;
                const dependencies = { ...parsedYaml.dependencies, ...parsedYaml.dev_dependencies };

                for (const [packageName, version] of Object.entries(dependencies)) {
                    const platformSupport = await checkPlatformSupport(packageName);
                    vscode.window.showInformationMessage(`${packageName}: ${platformSupport.join(', ')}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage('Error parsing pubspec.yaml: ' + error);
            }
        } else {
            vscode.window.showErrorMessage('This is not a pubspec.yaml file');
        }
    });

    context.subscriptions.push(disposable);
}

async function checkPlatformSupport(packageName: string): Promise<string[]> {
    return new Promise((resolve) => {
        https.get(`https://pub.dev/packages/${packageName}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const platforms = ['android', 'ios', 'web', 'macos', 'windows', 'linux'];
                const supportedPlatforms = platforms.filter(platform => data.includes(`${platform}: true`));
                resolve(supportedPlatforms);
            });
        }).on('error', () => {
            resolve(['Error checking platform support']);
        });
    });
}

export function deactivate() {}