import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useCallback } from 'react';
import { streamAIChat, AIType } from '@/services/ai/claude';
import { useColors } from '@/lib/useColors';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:         string;
  role:       'user' | 'assistant';
  content:    string;
  streaming?: boolean;  // true while tokens are still arriving
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id:      'welcome',
    role:    'assistant',
    content: '👋 Szia! Miben segíthetek ma?\n\nElemezhetek kiadásokat, segíthetek egy impulzusvásárlás átgondolásában, vagy bármilyen pénzügyi kérdésre válaszolok.',
  },
];

const TITLE_MAP: Record<string, string> = {
  impulse_check:    'Impulzus elemzés',
  spending_analysis: 'Kiadás elemzés',
  general:          'Nexpense AI',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AIChatModal() {
  const colors = useColors();
  const { type: typeParam, contextStr } = useLocalSearchParams<{
    type?:       string;
    contextStr?: string;
  }>();

  const chatType = (typeParam as AIType | undefined) ?? 'general';

  const [messages,    setMessages]    = useState<Message[]>(INITIAL_MESSAGES);
  const [input,       setInput]       = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // ── Auto-scroll helper ─────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Scroll whenever message list grows or a streaming bubble updates
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Auto-trigger spending analysis when launched from dashboard ──
  useEffect(() => {
    if (chatType === 'spending_analysis' && contextStr) {
      sendMessage('Elemezd a havi kiadásaimat és adj személyre szabott tanácsokat!', contextStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // intentionally only on mount

  // ── Core send / stream logic ───────────────────────────────

  async function sendMessage(text: string, ctx?: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // Add user bubble
    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Add empty streaming assistant bubble
    const assistantId = `a${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);

    await streamAIChat({
      message: trimmed,
      type:    chatType,
      context: ctx ?? (chatType !== 'general' ? contextStr : undefined),
      onToken: (token) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        );
      },
      onDone: () => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        );
        setIsStreaming(false);
      },
      onError: (err) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `⚠️ Hiba: ${err}`, streaming: false }
              : m,
          ),
        );
        setIsStreaming(false);
      },
    });
  }

  function handleSend() {
    sendMessage(input);
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backIcon, { color: colors.primary }]}>‹</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{TITLE_MAP[chatType] ?? 'Nexpense AI'}</Text>
          <Text style={[styles.headerStatus, { color: colors.success }, isStreaming && styles.headerStatusTyping, isStreaming && { color: colors.warning }]}>
            {isStreaming ? '✦ Gondolkodik…' : '● Online – Claude'}
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: colors.aiCardBg }]}>
          <Text style={[styles.headerBadgeText, { color: colors.primary }]}>AI</Text>
        </View>
      </View>

      {/* ── Message list ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToBottom}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
              msg.role === 'user' ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* Empty streaming bubble = loading dots */}
            {msg.streaming && msg.content === '' ? (
              <View style={styles.typingWrap}>
                <ActivityIndicator size="small" color={colors.textMuted} />
              </View>
            ) : (
              <Text style={[
                styles.bubbleText,
                msg.role === 'user' && styles.bubbleTextUser,
                msg.role !== 'user' && { color: colors.text },
              ]}>
                {msg.content}
                {/* Blinking cursor while streaming */}
                {msg.streaming && (
                  <Text style={[styles.cursor, { color: colors.primary }]}>▌</Text>
                )}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* ── Input bar ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: colors.header, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
            value={input}
            onChangeText={setInput}
            placeholder={isStreaming ? 'Várj a válaszra…' : 'Írj üzenetet...'}
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!isStreaming}
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.primary }, (isStreaming || !input.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={isStreaming || !input.trim()}
          >
            {isStreaming
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
  header: {
    backgroundColor: 'white',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon:   { fontSize: 28, color: '#4F46E5', lineHeight: 32 },
  headerInfo: { flex: 1 },
  headerTitle:       { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerStatus:      { fontSize: 12, color: '#10B981', fontWeight: '500' },
  headerStatusTyping:{ color: '#F59E0B' },
  headerBadge:     { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },

  // Messages
  messages:        { flex: 1 },
  messagesContent: { padding: 14, gap: 10, paddingBottom: 8 },

  bubble: {
    maxWidth: '85%',
    padding: 11,
    borderRadius: 16,
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleText:     { fontSize: 14, color: '#111827', lineHeight: 20 },
  bubbleTextUser: { color: 'white' },
  cursor:         { color: '#4F46E5', fontWeight: '700' },

  typingWrap: { paddingVertical: 4, paddingHorizontal: 8 },

  // Input bar
  inputBar: {
    backgroundColor: 'white',
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36,
    backgroundColor: '#4F46E5',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#A5B4FC' },
  sendIcon:        { color: 'white', fontSize: 18, fontWeight: '700' },
});
