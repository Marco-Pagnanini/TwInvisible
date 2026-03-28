import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useState } from "react";
import {
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

export default function index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <View style={styles.root}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            {/* Logo / Brand */}
            <View style={styles.brand}>
              <Image
                source={require("../../assets/images/logo/mainlogo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Bentornato</Text>
                <Text style={styles.cardSubtitle}>Accedi al tuo account</Text>

                {/* Email */}
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nome@esempio.com"
                    placeholderTextColor="rgba(0,0,0,0.28)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                {/* Password */}
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(0,0,0,0.28)"
                    secureTextEntry
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </View>

                <Pressable style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Password dimenticata?</Text>
                </Pressable>

                {/* Accedi */}
                <Pressable
                  style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}
                  onPress={() => router.replace("/chat")}
                >
                  <Text style={styles.loginBtnText}>Accedi</Text>
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>oppure</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Register */}
                <Pressable style={styles.registerBtn}>
                  <Text style={styles.registerBtnText}>Crea un account</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f8fb" },
  flex: { flex: 1 },
  safeArea: { flex: 1 },

  // Blobs
  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 360, height: 360, backgroundColor: "#bfdbfe", opacity: 0.55, top: -120, left: -100 },
  blob2: { width: 300, height: 300, backgroundColor: "#fbcfe8", opacity: 0.55, top: 280, right: -110 },
  blob3: { width: 240, height: 240, backgroundColor: "#d1d5db", opacity: 0.5, bottom: 140, left: 10 },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 0,
  },

  // Brand
  brand: {
    alignItems: "center",
    gap: 10,
  },
  logoImg: {
    width: 260,
    height: 260,
    marginBottom: -40,
  },
  // Card
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  cardContent: {
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(0,0,0,0.42)",
    marginBottom: 6,
  },

  // Inputs
  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.09)",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  inputWrapperFocused: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    color: "#1a1a2e",
    paddingVertical: 2,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "500",
  },

  // Login button
  loginBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  dividerText: {
    fontSize: 13,
    color: "rgba(0,0,0,0.35)",
  },

  // Register button
  registerBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.35)",
    backgroundColor: "rgba(99,102,241,0.06)",
  },
  registerBtnText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
