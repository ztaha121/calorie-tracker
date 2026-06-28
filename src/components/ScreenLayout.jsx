export default function ScreenLayout({ title, subtitle, headerRight, headerExtra, children, flush }) {
  return (
    <div className="screen">
      {(title || headerExtra) && (
        <div className="screen-header">
          <div className="screen-header-top">
            <div>
              {title && <h1 className="screen-title">{title}</h1>}
              {subtitle && <p className="screen-subtitle">{subtitle}</p>}
            </div>
            {headerRight}
          </div>
          {headerExtra}
        </div>
      )}
      <div className={flush ? 'screen-body-flush' : 'screen-body'}>{children}</div>
    </div>
  )
}
