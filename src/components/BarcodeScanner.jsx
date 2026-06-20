import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onResult, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [looking, setLooking] = useState(false)
  const instanceRef = useRef(null)

  useEffect(() => {
    let scanner
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('barcode-reader')
        instanceRef.current = scanner
        setScanning(true)
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText) => {
            await scanner.stop()
            setScanning(false)
            lookupBarcode(decodedText)
          },
          () => {}
        )
      } catch (err) {
        setError('Camera not available. Type the barcode number below.')
        setScanning(false)
      }
    }
    startScanner()
    return () => {
      if (instanceRef.current) {
        instanceRef.current.stop().catch(() => {})
      }
    }
  }, [])

  async function lookupBarcode(code) {
    setLooking(true)
    setError('')
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
      const data = await res.json()
      if (data.status === 0) {
        setError('Product not found in database.')
        setLooking(false)
        return
      }
      const p = data.product
      const name = p.product_name_en || p.product_name_ar || p.product_name || p.abbreviated_product_name || 'Unknown product'
      // skip test/placeholder products
      if (name.toLowerCase().includes('test') || name.toLowerCase().includes('testprodukt')) {
        setBarcodeError('Product not found in database. Try searching by name.')
        setLooking(false)
        return
      }
      const food = {
        name,
        calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
        protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
        per: '100g'
      }
      if (!food.calories && !food.protein) {
        setError('No nutrition data for this product.')
        setLooking(false)
        return
      }
      onResult(food)
    } catch {
      setError('Could not look up product. Try searching by name.')
    }
    setLooking(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0e0e0f', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px' }}>
        <span style={{ fontSize: 17, fontWeight: 500, color: '#f0f0f0' }}>Scan barcode</span>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, width: 32, height: 32, color: '#f0f0f0', fontSize: 18 }}>×</button>
      </div>

      {looking ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ fontSize: 15, color: '#888' }}>Looking up product...</div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div id="barcode-reader" style={{ width: '100%', height: '100%' }} />
            {scanning && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: 250, height: 150,
                  border: '2px solid #a8e063',
                  borderRadius: 12,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                }} />
              </div>
            )}
          </div>

          <div style={{ padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && <p style={{ color: '#ff6b6b', fontSize: 13, textAlign: 'center' }}>{error}</p>}
            <div style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>
              {scanning ? 'Point camera at barcode' : 'Or enter barcode manually'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{
                  flex: 1, padding: '12px 14px',
                  background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#f0f0f0', fontSize: 15
                }}
                placeholder="Barcode number..."
                type="number"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupBarcode(manualCode)}
              />
              <button onClick={() => lookupBarcode(manualCode)} style={{
                padding: '12px 16px', background: '#a8e063', borderRadius: 10,
                color: '#0e0e0f', fontWeight: 500, fontSize: 14
              }}>Go</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
