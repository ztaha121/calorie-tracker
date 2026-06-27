// Reusable food image component with fallback emoji
import { useFoodImage } from '../hooks/useFoodImage.js'

const MEAL_FALLBACKS = {
  Breakfast: '🌅',
  Lunch: '🌤️',
  Dinner: '🌙',
  Snack: '⚡',
}

function getFallbackEmoji(name = '') {
  const n = name.toLowerCase()
  if (n.includes('chicken') || n.includes('دجاج')) return '🍗'
  if (n.includes('rice') || n.includes('أرز') || n.includes('kabsa') || n.includes('كبسة') || n.includes('mandi') || n.includes('مندي') || n.includes('biryani') || n.includes('برياني')) return '🍚'
  if (n.includes('egg') || n.includes('بيض')) return '🥚'
  if (n.includes('bread') || n.includes('خبز')) return '🥖'
  if (n.includes('milk') || n.includes('حليب') || n.includes('laban') || n.includes('لبن')) return '🥛'
  if (n.includes('salad') || n.includes('سلطة') || n.includes('tabbouleh') || n.includes('تبولة')) return '🥗'
  if (n.includes('coffee') || n.includes('قهوة')) return '☕'
  if (n.includes('tea') || n.includes('شاي')) return '🍵'
  if (n.includes('water') || n.includes('ماء')) return '💧'
  if (n.includes('fish') || n.includes('سمك')) return '🐟'
  if (n.includes('lamb') || n.includes('beef') || n.includes('لحم')) return '🥩'
  if (n.includes('date') || n.includes('تمر')) return '🫘'
  if (n.includes('hummus') || n.includes('حمص') || n.includes('foul') || n.includes('فول')) return '🫙'
  if (n.includes('shawarma') || n.includes('شاورما') || n.includes('wrap')) return '🌯'
  if (n.includes('falafel') || n.includes('فلافل') || n.includes('kebab') || n.includes('كباب')) return '🧆'
  if (n.includes('soup') || n.includes('شوربة') || n.includes('harira') || n.includes('حريرة')) return '🍲'
  if (n.includes('pizza')) return '🍕'
  if (n.includes('burger')) return '🍔'
  if (n.includes('fries')) return '🍟'
  if (n.includes('chocolate') || n.includes('cake') || n.includes('sweet') || n.includes('kunafa') || n.includes('كنافة') || n.includes('baklava') || n.includes('بقلاوة')) return '🍰'
  if (n.includes('apple') || n.includes('fruit') || n.includes('mango') || n.includes('banana')) return '🍎'
  if (n.includes('yogurt') || n.includes('labneh') || n.includes('لبنة')) return '🥛'
  if (n.includes('almond') || n.includes('nut')) return '🥜'
  if (n.includes('protein') || n.includes('shake')) return '💪'
  return '🍽️'
}

export default function FoodImage({ name, meal, size = 40, borderRadius = 10 }) {
  const imageUrl = useFoodImage(name)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius,
          objectFit: 'cover',
          flexShrink: 0,
          background: 'var(--bg-card-2)',
        }}
        onError={e => { e.target.style.display = 'none' }}
      />
    )
  }

  const emoji = getFallbackEmoji(name) || MEAL_FALLBACKS[meal] || '🍽️'

  return (
    <div style={{
      width: size, height: size, borderRadius,
      background: 'var(--accent-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, flexShrink: 0,
    }}>
      {emoji}
    </div>
  )
}
