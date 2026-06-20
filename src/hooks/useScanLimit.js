import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useScanLimit(user) {
  const [scanCount, setScanCount] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setScanCount(Number(localStorage.getItem('scan_count') || 0))
      setIsPremium(false)
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('scan_count, is_premium')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setScanCount(data?.scan_count || 0)
        setIsPremium(data?.is_premium || false)
        setLoading(false)
      })
  }, [user])

  async function incrementScan() {
    const next = scanCount + 1
    setScanCount(next)
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, scan_count: next, is_premium: isPremium })
    } else {
      localStorage.setItem('scan_count', next)
    }
  }

  const canScan = isPremium || scanCount < 3
  const scansLeft = Math.max(0, 3 - scanCount)

  return { scanCount, isPremium, canScan, scansLeft, incrementScan, loading }
}
