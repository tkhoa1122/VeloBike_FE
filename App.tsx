/**
 * VeloBike React Native App
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleAuthService } from './src/services/GoogleAuthService';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { COLORS } from './src/config/theme';

// Suppress known harmless warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

function App(): React.JSX.Element {
  useEffect(() => {
    GoogleAuthService.configure();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
