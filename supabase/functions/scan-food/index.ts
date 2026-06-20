import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, mediaType, userId } = await req.json()

    // check scan count for non-premium users
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('scan_count, is_premium')
        .eq('id', userId)
        .single()

      const scanCount = profile?.scan_count || 0
      const isPremium = profile?.is_premium || false

      if (!isPremium && scanCount >= 3) {
        return new Response(JSON.stringify({ error: 'UPGRADE_REQUIRED', scansUsed: scanCount }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // increment scan count
      await supabase.from('profiles').upsert({
        id: userId,
        scan_count: scanCount + 1,
        is_premium: isPremium
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: 'Identify the food in this image and estimate its nutritional content per 100g. Respond ONLY with a JSON object, no markdown, no explanation. Format: {"name":"food name","calories":number,"protein":number,"carbs":number,"fat":number,"confidence":"high/medium/low"}' }
          ]
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const food = JSON.parse(clean)

    return new Response(JSON.stringify(food), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
