import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Valid credentials
  const VALID_PHONE = '9803124221';
  const VALID_PASSWORD = '98@moktan';

  // Simulate API call delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle login
  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;

    // Check if phone/email is empty
    if (!email.trim()) {
      setEmailError('Your phone or email is incorrect');
      hasError = true;
    }

    // Check if password is empty
    if (!password.trim()) {
      setPasswordError('Your password is incorrect');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // Simulate network delay
      await delay(800);

      // Validate phone number
      if (email !== VALID_PHONE) {
        setEmailError('Your phone or email is incorrect');
        setIsLoading(false);
        return;
      }

      // Validate password
      if (password !== VALID_PASSWORD) {
        setPasswordError('Your password is incorrect');
        setIsLoading(false);
        return;
      }

      // Login successful - Navigate directly
      router.replace('/(user)/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact support to reset your password.',
      [{ text: 'OK' }]
    );
  };

  // Handle sign up
  const handleSignUp = () => {
    // Navigate to sign up screen
    router.push('/(auth)/signup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            <Text style={styles.loginText}>Login</Text>
            <Text style={styles.accountText}> your account</Text>
          </Text>
        </View>

        {/* Phone/Email Input */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, emailError && styles.inputError]}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone/Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
          {emailError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View
            style={[styles.inputWrapper, passwordError && styles.inputError]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot password</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>LOG IN</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Dont have account? </Text>
          <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // ✅ CENTER VERTICALLY
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
  },
  loginText: {
    color: '#22C55E',
  },
  accountText: {
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginLeft: 15,
  },
  errorDot: {
    color: '#EF4444',
    fontSize: 20,
    lineHeight: 20,
    marginRight: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  rememberMeText: {
    color: '#666',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#999',
    fontSize: 14,
  },
  signUpLink: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Login;