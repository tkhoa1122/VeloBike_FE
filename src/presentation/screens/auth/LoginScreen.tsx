/**
 * Sample Login Component với Google Sign-In
 * Demo cách sử dụng GoogleAuthService và AuthStore
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../../presentation/viewmodels/AuthStore';
import { GoogleAuthService } from '../../../services/GoogleAuthService';

export const LoginScreen: React.FC = () => {
  const { googleLogin, login, isLoading, error } = useAuthStore();

  // Initialize Google Sign-In khi component mount
  React.useEffect(() => {
    GoogleAuthService.configure();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const success = await googleLogin();
      if (success) {
        Alert.alert('Thành công', 'Đăng nhập Google thành công!');
      } else {
        Alert.alert('Lỗi', 'Đăng nhập Google thất bại');
      }
    } catch (err) {
      Alert.alert('Error', 'Có lỗi xảy ra khi đăng nhập');
      console.error('Google login error:', err);
    }
  };

  const handleEmailLogin = async () => {
    // Demo email/password login
    const success = await login({
      email: 'demo@velobike.com',
      password: 'password123'
    });
    
    if (success) {
      Alert.alert('Thành công', 'Đăng nhập thành công!');
    } else {
      Alert.alert('Lỗi', error || 'Đăng nhập thất bại');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VeloBike Login</Text>
      
      {/* Google Sign-In Button */}
      <TouchableOpacity 
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleLogin}
        disabled={isLoading()}
      >
        <Text style={styles.googleButtonText}>
          {isLoading() ? 'Đang đăng nhập...' : '🔍 Đăng nhập với Google'}
        </Text>
      </TouchableOpacity>

      {/* Email Login Button (Demo) */}
      <TouchableOpacity 
        style={[styles.button, styles.emailButton]}
        onPress={handleEmailLogin}
        disabled={isLoading()}
      >
        <Text style={styles.emailButtonText}>
          📧 Đăng nhập với Email (Demo)
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#db4437',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emailButton: {
    backgroundColor: '#4285f4',
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
});