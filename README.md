<div align="center">

# 🌐 dsh-translate-tab

**A translation plugin for DeepSeek Harness.**

[![Version 0.1.0](https://img.shields.io/badge/version-0.1.0-4d6bfe)](package.json) [![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE) [![DeepSeek Harness plugin](https://img.shields.io/badge/DeepSeek_Harness-plugin-4d6bfe)](#-installation) [![15 languages](https://img.shields.io/badge/languages-15-orange)](#languages) [![No build step](https://img.shields.io/badge/build_step-none-lightgrey)](#-architecture)

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

1. Clone this repository.
2. Register it with the desktop profile, using the path to the plugin directory:

   ```bash
   dsh plugin --profile desktop add "link:D:/path/to/dsh-translate-tab"
   ```

3. Restart DeepSeek Harness.

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

| File | Runtime | Role |
|---|---|---|
| `lib/client.js` | Harness window | Translate page, hand-written in the Harness client module format |
| `lib/index.js` | Harness host | `POST /translate/api/stream`, streams a single model call |

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

Changes in `lib/` take effect after restarting DeepSeek Harness. Syntax check:

```bash
npm run check
```

## 📄 License

Licensed under the [MIT License](LICENSE).
