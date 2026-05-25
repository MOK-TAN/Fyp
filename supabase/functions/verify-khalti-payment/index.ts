// supabase/functions/verify-khalti-payment/index.ts
//
// Called by the app after the WebView redirects back with a pidx.
// Re-verifies the payment with Khalti (the redirect alone is NOT trustworthy —
// anyone can hit the deep link). Only if Khalti confirms status='Completed'
// do we create the booking in the database.
//
// Secrets required:
//   KHALTI_SECRET_KEY  = test_secret_key_xxxxxxxxxxxx
//   KHALTI_BASE_URL    = https://dev.khalti.com/api/v2
//   SUPABASE_URL       (auto-provided by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-provided by Supabase)

// @ts-expect-error - Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error - Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyRequest {
  pidx: string;
  // Booking details to insert IF payment is verified as completed
  booking: {
    user_id: string;
    facility_id: string;
    slot_id: string;
    vehicle_id: string;
    booking_reference: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    base_price: number;
    service_fee: number;
    total_amount: number;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-expect-error - Deno global
    const KHALTI_SECRET_KEY = Deno.env.get('KHALTI_SECRET_KEY');
    // @ts-expect-error - Deno global
    const KHALTI_BASE_URL =
      Deno.env.get('KHALTI_BASE_URL') || 'https://dev.khalti.com/api/v2';
    // @ts-expect-error - Deno global
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    // @ts-expect-error - Deno global
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!KHALTI_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'KHALTI_SECRET_KEY not set' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Supabase service credentials missing' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: VerifyRequest = await req.json();

    if (!body.pidx || !body.booking) {
      return new Response(
        JSON.stringify({ error: 'Missing pidx or booking details' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. Verify with Khalti
    const lookupResponse = await fetch(
      `${KHALTI_BASE_URL}/epayment/lookup/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: body.pidx }),
      }
    );

    const lookupData = await lookupResponse.json();

    if (!lookupResponse.ok) {
      console.error('Khalti lookup failed:', lookupData);
      return new Response(
        JSON.stringify({
          error: 'Khalti verification failed',
          detail: lookupData,
        }),
        {
          status: lookupResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Khalti returns: { pidx, total_amount, status, transaction_id, fee, refunded }
    // status can be: Completed | Pending | Initiated | Refunded | Expired | User canceled

    if (lookupData.status !== 'Completed') {
      return new Response(
        JSON.stringify({
          success: false,
          status: lookupData.status,
          message: `Payment is ${lookupData.status}, not Completed`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify amount matches (anti-tampering)
    const expectedPaisa = Math.round(body.booking.total_amount * 100);
    if (lookupData.total_amount !== expectedPaisa) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Amount mismatch',
          paid: lookupData.total_amount,
          expected: expectedPaisa,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Payment verified — create booking in database
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check slot still available
    const { data: slot, error: slotCheckError } = await supabase
      .from('parking_slots')
      .select('id, is_available, is_occupied')
      .eq('id', body.booking.slot_id)
      .single();

    if (slotCheckError || !slot) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Slot not found',
          shouldRefund: true,
          khalti_transaction_id: lookupData.transaction_id,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!slot.is_available || slot.is_occupied) {
      // Race: someone else took the slot between initiate and verify
      // In production: trigger an automatic Khalti refund here.
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Slot was taken by another user',
          shouldRefund: true,
          khalti_transaction_id: lookupData.transaction_id,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: body.booking.user_id,
        facility_id: body.booking.facility_id,
        slot_id: body.booking.slot_id,
        vehicle_id: body.booking.vehicle_id,
        booking_reference: body.booking.booking_reference,
        booking_date: body.booking.booking_date,
        start_time: body.booking.start_time,
        end_time: body.booking.end_time,
        duration_hours: body.booking.duration_hours,
        base_price: body.booking.base_price,
        service_fee: body.booking.service_fee,
        total_amount: body.booking.total_amount,
        payment_method: 'khalti',
        payment_status: 'paid',
        booking_status: 'confirmed',
        is_timer_active: false,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Booking insert failed:', bookingError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create booking after successful payment',
          detail: bookingError?.message,
          shouldRefund: true,
          khalti_transaction_id: lookupData.transaction_id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update slot
    const { error: slotUpdateError } = await supabase
      .from('parking_slots')
      .update({
        is_available: false,
        is_occupied: true,
        current_booking_id: booking.id,
      })
      .eq('id', body.booking.slot_id);

    if (slotUpdateError) {
      console.error('Slot update failed:', slotUpdateError);
      // Booking exists, slot stuck. Log it; don't roll back the booking.
    }

    // Send notifications
    try {
      const { data: facility } = await supabase
        .from('parking_facilities')
        .select('owner_id, name')
        .eq('id', body.booking.facility_id)
        .single();

      if (facility) {
        const { data: slotInfo } = await supabase
          .from('parking_slots')
          .select('slot_number')
          .eq('id', body.booking.slot_id)
          .single();

        const slotLabel = slotInfo?.slot_number || 'unknown';

        await supabase.from('notifications').insert([
          {
            user_id: body.booking.user_id,
            type: 'booking_confirmed',
            title: 'Booking Confirmed',
            message: `Your Khalti payment was successful. Booking at ${facility.name}, slot ${slotLabel}. Ref: ${body.booking.booking_reference}`,
            booking_id: booking.id,
            facility_id: body.booking.facility_id,
          },
          {
            user_id: facility.owner_id,
            type: 'booking_confirmed',
            title: 'New Booking (Khalti Paid)',
            message: `New booking at ${facility.name}, slot ${slotLabel}. Paid via Khalti. Ref: ${body.booking.booking_reference}`,
            booking_id: booking.id,
            facility_id: body.booking.facility_id,
          },
          {
            user_id: facility.owner_id,
            type: 'payment_success',
            title: 'Payment Received',
            message: `Khalti payment of Rs ${body.booking.total_amount} received for ${body.booking.booking_reference}`,
            booking_id: booking.id,
            facility_id: body.booking.facility_id,
            data: {
              payment_method: 'khalti',
              payment_status: 'paid',
              amount: body.booking.total_amount,
              khalti_transaction_id: lookupData.transaction_id,
            },
          },
        ]);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
      // Non-fatal
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        booking_reference: body.booking.booking_reference,
        khalti_transaction_id: lookupData.transaction_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Verify Khalti error:', error);
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