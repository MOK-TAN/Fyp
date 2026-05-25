// supabase/functions/initiate-khalti-payment/index.ts
//
// Called by the app when user clicks "Pay Now" with Khalti selected.
// Creates a Khalti payment session and returns the payment URL.
// The app then loads that URL in a WebView.
//
// Secrets required (set in Supabase Dashboard → Edge Functions → Secrets):
//   KHALTI_SECRET_KEY  = test_secret_key_xxxxxxxxxxxx
//   KHALTI_BASE_URL    = https://dev.khalti.com/api/v2  (optional, defaults to sandbox)

// @ts-expect-error - Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InitiateRequest {
  amount: number;              // in paisa (Rs 50 = 5000)
  purchase_order_id: string;   // your internal reference (we use the booking_reference)
  purchase_order_name: string; // shown to user on Khalti page
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  return_url: string;          // parkease://payment/callback
  website_url: string;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global
    const KHALTI_SECRET_KEY = Deno.env.get('KHALTI_SECRET_KEY');
    // @ts-expect-error - Deno global
    const KHALTI_BASE_URL =
      Deno.env.get('KHALTI_BASE_URL') || 'https://dev.khalti.com/api/v2';

    if (!KHALTI_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          error:
            'Khalti not configured. Set KHALTI_SECRET_KEY in Supabase Edge Function secrets.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: InitiateRequest = await req.json();

    // Validate required fields
    if (
      !body.amount ||
      !body.purchase_order_id ||
      !body.purchase_order_name ||
      !body.return_url ||
      !body.website_url
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (body.amount < 1000) {
      // Khalti minimum is Rs 10 = 1000 paisa
      return new Response(
        JSON.stringify({ error: 'Minimum amount is Rs 10' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Call Khalti's initiate endpoint
    const khaltiResponse = await fetch(
      `${KHALTI_BASE_URL}/epayment/initiate/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: body.return_url,
          website_url: body.website_url,
          amount: body.amount,
          purchase_order_id: body.purchase_order_id,
          purchase_order_name: body.purchase_order_name,
          customer_info: {
            name: body.customer_name || 'Customer',
            email: body.customer_email || 'customer@parkease.app',
            phone: body.customer_phone || '9800000000',
          },
        }),
      }
    );

    const khaltiData = await khaltiResponse.json();

    if (!khaltiResponse.ok) {
      console.error('Khalti initiate failed:', khaltiData);
      return new Response(
        JSON.stringify({
          error: 'Khalti initiation failed',
          detail: khaltiData,
        }),
        {
          status: khaltiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Khalti returns: { pidx, payment_url, expires_at, expires_in }
    return new Response(
      JSON.stringify({
        pidx: khaltiData.pidx,
        payment_url: khaltiData.payment_url,
        expires_at: khaltiData.expires_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Initiate Khalti error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});