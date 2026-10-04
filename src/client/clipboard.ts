import {writeClipboard} from '@deepseek-ai/dsh-client-ui-primitives';

// Some embedded browsers refuse the async clipboard but allow execCommand.
function copyWithExecCommand(text: string) {
  const hiddenArea = document.createElement('textarea');
  hiddenArea.value = text;
  hiddenArea.setAttribute('readonly', '');
  hiddenArea.style.cssText =
    'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  const previouslyFocused = document.activeElement;
  document.body.appendChild(hiddenArea);
  hiddenArea.select();
  let copied: boolean;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  hiddenArea.remove();
  if (previouslyFocused instanceof HTMLElement) {
    previouslyFocused.focus({preventScroll: true});
  }
  return copied;
}

export async function copyText(text: string) {
  return (await writeClipboard(text)) || copyWithExecCommand(text);
}
