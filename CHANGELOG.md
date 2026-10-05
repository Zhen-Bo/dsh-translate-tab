# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-05

### Added

- Translate entry under Plugins in the sidebar, opening a two-pane translation view in the main area.
- Model picker sharing the Harness chat providers and models, with adjustable reasoning effort.
- Models disabled by their provider for the workspace are hidden from the picker.
- 15 languages with automatic source language detection.
- Configurable translation prompt with `{{target_language}}`, `{{source_language}}` and `{{text}}` variables.
- Interface text in English, Simplified Chinese and Traditional Chinese, following the Harness language setting.
- Translation failures shown as a toast with the cause and a suggested resolution.
