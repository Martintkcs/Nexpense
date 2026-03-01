import { supabase } from './client';

/**
 * Push token mentése / aktiválása a DB-be.
 * Ha már létezik ugyanez a token, csak is_active-ra állítjuk.
 */
export async function savePushToken(
  userId: string,
  token: string,
  platform: string,
) {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform, is_active: true },
      { onConflict: 'token' },
    );

  if (error) throw error;
}

/**
 * Push token deaktiválása (kijelentkezéskor / értesítés kikapcsolásakor).
 * Nem töröljük, csak is_active = false, hogy az Edge Function ne küldjön.
 */
export async function deactivatePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('token', token);

  if (error) throw error;
}

/**
 * Minden push token deaktiválása egy adott user alatt
 * (pl. kijelentkezéskor).
 */
export async function deactivateAllPushTokens(userId: string) {
  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) throw error;
}
