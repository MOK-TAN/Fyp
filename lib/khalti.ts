// lib/khalti.ts
// Khalti payment gateway configuration (sandbox / test mode)
//
// WHEN KHALTI SENDS YOUR CREDENTIALS:
//   1. Replace `publicKey` below with your test_public_key_...
//   2. In Supabase dashboard → Edge Functions → Secrets:
//        add KHALTI_SECRET_KEY = test_secret_key_...
//   3. Deploy edge functions:
//        npx supabase functions deploy initiate-khalti-payment
//        npx supabase functions deploy verify-khalti-payment

export const KHALTI_CONFIG = {
  // Public key is safe to ship in the app bundle.
  // Secret key NEVER goes here — it lives only in the Supabase Edge Function secrets.
  publicKey: 'test_public_key_REPLACE_ME',

  // Sandbox base URL. For production switch to https://khalti.com/api/v2
  baseUrl: 'https://dev.khalti.com/api/v2',

  // Deep link the WebView returns to after payment.
  // Must match the `scheme` declared in app.json.
  returnUrl: 'parkease://payment/callback',

  // Required by Khalti — your business URL. For sandbox any URL works.
  websiteUrl: 'https://parkease.app',

  // Set to true to disable the Khalti option in the UI while credentials are pending.
  // Set to false once you've pasted real credentials and deployed the edge functions.
  isConfigured: false,
};

// Helper used by payment-selection.tsx to decide whether to show Khalti as available
export const isKhaltiReady = (): boolean => {
  return (
    KHALTI_CONFIG.isConfigured &&
    KHALTI_CONFIG.publicKey !== 'test_public_key_REPLACE_ME' &&
    KHALTI_CONFIG.publicKey.length > 0
  );
};