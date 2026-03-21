// Adapter exports
export type { Adapter, AdapterHealth } from './base';
export { BaseAdapter } from './base';
export { adapterRegistry } from './registry';

// Telegram
export { TelegramAdapter } from './telegram/adapter';
export type { TelegramConfig, TelegramMessage, TelegramCommand } from './telegram/config';
export { registerTelegramCommands } from './telegram/commands';

// Discord
export { DiscordAdapter } from './discord/adapter';
export type { DiscordConfig, DiscordEmbed, DiscordMessage } from './discord/config';

// LLM
export type { LLMProvider, LLMConfig, LLMOptions, LLMResponse, LLMChunk } from './llm/base';
export { BaseLLMProvider } from './llm/base';
export { OpenAIProvider } from './llm/openai';
export { AnthropicProvider } from './llm/anthropic';
export { KimiProvider } from './llm/kimi';
export { llmFactory, LLMFactory } from './llm/factory';

// Supabase
export { SupabaseAdapter } from './supabase/adapter';
export type { SupabaseConfig } from './supabase/config';
