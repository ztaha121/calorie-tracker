// Hook to fetch and cache food images from Spoonacular
// Caches in localStorage for 7 days to save API calls

const CACHE_PREFIX = 'mizan_img_'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function getFoodImage(foodName) {
  if (!foodName) return null

  // Normalize key
  const key = CACHE_PREFIX + foodName.trim().toLowerCase().slice(0, 50).replace(/[^a-z0-9]/g, '_')

  // Check cache
  try {
    const cached = localStorage.getItem(key)
    if (cached) {
      const { url, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) return url
    }
  } catch {}

  const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY
  if (!apiKey) return null

  try {
    // Search for the food
    const res = await fetch(
      `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(foodName)}&number=1&apiKey=${apiKey}`
    )
    if (!res.ok) return null
    const data = await res.json()

    let imageUrl = null

    if (data.results?.[0]?.image) {
      // Ingredient image
      imageUrl = `https://spoonacular.com/cdn/ingredients_100x100/${data.results[0].image}`
    } else {
      // Try recipe search as fallback
      const res2 = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(foodName)}&number=1&apiKey=${apiKey}`
      )
      if (res2.ok) {
        const data2 = await res2.json()
        if (data2.results?.[0]?.image) {
          imageUrl = data2.results[0].image
        }
      }
    }

    if (imageUrl) {
      try {
        localStorage.setItem(key, JSON.stringify({ url: imageUrl, timestamp: Date.now() }))
      } catch {}
    }

    return imageUrl
  } catch {
    return null
  }
}

// React hook version
import { useState, useEffect } from 'react'

export function useFoodImage(foodName) {
  const [imageUrl, setImageUrl] = useState(() => {
    // Try cache synchronously first
    if (!foodName) return null
    try {
      const key = CACHE_PREFIX + foodName.trim().toLowerCase().slice(0, 50).replace(/[^a-z0-9]/g, '_')
      const cached = localStorage.getItem(key)
      if (cached) {
        const { url, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) return url
      }
    } catch {}
    return null
  })

  useEffect(() => {
    if (!foodName || imageUrl) return
    let cancelled = false
    getFoodImage(foodName).then(url => {
      if (!cancelled && url) setImageUrl(url)
    })
    return () => { cancelled = true }
  }, [foodName])

  return imageUrl
}
