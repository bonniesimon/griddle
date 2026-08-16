import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePalette } from '@/theme/usePalette';

const RootLayout = () => {
  const palette = usePalette();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.background },
            headerTitleStyle: { color: palette.primaryText },
            headerTintColor: palette.accent,
            contentStyle: { backgroundColor: palette.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="posts/new" options={{ presentation: 'modal', title: 'New post' }} />
          <Stack.Screen name="posts/[id]/index" options={{ title: 'Post' }} />
          <Stack.Screen name="posts/[id]/edit" options={{ title: 'Edit post' }} />
          <Stack.Screen name="archived-posts/index" options={{ title: 'Archive' }} />
          <Stack.Screen
            name="accounts/index"
            options={{ presentation: 'modal', title: 'Accounts' }}
          />
          <Stack.Screen
            name="accounts/new"
            options={{ presentation: 'modal', title: 'New account' }}
          />
          <Stack.Screen name="accounts/[id]/edit" options={{ title: 'Edit profile' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
