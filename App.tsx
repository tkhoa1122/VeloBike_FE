/**
 * VeloBike React Native App - Google Sign-In Test
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import { LoginScreen } from './src/presentation/screens/auth/LoginScreen';
import { GoogleAuthService } from './src/services/GoogleAuthService';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  
  useEffect(() => {
    // Configure Google Sign-In khi app khởi động
    GoogleAuthService.configure();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <LoginScreen />
    </SafeAreaView>
  );
}

export default App;
