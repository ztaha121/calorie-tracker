import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    return new Response('OK', { status: 200 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const contentType = req.headers.get('content-type') || ''
    let email = ''
    let productPermalink = ''
    let saleId = ''
    let refunded = false

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await req.text()
      const params = new URLSearchParams(body)
      email = params.get('email') || ''
      productPermalink = params.get('product_permalink') || ''
      saleId = params.get('sale_id') || ''
      refunded = params.get('refunded') === 'true'
    } else {
      const body = await req.json()
      email = body.email || ''
      productPermalink = body.product_permalink || ''
      saleId = body.sale_id || ''
      refunded = body.refunded === true
    }

    console.log(`Gumroad webhook: email=${email}, product=${productPermalink}, sale=${saleId}, refunded=${refunded}`)

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email in payload' }), { status: 400 })
    }

   if (!productPermalink.includes('cyfiz')) {
      return new Response(JSON.stringify({ skipped: 'Not Mizan Pro product' }), { status: 200 })
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError || !userData?.user?.id) {
      console.error('User not found for email:', email)
      return new Response(JSON.stringify({ warning: 'User not found', email }), { status: 200 })
    }

    const userId = userData.user.id
    const isPremium = !refunded

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: userId, is_premium: isPremium })

    if (updateError) {
      console.error('Profile update error:', updateError)
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }

    console.log(`✅ User ${userId} is_premium set to ${isPremium}`)

    return new Response(JSON.stringify({ success: true, userId, is_premium: isPremium }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
