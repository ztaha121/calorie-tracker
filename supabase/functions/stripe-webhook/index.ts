import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.text()
    const event = JSON.parse(body)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id
      const email = session.customer_email

      if (userId && userId !== 'guest') {
        await supabase.from('profiles').upsert({
          id: userId,
          is_premium: true,
          scan_count: 0
        })
      } else if (email) {
        const { data: user } = await supabase.auth.admin.getUserByEmail(email)
        if (user?.user?.id) {
          await supabase.from('profiles').upsert({
            id: user.user.id,
            is_premium: true,
            scan_count: 0
          })
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const customerId = subscription.customer
      const { data: customers } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
      if (customers?.[0]) {
        await supabase.from('profiles')
          .update({ is_premium: false })
          .eq('id', customers[0].id)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
