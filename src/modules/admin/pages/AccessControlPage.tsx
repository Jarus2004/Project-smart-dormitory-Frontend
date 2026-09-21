import { AlertTriangle, CheckCircle2, Lock, ShieldCheck, Unlock, Video } from 'lucide-react';
import { useMemo, useState } from 'react';

type StatusTone = 'ok' | 'warn' | 'alert';

type AuditItem = {
  id: number;
  time: string;
  action: string;
  user: string;
  result: string;
  tone: StatusTone;
};

const AccessControlPage = () => {
  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [cameraOnline, setCameraOnline] = useState(true);
  const [recognitionState] = useState<'Match' | 'No Face' | 'Unknown'>('Match');
  const [detectedUser] = useState('Nattapat R.');
  const [confidence] = useState(96);

  const metrics = useMemo(
    () => [
      { label: 'Door Status', value: doorUnlocked ? 'Unlocked' : 'Locked', tone: doorUnlocked ? 'ok' : 'warn' },
      { label: 'Camera', value: cameraOnline ? 'Online' : 'Offline', tone: cameraOnline ? 'ok' : 'alert' },
      { label: 'Recognition', value: recognitionState, tone: recognitionState === 'Match' ? 'ok' : 'warn' },
      { label: 'Alert', value: confidence >= 90 ? 'Normal' : 'Review', tone: confidence >= 90 ? 'ok' : 'warn' },
    ],
    [cameraOnline, confidence, doorUnlocked, recognitionState]
  );

  const auditLog: AuditItem[] = [
    { id: 1, time: '09:42:12', action: 'Face verified', user: 'Nattapat R.', result: 'Granted access', tone: 'ok' },
    { id: 2, time: '09:37:04', action: 'Camera check', user: 'System', result: 'Healthy', tone: 'ok' },
    { id: 3, time: '09:12:46', action: 'Door lock', user: 'Admin', result: 'Manual lock', tone: 'warn' },
    { id: 4, time: '08:58:11', action: 'Unrecognized face', user: 'Unknown', result: 'Denied', tone: 'alert' },
  ];

  const toneStyles: Record<StatusTone, { background: string; border: string; color: string }> = {
    ok: { background: '#ecfdf5', border: '#bbf7d0', color: '#166534' },
    warn: { background: '#fff7ed', border: '#fed7aa', color: '#9a5b00' },
    alert: { background: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
  };

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          border: '1px solid #dbeafe',
          borderRadius: 20,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#2563eb',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.2, color: '#1d4ed8', fontWeight: 700 }}>ACCESS CONTROL</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 30 }}>Door + Camera Control Center</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {metrics.map((metric) => {
          const tone = toneStyles[metric.tone as StatusTone];
          return (
            <div
              key={metric.label}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 18,
                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: 1.1, color: '#6b7280', textTransform: 'uppercase' }}>{metric.label}</div>
              <div
                style={{
                  marginTop: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1px solid ${tone.border}`,
                  background: tone.background,
                  color: tone.color,
                  fontWeight: 700,
                }}
              >
                {metric.value}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <Video size={18} color="#2563eb" />
              Live Camera Feed
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${cameraOnline ? '#bbf7d0' : '#fecaca'}`,
                background: cameraOnline ? '#ecfdf5' : '#fef2f2',
                color: cameraOnline ? '#166534' : '#b91c1c',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {cameraOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 10',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: '#dbeafe',
                fontWeight: 700,
                letterSpacing: 1.1,
              }}
            >
              CAMERA FEED
            </div>
            <div
              style={{
                position: 'absolute',
                left: '18%',
                top: '22%',
                width: '26%',
                height: '42%',
                border: '3px solid #4ade80',
                borderRadius: 12,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <button
              type="button"
              onClick={() => setDoorUnlocked(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                borderRadius: 12,
                background: '#16a34a',
                color: '#fff',
                padding: '12px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Unlock size={18} />
              Unlock Door
            </button>
            <button
              type="button"
              onClick={() => setDoorUnlocked(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #d1d5db',
                borderRadius: 12,
                background: '#fff',
                color: '#111827',
                padding: '12px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Lock size={18} />
              Lock Door
            </button>
            <button
              type="button"
              onClick={() => setCameraOnline((value) => !value)}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                background: '#f8fafc',
                padding: '12px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Toggle Camera
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <strong>Entrance Result</strong>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                background: recognitionState === 'Match' ? '#ecfdf5' : '#fef2f2',
                color: recognitionState === 'Match' ? '#166534' : '#b91c1c',
                border: `1px solid ${recognitionState === 'Match' ? '#bbf7d0' : '#fecaca'}`,
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {recognitionState === 'Match' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {recognitionState}
            </span>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, background: '#f8fafc', padding: 14 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Detected Person</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{detectedUser}</div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, background: '#f8fafc', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Confidence</span>
                <strong>{confidence}%</strong>
              </div>
              <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                <div style={{ width: `${confidence}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #84cc16)' }} />
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, background: '#f8fafc', padding: 14 }}>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>Suggested Action</div>
              <div style={{ fontWeight: 700, color: recognitionState === 'Match' ? '#166534' : '#b91c1c' }}>
                {recognitionState === 'Match' ? 'Authenticate and unlock the door.' : 'Request manual verification or deny access.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <strong>Activity Log</strong>
          <span style={{ color: '#6b7280', fontSize: 12 }}>Last 4 events</span>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {auditLog.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1.3fr 1fr 160px',
                gap: 12,
                alignItems: 'center',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '12px 14px',
                background: '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 700, color: '#475569' }}>{item.time}</span>
              <span>{item.action}</span>
              <span>{item.user}</span>
              <span
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1px solid ${toneStyles[item.tone].border}`,
                  background: toneStyles[item.tone].background,
                  color: toneStyles[item.tone].color,
                  fontWeight: 700,
                }}
              >
                {item.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccessControlPage;
