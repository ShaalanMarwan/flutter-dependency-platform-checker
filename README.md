# Flutter Dependency Platform Checker

## Overview

Flutter Dependency Platform Checker is a Visual Studio Code extension that helps Flutter developers quickly check which platforms their project dependencies support. This tool streamlines the process of verifying cross-platform compatibility for Flutter projects.

## Features

- Automatically scans your `pubspec.yaml` file for dependencies
- Checks each dependency against pub.dev to determine platform support
- Provides a quick overview of platform support for Android, iOS, Web, macOS, Windows, and Linux
- Easy to use with a simple command in VS Code

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Flutter Dependency Platform Checker"
4. Click Install

Alternatively, you can download the .vsix file from the [releases page](https://github.com/ShaalanMarwan/flutter-dependency-platform-checker/releases) and install it manually:

1. Open Visual Studio Code
2. Go to the Extensions view
3. Click on the '...' menu (top-right corner of the Extensions view)
4. Choose 'Install from VSIX...'
5. Select the downloaded .vsix file

## Usage

1. Open a Flutter project in VS Code
2. Open the `pubspec.yaml` file
3. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
4. Type "Check Flutter Dependencies" and select the command
5. The extension will scan your dependencies and display platform support information

## Requirements

- Visual Studio Code 1.93.0 or higher
- A Flutter project with a `pubspec.yaml` file

## Known Issues

- The extension relies on pub.dev for platform support information. If a package page on pub.dev is unavailable or has changed its format, the extension may not provide accurate information.

## Contributing

Contributions to the Flutter Dependency Platform Checker are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions, feel free to reach out to Shaalan Marwan at [Linkedin](https://linkedin.com/in/shaalanmarwan).

## Acknowledgments

- Thanks to the Flutter team for creating an amazing cross-platform framework
- Thanks to the VS Code team for providing a powerful extension API