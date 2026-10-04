import type {IncomingMessage, ServerResponse} from 'node:http';

export interface LlmFinishReason {
  kind?: string;
  failure?: {code?: string; message?: string};
}

export type LlmChunk =
  | {type: 'text-delta'; text: string}
  | {type: 'finish'; reason: LlmFinishReason};

export interface LlmStreamOptions {
  provider: string;
  model: string;
  messages: Array<{role: 'user'; content: Array<{type: 'text'; text: string}>}>;
  system?: string;
  reasoningEffort?: string;
  signal: AbortSignal;
}

/** The parts of the host plugin context this plugin uses. */
export interface ServerContext {
  effect(setup: () => () => void, label: string): void;
  webServer: {
    register(route: {
      kind: 'exact';
      path: string;
      handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    }): () => void;
  };
  llm: {stream(options: LlmStreamOptions): AsyncIterable<LlmChunk>};
  webRuntime?: {trustedHosts?: readonly string[]};
}
