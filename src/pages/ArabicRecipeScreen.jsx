import { useState } from 'react'

const EXAMPLES = [
  'كبسة دجاج مع أرز بالزعفران',
  'مجبوس لحم بالخضار',
  'هريسة دجاج بالسمن البلدي',
  'شوربة عدس بالليمون',
  'فتة دجاج بالخبز المحمص',
  'مندي خروف',
  'بريك تونسي بالبيض',
  'كسكس بالخضار والدجاج',
]

export default function ArabicRecipeScreen({ onAdd, user }) {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [portions, setPortions] = useState(1)

  async function analyzeRecipe() {
    if (!input.trim()) return
    setLoading(true); setResult(null); setError('')

    try {
      const response = await fetch('https://rnwsnnvdgsxqamvofhno.supabase.co/functions/v1/analyze-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish: input.trim() })
      })
      const parsed = await response.json()
      if (parsed.error) throw new Error(parsed.error)
      setResult(parsed)
    } catch (e) {
      setError('Could not analyze this dish. Try describing it differently.')
    }
    setLoading(false)
  }

  function addToLog() {
    if (!result || !onAdd) return
    onAdd({
      name: result.dish_name_english || result.dish_name_arabic,
      calories: Math.round(result.calories * portions),
      protein: Math.round(result.protein * portions * 10) / 10,
      carbs: Math.round(result.carbs * portions * 10) / 10,
      fat: Math.round(result.fat * portions * 10) / 10,
      meal: 'Dinner',
      per: portions === 1 ? result.serving_size : `${portions}x ${result.serving_size}`,
    })
    setResult(null); setInput(''); setPortions(1)
  }

  const confidenceColor = { high: 'var(--accent)', medium: 'var(--orange)', low: 'var(--danger)' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, background: 'var(--bg)' }}>

      <div style={{ padding: '20px 20px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Arabic Recipe AI</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Describe any Arabic dish — AI estimates macros</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Describe your dish</div>
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="مثال: كبسة دجاج مع أرز بالزعفران والبهارات&#10;Or in English: Chicken kabsa with saffron rice"
            rows={3}
            style={{
              width: '100%', padding: '14px', resize: 'none',
              background: 'var(--bg-input)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 15,
              fontFamily: 'inherit', lineHeight: 1.6, direction: 'auto',
            }}
          />
          <button
            onClick={analyzeRecipe}
            disabled={!input.trim() || loading}
            style={{
              width: '100%', marginTop: 10, padding: '14px',
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-card-2)',
              borderRadius: 'var(--radius-sm)', color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
              fontSize: 15, fontWeight: 700, boxShadow: input.trim() && !loading ? 'var(--shadow-accent)' : 'none',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Analyzing…
              </span>
            ) : '✦ Analyze with AI'}
          </button>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8, padding: '8px 12px', background: 'var(--danger-dim)', borderRadius: 8 }}>{error}</div>}
        </div>

        {!result && !loading && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.08em', marginBottom: 12 }}>TRY THESE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setInput(ex)} style={{ padding: '7px 12px', background: 'var(--bg-card-2)', borderRadius: 99, fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'inherit' }}>{ex}</button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }} className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{result.dish_name_english}</div>
                  <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 4 }}>{result.dish_name_arabic}</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${confidenceColor[result.confidence]}20`, color: confidenceColor[result.confidence], border: `1px solid ${confidenceColor[result.confidence]}40`, flexShrink: 0, marginLeft: 10 }}>
                  {result.confidence} confidence
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{result.description}</div>
            </div>

            <div style={{ background: 'var(--accent-dim)', borderRadius: 14, padding: '16px', marginBottom: 14, textAlign: 'center', border: '1px solid var(--accent-glow)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: 4 }}>PER {result.serving_size?.toUpperCase()}</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.06em', lineHeight: 1 }}>{Math.round(result.calories * portions)}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>calories</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {[['Protein', result.protein, 'var(--blue)'], ['Carbs', result.carbs, 'var(--orange)'], ['Fat', result.fat, 'var(--purple)']].map(([label, value, color]) => (
                <div key={label} style={{ background: 'var(--bg-card-2)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{Math.round(value * portions)}g</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 14px', background: 'var(--bg-card-2)', borderRadius: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Portions</span>
              <button onClick={() => setPortions(p => Math.max(0.5, p - 0.5))} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 800, minWidth: 36, textAlign: 'center' }}>{portions}</span>
              <button onClick={() => setPortions(p => p + 0.5)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>

            {result.main_ingredients?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hint)', letterSpacing: '0.08em', marginBottom: 8 }}>MAIN INGREDIENTS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.main_ingredients.map(ing => (
                    <span key={ing} style={{ padding: '5px 12px', background: 'var(--bg-card-2)', borderRadius: 99, fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{ing}</span>
                  ))}
                </div>
              </div>
            )}

            {result.cooking_notes && (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                💡 {result.cooking_notes}
              </div>
            )}

            {result.tips && (
              <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                ✦ {result.tips}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addToLog} style={{ flex: 2, padding: '14px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>+ Add to today's log</button>
              <button onClick={() => { setResult(null); setInput('') }} style={{ flex: 1, padding: '14px', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 14, border: '1px solid var(--border)' }}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
