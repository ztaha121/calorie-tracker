import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email, successUrl, cancelUrl } = await req.json()

    const stripeKey = 'STRIPE_SECRET_KEY'

    const priceId = 'price_1TkRCbKYIKfijaoYfXAdnrpJ'

    const body = [
      'mode=subscription',
      'payment_method_types[0]=card',
      `line_items[0][price]=${priceId}`,
      'line_items[0][quantity]=1',
      `success_url=${encodeURIComponent(successUrl)}`,
      `cancel_url=${encodeURIComponent(cancelUrl)}`,
      `customer_email=${encodeURIComponent(email)}`,
      `metadata[user_id]=${encodeURIComponent(userId)}`,
    ].join('&')

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body
    })

    const session = await response.json()

    if (session.error) throw new Error(session.error.message)
    if (!session.url) throw new Error('No checkout URL returned')

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})