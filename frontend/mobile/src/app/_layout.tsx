import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="loading" options={{ headerShown: false }} />
      <Stack.Screen name="graph" options={{ headerShown: false }} />
      <Stack.Screen name="browser" options={{ headerShown: false }} />
    </Stack>
  );
}
