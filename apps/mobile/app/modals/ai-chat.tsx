import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: '👋 Szia! Miben segíthetek ma? Elemezhetek kiadásokat, segíthetek egy impulzusvásárlás átgondolásában, vagy bármilyen pénzügyi kérdésre válaszolok.',
  },
];

export default function AIChatModal() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // TODO: Valódi Supabase Edge Function hívás SSE streaming-gel
    // import { streamAIChat } from '@/services/ai/claude';
    // await streamAIChat({ message: text, type: 'general', ... });

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ez egy nagyon jó kérdés! Az elemzéseim alapján a legjobb tanácsom az, hogy figyelj az ismétlődő kis kiadásokra – ezek összeadódva jelentős összegekké válhatnak. 💡',
      }]);
    }, 1500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Nexpense AI</Text>
          <Text style={styles.headerStatus}>● Online – Claude Haiku</Text>
        </View>
        <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>AI</Text></View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
            <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.content}</Text>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.bubble, styles.bubbleAI]}>
            <Text style={styles.bubbleText}>●  ●  ●</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Írj üzenetet..."
            placeholderTextColor="#9CA3AF"
            multiline
            onSubmitEditing={sendMessage}
          />
          <Pressable style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: 'white', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#4F46E5', lineHeight: 32 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerStatus: { fontSize: 12, color: '#10B981', fontWeight: '500' },
  headerBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  messages: { flex: 1 },
  messagesContent: { padding: 14, gap: 10 },
  bubble: { maxWidth: '85%', padding: 11, borderRadius: 16 },
  bubbleAI: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  bubbleTextUser: { color: 'white' },
  inputBar: { backgroundColor: 'white', padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#111827', maxHeight: 100 },
  sendBtn: { width: 36, height: 36, backgroundColor: '#4F46E5', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: 'white', fontSize: 18, fontWeight: '700' },
});
