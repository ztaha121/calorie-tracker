import { useState, useRef, useEffect } from 'react'
import UpgradeScreen from '../pages/UpgradeScreen.jsx'
import { useScanLimit } from '../hooks/useScanLimit.js'
import BarcodeScanner from './BarcodeScanner.jsx'

const ARABIC_FOODS = [
  { name: 'تمر (Dates)', calories: 277, protein: 1.8, carbs: 75, fat: 0.2, per: '100g' },
  { name: 'خبز عربي (Arabic bread)', calories: 165, protein: 5.5, carbs: 33, fat: 0.7, per: '1 piece' },
  { name: 'أرز بسمتي (Basmati rice)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, per: '1 cup cooked' },
  { name: 'لبن (Laban)', calories: 60, protein: 3.4, carbs: 4.8, fat: 3.2, per: '1 cup' },
  { name: 'خبز تنور (Tandoor bread)', calories: 145, protein: 5, carbs: 29, fat: 1.2, per: '1 piece' },
  { name: 'كبسة دجاج (Chicken Kabsa)', calories: 320, protein: 18, carbs: 38, fat: 9, per: '1 serving' },
  { name: 'مندي دجاج (Chicken Mandi)', calories: 380, protein: 28, carbs: 42, fat: 10, per: '1 serving' },
  { name: 'مندي لحم (Lamb Mandi)', calories: 420, protein: 30, carbs: 42, fat: 14, per: '1 serving' },
  { name: 'برياني دجاج (Chicken Biryani)', calories: 350, protein: 20, carbs: 45, fat: 10, per: '1 serving' },
  { name: 'مجبوس (Machboos)', calories: 340, protein: 22, carbs: 40, fat: 10, per: '1 serving' },
  { name: 'حمص (Hummus)', calories: 166, protein: 8, carbs: 14, fat: 10, per: '100g' },
  { name: 'فول مدمس (Foul)', calories: 110, protein: 8, carbs: 18, fat: 0.5, per: '1 cup' },
  { name: 'متبل (Mutabbal)', calories: 90, protein: 2.5, carbs: 8, fat: 5.5, per: '100g' },
  { name: 'تبولة (Tabbouleh)', calories: 70, protein: 2, carbs: 10, fat: 3, per: '100g' },
  { name: 'لبنة (Labneh)', calories: 160, protein: 8, carbs: 4, fat: 12, per: '100g' },
  { name: 'شاورما دجاج (Chicken shawarma)', calories: 290, protein: 24, carbs: 22, fat: 11, per: '1 wrap' },
  { name: 'شاورما لحم (Meat shawarma)', calories: 340, protein: 22, carbs: 24, fat: 16, per: '1 wrap' },
  { name: 'فلافل (Falafel)', calories: 57, protein: 2.3, carbs: 5.4, fat: 3, per: '1 piece' },
  { name: 'سمبوسة (Sambosa)', calories: 120, protein: 4, carbs: 14, fat: 6, per: '1 piece' },
  { name: 'كباب (Kebab)', calories: 220, protein: 20, carbs: 5, fat: 14, per: '2 skewers' },
  { name: 'شوربة عدس (Lentil soup)', calories: 130, protein: 9, carbs: 20, fat: 2, per: '1 bowl' },
  { name: 'هريسة (Harees)', calories: 210, protein: 12, carbs: 30, fat: 5, per: '1 bowl' },
  { name: 'دجاج مشوي (Grilled chicken)', calories: 165, protein: 31, carbs: 0, fat: 3.6, per: '100g' },
  { name: 'سمك مشوي (Grilled fish)', calories: 140, protein: 26, carbs: 0, fat: 3.5, per: '100g' },
  { name: 'لحم مشوي (Grilled lamb)', calories: 250, protein: 26, carbs: 0, fat: 16, per: '100g' },
  { name: 'كنافة (Kunafa)', calories: 380, protein: 8, carbs: 52, fat: 17, per: '1 serving' },
  { name: 'بقلاوة (Baklava)', calories: 334, protein: 5, carbs: 40, fat: 18, per: '2 pieces' },
  { name: 'لقيمات (Luqaimat)', calories: 65, protein: 1.2, carbs: 9, fat: 3, per: '1 piece' },
  { name: 'قهوة عربية (Arabic coffee)', calories: 5, protein: 0.2, carbs: 0.8, fat: 0.1, per: '1 cup' },
  { name: 'شاي بالحليب (Tea with milk)', calories: 45, protein: 2, carbs: 6, fat: 1.5, per: '1 cup' },
  { name: 'طاجين دجاج (Chicken Tagine)', calories: 280, protein: 24, carbs: 18, fat: 12, per: '1 serving' },
  { name: 'كسكس (Couscous)', calories: 176, protein: 6, carbs: 36, fat: 0.3, per: '1 cup cooked' },
  { name: 'حريرة (Harira soup)', calories: 120, protein: 7, carbs: 18, fat: 2.5, per: '1 bowl' },
  { name: 'خبز مغربي (Moroccan bread)', calories: 155, protein: 5, carbs: 30, fat: 2, per: '1 piece' },
  { name: 'شاي بالنعناع (Mint tea)', calories: 60, protein: 0, carbs: 15, fat: 0, per: '1 glass' },
]

const QUICK_FOODS = {
  '🥚 Breakfast': [
    { name: 'Egg (boiled)', calories: 78, protein: 6, carbs: 0.6, fat: 5, per: '1 egg' },
    { name: 'Egg (fried)', calories: 90, protein: 6, carbs: 0.4, fat: 7, per: '1 egg' },
    { name: 'Whole milk', calories: 149, protein: 8, carbs: 12, fat: 8, per: '1 cup' },
    { name: 'White bread', calories: 79, protein: 2.7, carbs: 15, fat: 1, per: '1 slice' },
    { name: 'Butter', calories: 102, protein: 0.1, carbs: 0, fat: 11.5, per: '1 tbsp' },
    { name: 'Oats (cooked)', calories: 166, protein: 6, carbs: 28, fat: 4, per: '1 cup' },
    { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, per: '1 medium' },
  ],
  '🍗 Protein': [
    { name: 'Chicken breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, per: '100g' },
    { name: 'Tuna (canned)', calories: 116, protein: 26, carbs: 0, fat: 1, per: '100g' },
    { name: 'Salmon (grilled)', calories: 208, protein: 20, carbs: 0, fat: 13, per: '100g' },
    { name: 'Ground beef (lean)', calories: 215, protein: 26, carbs: 0, fat: 12, per: '100g' },
    { name: 'Greek yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, per: '170g' },
  ],
  '🍚 Carbs': [
    { name: 'White rice (cooked)', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, per: '1 cup' },
    { name: 'Brown rice (cooked)', calories: 216, protein: 5, carbs: 45, fat: 1.8, per: '1 cup' },
    { name: 'Pasta (cooked)', calories: 220, protein: 8, carbs: 43, fat: 1.3, per: '1 cup' },
    { name: 'Potato (boiled)', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, per: '100g' },
    { name: 'Pita bread', calories: 165, protein: 5.5, carbs: 33, fat: 0.7, per: '1 piece' },
  ],
  '🥗 Vegetables': [
    { name: 'Salad (mixed greens)', calories: 15, protein: 1.3, carbs: 2.5, fat: 0.2, per: '1 cup' },
    { name: 'Tomato', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, per: '1 medium' },
    { name: 'Broccoli (steamed)', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, per: '1 cup' },
    { name: 'Olive oil', calories: 119, protein: 0, carbs: 0, fat: 13.5, per: '1 tbsp' },
  ],
  '🍎 Fruits': [
    { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, per: '1 medium' },
    { name: 'Mango', calories: 135, protein: 1.1, carbs: 35, fat: 0.6, per: '1 cup' },
    { name: 'Watermelon', calories: 86, protein: 1.7, carbs: 22, fat: 0.4, per: '2 cups' },
    { name: 'Strawberries', calories: 49, protein: 1, carbs: 12, fat: 0.5, per: '1 cup' },
  ],
  '🥤 Drinks': [
    { name: 'Water', calories: 0, protein: 0, carbs: 0, fat: 0, per: '1 glass' },
    { name: 'Black coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, per: '1 cup' },
    { name: 'Green tea', calories: 2, protein: 0, carbs: 0.5, fat: 0, per: '1 cup' },
    { name: 'Protein shake', calories: 130, protein: 25, carbs: 5, fat: 2, per: '1 scoop' },
  ],
  '🍔 Fast food': [
    { name: 'Burger (plain)', calories: 354, protein: 20, carbs: 29, fat: 17, per: '1 burger' },
    { name: 'Fries (medium)', calories: 365, protein: 4, carbs: 48, fat: 17, per: '1 serving' },
    { name: 'Pizza slice', calories: 285, protein: 12, carbs: 36, fat: 10, per: '1 slice' },
    { name: 'Fried chicken piece', calories: 320, protein: 22, carbs: 14, fat: 19, per: '1 piece' },
  ],
  '🍫 Snacks': [
    { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, per: '28g (handful)' },
    { name: 'Dark chocolate', calories: 170, protein: 2, carbs: 13, fat: 12, per: '30g' },
    { name: 'Chips', calories: 152, protein: 2, carbs: 15, fat: 10, per: '28g' },
    { name: 'Protein bar', calories: 200, protein: 20, carbs: 22, fat: 6, per: '1 bar' },
  ],
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
function getCurrentMeal() {
  const h = new Date().getHours()
  if (h < 10) return 'Breakfast'; if (h < 14) return 'Lunch'; if (h < 19) return 'Dinner'; return 'Snack'
}

const TABS = [
  { id: 'search', icon: '🔍', label: 'Search' },
  { id: 'quick', icon: '⚡', label: 'Quick' },
  { id: 'arabic', icon: '🌙', label: 'Arabic' },
  { id: 'scan', icon: '✦', label: 'AI Scan' },
  { id: 'barcode', icon: '▦', label: 'Barcode' },
  { id: 'templates', icon: '⭐', label: 'Saved' },
  { id: 'custom', icon: '✏️', label: 'Custom' },
]

export default function AddFoodModal({ onAdd, onClose, editEntry, user }) {
  const isEdit = !!editEntry
  const [tab, setTab] = useState(isEdit ? 'custom' : 'search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showBarcode, setShowBarcode] = useState(false)
  const [selected, setSelected] = useState(null)
  const [portion, setPortion] = useState(isEdit ? (editEntry.portion || 100) : 100)
  const [meal, setMeal] = useState(isEdit ? (editEntry.meal || getCurrentMeal()) : getCurrentMeal())
  const [custom, setCustom] = useState(isEdit ? { name: editEntry.name, calories: editEntry.calories, protein: editEntry.protein, carbs: editEntry.carbs, fat: editEntry.fat } : { name: '', calories: '', protein: '', carbs: '', fat: '' })
  const cameraRef = useRef()
  const [barcodeLoading, setBarcodeLoading] = useState(false)
  const [barcodeError, setBarcodeError] = useState('')
  const [templates, setTemplates] = useState(() => { try { return JSON.parse(localStorage.getItem('meal_templates') || '[]') } catch { return [] } })
  const { canScan, scansLeft, isPremium, incrementScan } = useScanLimit(user)

  useEffect(() => { window._mizanSetTab = setTab; return () => { delete window._mizanSetTab } }, [])

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xs)', color: 'var(--text)', fontSize: 15
  }

  async function searchFood(val) {
    const q = val ?? query; if (!q.trim()) return
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_USDA_API_KEY
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=25&api_key=${apiKey}`)
      const data = await res.json()
      const toProperCase = (str) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
      const seen = new Set()
      const items = (data.foods || []).filter(f => f.foodNutrients).map(f => {
        const get = (name) => { const n = f.foodNutrients.find(n => n.nutrientName?.toLowerCase().includes(name)); return Math.round((n?.value || 0) * 10) / 10 }
        return { name: toProperCase(f.description), calories: Math.round(get('energy') || get('calorie')), protein: get('protein'), carbs: get('carbohydrate'), fat: get('total lipid'), per: '100g' }
      }).filter(f => f.calories > 0).filter(f => { const key = f.name.split(',')[0].trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true }).slice(0, 10)
      setResults(items)
    } catch { setResults([]) }
    setLoading(false)
  }

  async function handleAIScan(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (!canScan) { setShowUpgrade(true); return }
    setAiError(''); setAiLoading(true)
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file) })
      const response = await fetch('https://rnwsnnvdgsxqamvofhno.supabase.co/functions/v1/scan-food', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, mediaType: file.type, userId: user?.id }) })
      const food = await response.json()
      if (food.error === 'UPGRADE_REQUIRED') { setShowUpgrade(true); setAiLoading(false); return }
      if (food.error) throw new Error(food.error)
      await incrementScan(); setSelected(food); setPortion(100); setTab('confirm')
    } catch { setAiError('Could not identify food. Try the custom tab.') }
    setAiLoading(false)
  }

  async function lookupBarcode(code) {
    if (!code.trim()) return
    setBarcodeLoading(true); setBarcodeError('')
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
      const data = await res.json()
      if (data.status === 0) { setBarcodeError('Product not found.'); setBarcodeLoading(false); return }
      const p = data.product
      const food = { name: p.product_name || 'Unknown product', calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0), protein: Math.round(p.nutriments?.proteins_100g || 0), carbs: Math.round(p.nutriments?.carbohydrates_100g || 0), fat: Math.round(p.nutriments?.fat_100g || 0), per: '100g' }
      if (!food.calories) { setBarcodeError('No nutrition data for this product.'); setBarcodeLoading(false); return }
      setSelected(food); setPortion(100); setTab('confirm')
    } catch { setBarcodeError('Could not find product.') }
    setBarcodeLoading(false)
  }

  function selectFood(item) { setSelected(item); setPortion(100); setTab('confirm') }

  function getScaled(item, p) {
    const ratio = p / 100
    return { calories: Math.round((Number(item.calories)||0)*ratio), protein: Math.round((Number(item.protein)||0)*ratio*10)/10, carbs: Math.round((Number(item.carbs)||0)*ratio*10)/10, fat: Math.round((Number(item.fat)||0)*ratio*10)/10 }
  }

  function confirmAdd() {
    if (!selected) return
    const scaled = getScaled(selected, portion)
    onAdd({ ...selected, ...scaled, portion, meal, per: `${portion}g` })
  }

  function addCustomDirect() {
    if (!custom.name || !custom.calories) return
    onAdd({ name: custom.name, calories: Number(custom.calories), protein: Number(custom.protein)||0, carbs: Number(custom.carbs)||0, fat: Number(custom.fat)||0, meal, per: '1 serving' })
  }

  const scaled = selected ? getScaled(selected, portion) : null

  const FoodRow = ({ item, onSelect }) => (
    <button onClick={() => onSelect(item)} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', textAlign: 'left', width: '100%',
      transition: 'border-color 0.15s'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{item.per} · P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginLeft: 12, flexShrink: 0, fontFamily: 'var(--font-display)' }}>{item.calories}</div>
    </button>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{
        width: '100%', background: 'var(--bg-card)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '20px 20px 40px',
        maxHeight: '92dvh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            {isEdit ? 'Edit entry' : 'Log food'}
          </span>
          <button onClick={onClose} style={{
            background: 'var(--bg-input)', borderRadius: 99, width: 34, height: 34,
            color: 'var(--text-muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)'
          }}>×</button>
        </div>

        {/* Meal selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 2 }}>
          {MEAL_TYPES.map(m => (
            <button key={m} onClick={() => setMeal(m)} style={{
              padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              background: meal === m ? 'var(--accent)' : 'var(--bg-input)',
              color: meal === m ? '#0e0e0f' : 'var(--text-muted)',
              border: `1px solid ${meal === m ? 'transparent' : 'var(--border)'}`,
              fontFamily: 'var(--font-display)'
            }}>{m}</button>
          ))}
        </div>

        {/* Tab bar */}
        {tab !== 'confirm' && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {TABS.map(({ id, icon, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', flexShrink: 0,
                background: tab === id ? 'var(--accent)' : 'var(--bg-input)',
                color: tab === id ? '#0e0e0f' : 'var(--text-muted)',
                border: `1px solid ${tab === id ? 'transparent' : 'var(--border)'}`,
              }}>
                <span style={{ fontSize: tab === id ? 18 : 16 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search tab */}
        {tab === 'search' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Search food..." value={query}
                onChange={e => { setQuery(e.target.value); if (e.target.value.length > 2) searchFood(e.target.value) }} />
              <button onClick={() => searchFood()} style={{
                padding: '12px 16px', background: 'var(--accent)', borderRadius: 'var(--radius-xs)',
                color: '#0e0e0f', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)'
              }}>{loading ? '...' : 'Go'}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map((item, i) => <FoodRow key={i} item={item} onSelect={selectFood} />)}
              {results.length === 0 && query && !loading && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ color: 'var(--text-hint)', fontSize: 14, marginBottom: 14 }}>No results found for "{query}".</p>
                  <a href={`mailto:zay.taha@gmail.com?subject=Food request: ${query}&body=Hi, I couldn't find "${query}" in Mizan. Please add it!`}
                    style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--accent-dim)', borderRadius: 99, color: 'var(--accent)', fontSize: 13, fontWeight: 600, border: '1px solid var(--accent-glow)', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
                    + Request this food
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick tab */}
        {tab === 'quick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(QUICK_FOODS).map(([category, foods]) => (
              <div key={category}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {foods.map((item, i) => <FoodRow key={i} item={item} onSelect={selectFood} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Arabic tab */}
        {tab === 'arabic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ARABIC_FOODS.map((item, i) => <FoodRow key={i} item={item} onSelect={selectFood} />)}
          </div>
        )}

        {/* AI Scan tab */}
        {tab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 99,
              background: 'var(--accent-dim)', border: '2px solid var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
            }}>✦</div>
            {!isPremium && (
              <div style={{
                background: canScan ? 'var(--bg-input)' : 'var(--danger-dim)',
                borderRadius: 99, padding: '6px 16px', fontSize: 13,
                color: canScan ? 'var(--text-muted)' : 'var(--danger)',
                border: `1px solid ${canScan ? 'var(--border)' : 'var(--danger)'}`,
                fontWeight: 600
              }}>
                {canScan ? `${scansLeft} free scan${scansLeft !== 1 ? 's' : ''} left` : 'No scans left — upgrade to continue'}
              </div>
            )}
            {isPremium && (
              <div style={{ background: 'var(--accent-dim)', borderRadius: 99, padding: '6px 16px', fontSize: 13, color: 'var(--accent)', border: '1px solid var(--accent-glow)', fontWeight: 600 }}>
                ✦ Pro — unlimited scans
              </div>
            )}
            {aiLoading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 6 }}>Analyzing your food...</div>
                <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>This takes a few seconds</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
                  Take a photo of your meal and AI will identify the food and estimate calories.
                </div>
                {aiError && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{aiError}</p>}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleAIScan} />
                <button onClick={() => !canScan ? setShowUpgrade(true) : cameraRef.current?.click()} style={{
                  width: '100%', padding: '15px',
                  background: !canScan ? 'var(--accent-dim)' : 'var(--accent)',
                  borderRadius: 'var(--radius-sm)', color: !canScan ? 'var(--accent)' : '#0e0e0f',
                  fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)',
                  border: !canScan ? '1px solid var(--accent-glow)' : 'none',
                  boxShadow: canScan ? '0 4px 20px var(--accent-glow)' : 'none'
                }}>
                  {!canScan ? '✦ Upgrade to scan' : '📷 Take photo'}
                </button>
                {canScan && (
                  <button onClick={() => { if (cameraRef.current) { cameraRef.current.removeAttribute('capture'); cameraRef.current.click() } }} style={{
                    width: '100%', padding: '13px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)', fontSize: 14, border: '1px solid var(--border)'
                  }}>🖼️ Choose from gallery</button>
                )}
              </>
            )}
          </div>
        )}

        {/* Barcode tab */}
        {tab === 'barcode' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
            {barcodeLoading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>▦</div>
                <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Looking up product...</div>
              </div>
            ) : (
              <>
                <div style={{ width: 80, height: 80, borderRadius: 99, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>▦</div>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
                  Scan a product barcode to get nutrition info automatically.
                </div>
                {barcodeError && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{barcodeError}</p>}
                <button onClick={() => setShowBarcode(true)} style={{
                  width: '100%', padding: '15px', background: 'var(--accent)',
                  borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontSize: 16, fontWeight: 700,
                  fontFamily: 'var(--font-display)', boxShadow: '0 4px 20px var(--accent-glow)'
                }}>📷 Open barcode scanner</button>
                <div style={{ width: '100%', display: 'flex', gap: 8 }}>
                  <input style={{ flex: 1, ...inputStyle }} placeholder="Or type barcode number..." type="number" id="barcodeInput"
                    onKeyDown={e => e.key === 'Enter' && lookupBarcode(e.target.value)} />
                  <button onClick={() => lookupBarcode(document.getElementById('barcodeInput').value)} style={{
                    padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', color: 'var(--text-muted)', fontSize: 14, border: '1px solid var(--border)'
                  }}>Go</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Templates tab */}
        {tab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-hint)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-muted)', marginBottom: 6 }}>No saved meals yet</div>
                <div style={{ fontSize: 14 }}>Add a food and tap ⭐ to save it as a template.</div>
              </div>
            ) : templates.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>{t.calories} kcal · P {t.protein}g · C {t.carbs}g · F {t.fat}g</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 10 }}>
                  <button onClick={() => selectFood(t)} style={{ background: 'var(--accent)', borderRadius: 8, padding: '6px 14px', color: '#0e0e0f', fontSize: 13, fontWeight: 700 }}>Add</button>
                  <button onClick={() => { const next = templates.filter((_, j) => j !== i); setTemplates(next); localStorage.setItem('meal_templates', JSON.stringify(next)) }} style={{ background: 'var(--danger-dim)', borderRadius: 8, width: 30, height: 30, color: 'var(--danger)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--danger)' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom tab */}
        {tab === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={inputStyle} placeholder="Food name" value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Calories', 'calories'], ['Protein (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Fat (g)', 'fat']].map(([label, key]) => (
                <input key={key} style={inputStyle} placeholder={label} type="number" value={custom[key]} onChange={e => setCustom(p => ({ ...p, [key]: e.target.value }))} />
              ))}
            </div>
            <button onClick={addCustomDirect} style={{
              marginTop: 4, padding: '14px', background: 'var(--accent)',
              borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontWeight: 700, fontSize: 15,
              fontFamily: 'var(--font-display)', boxShadow: '0 4px 16px var(--accent-glow)'
            }}>{isEdit ? 'Save changes' : 'Add food'}</button>
          </div>
        )}

        {/* Confirm tab */}
        {tab === 'confirm' && selected && scaled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>Adjust portion size below</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Portion size</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{portion}g</span>
              </div>
              <input type="range" min="10" max="500" step="5" value={portion} onChange={e => setPortion(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-hint)', marginTop: 4 }}>
                <span>10g</span><span>100g</span><span>250g</span><span>500g</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Cal', scaled.calories, 'var(--accent)', ''], ['Pro', scaled.protein, 'var(--protein-color)', 'g'], ['Carb', scaled.carbs, 'var(--carbs-color)', 'g'], ['Fat', scaled.fat, 'var(--fat-color)', 'g']].map(([label, val, color, unit]) => (
                <div key={label} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{val}{unit}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTab('search')} style={{ flex: 1, padding: '13px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 14, border: '1px solid var(--border)' }}>← Back</button>
              <button onClick={confirmAdd} style={{ flex: 2, padding: '13px', background: 'var(--accent)', borderRadius: 'var(--radius-sm)', color: '#0e0e0f', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)', boxShadow: '0 4px 16px var(--accent-glow)' }}>Add to {meal}</button>
              <button onClick={() => { const t = { name: selected.name, calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, per: `${portion}g` }; const next = [...templates.filter(x => x.name !== t.name), t]; setTemplates(next); localStorage.setItem('meal_templates', JSON.stringify(next)); alert('⭐ Saved!') }} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-hint)', fontSize: 13, border: '1px solid var(--border)' }}>⭐</button>
            </div>
          </div>
        )}
      </div>
      {showUpgrade && <UpgradeScreen onClose={() => setShowUpgrade(false)} scansUsed={3 - scansLeft} user={user} />}
      {showBarcode && <BarcodeScanner onClose={() => setShowBarcode(false)} onResult={(food) => { setShowBarcode(false); setSelected(food); setPortion(100); setTab('confirm') }} />}
    </div>
  )
}
