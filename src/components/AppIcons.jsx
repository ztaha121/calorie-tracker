const S = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconRamadan() {
  return <svg {...S}><path d="M12 3a9 9 0 1 0 9 9c0-.5-.5-1-1-1a7 7 0 1 1-8-8c-.5 0-1-.5-1-1s.5-1 1-1z"/></svg>
}
export function IconWeight() {
  return <svg {...S}><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6V5a4 4 0 0 1 8 0v1"/><path d="M12 10v4M10 12h4"/></svg>
}
export function IconRecipe() {
  return <svg {...S}><path d="M4 19h16M4 15h16M8 15V9a4 4 0 0 1 8 0v6"/></svg>
}
export function IconFriends() {
  return <svg {...S}><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="8" r="2.5"/><path d="M19 19c0-2.8-1.8-5.1-4.3-5.9"/></svg>
}
export function IconCoach() {
  return <svg {...S}><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 19.2 8 14 2 9.4h7.6z"/></svg>
}
export function IconLog() {
  return <svg {...S}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 9h8M8 13h6M8 17h4"/></svg>
}
export function IconProgress() {
  return <svg {...S}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
}
export function IconProfile() {
  return <svg {...S}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
}
export function IconPrivacy() {
  return <svg {...S}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
}
export function IconDoc() {
  return <svg {...S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
}
export function IconSpark() {
  return <svg {...S}><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z"/></svg>
}
export function IconScan() {
  return <svg {...S}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>
}
export function IconChart() {
  return <svg {...S}><path d="M3 3v18h18"/><path d="M7 16l4-6 4 3 5-8"/></svg>
}
export function IconTrack() {
  return <svg {...S}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
}
export function IconChevron() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
}
export function IconClose() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
}

export function IconTile({ icon: Icon, color = 'green' }) {
  return (
    <div className={`icon-tile icon-tile-${color}`}>
      <Icon />
    </div>
  )
}
