// System initialization module
import { adapterRegistry } from '@/lib/adapters/registry';
import { TelegramAdapter } from '@/lib/adapters/telegram/adapter';
import { DiscordAdapter } from '@/lib/adapters/discord/adapter';
import { SupabaseAdapter } from '@/lib/adapters/supabase/adapter';
import { registerTelegramCommands } from '@/lib/adapters/telegram/commands';
import { getConfig } from '@/lib/services/config';
import { notificationService } from '@/lib/services/notifications';
import { getSystemHealth } from '@/lib/services/health';
import { setJobQueue } from '@/lib/agents/executor';
import { llmFactory } from '@/lib/adapters/llm/factory';
import { memoryQueue } from '@/lib/queue/memory';
// BullQueue is imported dynamically below

let isInitialized = false;

export async function initializeSystem(): Promise<{
  success: boolean;
  adapters: Array<{ id: string; success: boolean; error?: string }>;
  errors: string[];
}> {
  if (isInitialized) {
    return { success: true, adapters: [], errors: [] };
  }

  const errors: string[] = [];
  const adapterResults: Array<{ id: string; success: boolean; error?: string }> = [];

  try {
    const config = getConfig();

    // 1. Initialize LLM providers
    // LLM providers are initialized from config automatically
    const llmResults = await llmFactory.initializeAll();
    adapterResults.push(...llmResults);

    // 2. Initialize Telegram if enabled
    if (config.features.enableTelegram && config.telegram.botToken) {
      try {
        const telegramAdapter = new TelegramAdapter(config.telegram as any);
        registerTelegramCommands(telegramAdapter);
        await telegramAdapter.initialize();
        adapterRegistry.register(telegramAdapter, true);
        adapterResults.push({ id: 'telegram', success: true });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Telegram initialization failed: ${msg}`);
        adapterResults.push({ id: 'telegram', success: false, error: msg });
      }
    }

    // 3. Initialize Discord if enabled
    if (config.features.enableDiscord && config.discord.webhookUrl) {
      try {
        const discordAdapter = new DiscordAdapter(config.discord as any);
        await discordAdapter.initialize();
        adapterRegistry.register(discordAdapter, true);
        adapterResults.push({ id: 'discord', success: true });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Discord initialization failed: ${msg}`);
        adapterResults.push({ id: 'discord', success: false, error: msg });
      }
    }

    // 4. Initialize Supabase if enabled
    let supabaseAdapter: SupabaseAdapter | undefined;
    if (config.features.enableSupabase && config.supabase.url) {
      try {
        supabaseAdapter = new SupabaseAdapter(config.supabase as any);
        await supabaseAdapter.initialize();
        adapterRegistry.register(supabaseAdapter, true);
        adapterResults.push({ id: 'supabase', success: true });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Supabase initialization failed: ${msg}`);
        adapterResults.push({ id: 'supabase', success: false, error: msg });
      }
    }

    // 5. Initialize job queue (using memory queue by default)
    // BullMQ can be enabled later with Redis
    setJobQueue(memoryQueue);
    console.log('[System] Using memory queue');

    // 6. Notification service is ready (no init needed)

    // 7. Health service is ready
    console.log('[System] Health service ready');

    isInitialized = true;

    console.log('[System] Initialization complete');
    console.log(`[System] Adapters: ${adapterResults.filter((r) => r.success).length}/${adapterResults.length} ready`);

    return {
      success: errors.length === 0,
      adapters: adapterResults,
      errors,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      adapters: adapterResults,
      errors: [...errors, msg],
    };
  }
}

export function isSystemInitialized(): boolean {
  return isInitialized;
}

export async function shutdownSystem(): Promise<void> {
  await adapterRegistry.disposeAll();
  isInitialized = false;
}
