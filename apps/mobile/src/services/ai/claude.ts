import { supabase } from '@/services/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AIType = 'general' | 'impulse_check' | 'spending_analysis';

export interface StreamParams {
  message:   string;
  type:      AIType;
  context?:  string;           // extra context appended to user message on the server
  onToken:   (text: string) => void;
  onDone:    () => void;
  onError:   (msg: string) => void;
}

// ─── Streaming call ─────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export async function streamAIChat(params: StreamParams): Promise<void> {
  const { message, type, context, onToken, onDone, onError } = params;

  try {
    // Prefer the user's JWT so RLS can be applied server-side if needed
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token ?? SUPABASE_ANON_KEY;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message, type, context }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => response.statusText);
      onError(`Szerver hiba (${response.status}): ${body}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Üres válasz érkezett a szervertől.');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // Read the SSE stream chunk by chunk
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are newline-delimited; keep the trailing incomplete line in buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);   // strip "data: "
        if (data === '[DONE]') {
          onDone();
          reader.cancel();
          return;
        }

        try {
          const parsed = JSON.parse(data) as { text?: string };
          if (parsed.text) onToken(parsed.text);
        } catch {
          // Ignore non-JSON lines (e.g. keep-alive comments)
        }
      }
    }

    onDone();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ismeretlen hálózati hiba';
    onError(msg);
  }
}

// ─── Spending context builder ───────────────────────────────────────────────────

/**
 * Formats the current month's expense data into a concise text block
 * that is appended to the AI message as context (server-side).
 */
export function buildSpendingContext(
  expenseItems: Array<{ amount: number; type?: string | null; category_id?: string | null }>,
  categoryList: Array<{ id: string; name_hu?: string | null; name: string }>,
): string {
  const expOnly  = expenseItems.filter(e => e.type !== 'income');
  const total    = expOnly.reduce((s, e) => s + e.amount, 0);

  // Aggregate by category
  const catTotals = new Map<string, number>();
  for (const e of expOnly) {
    const k = e.category_id ?? '__none__';
    catTotals.set(k, (catTotals.get(k) ?? 0) + e.amount);
  }

  const catMap = new Map(categoryList.map(c => [c.id, c]));
  const sorted = Array.from(catTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  const now      = new Date();
  const monthStr = now.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });

  const lines = [
    `${monthStr} kiadások összefoglalója (összesen: ${total.toLocaleString('hu-HU')} Ft, ${expOnly.length} tétel):`,
    ...sorted.map(([id, amount]) => {
      const cat = catMap.get(id);
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      return `- ${cat?.name_hu ?? cat?.name ?? 'Egyéb'}: ${amount.toLocaleString('hu-HU')} Ft (${pct}%)`;
    }),
  ];

  return lines.join('\n');
}
