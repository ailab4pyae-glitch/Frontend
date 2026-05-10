export default function MatchSkeleton() {
  return (
    <div style={{
      background: '#141824', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: 120, height: 14 }} />
        <div className="skeleton" style={{ width: 50, height: 20, borderRadius: 20 }} />
      </div>
      {/* Teams row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: 70, height: 12 }} />
        </div>
        <div className="skeleton" style={{ width: 40, height: 22, borderRadius: 6 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: 70, height: 12 }} />
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 30, height: 22, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 30, height: 22, borderRadius: 6 }} />
        <div style={{ marginLeft: 'auto' }}>
          <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  )
}
