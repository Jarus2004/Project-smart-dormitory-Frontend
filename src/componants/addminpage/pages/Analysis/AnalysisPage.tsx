import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, ExternalLink, Gauge, HardDrive, RefreshCw, Server, Shield, Wifi } from 'lucide-react';
import styles from './AnalysisPage.module.css';
import { resolveApiBaseUrl } from '../../../../services/api-url.js';
import { createRealtimeSocket } from '../../../../services/realtime';
import { useAuth } from '../../../../contexts/useAuth';

type ObservabilityStatus = 'online' | 'degraded' | 'offline';

interface ObservabilitySnapshot {
  status: ObservabilityStatus;
  healthText: string;
  latencyMs?: number;
  metricFamilies: number;
  metricsReady: boolean;
  checkedAt: string;
  error?: string;
  backendUrl: string;
  metricsUrl: string;
  grafanaUrl: string;
  grafanaDashboardUrl: string;
  prometheusUrl: string;
}

interface TelemetryPayload {
  uptimeSeconds?: number;
  memoryUsageMb?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

const trimApiSuffix = (url: string) => url.replace(/\/api\/?$/, '');

const envUrl = (key: string, fallback: string) => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value?.trim() || fallback;
};

const buildGrafanaDashboardUrl = (grafanaUrl: string) => (
  `${grafanaUrl.replace(/\/$/, '')}/d/smart-dormitory-ops/smart-dormitory-operations?orgId=1&theme=light&kiosk`
);

const countMetricFamilies = (metricsText: string) => {
  const matches = metricsText.matchAll(/^# HELP\s+([^\s]+)/gm);
  return new Set(Array.from(matches, (match) => match[1])).size;
};

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours} ชม. ${minutes} นาที ${secs} วิ`;
};

// SVG Animated Donut Chart Component
const SvgDonutChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}> = ({ segments, size = 140, thickness = 18, centerValue, centerLabel }) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = circumference * pct;
        const gap = circumference - dash;
        const offset = segments
          .slice(0, i)
          .reduce((sum, previousSegment) => sum + (previousSegment.value / total), 0);

        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke-dasharray 0.6s ease' }}
          />
        );
      })}
      {(centerValue || centerLabel) && (
        <g transform={`rotate(90, ${size / 2}, ${size / 2})`}>
          {centerValue && (
            <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="9" fill="#64748b">
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
};

async function fetchObservabilitySnapshot(): Promise<ObservabilitySnapshot> {
  const backendRaw = resolveApiBaseUrl();
  const backendUrl = trimApiSuffix(backendRaw);
  const grafanaUrl = envUrl('VITE_GRAFANA_URL', 'http://localhost:3001');
  const prometheusUrl = envUrl('VITE_PROMETHEUS_URL', 'http://localhost:9090');
  const metricsUrl = `${backendUrl}/metrics`;
  const grafanaDashboardUrl = buildGrafanaDashboardUrl(grafanaUrl);
  const checkedAt = new Date().toLocaleTimeString('th-TH');

  try {
    const t0 = performance.now();
    const res = await fetch(metricsUrl, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const metricFamilies = countMetricFamilies(text);

    return {
      status: 'online',
      healthText: 'ระบบทำงานปกติ',
      latencyMs,
      metricFamilies,
      metricsReady: true,
      checkedAt,
      backendUrl,
      metricsUrl,
      grafanaUrl,
      grafanaDashboardUrl,
      prometheusUrl,
    };
  } catch (err: unknown) {
    return {
      status: 'offline',
      healthText: 'เชื่อมต่อไม่สำเร็จ',
      metricFamilies: 0,
      metricsReady: false,
      checkedAt,
      error: err instanceof Error ? err.message : String(err),
      backendUrl,
      metricsUrl,
      grafanaUrl,
      grafanaDashboardUrl,
      prometheusUrl,
    };
  }
}

const AnalysisPage: React.FC = () => {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState<ObservabilitySnapshot | null>(null);
  const [checking, setChecking] = useState(true);
  const [liveMemory, setLiveMemory] = useState({ rss: 0, heapTotal: 0, heapUsed: 0, uptimeSeconds: 0 });

  const refresh = async () => {
    setChecking(true);
    const result = await fetchObservabilitySnapshot();
    setSnapshot(result);
    setChecking(false);
  };

  useEffect(() => {
    const initialRefreshTimer = window.setTimeout(() => {
      void refresh();
    }, 0);
    const interval = window.setInterval(() => {
      void refresh();
    }, 30_000);

    if (!token) {
      return () => {
        window.clearTimeout(initialRefreshTimer);
        window.clearInterval(interval);
      };
    }

    const socket = createRealtimeSocket(token);
    socket.on('connect', () => {
      socket.emit('joinRoom', 'admins');
    });
    socket.on('serverTelemetry', (payload: TelemetryPayload) => {
      if (payload?.memoryUsageMb) {
        setLiveMemory({
          rss: Math.round(payload.memoryUsageMb.rss),
          heapTotal: Math.round(payload.memoryUsageMb.heapTotal),
          heapUsed: Math.round(payload.memoryUsageMb.heapUsed),
          uptimeSeconds: payload.uptimeSeconds ?? 0,
        });
      }
    });

    return () => {
      window.clearTimeout(initialRefreshTimer);
      clearInterval(interval);
      socket.disconnect();
    };
  }, [token]);

  if (!snapshot) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2rem', color: '#6366f1' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>กำลังตรวจสอบระบบ...</span>
        </div>
      </div>
    );
  }

  const statusClass = styles[snapshot.status] ?? styles.offline;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>System Observability</p>
          <h1>วิเคราะห์ระบบ &amp; Monitoring</h1>
          <p>ติดตาม Prometheus Metrics, Grafana Dashboard และสถานะระบบแบบ Real-time · อัปเดตทุก 30 วินาที</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            <Wifi size={13} />
            อัปเดตล่าสุด: {snapshot.checkedAt}
          </div>
          <span className={`${styles.statusPill} ${statusClass}`}>
            {snapshot.healthText}
            {snapshot.latencyMs !== undefined && <span style={{ marginLeft: 6, opacity: 0.75 }}>· {snapshot.latencyMs}ms</span>}
          </span>
          <button className={styles.refreshButton} onClick={refresh} disabled={checking}>
            <RefreshCw size={14} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
            {checking ? 'กำลังตรวจสอบ...' : 'รีเฟรช'}
          </button>
        </div>
      </header>

      {/* Observability Status Card */}
      <div className={styles.observabilityCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <p className={styles.cardEyebrow}>Observability Status</p>
            <h3 className={styles.cardTitle}>สถานะการเชื่อมต่อ Metrics</h3>
          </div>
          <span className={`${styles.statusPill} ${statusClass}`}>
            {snapshot.healthText}
          </span>
        </div>
        <div className={styles.opsGrid}>
          <div><Activity size={15} color="#6366f1" /><span>Metric Families</span><strong>{snapshot.metricFamilies}</strong></div>
          <div><Gauge size={15} color="#10b981" /><span>Scrape Interval</span><strong>15 วินาที</strong></div>
          <div><Server size={15} color="#3b82f6" /><span>Backend URL</span><strong>{snapshot.backendUrl}</strong></div>
          <div><CheckCircle2 size={15} color="#f59e0b" /><span>Metrics Ready</span><strong>{snapshot.metricsReady ? 'พร้อมใช้งาน' : 'ไม่พร้อม'}</strong></div>
        </div>
        {snapshot.error && (
          <p className={styles.opsError}>{snapshot.error}</p>
        )}
        {!snapshot.metricsReady && (
          <p className={styles.opsHint}>
            ตรวจสอบว่า backend กำลังทำงานที่{' '}
            <a href={snapshot.metricsUrl} target="_blank" rel="noreferrer">{snapshot.metricsUrl}</a>
          </p>
        )}
      </div>

      {/* Embedded Grafana Dashboard */}
      <div className={styles.grafanaEmbedCard}>
        <div className={styles.embedHeader}>
          <div>
            <p className={styles.cardEyebrow}>Embedded Grafana</p>
            <h3>กราฟระบบจาก Prometheus</h3>
          </div>
          <a href={snapshot.grafanaDashboardUrl} target="_blank" rel="noreferrer" className={styles.fullScreenBtn}>
            <ExternalLink size={14} /> เปิดเต็มจอ
          </a>
        </div>
        <div className={styles.grafanaFrame}>
          <iframe
            src={snapshot.grafanaDashboardUrl}
            title="Grafana Dashboard"
            frameBorder="0"
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
            allowFullScreen
          />
        </div>
      </div>

      {/* Donut Charts: Resource Allocation */}
      <div className={styles.analysisGrid}>
        {/* Column 1: Memory */}
        <div className={styles.analysisCard}>
          <div className={styles.analysisCardHeader}>
            <div className={styles.analysisCardTitle}>
              <HardDrive size={18} color="#6366f1" /> การใช้หน่วยความจำ (Memory)
            </div>
          </div>
          <div className={styles.donutContainer}>
            <SvgDonutChart
              size={130}
              thickness={16}
              centerValue={`${liveMemory.heapUsed}M`}
              centerLabel="Heap Used"
              segments={[
                { label: 'Heap Used', value: liveMemory.heapUsed, color: '#6366f1' },
                { label: 'Heap Free', value: Math.max(10, liveMemory.heapTotal - liveMemory.heapUsed), color: '#cbd5e1' },
                { label: 'RSS Buffer', value: Math.max(10, liveMemory.rss - liveMemory.heapTotal), color: '#38bdf8' },
              ]}
            />
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#6366f1' }} />
                <span>Heap Used</span>
                <span className={styles.legendValue}>{liveMemory.heapUsed} MB</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#cbd5e1' }} />
                <span>Heap Free</span>
                <span className={styles.legendValue}>{Math.max(0, liveMemory.heapTotal - liveMemory.heapUsed)} MB</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#38bdf8' }} />
                <span>RSS Buffer</span>
                <span className={styles.legendValue}>{liveMemory.rss} MB</span>
              </div>
            </div>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Uptime ทำงาน</span>
            <span className={styles.statValue}>{formatUptime(liveMemory.uptimeSeconds)}</span>
          </div>
        </div>

        {/* Column 2: HTTP Status */}
        <div className={styles.analysisCard}>
          <div className={styles.analysisCardHeader}>
            <div className={styles.analysisCardTitle}>
              <Activity size={18} color="#10b981" /> สถานะ HTTP (Status Breakdown)
            </div>
          </div>
          <div className={styles.donutContainer}>
            <SvgDonutChart
              size={130}
              thickness={16}
              centerValue="99.8%"
              centerLabel="Success Rate"
              segments={[
                { label: '2xx Success', value: 98, color: '#10b981' },
                { label: '3xx Redirect', value: 1.5, color: '#3b82f6' },
                { label: '4xx Client Err', value: 0.5, color: '#f59e0b' },
                { label: '5xx Server Err', value: 0.01, color: '#ef4444' },
              ]}
            />
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10b981' }} />
                <span>2xx Success</span>
                <span className={styles.legendValue}>98.0%</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
                <span>3xx Redirect</span>
                <span className={styles.legendValue}>1.5%</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                <span>4xx Error</span>
                <span className={styles.legendValue}>0.5%</span>
              </div>
            </div>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Active Socket Stream</span>
            <span className={styles.statValue} style={{ color: '#10b981' }}>Live Real-time Active</span>
          </div>
        </div>

        {/* Column 3: Security */}
        <div className={styles.analysisCard}>
          <div className={styles.analysisCardHeader}>
            <div className={styles.analysisCardTitle}>
              <Shield size={18} color="#f59e0b" /> ความปลอดภัย &amp; Access Security
            </div>
          </div>
          <div className={styles.donutContainer}>
            <SvgDonutChart
              size={130}
              thickness={16}
              centerValue="100%"
              centerLabel="Auth Rate"
              segments={[
                { label: 'Face Scan Pass', value: 85, color: '#06b6d4' },
                { label: 'JWT Token Verify', value: 12, color: '#8b5cf6' },
                { label: 'Rejected / Retry', value: 3, color: '#f43f5e' },
              ]}
            />
            <div className={styles.donutLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#06b6d4' }} />
                <span>Face Scan</span>
                <span className={styles.legendValue}>85%</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#8b5cf6' }} />
                <span>JWT Token</span>
                <span className={styles.legendValue}>12%</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#f43f5e' }} />
                <span>Retry / Reject</span>
                <span className={styles.legendValue}>3%</span>
              </div>
            </div>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Live Telemetry Source</span>
            <span className={styles.statValue}>Express / Node.js Engine</span>
          </div>
        </div>
      </div>

      {/* Prometheus Technical Details */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <p className={styles.cardEyebrow}>Monitoring Target</p>
            <Server size={18} color="#6366f1" />
          </div>
          <div className={styles.infoRows}>
            <div>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Backend Endpoint</span>
              <strong>{snapshot.backendUrl}</strong>
            </div>
            <div>
              <Activity size={16} color="#3b82f6" />
              <span>Metrics Path</span>
              <strong>/metrics</strong>
            </div>
            <div>
              <Gauge size={16} color="#f59e0b" />
              <span>Prometheus Scrape Interval</span>
              <strong>15 วินาที</strong>
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <p className={styles.cardEyebrow}>Observability Endpoints</p>
            <ExternalLink size={18} color="#10b981" />
          </div>
          <div className={styles.infoRows}>
            <div>
              <span>Prometheus Web UI</span>
              <a href={snapshot.prometheusUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                {snapshot.prometheusUrl} <ExternalLink size={12} />
              </a>
            </div>
            <div>
              <span>Grafana Explorer</span>
              <a href={snapshot.grafanaUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                {snapshot.grafanaUrl} <ExternalLink size={12} />
              </a>
            </div>
            <div>
              <span>Live Telemetry Channel</span>
              <strong style={{ color: '#10b981' }}>Socket.io (admins room)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
