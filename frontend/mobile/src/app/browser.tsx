import { BlurView } from "expo-blur";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile } from "../store";

// ─── store e-commerce ─────────────────────────────────────────────────────────
const STORES = [
  {
    id: "amazon",
    name: "Amazon",
    url: "https://www.amazon.it",
    logo: "https://logo.clearbit.com/amazon.it",
    accent: "#FF9900",
    category: "Generale",
  },
  {
    id: "zalando",
    name: "Zalando",
    url: "https://www.zalando.it",
    logo: "https://logo.clearbit.com/zalando.it",
    accent: "#FF6900",
    category: "Moda",
  },
  {
    id: "ebay",
    name: "eBay",
    url: "https://www.ebay.it",
    logo: "https://logo.clearbit.com/ebay.com",
    accent: "#E53238",
    category: "Generale",
  },
  {
    id: "asos",
    name: "ASOS",
    url: "https://www.asos.com/it",
    logo: "https://logo.clearbit.com/asos.com",
    accent: "#2D2D2D",
    category: "Moda",
  },
  {
    id: "shein",
    name: "Shein",
    url: "https://it.shein.com",
    logo: "https://logo.clearbit.com/shein.com",
    accent: "#FF3E6C",
    category: "Moda",
  },
  {
    id: "zara",
    name: "Zara",
    url: "https://www.zara.com/it",
    logo: "https://logo.clearbit.com/zara.com",
    accent: "#1a1a1a",
    category: "Moda",
  },
  {
    id: "hm",
    name: "H&M",
    url: "https://www2.hm.com/it_it",
    logo: "https://logo.clearbit.com/hm.com",
    accent: "#CC0000",
    category: "Moda",
  },
  {
    id: "yoox",
    name: "YOOX",
    url: "https://www.yoox.com/it",
    logo: "https://logo.clearbit.com/yoox.com",
    accent: "#000000",
    category: "Lusso",
  },
  {
    id: "farfetch",
    name: "Farfetch",
    url: "https://www.farfetch.com/it",
    logo: "https://logo.clearbit.com/farfetch.com",
    accent: "#232323",
    category: "Lusso",
  },
  {
    id: "mediaworld",
    name: "MediaWorld",
    url: "https://www.mediaworld.it",
    logo: "https://logo.clearbit.com/mediaworld.it",
    accent: "#CC0000",
    category: "Tecnologia",
  },
  {
    id: "unieuro",
    name: "Unieuro",
    url: "https://www.unieuro.it",
    logo: "https://logo.clearbit.com/unieuro.it",
    accent: "#E30613",
    category: "Tecnologia",
  },
  {
    id: "decathlon",
    name: "Decathlon",
    url: "https://www.decathlon.it",
    logo: "https://logo.clearbit.com/decathlon.com",
    accent: "#0082C3",
    category: "Sport",
  },
  {
    id: "privalia",
    name: "Privalia",
    url: "https://www.privalia.com/it",
    logo: "https://logo.clearbit.com/privalia.com",
    accent: "#7B2FBE",
    category: "Outlet",
  },
  {
    id: "bershka",
    name: "Bershka",
    url: "https://www.bershka.com/it",
    logo: "https://logo.clearbit.com/bershka.com",
    accent: "#1a1a2e",
    category: "Moda",
  },
];

// ─── card singolo store ────────────────────────────────────────────────────────
function StoreCard({
  item,
  onPress,
  loading,
}: {
  item: typeof STORES[number];
  onPress: () => void;
  loading: boolean;
}) {
  const [logoError, setLogoError] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      disabled={loading}
    >
      <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />

      {/* Barra accent in alto */}
      <View style={[styles.cardAccent, { backgroundColor: item.accent }]} />

      {/* Logo */}
      <View style={styles.logoWrap}>
        {!logoError ? (
          <Image
            source={{ uri: item.logo }}
            style={styles.logo}
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: item.accent }]}>
            <Text style={styles.logoFallbackText}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Nome e categoria */}
      <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
      <View style={[styles.categoryBadge, { backgroundColor: `${item.accent}18` }]}>
        <Text style={[styles.categoryText, { color: item.accent === "#000000" || item.accent === "#1a1a1a" || item.accent === "#232323" || item.accent === "#1a1a2e" || item.accent === "#2D2D2D" ? "#555" : item.accent }]}>
          {item.category}
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={item.accent} />
        </View>
      )}
    </Pressable>
  );
}

// ─── pagina principale ────────────────────────────────────────────────────────
export default function Browser() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const profile = getProfile();

  // Categorie da escludere dal profilo utente
  const noCategories = (profile?.no ?? []).map(c => c.toLowerCase());

  // Filtra gli store (se l'utente ha categorie "no" nel profilo, le evidenzia)
  const isExcluded = (store: typeof STORES[number]) =>
    noCategories.some(nc => store.category.toLowerCase().includes(nc) || nc.includes(store.category.toLowerCase()));

  const openStore = async (store: typeof STORES[number]) => {
    setLoadingId(store.id);
    try {
      await WebBrowser.openBrowserAsync(store.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: "#ffffff",
        controlsColor: "#6366f1",
        showTitle: true,
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
          </View>
        </View>

        {/* Titolo sezione */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Scopri gli store</Text>
          <Text style={styles.pageSubtitle}>
            {noCategories.length > 0
              ? `Personalizzato in base al tuo profilo · ${noCategories.join(", ")} esclusi`
              : "I principali e-commerce in un unico posto"}
          </Text>
        </View>

        {/* Griglia store */}
        <FlatList
          data={STORES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const excluded = isExcluded(item);
            return (
              <View style={[styles.cardContainer, excluded && styles.cardExcluded]}>
                <StoreCard
                  item={item}
                  onPress={() => openStore(item)}
                  loading={loadingId === item.id}
                />
                {excluded && (
                  <View style={styles.excludedBanner}>
                    <Text style={styles.excludedText}>Non preferito</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── stili ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f8fb" },
  safeArea: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 360, height: 360, backgroundColor: "#bfdbfe", opacity: 0.55, top: -120, left: -100 },
  blob2: { width: 300, height: 300, backgroundColor: "#fbcfe8", opacity: 0.55, top: 280, right: -110 },
  blob3: { width: 240, height: 240, backgroundColor: "#d1d5db", opacity: 0.5, bottom: 100, left: 10 },

  // header
  header: {
    height: 64,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  headerInner: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  headerBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo3: { width: 44, height: 44 },
  headerName: { height: 26, width: 110 },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 22, color: "rgba(0,0,0,0.5)" },

  // titolo
  titleSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#1a1a2e", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 12, color: "rgba(0,0,0,0.38)", marginTop: 4, lineHeight: 17 },

  // griglia
  grid: { paddingHorizontal: 12, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 12 },

  // card container (per badge "escluso")
  cardContainer: { flex: 1, position: "relative" },
  cardExcluded: { opacity: 0.55 },
  excludedBanner: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(239,68,68,0.9)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  excludedText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.2 },

  // card
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: { opacity: 0.80, transform: [{ scale: 0.97 }] },
  cardAccent: { height: 4, width: "100%" },

  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    paddingBottom: 10,
    height: 85,
  },
  logo: { width: 72, height: 52 },
  logoFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: { color: "#fff", fontSize: 24, fontWeight: "800" },

  storeName: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a2e",
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryText: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
