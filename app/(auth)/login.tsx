


import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { styles } from './login.styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      // Supabase sign in with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert('Email Not Verified', 'Please check your email and verify your account before logging in.');
        } else if (error.message.includes('rate limit')) {
          Alert.alert('Too Many Attempts', 'Please wait a moment and try again.');
        } else {
          Alert.alert('Login Failed', error.message);
        }
        return;
      }

      if (data.session) {
        // Store session token
        await AsyncStorage.setItem('auth_token', data.session.access_token);

        // Get user role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Default to user if profile not found
          router.replace('/(user)/(tabs)');
          return;
        }

        // Route based on role
        switch (profile?.role) {
          case 'parking_owner':
            router.replace('/(parking-owner)/(tabs)');
            break;
          case 'land_owner':
            router.replace('/(land-owner)');
            break;
          case 'admin':
            router.replace('/(admin)');
            break;
          default:
            router.replace('/(user)/(tabs)');
            break;
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick test login
  const handleQuickLoginUsers = () => {
    setEmail('user3@hello.com');
    setPassword('Hello989878');
    setEmailError('');
    setPasswordError('');
  };

  const handleQuickLoginPo = () => {
    setEmail('po1@hello.com');
    setPassword('Pa12345');
    setEmailError('');
    setPasswordError('');
  };


  const handleQuickLoginLo = () => {
    setEmail('lo1@hello.com');
    setPassword('Lo12345');
    setEmailError('');
    setPasswordError('');
  };

  const handleQuickLoginAd = () => {
    setEmail('admin@hello.com');
    setPassword('Test123456');
    setEmailError('');
    setPasswordError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="car-sport" size={48} color="#22C55E" />
          </View>
          <Text style={styles.title}>ParkEase</Text>
          <Text style={styles.subtitle}>Find & Book Parking in Kathmandu</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, emailError ? { borderColor: '#DC2626' } : {}]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailError ? '#DC2626' : '#9CA3AF'}
                style={{ paddingLeft: 16 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                editable={!loading}
              />
            </View>
            {emailError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, paddingLeft: 4 }}>
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, passwordError ? { borderColor: '#DC2626' } : {}]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordError ? '#DC2626' : '#9CA3AF'}
                style={{ paddingLeft: 16 }}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, paddingLeft: 4 }}>
                {passwordError}
              </Text>
            ) : null}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Test Login */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleQuickLoginUsers}
            disabled={loading}
          >
            <Ionicons name="flash" size={20} color="#22C55E" />
            <Text style={styles.testButtonText}>Fill Test users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleQuickLoginPo}
            disabled={loading}
          >
            <Ionicons name="flash" size={20} color="#22C55E" />
            <Text style={styles.testButtonText}>Fill Test parking owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleQuickLoginLo}
            disabled={loading}
          >
            <Ionicons name="flash" size={20} color="#22C55E" />
            <Text style={styles.testButtonText}>Fill Test land owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleQuickLoginAd}
            disabled={loading}
          >
            <Ionicons name="flash" size={20} color="#22C55E" />
            <Text style={styles.testButtonText}>Fill Test admin</Text>
          </TouchableOpacity>

          



          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}