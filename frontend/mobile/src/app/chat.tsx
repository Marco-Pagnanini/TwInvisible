import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { setProfile } from "./store";

// ─── endpoint API ─────────────────────────────────────────────────────────────
const API_URL = "http://10.10.50.130:5063/api/userprofile";

// ─── messaggi del bot ─────────────────────────────────────────────────────────
const BOT_MESSAGES = [
  // [0] nessuna risposta richiesta
  "Ciao! Attraverso poche brevi domande mi impegnerò a creare il tuo Digital Twin personalizzato, aiutandoti a visualizzare in maniera tangibile i dati relativi alle tue abitudini di shopping online senza salvare queste informazioni o condividerle con terzi.",
  // [1–6] richiedono risposta
  "Quando ti capita di acquistare prodotti online, sei solito cercare un prodotto specifico o preferisci sfogliare il catalogo generale? Finisci sempre per comprare i prodotti nel carrello?",
  "Consideri di frequente offerte e promozioni che prevedono l'acquisto di più prodotti contemporaneamente?",
  "In media, quanto tempo impieghi ad effettuare un ordine online? Quante volte al mese ti capita di visitare siti di ecommerce?",
  "Ti lasci influenzare da caroselli e dai prodotti evidenziati come di tendenza?",
  "Prima di finalizzare un ordine, confronti mai le offerte relative allo stesso prodotto su siti differenti?",
  "Ci sono delle categorie di prodotti che preferiresti non visualizzare durante la tua esperienza di shopping online?",
];

// ─── tipi ─────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// ─── bolla messaggio ──────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      {!isUser && (
        <Image
          source={require("../../assets/images/logo/logo3.png")}
          style={styles.avatar}
          resizeMode="contain"
        />
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.text}
        </Text>
        <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeAssistant]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// ─── indicatore "sta scrivendo" ───────────────────────────────────────────────
function TypingIndicator() {
  const dot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.messageRow}>
      <Image
        source={require("../../assets/images/logo/logo3.png")}
        style={styles.avatar}
        resizeMode="contain"
      />
      <View style={styles.bubbleAssistant}>
        <Animated.Text style={[styles.typingDots, { opacity: dot }]}>● ● ●</Animated.Text>
      </View>
    </View>
  );
}

// ─── chat ─────────────────────────────────────────────────────────────────────
export default function Chat() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [botIndex, setBotIndex]   = useState(0);
  const [isTyping, setIsTyping]   = useState(false);
  const [canReply, setCanReply]   = useState(false);
  const listRef                   = useRef<FlatList>(null);

  // raccoglie le risposte dell'utente in ordine (risposta a msg[1], msg[2], …, msg[6])
  const answersRef = useRef<string[]>([]);

  // Mostra un messaggio del bot
  const showBotMessage = useCallback((index: number) => {
    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: `bot-${index}-${Date.now()}`,
      role: "assistant",
      text: BOT_MESSAGES[index],
      timestamp: new Date(),
    }]);
    setBotIndex(index);
    setCanReply(index >= 1);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // All'avvio: mostra msg[0], poi dopo pausa mostra msg[1]
  useEffect(() => {
    const t1 = setTimeout(() => showBotMessage(0), 600);
    const t2 = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => showBotMessage(1), 1400);
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Chiamata all'API con le prime 5 risposte
  const callAPI = useCallback(async (answers: string[], noAnswer: string) => {
    // parse categorie "no" dalla risposta libera
    const noList = noAnswer
      .split(/[,;/]+/)
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const body: Record<string, string> = {};
      answers.slice(0, 5).forEach((ans, i) => {
        body[`answer${i + 1}`] = ans;
      });

      const res  = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      setProfile({
        ci:     String(json.ci     ?? 60),
        urg:    String(json.urg    ?? 60),
        hobby:  String(json.hobby  ?? 60),
        hype:   String(json.hype   ?? 60),
        disp_e: String(json.dispE  ?? 60), // API usa "dispE", store usa "disp_e"
        no:     noList,
      });
    } catch (e) {
      // fallback: valori di default se l'API non risponde
      console.warn("API non raggiungibile, uso valori di default:", e);
      setProfile({
        ci: "60", urg: "60", hobby: "60", hype: "60", disp_e: "60",
        no: noList,
      });
    }

    router.push("/loading");
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isTyping || !canReply) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setCanReply(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    // salva risposta (botIndex è l'indice del messaggio bot a cui si risponde)
    const answerIndex = botIndex - 1; // risposta 0-based
    answersRef.current[answerIndex] = text.trim();

    if (botIndex >= 6) {
      // Ultima risposta (domanda 6 → categorie "no") → chiama API e naviga
      const allAnswers = [...answersRef.current];
      const noAnswer   = allAnswers[5] ?? "";
      setTimeout(() => callAPI(allAnswers, noAnswer), 400);
      return;
    }

    // Mostra typing poi prossimo messaggio bot
    setTimeout(() => setIsTyping(true), 400);
    setTimeout(() => showBotMessage(botIndex + 1), 2000);
  }, [botIndex, isTyping, canReply, showBotMessage, callAPI]);

  const inputDisabled = !canReply || isTyping;

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.headerInner}>
              <View style={styles.headerBrand}>
                <Image
                  source={require("../../assets/images/logo/logo3.png")}
                  style={styles.headerLogo3}
                  resizeMode="contain"
                />
                <Image
                  source={require("../../assets/images/logo/name.png")}
                  style={styles.headerName}
                  resizeMode="contain"
                />
              </View>
              <Pressable style={styles.headerAction}>
                <Text style={styles.headerActionText}>···</Text>
              </Pressable>
            </View>
          </View>

          {/* Messaggi */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {/* Input bar */}
          <View style={styles.inputWrapper}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.inputBar}>
              <TextInput
                style={[styles.input, inputDisabled && styles.inputDisabled]}
                value={input}
                onChangeText={setInput}
                placeholder={inputDisabled ? "In attesa..." : "Scrivi la tua risposta..."}
                placeholderTextColor="rgba(0,0,0,0.3)"
                multiline
                maxLength={500}
                editable={!inputDisabled}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(input)}
              />
              <Pressable
                style={[styles.sendBtn, (inputDisabled || !input.trim()) && styles.sendBtnDisabled]}
                onPress={() => sendMessage(input)}
                disabled={inputDisabled || !input.trim()}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── stili ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f8fb" },
  flex: { flex: 1 },
  safeArea: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 360, height: 360, backgroundColor: "#bfdbfe", opacity: 0.55, top: -120, left: -100 },
  blob2: { width: 300, height: 300, backgroundColor: "#fbcfe8", opacity: 0.55, top: 280, right: -110 },
  blob3: { width: 240, height: 240, backgroundColor: "#d1d5db", opacity: 0.5, bottom: 140, left: 10 },

  header: {
    height: 64,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  headerInner: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
  headerBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo3: { width: 48, height: 48 },
  headerName:  { height: 28, width: 120 },
  headerAction: { padding: 8 },
  headerActionText: { color: "rgba(0,0,0,0.35)", fontSize: 20, letterSpacing: 1 },

  messageList: { paddingVertical: 20, paddingHorizontal: 16, gap: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8, gap: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAssistant: { justifyContent: "flex-start" },

  avatar: { width: 30, height: 30, flexShrink: 0 },

  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleUser: { backgroundColor: "#6366f1", borderBottomRightRadius: 4 },
  bubbleAssistant: {
    maxWidth: "78%",
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomLeftRadius: 4,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.07)",
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAssistant: { color: "#1a1a2e" },
  timeText: { fontSize: 11, marginTop: 4 },
  timeUser: { color: "rgba(255,255,255,0.6)", textAlign: "right" },
  timeAssistant: { color: "rgba(0,0,0,0.3)" },

  typingDots: { color: "rgba(0,0,0,0.4)", fontSize: 13, letterSpacing: 4, paddingVertical: 2 },

  inputWrapper: { overflow: "hidden", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.07)", paddingHorizontal: 12, paddingVertical: 10 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)", paddingHorizontal: 16, paddingVertical: 11, color: "#1a1a2e", fontSize: 15 },
  inputDisabled: { backgroundColor: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.06)" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "rgba(99,102,241,0.25)" },
  sendIcon: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: -1 },
});
