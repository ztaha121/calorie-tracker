import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { dish } = await req.json()
    if (!dish) return new Response(JSON.stringify({ error: 'No dish provided' }), { status: 400 })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a nutritionist expert in Arabic, Gulf, Moroccan, and Middle Eastern cuisine.

The user described a dish: "${dish}"

Analyze this dish and respond ONLY with a JSON object (no markdown, no explanation):
{
  "dish_name_arabic": "اسم الطبق بالعربي",
  "dish_name_english": "Dish Name in English",
  "description": "Brief description in English (1 sentence)",
  "serving_size": "e.g. 1 bowl (350g)",
  "calories": 350,
  "protein": 22,
  "carbs": 40,
  "fat": 10,
  "confidence": "high",
  "main_ingredients": ["ingredient1", "ingredient2", "ingredient3"],
  "cooking_notes": "Brief note about how cooking method affects nutrition (1 sentence)",
  "tips": "One practical nutrition tip for this dish"
}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return new Response(JSON.stringify(parsed), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
