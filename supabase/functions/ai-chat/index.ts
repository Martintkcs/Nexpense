// Supabase Edge Function: AI Chat
// Anthropic Claude API proxy SSE streaming-gel
// Deploy: supabase functions deploy ai-chat

import Anthropic from 'npm:@anthropic-ai/sdk@0.27.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversationId, message, type, context } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    // Rendszer prompt az AI típusától függően
    const systemPrompts: Record<string, string> = {
      impulse_check: `Te egy barátságos pénzügyi coach vagy, aki segít az impulzusvásárlások elkerülésében.
Amikor valaki vásárolni akar valamit, segíts nekik végiggondolni:
1. Tényleg szükségük van-e rá?
2. Illeszkedik-e a jelenlegi büdzsőjükbe?
3. Vannak-e olcsóbb alternatívák?
Légy empatikus, de segíts racionális döntést hozni. Mindig magyarul válaszolj.`,
      spending_analysis: `Te egy személyes pénzügyi elemző AI vagy.
Elemzed a felhasználó kiadásait és konstruktív, megvalósítható javaslatokat adsz.
Légy pozitív, de őszinte. Mindig magyarul válaszolj.`,
      general: `Te egy barátságos személyes pénzügyi asszisztens vagy.
Segíts a felhasználónak pénzügyi kérdéseiben. Mindig magyarul válaszolj.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.general;

    // SSE stream létrehozása
    const stream = anthropic.messages.stream({
      model: type === 'spending_analysis' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
