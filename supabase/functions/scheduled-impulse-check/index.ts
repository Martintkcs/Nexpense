// Supabase Edge Function: Scheduled Impulse Check (Cron)
// Minden 15 percben lefut és push értesítést küld a 24h letelt tételekhez
// Deploy: supabase functions deploy scheduled-impulse-check
// Cron: supabase functions schedule scheduled-impulse-check --cron "*/15 * * * *"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (_req: Request) => {
  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Lejárt, értesítetlen impulzus tételek lekérése
    const { data: items, error } = await supabase
      .from('impulse_items')
      .select(`
        id, name, price, currency, user_id,
        profiles!inner(push_tokens(token, platform, is_active))
      `)
      .lte('notify_at', new Date().toISOString())
      .eq('notification_sent', false)
      .eq('decision', 'pending');

    if (error) throw error;
    if (!items?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

    for (const item of items) {
      const profile = (item as any).profiles;
      const tokens = profile?.push_tokens?.filter((t: any) => t.is_active) ?? [];

      if (tokens.length > 0) {
        const messages = tokens.map((t: any) => ({
          to: t.token,
          title: '⚡ Impulzus döntés vár!',
          body: `24 óra telt el. Még mindig kell a(z) ${item.name}?`,
          data: { impulseItemId: item.id, screen: 'impulse' },
          sound: 'default',
        }));

        await fetch(expoPushUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messages),
        });
      }

      // Értesítés elküldöttnek jelölése
      await supabase
        .from('impulse_items')
        .update({ notification_sent: true })
        .eq('id', item.id);

      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
