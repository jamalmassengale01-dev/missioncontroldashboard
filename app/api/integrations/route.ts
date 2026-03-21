import { NextRequest, NextResponse } from 'next/server';
import { adapterRegistry } from '@/lib/adapters/registry';
import { getSystemHealth } from '@/lib/services/health';
import { getConfig } from '@/lib/services/config';

// GET: List all integrations and their health status
export async function GET(): Promise<NextResponse> {
  try {
    const config = getConfig();
    const health = await getSystemHealth();

    // Build integration list with config status
    const integrations = [
      {
        id: 'telegram',
        name: 'Telegram Bot',
        enabled: config.features.enableTelegram,
        configured: Boolean(config.telegram.botToken),
        health: health.adapters.find(a => a.id === 'telegram')?.health || null,
      },
      {
        id: 'discord',
        name: 'Discord Webhook',
        enabled: config.features.enableDiscord,
        configured: Boolean(config.discord.webhookUrl),
        health: health.adapters.find(a => a.id === 'discord')?.health || null,
      },
      {
        id: 'supabase',
        name: 'Supabase Database',
        enabled: config.features.enableSupabase,
        configured: Boolean(config.supabase.url && config.supabase.anonKey),
        health: health.adapters.find(a => a.id === 'supabase')?.health || null,
      },
      {
        id: 'llm',
        name: 'LLM Providers',
        enabled: config.features.enableLLM,
        configured: Boolean(
          config.llm.openai?.apiKey ||
          config.llm.anthropic?.apiKey ||
          config.llm.kimi?.apiKey
        ),
        health: null, // LLM health is per-provider
      },
      {
        id: 'redis',
        name: 'Redis Queue',
        enabled: config.features.enableRedis,
        configured: Boolean(config.redis.host),
        health: null, // Redis health checked separately
      },
    ];

    return NextResponse.json({
      integrations,
      summary: health.summary,
    });
  } catch (error) {
    console.error('[Integrations API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST: Enable/disable an integration
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { integrationId, enabled } = body;

    if (!integrationId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: integrationId, enabled' },
        { status: 400 }
      );
    }

    // Validate integration ID
    const validIds = ['telegram', 'discord', 'supabase', 'llm', 'redis'];
    if (!validIds.includes(integrationId)) {
      return NextResponse.json(
        { error: `Invalid integration ID: ${integrationId}` },
        { status: 400 }
      );
    }

    // Update adapter enabled state in registry
    const success = adapterRegistry.setEnabled(integrationId, enabled);

    if (!success) {
      // Adapter might not be registered yet, that's ok
      console.log(`[Integrations API] Adapter ${integrationId} not in registry, feature flag will be used`);
    }

    return NextResponse.json({
      success: true,
      integrationId,
      enabled,
      message: `Integration ${integrationId} ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error('[Integrations API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}
