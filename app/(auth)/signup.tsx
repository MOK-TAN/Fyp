import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type UserRole = 'user' | 'parking-owner' | 'land-owner';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Validate email/phone
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return emailRegex.test(text) || phoneRegex.test(text);
  };

  // Simulate API call delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle sign up
  const handleSignUp = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    // Validate email/phone
    if (!email.trim()) {
      setEmailError('Phone or email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid phone or email');
      hasError = true;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // Simulate network delay
      await delay(1000);

      // Sign up successful
      Alert.alert(
        'Success',
        `Account created successfully!\nRole: ${selectedRole}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate based on role
              switch (selectedRole) {
                case 'parking-owner':
                  router.replace('/(parking-owner)');
                  break;
                case 'land-owner':
                  router.replace('/(land-owner)');
                  break;
                case 'user':
                default:
                  router.replace('/(user)');
                  break;
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login navigation
  const handleLogin = () => {
    router.push('/(auth)/login');
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
        {/* Image */}
        <Image
          source={require('../../assets/images/park.png')}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            <Text style={styles.createText}>Create</Text>
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
              keyboardType="email-address"
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

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.inputWrapper,
              confirmPasswordError && styles.inputError,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="confirm password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorDot}>•</Text>
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          {/* User */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => setSelectedRole('user')}
            disabled={isLoading}
          >
            <View
              style={[
                styles.radioOuter,
                selectedRole === 'user' && styles.radioOuterSelected,
              ]}
            >
              {selectedRole === 'user' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.roleText}>User</Text>
          </TouchableOpacity>

          {/* Parking Owner */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => setSelectedRole('parking-owner')}
            disabled={isLoading}
          >
            <View
              style={[
                styles.radioOuter,
                selectedRole === 'parking-owner' && styles.radioOuterSelected,
              ]}
            >
              {selectedRole === 'parking-owner' && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.roleText}>Parking owner</Text>
          </TouchableOpacity>

          {/* Land Owner */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => setSelectedRole('land-owner')}
            disabled={isLoading}
          >
            <View
              style={[
                styles.radioOuter,
                selectedRole === 'land-owner' && styles.radioOuterSelected,
              ]}
            >
              {selectedRole === 'land-owner' && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.roleText}>Land owner</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signUpButtonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have account? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
            <Text style={styles.loginLink}>Log In</Text>
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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 24,
  },
  header: {
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '600',
  },
  createText: {
    color: '#22C55E',
  },
  accountText: {
    color: '#333',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
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
    marginTop: 6,
    marginLeft: 15,
  },
  errorDot: {
    color: '#EF4444',
    fontSize: 18,
    lineHeight: 18,
    marginRight: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioOuterSelected: {
    borderColor: '#22C55E',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  roleText: {
    fontSize: 14,
    color: '#333',
  },
  signUpButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#999',
    fontSize: 14,
  },
  loginLink: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignUp;