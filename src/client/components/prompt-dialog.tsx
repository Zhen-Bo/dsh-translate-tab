import {
  Button,
  IconCloseOutlineRegular,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives';
import {useEffect, useState} from 'react';

import {copyText} from '../clipboard';
import {useTemporaryValue} from '../hooks/use-temporary-value';
import type {Translate} from '../i18n';
import {
  DEFAULT_PROMPT_TEMPLATE,
  PROMPT_VARIABLES,
  promptToStore,
} from '../prompt';
import {isSubmitKey} from '../text-input';

const VARIABLE_COPY_FEEDBACK_MS = 1400;

interface PromptDialogProps {
  open: boolean;
  onClose: () => void;
  savedTemplate: string | null;
  onSave: (template: string | null) => void;
  t: Translate;
}

export function PromptDialog({
  open,
  onClose,
  savedTemplate,
  onSave,
  t,
}: PromptDialogProps) {
  const openedTemplate = savedTemplate ?? DEFAULT_PROMPT_TEMPLATE;
  const [template, setTemplate] = useState(openedTemplate);
  useEffect(() => {
    if (open) {
      setTemplate(openedTemplate);
    }
  }, [open, openedTemplate]);
  const hasChanges = template !== openedTemplate;
  const save = () => {
    if (hasChanges) {
      onSave(promptToStore(template));
    }
  };

  const [copiedVariable, showCopiedVariableFor] = useTemporaryValue<{
    token: string;
    copied: boolean;
  } | null>(null);
  const copyVariable = async (token: string) =>
    showCopiedVariableFor(
      {token, copied: await copyText(token)},
      VARIABLE_COPY_FEEDBACK_MS,
    );
  const variableTooltip = (token: string) => {
    if (copiedVariable?.token !== token) {
      return t('copyVar');
    }
    return copiedVariable.copied ? t('copied') : t('copyFailed');
  };

  return (
    // Headless lets the variables share the title row.
    <Modal
      open={open}
      onClose={onClose}
      title={t('prompt')}
      closeLabel={t('close')}
      className="dtt-modal"
      headless
    >
      <div className="dtt-modal-head">
        <h2 className="dtt-modal-title">{t('prompt')}</h2>
        <div className="dtt-vars" role="group" aria-label={t('variables')}>
          {PROMPT_VARIABLES.map(({token, labelKey}) => (
            <Tooltip
              key={token}
              label={variableTooltip(token)}
              side="bottom"
              delayMs={300}
            >
              <button
                type="button"
                className="dtt-var"
                aria-label={`${t('copyVar')} ${token}`}
                onClick={() => void copyVariable(token)}
              >
                <span>{`${t(labelKey)}:`}</span>
                <code>{token}</code>
              </button>
            </Tooltip>
          ))}
        </div>
        <span className="dtt-grow" />
        <button
          type="button"
          className="dtt-icon-btn"
          aria-label={t('close')}
          onClick={onClose}
        >
          <IconCloseOutlineRegular size={14} />
        </button>
      </div>
      <div className="dtt-modal-body">
        <textarea
          className="dtt-modal-text"
          value={template}
          spellCheck={false}
          autoFocus
          aria-label={t('prompt')}
          onChange={event => setTemplate(event.target.value)}
          onKeyDown={event => {
            if (isSubmitKey(event)) {
              event.preventDefault();
              save();
            }
          }}
        />
        <div className="dtt-modal-actions">
          <Button
            variant="ghost"
            size="sm"
            disabled={template === DEFAULT_PROMPT_TEMPLATE}
            onClick={() => setTemplate(DEFAULT_PROMPT_TEMPLATE)}
          >
            {t('resetPrompt')}
          </Button>
          <span className="dtt-grow" />
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!hasChanges}
            onClick={save}
          >
            {t('save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
