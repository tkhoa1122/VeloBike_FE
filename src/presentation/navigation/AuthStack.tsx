/**
 * Auth Stack Navigator
 * Login → Register → VerifyEmail → ForgotPassword
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  onLoginSuccess: () => void;
}

export const AuthStack: React.FC<AuthStackProps> = ({ onLoginSuccess }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onRegister={() => navigation.navigate('Register')}
            onForgotPassword={() => navigation.navigate('ForgotPassword')}
            onLoginSuccess={onLoginSuccess}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onLogin={() => navigation.navigate('Login')}
            onBack={() => navigation.goBack()}
            onRegisterSuccess={(email: string) =>
              navigation.navigate('VerifyEmail', { email })
            }
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="VerifyEmail">
        {({ navigation, route }) => (
          <VerifyEmailScreen
            email={route.params.email}
            onVerifySuccess={onLoginSuccess}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ForgotPassword">
        {({ navigation }) => (
          <ForgotPasswordScreen
            onBack={() => navigation.goBack()}
            onResetSent={() => navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthStack;
