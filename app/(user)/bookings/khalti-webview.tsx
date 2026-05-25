// app/(user)/bookings/khalti-webview.tsx
//
// Hosts Khalti's payment page in a WebView.
// Flow:
//   1. Receives paymentUrl + pidx + booking details as params from payment-selection.tsx
//   2. Loads paymentUrl in the WebView — user pays inside Khalti's UI
//   3. Detects when Khalti redirects back to parkease://payment/callback
//   4. Extracts pidx from the callback URL
//   5. Calls verify-khalti-payment edge function
//   6. On success → routes to confirmation screen
//   7. On failure → shows error, lets user retry or cancel

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { KHALTI_CONFIG } from '../../../lib/khalti';
import { supabase } from '../../../lib/supabase';

export default function KhaltiWebView() {
  const params = useLocalSearchParams();

  // Khalti session params
  const paymentUrl = params.paymentUrl as string;
  const pidx = params.pidx as string;

  // Booking details (we hold them here; only insert into DB if Khalti verifies)
  const userId = params.userId as string;
  const parkingId = params.parkingId as string;
  const parkingName = params.parkingName as string;
  const pricePerHour = params.pricePerHour as string;
  const slotId = params.slotId as string;
  const slotNumber = params.slotNumber as string;
  const date = params.date as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  const duration = params.duration as string;
  const vehicleId = params.vehicleId as string;
  const vehiclePlate = params.vehiclePlate as string;
  const vehicleModel = params.vehicleModel as string;
  const vehicleType = params.vehicleType as string;
  const basePrice = params.basePrice as string;
  const serviceFee = params.serviceFee as string;
  const totalPrice = params.totalPrice as string;
  const bookingReference = params.bookingReference as string;

  const webViewRef = useRef<WebView>(null);
  const [verifying, setVerifying] = useState(false);
  const [handledCallback, setHandledCallback] = useState(false);

  // Handle Android hardware back button — confirm before leaving
  React.useEffect(() => {
    const onBackPress = () => {
      handleCancel();
      return true; // we handled it
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel? Your booking will not be created.',
      [
        { text: 'Keep Paying', style: 'cancel' },
        {
          text: 'Cancel Payment',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Intercept navigation — when the WebView tries to load parkease://payment/callback,
  // that's our signal that Khalti is done.
  // ────────────────────────────────────────────────────────────────────────────
  const handleNavigationChange = (navState: WebViewNavigation) => {
    const url = navState.url;
    if (!url) return;

    // Has the WebView been redirected to our return_url?
    if (url.startsWith(KHALTI_CONFIG.returnUrl) && !handledCallback) {
      setHandledCallback(true);

      // Parse query params from the callback URL
      // Khalti appends: ?pidx=...&status=...&transaction_id=...&amount=...
      const queryString = url.split('?')[1] || '';
      const queryParams = new URLSearchParams(queryString);
      const callbackPidx = queryParams.get('pidx') || pidx;
      const status = queryParams.get('status');

      if (status === 'User canceled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      if (status && status !== 'Completed') {
        Alert.alert(
          'Payment Not Completed',
          `Khalti reported status: ${status}. Please try again.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // Status is Completed (or not present — we'll verify with backend regardless)
      verifyPayment(callbackPidx);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Verify payment server-side and create the booking.
  // ────────────────────────────────────────────────────────────────────────────
  const verifyPayment = async (verifyPidx: string) => {
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-khalti-payment',
        {
          body: {
            pidx: verifyPidx,
            booking: {
              user_id: userId,
              facility_id: parkingId,
              slot_id: slotId,
              vehicle_id: vehicleId,
              booking_reference: bookingReference,
              booking_date: date,
              start_time: startTime,
              end_time: endTime,
              duration_hours: parseFloat(duration),
              base_price: parseFloat(basePrice),
              service_fee: parseFloat(serviceFee),
              total_amount: parseFloat(totalPrice),
            },
          },
        }
      );

      if (error) {
        console.error('Verify function error:', error);
        Alert.alert(
          'Verification Failed',
          'Could not verify your payment. If money was deducted, please contact support with your booking reference.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        setVerifying(false);
        return;
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Payment could not be verified.';
        const refundNote = data?.shouldRefund
          ? '\n\nIf money was deducted, it will be refunded within 3–5 business days.'
          : '';

        Alert.alert('Payment Issue', errorMsg + refundNote, [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setVerifying(false);
        return;
      }

      // Success — navigate to confirmation
      router.replace({
        pathname: '/(user)/bookings/confirmation',
        params: {
          parkingId,
          parkingName,
          pricePerHour,
          slotId,
          slotNumber,
          date,
          startTime,
          endTime,
          duration,
          vehicleId,
          vehiclePlate,
          vehicleType,
          vehicleModel,
          basePrice,
          serviceFee,
          totalPrice,
          bookingReference,
          paymentMethod: 'khalti',
        },
      });
    } catch (err: any) {
      console.error('Verify error:', err);
      Alert.alert(
        'Network Error',
        'Could not reach the server to verify your payment. Please check your connection.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setVerifying(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  if (!paymentUrl) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Missing payment URL</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} hitSlop={10}>
          <Ionicons name="close" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khalti Payment</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#5C2D91" />
            <Text style={styles.loadingText}>Loading Khalti...</Text>
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        originWhitelist={['https://*', 'parkease://*']}
        style={styles.webview}
      />

      {/* Verifying overlay */}
      {verifying && (
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingBox}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
            <Text style={styles.verifyingSubtext}>
              Please wait while we confirm your payment with Khalti.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  verifyingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  verifyingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  verifyingSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});