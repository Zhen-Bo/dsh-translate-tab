# dsh-translate-tab

A Translate entry under Plugins in the DeepSeek Harness sidebar.

- Click it to swap the main area for a two-pane translator. Use the sidebar to go back to a chat.
- The page follows the Harness language setting (Settings › General › Language) and switches live. It ships Simplified Chinese, Traditional Chinese and English. Language packs from other plugins for zh-TW, zh-HK or zh-Hant get Traditional Chinese, and any other language gets English.
- The model picker sits at the top right and uses the same catalog as the chat model picker, with reasoning effort as a slider under the model list. Until you pick one, it follows the catalog's default model, with effort set to Off so the translation starts right away.
- The swap button between the languages always works. With Detect language as the source, it swaps to the detected language when the text makes that clear, and otherwise to the last source you picked.
- The translation prompt is editable from the sliders button. It is sent as the user message, with `{{target_language}}`, `{{source_language}}` and `{{text}}` filled in. Settings are kept in localStorage, and the text you are working on is kept for the browser session.

Install (then restart the app):

    dsh plugin --profile desktop add "link:<path to this folder>"

Syntax check: `npm run check`.

Layout: `lib/index.js` is the host route `/translate/api/stream`, `lib/client.js` is the hand-written browser bundle (no build step).
