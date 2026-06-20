# Calorie Tracker

Mobile-first calorie tracking app. Built with React + Vite. Deployable to web (Vercel) and Android (Capacitor).

## Stack
- React 18 + Vite
- Supabase (auth + database)
- OpenFoodFacts API (food search)
- Capacitor (for Android APK later)

## Setup

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/calorie-tracker.git
cd calorie-tracker
npm install
```

### 2. Create .env file (PowerShell — UTF-8 encoding)
```powershell
New-Item .env -ItemType File
Add-Content .env "VITE_SUPABASE_URL=https://rnwsnnvdgsxqamvofhno.supabase.co"
Add-Content .env "VITE_SUPABASE_ANON_KEY=your_anon_key_here"
```
Get your anon key from: https://supabase.com/dashboard/project/rnwsnnvdgsxqamvofhno/settings/api

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:5173

### 4. Build for production
```bash
npm run build
```

## Deploy to Vercel (free)
1. Push to GitHub
2. Go to vercel.com → New Project → import your repo
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy — you get a live URL instantly

## Add Android support (later)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Calorie Tracker" "com.zayt.calorietracker"
npx cap add android
npm run build
npx cap sync
npx cap open android
```
Then in Android Studio: Build → Generate Signed APK

## Features
- Calorie ring with live progress
- Protein / carbs / fat macro bars
- OpenFoodFacts food search (global database)
- Arabic foods quick-add (dates, kabsa, foul, shawarma, etc.)
- Custom food entry
- Daily log with delete
- Local storage (works offline)
- Mobile-first UI, dark theme

## Patent connection
This app is covered by USPTO provisional patent application:
"AI-Powered Multi-Modal Calorie Tracking and Predictive Nutrition Management System"
Filed under DTH Technology SARL — co-inventor: Zaynab Taha
