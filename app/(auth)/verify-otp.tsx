import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { supabase } from '../../lib/supabase';

const VerifyOTP = () => {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for 8 OTP inputs
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 7) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-verify when all 8 digits entered
    if (index === 7 && value) {
      const fullOtp = [...newOtp.slice(0, 7), value].join('');
      if (fullOtp.length === 8) {
        handleVerifyWithOtp(fullOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Validate OTP
  const validateOtp = (otpString?: string): boolean => {
    const fullOtp = otpString ?? otp.join('');
    if (fullOtp.length !== 8) {
      setOtpError('Please enter the complete 8-digit code');
      return false;
    }
    return true;
  };

  // Verify with a given OTP string (used for auto-verify)
  const handleVerifyWithOtp = async (otpString: string) => {
    if (!validateOtp(otpString)) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: 'signup',
      });

      if (error) {
        setOtpError(error.message || 'Invalid OTP. Please try again.');
        return;
      }

      // Alert.alert('Verified! ✅', 'Your email has been verified. You can now log in.', [
      //   { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      // ]);

      // Verified — they now have a session, route to the right dashboard
      const { data: { user } } = await supabase.auth.getUser();
      let target = '/(user)/(tabs)';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'parking_owner') target = '/(parking-owner)/(tabs)';
        else if (profile?.role === 'land_owner') target = '/(land-owner)';
        else if (profile?.role === 'admin') target = '/(admin)';
      }
      Alert.alert('Verified! ✅', 'Your email has been verified.', [
        { text: 'OK', onPress: () => router.replace(target as any) },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to verify. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify button press
  const handleVerify = () => {
    handleVerifyWithOtp(otp.join(''));
  };

  // Handle resend code
  const handleResend = async () => {
    if (!canResend) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '', '', '']);
      setOtpError('');
      otpRefs[0].current?.focus();

      Alert.alert('Code Resent! 📧', `A new 8-digit code has been sent to ${email}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.otpText}>OTP </Text>
            <Text style={styles.verificationText}>verification</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>Enter the OTP to verify</Text>
          <Text style={styles.emailText}>Code sent to: {email || 'your email'}</Text>
        </View>

        {/* OTP Input Boxes — 8 digits */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpInputWrapper}>
              <TextInput
                ref={otpRefs[index]}
                style={[
                  styles.otpInput,
                  otpError ? styles.otpInputError : null,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
                returnKeyType={index === 7 ? 'done' : 'next'}
              />
            </View>
          ))}
        </View>

        {/* Error Message */}
        {otpError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorDot}>•</Text>
            <Text style={styles.errorText}>{otpError}</Text>
          </View>
        ) : null}

        {/* Resend Timer */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity
              onPress={handleResend}
              disabled={isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>Resend code in {resendTimer}s</Text>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>VERIFY</Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
  },
  otpText: {
    color: '#22C55E',
  },
  verificationText: {
    color: '#1F2937',
  },
  instructionsContainer: {
    marginBottom: 40,
  },
  instructionsText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  emailText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  otpInputWrapper: {
    flex: 1,
  },
  otpInput: {
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  otpInputError: {
    borderColor: '#EF4444',
  },
  otpInputFilled: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginLeft: 4,
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
    fontWeight: '400',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 24,
  },
  resendText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
  timerText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
  },
  verifyButton: {
    backgroundColor: '#22C55E',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VerifyOTP;


//before

// import { router, useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// const VerifyOTP = () => {
//   const params = useLocalSearchParams();
//   const phoneEmail = params.phoneEmail as string || '';

//   const [otp, setOtp] = useState(['', '', '', '']);
//   const [otpError, setOtpError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [resendTimer, setResendTimer] = useState(60);
//   const [canResend, setCanResend] = useState(false);

//   // Refs for OTP inputs
//   const otpRefs = [
//     useRef<TextInput>(null),
//     useRef<TextInput>(null),
//     useRef<TextInput>(null),
//     useRef<TextInput>(null),
//   ];

//   // Timer countdown
//   useEffect(() => {
//     if (resendTimer > 0) {
//       const timer = setTimeout(() => {
//         setResendTimer(resendTimer - 1);
//       }, 1000);
//       return () => clearTimeout(timer);
//     } else {
//       setCanResend(true);
//     }
//   }, [resendTimer]);

//   // Simulate API delay
//   const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

//   // Handle OTP input change
//   const handleOtpChange = (value: string, index: number) => {
//     // Only allow numbers
//     if (value && !/^\d+$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setOtpError('');

//     // Auto-focus next input
//     if (value && index < 3) {
//       otpRefs[index + 1].current?.focus();
//     }

//     // Auto-verify when all 4 digits entered
//     if (index === 3 && value) {
//       const fullOtp = [...newOtp.slice(0, 3), value].join('');
//       if (fullOtp.length === 4) {
//         handleVerify();
//       }
//     }
//   };

//   // Handle backspace
//   const handleKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
//       otpRefs[index - 1].current?.focus();
//     }
//   };

//   // Validate OTP
//   const validateOtp = (): boolean => {
//     const fullOtp = otp.join('');
    
//     if (fullOtp.length !== 4) {
//       setOtpError('Please enter the complete 4-digit code');
//       return false;
//     }

//     return true;
//   };

//   // Handle verify
//   const handleVerify = async () => {
//     if (!validateOtp()) return;

//     setIsLoading(true);

//     try {
//       // Simulate network delay
//       await delay(1000);

//       const fullOtp = otp.join('');

//       // Validate OTP (for demo, accept any 4-digit code)
//       if (fullOtp.length === 4) {
//         // Success
//         Alert.alert(
//           'Verified! ✅',
//           'Your code has been verified. You can now reset your password.',
//           [
//             {
//               text: 'OK',
//               onPress: () => {
//                 // In production, navigate to reset password screen
//                 router.replace('/(auth)/login');
//               },
//             },
//           ]
//         );
//       } else {
//         setOtpError('Invalid code. Please try again.');
//       }
//     } catch (error) {
//       console.error('Verify OTP error:', error);
//       Alert.alert('Error', 'Failed to verify code. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle resend code
//   const handleResend = async () => {
//     if (!canResend) return;

//     setIsLoading(true);

//     try {
//       // Simulate network delay
//       await delay(800);

//       // Reset timer
//       setResendTimer(60);
//       setCanResend(false);
//       setOtp(['', '', '', '']);
//       setOtpError('');
      
//       // Focus first input
//       otpRefs[0].current?.focus();

//       Alert.alert('Code Resent! 📧', `A new code has been sent to ${phoneEmail}`);
//     } catch (error) {
//       console.error('Resend error:', error);
//       Alert.alert('Error', 'Failed to resend code. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <ScrollView
//         contentContainerStyle={styles.scrollContainer}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.headerText}>
//             <Text style={styles.otpText}>OTP </Text>
//             <Text style={styles.verificationText}>verification</Text>
//           </Text>
//         </View>

//         {/* Instructions */}
//         <View style={styles.instructionsContainer}>
//           <Text style={styles.instructionsText}>
//             Enter the OTP to verify
//           </Text>
//           <Text style={styles.phoneEmailText}>
//             Code sent to: {phoneEmail || 'your phone/email'}
//           </Text>
//         </View>

//         {/* OTP Input Boxes */}
//         <View style={styles.otpContainer}>
//           {otp.map((digit, index) => (
//             <View key={index} style={styles.otpInputWrapper}>
//               <TextInput
//                 ref={otpRefs[index]}
//                 style={[
//                   styles.otpInput,
//                   otpError && styles.otpInputError,
//                   digit && styles.otpInputFilled
//                 ]}
//                 value={digit}
//                 onChangeText={(value) => handleOtpChange(value, index)}
//                 onKeyPress={(e) => handleKeyPress(e, index)}
//                 keyboardType="number-pad"
//                 maxLength={1}
//                 selectTextOnFocus
//                 editable={!isLoading}
//                 returnKeyType={index === 3 ? 'done' : 'next'}
//               />
//             </View>
//           ))}
//         </View>

//         {/* Error Message */}
//         {otpError ? (
//           <View style={styles.errorContainer}>
//             <Text style={styles.errorDot}>•</Text>
//             <Text style={styles.errorText}>{otpError}</Text>
//           </View>
//         ) : null}

//         {/* Resend Timer */}
//         <View style={styles.resendContainer}>
//           {canResend ? (
//             <TouchableOpacity
//               onPress={handleResend}
//               disabled={isLoading}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <Text style={styles.resendText}>Resend Code</Text>
//             </TouchableOpacity>
//           ) : (
//             <Text style={styles.timerText}>
//               Resend code in {resendTimer}s
//             </Text>
//           )}
//         </View>

//         {/* Verify Button */}
//         <TouchableOpacity
//           style={[
//             styles.verifyButton,
//             isLoading && styles.verifyButtonDisabled
//           ]}
//           onPress={handleVerify}
//           disabled={isLoading}
//           activeOpacity={0.8}
//         >
//           {isLoading ? (
//             <ActivityIndicator color="#fff" size="small" />
//           ) : (
//             <Text style={styles.verifyButtonText}>VERIFY</Text>
//           )}
//         </TouchableOpacity>

//         {/* Back to Login */}
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//           disabled={isLoading}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Text style={styles.backText}>Back to Login</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 40,
//   },
//   header: {
//     marginBottom: 24,
//   },
//   headerText: {
//     fontSize: 32,
//     fontWeight: '600',
//     lineHeight: 40,
//   },
//   otpText: {
//     color: '#22C55E',
//   },
//   verificationText: {
//     color: '#1F2937',
//   },
//   instructionsContainer: {
//     marginBottom: 40,
//   },
//   instructionsText: {
//     fontSize: 16,
//     color: '#1F2937',
//     marginBottom: 8,
//     fontWeight: '500',
//   },
//   phoneEmailText: {
//     fontSize: 14,
//     color: '#6B7280',
//     lineHeight: 20,
//   },
//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//     gap: 12,
//   },
//   otpInputWrapper: {
//     flex: 1,
//   },
//   otpInput: {
//     height: 64,
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderRadius: 12,
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//     color: '#1F2937',
//     backgroundColor: '#FFFFFF',
//   },
//   otpInputError: {
//     borderColor: '#EF4444',
//   },
//   otpInputFilled: {
//     borderColor: '#22C55E',
//     backgroundColor: '#F0FDF4',
//   },
//   errorContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//     marginLeft: 4,
//   },
//   errorDot: {
//     color: '#EF4444',
//     fontSize: 20,
//     lineHeight: 20,
//     marginRight: 4,
//   },
//   errorText: {
//     color: '#EF4444',
//     fontSize: 14,
//     lineHeight: 20,
//     flex: 1,
//     fontWeight: '400',
//   },
//   resendContainer: {
//     alignItems: 'center',
//     marginBottom: 32,
//     minHeight: 24,
//   },
//   resendText: {
//     color: '#22C55E',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   timerText: {
//     color: '#6B7280',
//     fontSize: 14,
//     fontWeight: '400',
//   },
//   verifyButton: {
//     backgroundColor: '#22C55E',
//     height: 56,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     shadowColor: '#22C55E',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   verifyButtonDisabled: {
//     opacity: 0.6,
//   },
//   verifyButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//     letterSpacing: 1.2,
//   },
//   backButton: {
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   backText: {
//     color: '#6B7280',
//     fontSize: 14,
//     fontWeight: '500',
//   },
// });

// export default VerifyOTP;