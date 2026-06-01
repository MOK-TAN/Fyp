import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

// ⚠️ Set this to match your Supabase "Email OTP Length"
// (Authentication → Providers → Email). Default is 6.
// Your signup screen uses 8 — if your project is set to 8, change this to 8.
const OTP_LENGTH = 6;

const ForgotPassword = () => {
  // ─── Form state ───
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Errors ───
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // ─── OTP modal state ───
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ─── Validation ───
  const validateEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  const validatePassword = (text: string): string | null => {
    if (text.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(text)) return 'Must include an uppercase letter';
    if (!/[0-9]/.test(text)) return 'Must include a number';
    return null;
  };

  const validateForm = (): boolean => {
    let ok = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      ok = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Enter a valid email address');
      ok = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      ok = false;
    } else {
      const pwErr = validatePassword(password);
      if (pwErr) {
        setPasswordError(pwErr);
        ok = false;
      }
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      ok = false;
    } else if (confirmPassword !== password) {
      setConfirmError('Passwords do not match');
      ok = false;
    }

    return ok;
  };

  // ─── Resend countdown ───
  useEffect(() => {
    if (!showOtpModal) return;
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    setCanResend(true);
  }, [resendTimer, showOtpModal]);

  // ─── Step 1: validate + send the OTP, then open the modal ───
  const handleSendCode = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send the code.');
        return;
      }

      // Open OTP modal
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      setResendTimer(60);
      setCanResend(false);
      setShowOtpModal(true);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (e) {
      console.error('Send code error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── OTP input handlers ───
  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setOtpError('');

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // auto-verify when last digit is filled
    if (index === OTP_LENGTH - 1 && value) {
      const full = [...next.slice(0, OTP_LENGTH - 1), value].join('');
      if (full.length === OTP_LENGTH) handleVerify(full);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ─── Step 2: verify OTP → set the new password ───
  const handleVerify = async (codeArg?: string) => {
    const code = codeArg ?? otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError(`Please enter the complete ${OTP_LENGTH}-digit code`);
      return;
    }

    setVerifying(true);
    try {
      // Verifying the recovery OTP creates a temporary session that
      // authorizes the password change.
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'recovery',
      });

      if (vErr) {
        setOtpError('Invalid or expired code. Please try again.');
        setVerifying(false);
        return;
      }

      // Now apply the new password the user already entered.
      const { error: uErr } = await supabase.auth.updateUser({ password });

      if (uErr) {
        setOtpError('');
        setShowOtpModal(false);
        Alert.alert('Error', uErr.message || 'Failed to update password.');
        setVerifying(false);
        return;
      }

      // Sign out the temporary recovery session so they log in fresh.
      await supabase.auth.signOut();

      setShowOtpModal(false);
      Alert.alert(
        'Password Updated ✅',
        'Your password has been changed. Please log in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e) {
      console.error('Verify error:', e);
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ─── Resend code ───
  const handleResend = async () => {
    if (!canResend) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      setResendTimer(60);
      setCanResend(false);
      otpRefs.current[0]?.focus();
      Alert.alert('Code Resent 📧', `A new code was sent to ${email.trim().toLowerCase()}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to resend code.');
    } finally {
      setVerifying(false);
    }
  };

  // ─── UI ───
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
            <Text style={styles.forgotText}>Forgot </Text>
            <Text style={styles.passwordText}>password</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Reset Password</Text>
          <Text style={styles.instructionsText}>
            Enter your email and a new password. We'll send a code to confirm it's you.
          </Text>
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={emailError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
          {emailError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{emailError}</Text>
            </View>
          ) : null}
        </View>

        {/* New password */}
        <View style={styles.fieldContainer}>
          <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={passwordError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          ) : null}
        </View>

        {/* Confirm password */}
        <View style={styles.fieldContainer}>
          <View style={[styles.inputWrapper, confirmError ? styles.inputError : null]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={confirmError ? '#EF4444' : '#9CA3AF'}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (confirmError) setConfirmError('');
              }}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((s) => !s)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isLoading}
            >
              <Ionicons
                name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {confirmError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{confirmError}</Text>
            </View>
          ) : null}
        </View>

        {/* Send code */}
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendCode}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>SEND CODE</Text>
          )}
        </TouchableOpacity>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#22C55E" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── OTP Modal ─── */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => !verifying && setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Verify it's you</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Code sent to {email.trim().toLowerCase()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => !verifying && setShowOtpModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* OTP boxes */}
            <View style={styles.otpContainer}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    otpError ? styles.otpInputError : null,
                  ]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  onKeyPress={(e) => handleOtpKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!verifying}
                  returnKeyType={i === OTP_LENGTH - 1 ? 'done' : 'next'}
                />
              ))}
            </View>

            {otpError ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{otpError}</Text>
              </View>
            ) : null}

            {/* Resend */}
            <View style={styles.resendRow}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={verifying}>
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>Resend code in {resendTimer}s</Text>
              )}
            </View>

            {/* Verify */}
            <TouchableOpacity
              style={[styles.sendButton, verifying && styles.sendButtonDisabled]}
              onPress={() => handleVerify()}
              disabled={verifying}
              activeOpacity={0.8}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>VERIFY & RESET</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: { marginBottom: 24 },
  headerText: { fontSize: 32, fontWeight: '600', lineHeight: 40 },
  forgotText: { color: '#22C55E' },
  passwordText: { color: '#1F2937' },
  instructionsContainer: { marginBottom: 28 },
  instructionsTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  instructionsText: { fontSize: 14, color: '#6B7280', lineHeight: 20 },

  fieldContainer: { marginBottom: 18 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: '#EF4444' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', fontWeight: '400' },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4, gap: 4 },
  errorText: { color: '#EF4444', fontSize: 13, lineHeight: 18, flex: 1 },

  sendButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1.2 },

  backButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  backText: { color: '#22C55E', fontSize: 14, fontWeight: '600', marginLeft: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  otpInputError: { borderColor: '#EF4444' },

  resendRow: { alignItems: 'center', marginVertical: 16, minHeight: 22 },
  resendText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
  timerText: { color: '#6B7280', fontSize: 14 },
});

export default ForgotPassword;