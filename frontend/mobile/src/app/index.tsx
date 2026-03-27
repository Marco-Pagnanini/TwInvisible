import { BlurView } from "expo-blur";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';




export default function Index() {


  return (
    <View style={styles.root}>

      {/* blob decorativi sfocati — stile Revolut */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      {/* blur overlay sull'intero sfondo */}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.appTitle}>Repay</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080808',
  },

  // blob colorati dietro il blur — creano i riflessi di luce
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  blob1: {
    width: 320,
    height: 320,
    backgroundColor: '#6366f1', // viola indigo
    top: -80,
    left: -60,
  },
  blob2: {
    width: 260,
    height: 260,
    backgroundColor: '#0ea5e9', // azzurro
    top: 180,
    right: -80,
  },
  blob3: {
    width: 200,
    height: 200,
    backgroundColor: '#8b5cf6', // viola
    bottom: 120,
    left: 40,
  },

  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  cardAmount: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 40,
  },
  appTitle: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
});