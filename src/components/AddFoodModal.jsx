import { useState, useRef } from 'react'
import UpgradeScreen from '../pages/UpgradeScreen.jsx'
import { useScanLimit } from '../hooks/useScanLimit.js'

const ARABIC_FOODS = [
  // Staples
  { name: 'تمر (Dates)', calories: 277, protein: 1.8, carbs: 75, fat: 0.2, per: '100g' },
  { name: 'خبز عربي (Arabic bread)', calories: 165, protein: 5.5, carbs: 33, fat: 0.7, per: '1 piece' },
  { name: 'أرز بسمتي (Basmati rice)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, per: '1 cup cooked' },
  { name: 'لبن (Laban)', calories: 60, protein: 3.4, carbs: 4.8, fat: 3.2, per: '1 cup' },
  { name: 'خبز تنور (Tandoor bread)', calories: 145, protein: 5, carbs: 29, fat: 1.2, per: '1 piece' },
  // Rice dishes
  { name: 'كبسة دجاج (Chicken Kabsa)', calories: 320, protein: 18, carbs: 38, fat: 9, per: '1 serving' },
  { name: 'مندي دجاج (Chicken Mandi)', calories: 380, protein: 28, carbs: 42, fat: 10, per: '1 serving' },
  { name: 'مندي لحم (Lamb Mandi)', calories: 420, protein: 30, carbs: 42, fat: 14, per: '1 serving' },
  { name: 'برياني دجاج (Chicken Biryani)', calories: 350, protein: 20, carbs: 45, fat: 10, per: '1 serving' },
  { name: 'مجبوس (Machboos)', calories: 340, protein: 22, carbs: 40, fat: 10, per: '1 serving' },
  { name: 'أرز بالخضار (Vegetable rice)', calories: 220, protein: 5, carbs: 44, fat: 3, per: '1 cup' },
  // Dips & sides
  { name: 'حمص (Hummus)', calories: 166, protein: 8, carbs: 14, fat: 10, per: '100g' },
  { name: 'فول مدمس (Foul)', calories: 110, protein: 8, carbs: 18, fat: 0.5, per: '1 cup' },
  { name: 'متبل (Mutabbal)', calories: 90, protein: 2.5, carbs: 8, fat: 5.5, per: '100g' },
  { name: 'تبولة (Tabbouleh)', calories: 70, protein: 2, carbs: 10, fat: 3, per: '100g' },
  { name: 'فتوش (Fattoush)', calories: 85, protein: 2, carbs: 12, fat: 3.5, per: '1 bowl' },
  { name: 'لبنة (Labneh)', calories: 160, protein: 8, carbs: 4, fat: 12, per: '100g' },
  { name: 'زيتون (Olives)', calories: 115, protein: 0.8, carbs: 6, fat: 10, per: '100g' },
  // Street food & wraps
  { name: 'شاورما دجاج (Chicken shawarma)', calories: 290, protein: 24, carbs: 22, fat: 11, per: '1 wrap' },
  { name: 'شاورما لحم (Meat shawarma)', calories: 340, protein: 22, carbs: 24, fat: 16, per: '1 wrap' },
  { name: 'فلافل (Falafel)', calories: 57, protein: 2.3, carbs: 5.4, fat: 3, per: '1 piece' },
  { name: 'سمبوسة (Sambosa)', calories: 120, protein: 4, carbs: 14, fat: 6, per: '1 piece' },
  { name: 'كباب (Kebab)', calories: 220, protein: 20, carbs: 5, fat: 14, per: '2 skewers' },
  { name: 'كفتة (Kofta)', calories: 240, protein: 18, carbs: 6, fat: 16, per: '2 pieces' },
  { name: 'مطبق (Mutabbaq)', calories: 280, protein: 10, carbs: 32, fat: 14, per: '1 piece' },
  // Soups & stews
  { name: 'شوربة عدس (Lentil soup)', calories: 130, protein: 9, carbs: 20, fat: 2, per: '1 bowl' },
  { name: 'شوربة دجاج (Chicken soup)', calories: 95, protein: 10, carbs: 8, fat: 2.5, per: '1 bowl' },
  { name: 'هريسة (Harees)', calories: 210, protein: 12, carbs: 30, fat: 5, per: '1 bowl' },
  { name: 'مرقة لحم (Lamb stew)', calories: 180, protein: 16, carbs: 10, fat: 8, per: '1 bowl' },
  // Grilled & meat
  { name: 'دجاج مشوي (Grilled chicken)', calories: 165, protein: 31, carbs: 0, fat: 3.6, per: '100g' },
  { name: 'سمك مشوي (Grilled fish)', calories: 140, protein: 26, carbs: 0, fat: 3.5, per: '100g' },
  { name: 'لحم مشوي (Grilled lamb)', calories: 250, protein: 26, carbs: 0, fat: 16, per: '100g' },
  { name: 'جمبري مشوي (Grilled shrimp)', calories: 99, protein: 24, carbs: 0, fat: 0.3, per: '100g' },
  // Breakfast
  { name: 'بيض مقلي (Fried eggs)', calories: 90, protein: 6, carbs: 0.4, fat: 7, per: '1 egg' },
  { name: 'فول نابت (Bean sprouts)', calories: 45, protein: 4, carbs: 6, fat: 0.5, per: '1 cup' },
  { name: 'جبن أبيض (White cheese)', calories: 260, protein: 14, carbs: 2, fat: 22, per: '100g' },
  { name: 'عسل (Honey)', calories: 304, protein: 0.3, carbs: 82, fat: 0, per: '100g' },
  { name: 'قشطة (Qishta cream)', calories: 195, protein: 3, carbs: 4, fat: 19, per: '100g' },
  // Sweets & desserts
  { name: 'كنافة (Kunafa)', calories: 380, protein: 8, carbs: 52, fat: 17, per: '1 serving' },
  { name: 'بقلاوة (Baklava)', calories: 334, protein: 5, carbs: 40, fat: 18, per: '2 pieces' },
  { name: 'أم علي (Om Ali)', calories: 350, protein: 8, carbs: 42, fat: 18, per: '1 bowl' },
  { name: 'لقيمات (Luqaimat)', calories: 65, protein: 1.2, carbs: 9, fat: 3, per: '1 piece' },
  { name: 'حلوى تمر (Date sweet)', calories: 320, protein: 3, carbs: 62, fat: 8, per: '100g' },
  // Drinks
  { name: 'قهوة عربية (Arabic coffee)', calories: 5, protein: 0.2, carbs: 0.8, fat: 0.1, per: '1 cup' },
  { name: 'شاي بالحليب (Tea with milk)', calories: 45, protein: 2, carbs: 6, fat: 1.5, per: '1 cup' },
  { name: 'عصير تمر هندي (Tamarind juice)', calories: 120, protein: 0.5, carbs: 30, fat: 0.1, per: '1 cup' },
  { name: 'لبن (Laban drink)', calories: 60, protein: 3.4, carbs: 4.8, fat: 3.2, per: '1 cup' },
  { name: 'ماء زهر (Rose water drink)', calories: 20, protein: 0, carbs: 5, fat: 0, per: '1 cup' },
]

const QUICK_FOODS = {
  '🥚 Breakfast': [
    { name: 'Egg (boiled)', calories: 78, protein: 6, carbs: 0.6, fat: 5, per: '1 egg' },
    { name: 'Egg (fried)', calories: 90, protein: 6, carbs: 0.4, fat: 7, per: '1 egg' },
    { name: 'Whole milk', calories: 149, protein: 8, carbs: 12, fat: 8, per: '1 cup' },
    { name: 'White bread', calories: 79, protein: 2.7, carbs: 15, fat: 1, per: '1 slice' },
    { name: 'Butter', calories: 102, protein: 0.1, carbs: 0, fat: 11.5, per: '1 tbsp' },
    { name: 'Labneh', calories: 45, protein: 3, carbs: 2, fat: 3, per: '1 tbsp' },
    { name: 'Cheese slice', calories: 113, protein: 7, carbs: 0.4, fat: 9, per: '1 slice' },
    { name: 'Oats (cooked)', calories: 166, protein: 6, carbs: 28, fat: 4, per: '1 cup' },
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, per: '1 medium' },
    { name: 'Orange juice', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, per: '1 cup' },
  ],
  '🍗 Protein': [
    { name: 'Chicken breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, per: '100g' },
    { name: 'Chicken thigh (grilled)', calories: 209, protein: 26, carbs: 0, fat: 11, per: '100g' },
    { name: 'Tuna (canned)', calories: 116, protein: 26, carbs: 0, fat: 1, per: '100g' },
    { name: 'Salmon (grilled)', calories: 208, protein: 20, carbs: 0, fat: 13, per: '100g' },
    { name: 'Ground beef (lean)', calories: 215, protein: 26, carbs: 0, fat: 12, per: '100g' },
    { name: 'Shrimp (cooked)', calories: 99, protein: 24, carbs: 0, fat: 0.3, per: '100g' },
    { name: 'Eggs (2 scrambled)', calories: 182, protein: 12, carbs: 1.6, fat: 14, per: '2 eggs' },
    { name: 'Greek yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, per: '170g' },
  ],
  '🍚 Carbs': [
    { name: 'White rice (cooked)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, per: '1 cup' },
    { name: 'Brown rice (cooked)', calories: 216, protein: 5, carbs: 45, fat: 1.8, per: '1 cup' },
    { name: 'Pasta (cooked)', calories: 220, protein: 8, carbs: 43, fat: 1.3, per: '1 cup' },
    { name: 'Potato (boiled)', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, per: '100g' },
    { name: 'Sweet potato', calories: 103, protein: 2.3, carbs: 24, fat: 0.1, per: '100g' },
    { name: 'Pita bread', calories: 165, protein: 5.5, carbs: 33, fat: 0.7, per: '1 piece' },
    { name: 'Tortilla wrap', calories: 146, protein: 3.8, carbs: 25, fat: 3.5, per: '1 wrap' },
  ],
  '🥗 Vegetables': [
    { name: 'Salad (mixed greens)', calories: 15, protein: 1.3, carbs: 2.5, fat: 0.2, per: '1 cup' },
    { name: 'Tomato', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, per: '1 medium' },
    { name: 'Cucumber', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, per: '1 cup' },
    { name: 'Broccoli (steamed)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, per: '1 cup' },
    { name: 'Olive oil', calories: 119, protein: 0, carbs: 0, fat: 13.5, per: '1 tbsp' },
  ],
  '🍎 Fruits': [
    { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, per: '1 medium' },
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, per: '1 medium' },
    { name: 'Mango', calories: 135, protein: 1.1, carbs: 35, fat: 0.6, per: '1 cup' },
    { name: 'Watermelon', calories: 86, protein: 1.7, carbs: 22, fat: 0.4, per: '2 cups' },
    { name: 'Grapes', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, per: '1 cup' },
    { name: 'Strawberries', calories: 49, protein: 1, carbs: 12, fat: 0.5, per: '1 cup' },
  ],
  '🥤 Drinks': [
    { name: 'Water', calories: 0, protein: 0, carbs: 0, fat: 0, per: '1 glass' },
    { name: 'Black coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, per: '1 cup' },
    { name: 'Coffee with milk', calories: 58, protein: 3, carbs: 5, fat: 2.5, per: '1 cup' },
    { name: 'Green tea', calories: 2, protein: 0, carbs: 0.5, fat: 0, per: '1 cup' },
    { name: 'Orange juice', calories: 112, protein: 1.7, carbs: 26, fat: 0.5, per: '1 cup' },
    { name: 'Protein shake', calories: 130, protein: 25, carbs: 5, fat: 2, per: '1 scoop' },
  ],
  '🍔 Fast food': [
    { name: 'Burger (plain)', calories: 354, protein: 20, carbs: 29, fat: 17, per: '1 burger' },
    { name: 'Fries (medium)', calories: 365, protein: 4, carbs: 48, fat: 17, per: '1 serving' },
    { name: 'Pizza slice', calories: 285, protein: 12, carbs: 36, fat: 10, per: '1 slice' },
    { name: 'Hot dog', calories: 290, protein: 10, carbs: 24, fat: 17, per: '1 hot dog' },
    { name: 'Fried chicken piece', calories: 320, protein: 22, carbs: 14, fat: 19, per: '1 piece' },
  ],
  '🍫 Snacks': [
    { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, per: '28g (handful)' },
    { name: 'Chocolate (dark)', calories: 170, protein: 2, carbs: 13, fat: 12, per: '30g' },
    { name: 'Chips', calories: 152, protein: 2, carbs: 15, fat: 10, per: '28g' },
    { name: 'Protein bar', calories: 200, protein: 20, carbs: 22, fat: 6, per: '1 bar' },
    { name: 'Yogurt (plain)', calories: 100, protein: 5, carbs: 11, fat: 4, per: '170g' },
  ],
}

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
  const [selected, setSelected] = useState(null)
  const [portion, setPortion] = useState(isEdit ? (editEntry.portion || 100) : 100)
  const [meal, setMeal] = useState(isEdit ? (editEntry.meal || getCurrentMeal()) : getCurrentMeal())
  const [custom, setCustom] = useState(isEdit ? {
    name: editEntry.name, calories: editEntry.calories,
    protein: editEntry.protein, carbs: editEntry.carbs, fat: editEntry.fat
  } : { name: '', calories: '', protein: '', carbs: '', fat: '' })
  const cameraRef = useRef()

  const { canScan, scansLeft, isPremium, incrementScan } = useScanLimit(user)

  async function searchFood(val) {
    const q = val ?? query
    if (!q.trim()) return
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_USDA_API_KEY
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=25&api_key=${apiKey}`)
      const data = await res.json()
      const toProperCase = (str) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
      const seen = new Set()
      const items = (data.foods || [])
        .filter(f => f.foodNutrients)
        .map(f => {
          const get = (name) => {
            const n = f.foodNutrients.find(n => n.nutrientName?.toLowerCase().includes(name))
            return Math.round((n?.value || 0) * 10) / 10
          }
          return {
            name: toProperCase(f.description),
            calories: Math.round(get('energy') || get('calorie')),
            protein: get('protein'),
            carbs: get('carbohydrate'),
            fat: get('total lipid'),
            per: '100g'
          }
        })
        .filter(f => f.calories > 0)
        .filter(f => {
          const key = f.name.split(',')[0].trim().toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 10)
      setResults(items)
    } catch(err) { console.log('search error:', err); setResults([]) }
    setLoading(false)
  }

  async function handleAIScan(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!canScan) {
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
      await incrementScan()
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
            {[['search', '🔍'], ['quick', '⚡'], ['arabic', '🌙'], ['scan', '📸'], ['custom', '✏️']].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 13, fontWeight: 500,
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
                onChange={e => { setQuery(e.target.value); if (e.target.value.length > 2) searchFood(e.target.value) }} />
              <button onClick={() => searchFood()} style={{ padding: '12px 16px', background: '#a8e063', borderRadius: 10, color: '#0e0e0f', fontWeight: 500 }}>
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

        {tab === 'quick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(QUICK_FOODS).map(([category, foods]) => (
              <div key={category}>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {foods.map((item, i) => (
                    <button key={i} onClick={() => selectFood(item)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, textAlign: 'left', width: '100%'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: '#f0f0f0', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#555' }}>{item.per} · P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#a8e063', marginLeft: 10, flexShrink: 0 }}>{item.calories}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
            {!isPremium && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: canScan ? '#888' : '#ff6b6b' }}>
                {canScan ? `${scansLeft} free scan${scansLeft !== 1 ? 's' : ''} remaining` : '0 free scans left — upgrade to continue'}
              </div>
            )}
            {isPremium && (
              <div style={{ background: 'rgba(168,224,99,0.08)', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#a8e063' }}>
                ✨ Pro — unlimited scans
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
                <button onClick={() => !canScan ? setShowUpgrade(true) : cameraRef.current?.click()} style={{
                  width: '100%', padding: '15px',
                  background: !canScan ? 'rgba(168,224,99,0.15)' : '#a8e063',
                  borderRadius: 14, color: !canScan ? '#a8e063' : '#0e0e0f', fontSize: 16, fontWeight: 600,
                  border: !canScan ? '1px solid rgba(168,224,99,0.3)' : 'none'
                }}>
                  {!canScan ? '✨ Upgrade to scan' : '📷 Take photo'}
                </button>
                {canScan && (
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
      {showUpgrade && <UpgradeScreen onClose={() => setShowUpgrade(false)} scansUsed={3 - scansLeft} user={user} />}
    </div>
  )
}
