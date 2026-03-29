import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ai-setup" />
      <Stack.Screen name="board" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
