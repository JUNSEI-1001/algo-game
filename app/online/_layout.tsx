import { Stack } from 'expo-router';

export default function OnlineLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="random" />
      <Stack.Screen name="room" />
      <Stack.Screen name="game-board" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
