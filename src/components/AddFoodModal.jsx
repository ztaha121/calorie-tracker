import { useState, useRef } from 'react'
import UpgradeScreen from '../pages/UpgradeScreen.jsx'

const ARABIC_FOODS = [
  { name: 'تمر (Dates)', calories: 277, protein: 1.8, carbs: 75, fat: 0.2, per: '100g' },
  { name: 'كبسة (Kabsa)', calories: 320, protein: 18, carbs: 38, fat: 9, per: '1 serving' },
  { name: 'فول مدمس (Foul)', calories: 110, protein: 8, carbs: 18, fat: 0.5, per: '1 cup' },
  { name: 'خبز عربي (Arabic bread)', calories: 165, protein: 5.5, carbs: 33, fat: 0.7, per: '1 piece' },
  { name: 'حمص (Hummus)', calories: 166, protein: 8, carbs: 14, fat: 10, per: '100g' },
  { name: 'شاورما دجاج (Chicken shawarma)', calories: 290, protein: 24, carbs: 22, fat: 11, per: '1 wrap' },
  { name: 'أرز بسمتي (Basmati rice)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, per: '1 cup cooked' },
  { name: 'لبن (Laban)', calories: 60, protein: 3.4, carbs: 4.8, fat: 3.2, per: '1 cup' },
  { name: 'مندي دجاج (Chicken Mandi)', calories: 380, protein: 28, carbs: 42, fat: 10, per: '1 serving' },
  { name: 'شوربة عدس (Lentil soup)', calories: 130, protein: 9, carbs: 20, fat: 2, per: '1 bowl' },
  { name: 'فلافل (Falafel)', calories: 57, protein: 2.3, carbs: 5.4, fat: 3, per: '1 piece' },
]

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function getCurrentMeal() {
  const h = new Date().getHours()
  if (h < 10) return 'Breakfast'
  if (h < 14) return 'Lunch'
  if (h < 19) return 'Dinner'
  return 'Snack'
}

export default function AddFoodModal({ onAdd, onClose, editEntry, user }) {
  const isEdit = !!editEntry
  const [tab, setTab] = useState(isEdit ? 'custom' : 'search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [scansUsed, setScansUsed] = useState(() => Number(localStorage.getItem('scan_count') || 0))
  const [selected, setSelected] = useState(null)
  const [portion, setPortion] = useState(isEdit ? (editEntry.portion || 100) : 100)
  const [meal, setMeal] = useState(isEdit ? (editEntry.meal || getCurrentMeal()) : getCurrentMeal())
  const [custom, setCustom] = useState(isEdit ? {
    name: editEntry.name, calories: editEntry.calories,
    protein: editEntry.protein, carbs: editEntry.carbs, fat: editEntry.fat
  } : { name: '', calories: '', protein: '', carbs: '', fat: '' })
  const cameraRef = useRef()

  async function searchFood() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`)
      const data = await res.json()
      const items = (data.products || [])
        .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
        .map(p => ({
          name: p.product_name,
          calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          protein: Math.round(p.nutriments.proteins_100g || 0),
          carbs: Math.round(p.nutriments.carbohydrates_100g || 0),
          fat: Math.round(p.nutriments.fat_100g || 0),
          per: '100g'
        }))
      setResults(items)
    } catch { setResults([]) }
    setLoading(false)
  }

  async function handleAIScan(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user && scansUsed >= 3) {
      setShowUpgrade(true)
      return
    }
    setAiError('')
    setAiLoading(true)
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const response = await fetch('https://rnwsnnvdgsxqamvofhno.supabase.co/functions/v1/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: file.type, userId: user?.id })
      })
      const food = await response.json()
      if (food.error === 'UPGRADE_REQUIRED') {
        setShowUpgrade(true)
        setAiLoading(false)
        return
      }
      if (food.error) throw new Error(food.error)
      const newCount = scansUsed + 1
      localStorage.setItem('scan_count', newCount)
      setScansUsed(newCount)
      setSelected(food)
      setPortion(100)
      setTab('confirm')
    } catch {
      setAiError('Could not identify food. Try the custom tab.')
    }
    setAiLoading(false)
  }

  function selectFood(item) {
    setSelected(item)
    setPortion(100)
    setTab('confirm')
  }

  function getScaled(item, p) {
    const ratio = p / 100
    return {
      calories: Math.round((Number(item.calories) || 0) * ratio),
      protein: Math.round((Number(item.protein) || 0) * ratio * 10) / 10,
      carbs: Math.round((Number(item.carbs) || 0) * ratio * 10) / 10,
      fat: Math.round((Number(item.fat) || 0) * ratio * 10) / 10,
    }
  }

  function confirmAdd() {
    if (!selected) return
    const scaled = getScaled(selected, portion)
    onAdd({ ...selected, ...scaled, portion, meal, per: `${portion}g` })
  }

  function addCustomDirect() {
    if (!custom.name || !custom.calories) return
    onAdd({
      name: custom.name, calories: Number(custom.calories),
      protein: Number(custom.protein) || 0, carbs: Number(custom.carbs) || 0,
      fat: Number(custom.fat) || 0, meal, per: '1 serving'
    })
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#f0f0f0', fontSize: 15
  }

  const scaled = selected ? getScaled(selected, portion) : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: '#1a1a1c', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '90dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 500 }}>{isEdit ? 'Edit entry' : 'Add food'}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, width: 32, height: 32, color: '#f0f0f0', fontSize: 18 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {MEAL_TYPES.map(m => (
            <button key={m} onClick={() => setMeal(m)} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              background: meal === m ? '#a8e063' : 'rgba(255,255,255,0.06)',
              color: meal === m ? '#0e0e0f' : '#666'
            }}>{m}</button>
          ))}
        </div>

        {tab !== 'confirm' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['search', '🔍 Search'], ['arabic', '🌙 Arabic'], ['scan', '📸 AI Scan'], ['custom', '✏️ Custom']].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                background: tab === t ? '#a8e063' : 'rgba(255,255,255,0.06)',
                color: tab === t ? '#0e0e0f' : '#888'
              }}>{label}</button>
            ))}
          </div>
        )}

        {tab === 'search' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Search food..." value={query}
                onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchFood()} />
              <button onClick={searchFood} style={{ padding: '12px 16px', background: '#a8e063', borderRadius: 10, color: '#0e0e0f', fontWeight: 500 }}>
                {loading ? '...' : 'Go'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map((item, i) => (
                <button key={i} onClick={() => selectFood(item)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'left', width: '100%'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 500, color: '#a8e063', marginLeft: 12, flexShrink: 0 }}>{item.calories}</div>
                </button>
              ))}
              {results.length === 0 && query && !loading && (
                <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No results. Try the custom tab.</p>
              )}
            </div>
          </>
        )}

        {tab === 'arabic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ARABIC_FOODS.map((item, i) => (
              <button key={i} onClick={() => selectFood(item)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'left', width: '100%'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0', marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 500, color: '#a8e063', marginLeft: 12 }}>{item.calories}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
            {!user && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: scansUsed >= 3 ? '#ff6b6b' : '#888' }}>
                {scansUsed >= 3 ? '0 free scans left — upgrade to continue' : `${3 - scansUsed} free scan${3 - scansUsed !== 1 ? 's' : ''} remaining`}
              </div>
            )}
            {aiLoading ? (
              <>
                <div style={{ fontSize: 48 }}>🤖</div>
                <div style={{ fontSize: 15, color: '#888' }}>Analyzing your food...</div>
                <div style={{ fontSize: 13, color: '#555' }}>This takes a few seconds</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48 }}>📸</div>
                <div style={{ fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                  Take a photo of your meal and AI will identify the food and estimate the calories.
                </div>
                {aiError && <p style={{ color: '#ff6b6b', fontSize: 13, textAlign: 'center' }}>{aiError}</p>}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleAIScan} />
                <button onClick={() => scansUsed >= 3 && !user ? setShowUpgrade(true) : cameraRef.current?.click()} style={{
                  width: '100%', padding: '15px', background: scansUsed >= 3 && !user ? 'rgba(168,224,99,0.15)' : '#a8e063',
                  borderRadius: 14, color: scansUsed >= 3 && !user ? '#a8e063' : '#0e0e0f', fontSize: 16, fontWeight: 600,
                  border: scansUsed >= 3 && !user ? '1px solid rgba(168,224,99,0.3)' : 'none'
                }}>
                  {scansUsed >= 3 && !user ? '✨ Upgrade to scan' : '📷 Take photo'}
                </button>
                {!(scansUsed >= 3 && !user) && (
                  <button onClick={() => { if (cameraRef.current) { cameraRef.current.removeAttribute('capture'); cameraRef.current.click() } }} style={{
                    width: '100%', padding: '13px', background: 'rgba(255,255,255,0.06)', borderRadius: 14, color: '#888', fontSize: 14
                  }}>🖼️ Choose from gallery</button>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={inputStyle} placeholder="Food name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input style={inputStyle} placeholder="Calories" type="number" value={custom.calories} onChange={e => setCustom(p => ({ ...p, calories: e.target.value }))} />
              <input style={inputStyle} placeholder="Protein (g)" type="number" value={custom.protein} onChange={e => setCustom(p => ({ ...p, protein: e.target.value }))} />
              <input style={inputStyle} placeholder="Carbs (g)" type="number" value={custom.carbs} onChange={e => setCustom(p => ({ ...p, carbs: e.target.value }))} />
              <input style={inputStyle} placeholder="Fat (g)" type="number" value={custom.fat} onChange={e => setCustom(p => ({ ...p, fat: e.target.value }))} />
            </div>
            <button onClick={addCustomDirect} style={{
              marginTop: 4, padding: '13px', background: '#a8e063', borderRadius: 12,
              color: '#0e0e0f', fontWeight: 600, fontSize: 15
            }}>{isEdit ? 'Save changes' : 'Add food'}</button>
          </div>
        )}

        {tab === 'confirm' && selected && scaled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#f0f0f0', marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: '#666' }}>Adjust portion size below</div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: '#888' }}>Portion size</span>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#f0f0f0' }}>{portion}g</span>
              </div>
              <input type="range" min="10" max="500" step="5" value={portion}
                onChange={e => setPortion(Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444', marginTop: 4 }}>
                <span>10g</span><span>100g</span><span>250g</span><span>500g</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Cal', scaled.calories, '#a8e063', ''], ['Pro', scaled.protein, '#f0f0f0', 'g'], ['Carb', scaled.carbs, '#ffd166', 'g'], ['Fat', scaled.fat, '#ff9f68', 'g']].map(([label, val, color, unit]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 500, color }}>{val}{unit}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTab('search')} style={{
                flex: 1, padding: '13px', background: 'rgba(255,255,255,0.06)',
                borderRadius: 12, color: '#888', fontSize: 14
              }}>← Back</button>
              <button onClick={confirmAdd} style={{
                flex: 2, padding: '13px', background: '#a8e063',
                borderRadius: 12, color: '#0e0e0f', fontWeight: 600, fontSize: 15
              }}>Add to {meal}</button>
            </div>
          </div>
        )}
      </div>
      {showUpgrade && <UpgradeScreen onClose={() => setShowUpgrade(false)} scansUsed={scansUsed} />}
    </div>
  )
}