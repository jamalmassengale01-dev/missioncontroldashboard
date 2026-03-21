import { NextRequest, NextResponse } from 'next/server';
import { TelegramAdapter } from '@/lib/adapters/telegram/adapter';
import TelegramBot from 'node-telegram-bot-api';

// Store the Telegram adapter instance (initialized elsewhere)
let telegramAdapter: TelegramAdapter | null = null;

export function setTelegramAdapter(adapter: TelegramAdapter): void {
  telegramAdapter = adapter;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook secret if configured
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the Telegram adapter
    if (!telegramAdapter) {
      return NextResponse.json(
        { error: 'Telegram adapter not initialized' },
        { status: 503 }
      );
    }

    // Parse the update
    const update: TelegramBot.Update = await request.json();

    // Process the update
    await telegramAdapter.processWebhookUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'Telegram webhook endpoint is active',
  });
}
