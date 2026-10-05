<div align="center">

# 🌐 dsh-translate-tab

**A translation plugin for DeepSeek Harness.**

[![npm version](https://img.shields.io/npm/v/dsh-translate-tab?color=4d6bfe)](https://www.npmjs.com/package/dsh-translate-tab) [![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE) [![DeepSeek Harness plugin](https://img.shields.io/badge/DeepSeek_Harness-plugin-4d6bfe)](#-installation) [![15 languages](https://img.shields.io/badge/languages-15-orange)](#languages) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)](#-architecture) [![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/zhen-bo/dsh-translate-tab)

[Installation](#-installation) · [Quick start](#-quick-start) · [Usage](#-usage) · [Troubleshooting](#-troubleshooting)

English | [繁體中文](docs/README.zh-TW.md)

</div>

![The Translate page in DeepSeek Harness. English source text on the left, detected automatically and translated into Traditional Chinese on the right.](docs/screenshot-dark.png)

## ✨ Features

- **Sidebar integration:** adds a Translate entry under Plugins that opens a two-pane translation view in the main area.
- **Shared model catalog:** uses the same providers and models as Harness chat, with adjustable reasoning effort.
- **Low-latency default:** uses the catalog's default model with reasoning effort off.
- **15 languages:** with automatic source language detection.
- **Configurable prompt:** supports `{{target_language}}`, `{{source_language}}` and `{{text}}` variables.
- **Localized interface:** follows the Harness language setting in English, Simplified Chinese and Traditional Chinese.

## 📋 Requirements

- DeepSeek Harness desktop app with the `dsh` CLI on `PATH`
- At least one model configured with a valid API key in Settings › Models

## 📦 Installation

### From DSH Plugin Hub

1. Install DSH Plugin Hub:

   ```bash
   dsh plugin --profile desktop add dsh-plugin
   ```

2. Restart DeepSeek Harness.
3. Open **Settings › Plugin Market**, search for `dsh-translate-tab` and select **Install**.

### From npm

1. Install the plugin from the npm registry:

   ```bash
   dsh plugin --profile desktop add dsh-translate-tab
   ```

2. Restart DeepSeek Harness.

### From GitHub

1. Install the plugin from the repository:

   ```bash
   dsh plugin --profile desktop add "github:Zhen-Bo/dsh-translate-tab"
   ```

2. Restart DeepSeek Harness.

## 🚀 Quick start

1. Open **Plugins › Translate** in the sidebar.
2. Enter the source text in the left pane.
3. Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>, or <kbd>⌘</kbd> + <kbd>Enter</kbd> on macOS.

The translation streams into the right pane.

## 🧭 Usage

### Languages

Traditional Chinese, Simplified Chinese, English, Japanese, Korean, French, German, Spanish, Portuguese, Italian, Russian, Vietnamese, Thai, Indonesian and Arabic, each available as source or target.

Automatic detection applies to the source and recognizes Japanese, Korean, Arabic, Thai, Russian, Simplified Chinese, Traditional Chinese and English.

### Model and reasoning effort

The model picker is at the top right. Reasoning effort is set with the slider below the model list.

### Translation prompt

The prompt editor opens from the button next to the model picker. The prompt is sent as the user message with the following variables substituted:

| Variable | Value |
|---|---|
| `{{target_language}}` | Target language name in English, for example `Japanese` |
| `{{source_language}}` | Source language name, or `the detected source language` |
| `{{text}}` | Source text. Appended to the end when the prompt omits this variable |

### Storage

| Data | Location | Lifetime |
|---|---|---|
| Languages, model, reasoning effort and custom prompt | `localStorage` key `dsh-translate-tab:v1` | Persistent |
| Source text draft | `sessionStorage` key `dsh-translate-tab:draft` | Current window session |

## 🔧 Troubleshooting

| Message | Resolution |
|---|---|
| This model has no API key yet | Add a key in Settings › Models, or select another model |
| The API key was rejected | Verify the key in Settings › Models |
| Too many requests | Retry after a short wait |
| The response stopped early | Run the translation again |
| Text is too long | Split the source text into segments under 100,000 characters |

If Translate is missing under Plugins, verify the install path and restart DeepSeek Harness.

## 🧹 Uninstall

```bash
dsh plugin --profile desktop remove dsh-translate-tab
```

Restart DeepSeek Harness afterwards.

## 🧩 Architecture

| Path | Runtime | Role |
|---|---|---|
| `src/client` | Harness window | Translate page in React and TypeScript |
| `src/server` | Harness host | `POST /translate/api/stream`, streams a single model call |
| `src/shared` | Both | Route, text limits and stream event types |
| `locale` | Harness window | Interface text, registered with the Harness locale service |
| `lib` | Both | Build output loaded by Harness |

<details>
<summary>Stream format</summary>

<br>

The route accepts same-origin requests from the Harness window and responds with newline-delimited JSON:

```text
{"t":"text","v":"..."}        translated text
{"t":"done"}                  finished
{"t":"aborted"}               cancelled
{"t":"error","message":"..."} failed
```

</details>

## 💻 Development

1. Install dependencies and link the working copy to the desktop profile:

   ```bash
   npm install
   dsh plugin --profile desktop add "link:D:/path/to/dsh-translate-tab"
   ```

2. Run the build in watch mode, then restart DeepSeek Harness to load changes:

   ```bash
   npm run dev
   ```

| Command | Purpose |
|---|---|
| `npm run build` | Builds `lib/client.js` and `lib/index.js` |
| `npm run check` | Runs the type check, lint, tests and build |
| `npm run fix` | Formats the code with gts |

## 📄 License

Licensed under the [MIT License](LICENSE).
