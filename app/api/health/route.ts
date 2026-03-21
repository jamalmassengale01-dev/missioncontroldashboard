import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth, quickHealthCheck } from '@/lib/services/health';
import { getConfig } from '@/lib/services/config';

// GET: Full system health check
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for simple health check mode (for load balancers)
    const { searchParams } = new URL(request.url);
    const simple = searchParams.get('simple') === 'true';

    if (simple) {
      const quick = await quickHealthCheck();
      return NextResponse.json(
        { status: quick.status, healthy: quick.healthy },
        { status: quick.healthy ? 200 : 503 }
      );
    }

    const health = await getSystemHealth();
    const config = getConfig();

    // Mask sensitive config values
    const maskedConfig = {
      features: config.features,
      app: config.app,
      telegram: {
        ...config.telegram,
        botToken: config.telegram.botToken ? '***' : undefined,
      },
      discord: {
        ...config.discord,
        webhookUrl: config.discord.webhookUrl ? '***' : undefined,
      },
      supabase: {
        ...config.supabase,
        anonKey: config.supabase.anonKey ? '***' : undefined,
        serviceRoleKey: config.supabase.serviceRoleKey ? '***' : undefined,
      },
      llm: {
        defaultProvider: config.llm.defaultProvider,
        openai: config.llm.openai ? { configured: true, model: config.llm.openai.model } : undefined,
        anthropic: config.llm.anthropic ? { configured: true, model: config.llm.anthropic.model } : undefined,
        kimi: config.llm.kimi ? { configured: true, model: config.llm.kimi.model } : undefined,
      },
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
        password: config.redis.password ? '***' : undefined,
      },
    };

    return NextResponse.json({
      status: health.status,
      timestamp: health.timestamp,
      summary: health.summary,
      adapters: health.adapters,
      config: maskedConfig,
    });
  } catch (error) {
    console.error('[Health API] Error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
      { status: 503 }
    );
  }
}
