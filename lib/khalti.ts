// lib/khalti.ts
// Khalti payment gateway configuration (sandbox / test mode)
//
// The PUBLIC key comes from .env (EXPO_PUBLIC_KHALTI_PUBLIC_KEY).
// The SECRET key is NOT here — it lives only in Supabase Edge Function secrets:
//   Supabase Dashboard -> Edge Functions -> Secrets -> KHALTI_SECRET_KEY
//
// After editing .env, restart with: npx expo start -c

const KHALTI_PUBLIC_KEY = process.env.EXPO_PUBLIC_KHALTI_PUBLIC_KEY ?? '';

export const KHALTI_CONFIG = {
  // Public key — safe to ship in the app bundle.
  publicKey: KHALTI_PUBLIC_KEY,

  // Sandbox base URL. For production switch to https://khalti.com/api/v2
  baseUrl: 'https://dev.khalti.com/api/v2',

  // Khalti requires a valid http(s) URL here (NOT a custom scheme like
  // parkingapp://). The WebView intercepts the redirect to this URL before
  // it loads, so the page itself does not need to exist.
  returnUrl: 'https://parkease.app/payment/callback',

  // Your business URL — must also be a valid https URL.
  websiteUrl: 'https://parkease.app',

  // Khalti shows as available whenever a public key is present.
  isConfigured: KHALTI_PUBLIC_KEY.length > 0,
};

// Used by payment-selection.tsx to decide whether to offer Khalti.
export const isKhaltiReady = (): boolean => {
  return KHALTI_CONFIG.isConfigured && KHALTI_CONFIG.publicKey.length > 0;
};

// // lib/khalti.ts
// // Khalti payment gateway configuration (sandbox / test mode)
// //
// // WHEN KHALTI SENDS YOUR CREDENTIALS:
// //   1. Replace `publicKey` below with your test_public_key_...
// //   2. In Supabase dashboard → Edge Functions → Secrets:
// //        add KHALTI_SECRET_KEY = test_secret_key_...
// //   3. Deploy edge functions:
// //        npx supabase functions deploy initiate-khalti-payment
// //        npx supabase functions deploy verify-khalti-payment

// export const KHALTI_CONFIG = {
//   // Public key is safe to ship in the app bundle.
//   // Secret key NEVER goes here — it lives only in the Supabase Edge Function secrets.
//   publicKey: 'e5c7eea1dfb74927b5ccd6180a201fbc',

//   // Sandbox base URL. For production switch to https://khalti.com/api/v2
//   baseUrl: 'https://dev.khalti.com/api/v2',

//   // Deep link the WebView returns to after payment.
//   // Must match the `scheme` declared in app.json.
//   returnUrl: 'https://parkease.app/payment/callback',

//   // Required by Khalti — your business URL. For sandbox any URL works.
//   websiteUrl: 'https://parkease.app',

//   // Set to true to disable the Khalti option in the UI while credentials are pending.
//   // Set to false once you've pasted real credentials and deployed the edge functions.
//   isConfigured: true,
// };

// // Helper used by payment-selection.tsx to decide whether to show Khalti as available
// export const isKhaltiReady = (): boolean => {
//   return (
//     KHALTI_CONFIG.isConfigured &&
//     KHALTI_CONFIG.publicKey !== 'test_public_key_REPLACE_ME' &&
//     KHALTI_CONFIG.publicKey.length > 0
//   );
// };