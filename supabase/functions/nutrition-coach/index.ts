import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Auth check ────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Parse request ─────────────────────────────────────────────────────
    const { message = '', mode = 'chat' } = await req.json()

    // ── 3. Admin client ──────────────────────────────────────────────────────
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    )

    // ── 4. Load profile & check is_premium ───────────────────────────────────
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, display_name, daily_goal, weight_kg, height_cm, age, is_premium')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!profile.is_premium) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required', code: 'NOT_PREMIUM' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 5. Fetch last 7 days of food logs ────────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0] // YYYY-MM-DD

    const { data: foodLogs } = await adminClient
      .from('food_logs')
      .select('date, name, calories, protein, carbs, fat, meal, portion, per')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false })

    // ── 6. Crunch the numbers ────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]

    const todayLogs = (foodLogs ?? []).filter((l: any) => l.date === today)
    const caloriesToday = todayLogs.reduce((s: number, l: any) => s + (l.calories ?? 0), 0)
    const proteinToday  = todayLogs.reduce((s: number, l: any) => s + (l.protein ?? 0), 0)
    const carbsToday    = todayLogs.reduce((s: number, l: any) => s + (l.carbs ?? 0), 0)
    const fatToday      = todayLogs.reduce((s: number, l: any) => s + (l.fat ?? 0), 0)

    const avgCalories = foodLogs?.length
      ? Math.round(foodLogs.reduce((s: number, l: any) => s + (l.calories ?? 0), 0) / 7)
      : 0

    const caloriesRemaining = (profile.daily_goal ?? 2000) - caloriesToday

    // ── 7. Build AI context from real data ───────────────────────────────────
    const userContext = `
USER PROFILE:
- Name: ${profile.display_name ?? 'User'}
- Daily calorie goal: ${profile.daily_goal ?? 2000} kcal
- Age: ${profile.age ?? 'not set'}
- Weight: ${profile.weight_kg ? `${profile.weight_kg} kg` : 'not logged'}
- Height: ${profile.height_cm ? `${profile.height_cm} cm` : 'not logged'}

TODAY (${today}):
- Calories eaten: ${caloriesToday} kcal / ${profile.daily_goal ?? 2000} kcal goal
- Remaining: ${caloriesRemaining} kcal
- Protein: ${proteinToday}g | Carbs: ${carbsToday}g | Fat: ${fatToday}g
- Meals today: ${todayLogs.length > 0
    ? todayLogs.map((l: any) => `${l.name} (${l.meal ?? 'meal'}, ${l.calories ?? 0} kcal)`).join(', ')
    : 'nothing logged yet'}

LAST 7 DAYS:
- Average calories/day: ${avgCalories} kcal (goal: ${profile.daily_goal ?? 2000})
- Total entries logged: ${foodLogs?.length ?? 0}

RECENT FOOD LOG:
${(foodLogs ?? []).slice(0, 25).map((l: any) =>
  `  [${l.date}] ${l.meal ?? 'meal'}: ${l.name} — ${l.calories ?? 0} kcal | P:${l.protein ?? 0}g C:${l.carbs ?? 0}g F:${l.fat ?? 0}g${l.portion ? ` (${l.portion}${l.per ? ' ' + l.per : ''})` : ''}`
).join('\n') || '  No food logs in the last 7 days'}
`.trim()

    // ── 8. Mode-specific system prompts ──────────────────────────────────────
    const systemPrompts: Record<string, string> = {
      chat: `You are a friendly expert AI nutrition coach inside a calorie tracking app.
You have the user's REAL food logs — always reference their actual foods and numbers.
Be warm, specific, and actionable. 2-3 paragraphs max. No generic advice.
The app supports Arabic Gulf cuisine (kabsa, shawarma, foul, harees, dates, etc.) — be culturally aware.`,

      analyze: `You are an expert AI nutrition coach. Analyze the user's real data deeply.
Respond in this exact format:
✅ What's going well (2-3 specific observations from their actual logs)
⚠️ Areas to improve (2-3 specific gaps or patterns you notice)
🎯 Top 3 action steps (concrete steps based on their real numbers and foods)
Be data-driven — mention their actual food names and calorie numbers.`,

      meal_plan: `You are an expert AI nutrition coach and meal planner.
Create a 1-day meal plan tailored to hit this user's ${profile.daily_goal ?? 2000} kcal daily goal.
Format: Breakfast | Lunch | Dinner | Snacks — each with foods, calories, and macros (P/C/F).
Use foods similar to what they already eat. Consider Gulf/Arabic cuisine preferences.`,

      recommendations: `You are an expert AI nutrition coach.
Give this user their top 5 PERSONALIZED daily recommendations based on their actual logs.
Number each one. Every point must reference their real data — no generic tips.
Keep each recommendation to 1-2 sentences.`,
    }

    const systemPrompt = systemPrompts[mode] ?? systemPrompts.chat

    // ── 9. Call Claude ───────────────────────────────────────────────────────
    const aiMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: `${systemPrompt}\n\n${userContext}`,
      messages: [{
        role: 'user',
        content: message || 'Give me a personalized coaching summary based on my recent food logs.',
      }],
    })

    const reply = aiMessage.content[0].type === 'text' ? aiMessage.content[0].text : ''

    // ── 10. Return ───────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        reply,
        mode,
        stats: {
          caloriesToday,
          proteinToday,
          carbsToday,
          fatToday,
          caloriesRemaining,
          avgCalories,
          dailyGoal: profile.daily_goal ?? 2000,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Coach failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
