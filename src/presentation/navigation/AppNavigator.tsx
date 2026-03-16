/**
 * Root App Navigator
 * Manages: Welcome → Auth → Main flow
 *
 * Flow:
 * 1. If first launch → WelcomeScreen
 * 2. If not authenticated → AuthStack (Login/Register/VerifyEmail)
 * 3. If authenticated → MainTabs (Home/Search/Wishlist/Messages/Profile)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { useAuthStore } from '../viewmodels/AuthStore';
import { COLORS } from '../../config/theme';

const ONBOARDING_KEY = '@velobike_onboarding_completed';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, getCurrentUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check onboarding state + try to restore session
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(onboardingDone === 'true');

        // Try to restore user session from stored token
        await getCurrentUser(true);
      } catch (e) {
        // Ignore errors — just proceed
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // AuthStore is already updated — the navigator will react to isAuthenticated change
  }, []);

  const handleLogout = useCallback(() => {
    // AuthStore already cleared — navigator reacts automatically
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!hasSeenOnboarding ? (
        <Stack.Screen name="Welcome">
          {() => (
            <WelcomeScreen
              onGetStarted={handleOnboardingComplete}
              onLogin={handleOnboardingComplete}
            />
          )}
        </Stack.Screen>
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth">
          {() => <AuthStack onLoginSuccess={handleLoginSuccess} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main">
          {() => <MainTabs onLogout={handleLogout} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default AppNavigator;
