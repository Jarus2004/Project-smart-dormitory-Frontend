import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, Users, XCircle, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import * as blazeface from '@tensorflow-models/blazeface';
import type { BlazeFaceModel, NormalizedFace } from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';
import { useAuth } from '../../../../contexts/useAuth';
import { api } from '../../../../services/api';
import { resolveApiBaseUrl } from '../../../../services/api-url.js';
import styles from './MonitorPage.module.css';

type ScanHistoryEntry = {
  direction?: 'IN' | 'OUT' | string;
  id: string;
  student_code?: string;
  student?: { name?: string; room?: string };
  action?: 'checkin' | 'checkout' | 'IN' | 'OUT' | string;
  confidence?: number;
  scanned_at?: string;
  device_code?: string;
};

type RecognitionStatus = 'idle' | 'detecting' | 'matched' | 'denied';

const VERIFY_INTERVAL_MS = 800;
const COOLDOWN_MS = 3500;
const MATCH_HOLD_MS = 2500;
const DETECT_INTERVAL_MS = 120;
const MAX_HISTORY_ITEMS = 30;

const isCheckinAction = (item: ScanHistoryEntry): boolean => {
  const act = (item.action || item.direction || '').toUpperCase();
  if (act === 'CHECKOUT' || act === 'OUT' || act === 'EXIT') return false;
  return true; // Default scan at gate is Check-in
};

const isRecordedScan = (item: ScanHistoryEntry): boolean =>
  (item.action || '').toLowerCase() !== 'tracking';

const isScannedToday = (item: ScanHistoryEntry): boolean => {
  if (!item.scanned_at) return false;

  const scannedAt = new Date(item.scanned_at);
  if (Number.isNaN(scannedAt.getTime())) return false;

  const today = new Date();
  return (
    scannedAt.getFullYear() === today.getFullYear()
    && scannedAt.getMonth() === today.getMonth()
    && scannedAt.getDate() === today.getDate()
  );
};

const calculateScanCounts = (items: ScanHistoryEntry[]) => {
  let inCount = 0;
  let outCount = 0;
  const todayItems = items.filter((item) => isRecordedScan(item) && isScannedToday(item));

  todayItems.forEach((item) => {
    if (isCheckinAction(item)) {
      inCount++;
    } else {
      outCount++;
    }
  });
  return { in: inCount, out: outCount, total: todayItems.length };
};


const MonitorPage = () => {
  const { user, token } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const detectionInProgressRef = useRef(false);
  const modelRef = useRef<BlazeFaceModel | null>(null);

  const [cameraStatus, setCameraStatus] = useState<'OFFLINE' | 'ONLINE' | 'ERROR'>('OFFLINE');
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('idle');
  const [detectedUser, setDetectedUser] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [todayCounts, setTodayCounts] = useState({ in: 0, out: 0, total: 0 });

  const lastVerifyTimeRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const statusChangedAtRef = useRef(0);
  const apiInProgressRef = useRef(false);

  const baseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

  // Fetch initial scan history
  const fetchScanHistory = useCallback(async () => {
    try {
      const response = await api.get('/face-verification/scan-history');
      const payloadData = response.data?.data;
      const items: ScanHistoryEntry[] = Array.isArray(payloadData)
        ? payloadData
        : (payloadData?.scans || payloadData?.items || []);
      const recordedItems = items.filter(isRecordedScan);
      setScanHistory(recordedItems.slice(0, MAX_HISTORY_ITEMS));

      setTodayCounts(calculateScanCounts(recordedItems));
    } catch {
      // Fallback silent
    }
  }, []);

  // Draw face box on canvas
  const drawOverlay = useCallback((faces: NormalizedFace[]) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faces.length === 0) return;

    faces.forEach((face) => {
      const start = face.topLeft as [number, number];
      const end = face.bottomRight as [number, number];
      const x = start[0];
      const y = start[1];
      const w = end[0] - start[0];
      const h = end[1] - start[1];

      let strokeColor = '#3b82f6';
      if (recognitionStatus === 'matched') strokeColor = '#10b981';
      if (recognitionStatus === 'denied') strokeColor = '#ef4444';
      if (recognitionStatus === 'detecting') strokeColor = '#f59e0b';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const cornerLength = Math.min(w, h) * 0.25;

      // Top Left
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);

      // Top Right
      ctx.moveTo(x + w - cornerLength, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLength);

      // Bottom Right
      ctx.moveTo(x + w, y + h - cornerLength);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w - cornerLength, y + h);

      // Bottom Left
      ctx.moveTo(x + cornerLength, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + h - cornerLength);

      ctx.stroke();
    });
  }, [recognitionStatus]);

  // Send snapshot to backend for verification
  const sendVerifyFrame = useCallback(async (blob: Blob) => {
    setRecognitionStatus('detecting');
    const formData = new FormData();
    formData.append('file', blob, 'capture.jpg');
    formData.append('device_code', 'MAIN_GATE_01');

    try {
      const response = await api.post('/face-verification/verify-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const resData = response.data?.data;
      const now = Date.now();

      if (resData) {
        const matched = resData.matched === true;
        const similarity = Number(resData.similarity ?? 0);
        const name = resData.student_name || resData.message || 'ผู้พักอาศัย';

        if (matched) {
          setRecognitionStatus('matched');
          setDetectedUser(name);
          setConfidence(similarity * 100);
          statusChangedAtRef.current = now;
          cooldownUntilRef.current = now + COOLDOWN_MS;

          // Render only scans persisted by the backend; do not fabricate client-side scan records.
          void fetchScanHistory();
        } else {
          setRecognitionStatus('denied');
          setDetectedUser('ไม่พบข้อมูลใบหน้า');
          setConfidence(similarity * 100);
          statusChangedAtRef.current = now;
          cooldownUntilRef.current = now + COOLDOWN_MS;
        }
      }
    } catch {
      setRecognitionStatus('denied');
      setDetectedUser('เกิดข้อผิดพลาดในการตรวจสอบ');
    }
  }, [fetchScanHistory]);

  // Detect loop with BlazeFace
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !modelRef.current || videoRef.current.readyState < 2) return;

    try {
      const faces = (await modelRef.current.estimateFaces(videoRef.current, false, false)) as NormalizedFace[];
      drawOverlay(faces);

      const now = Date.now();

      // Reset matched/denied banner after MATCH_HOLD_MS
      if (
        (recognitionStatus === 'matched' || recognitionStatus === 'denied') &&
        now - statusChangedAtRef.current > MATCH_HOLD_MS
      ) {
        setRecognitionStatus('idle');
        setDetectedUser('');
      }

      if (faces.length > 0 && now > cooldownUntilRef.current && !apiInProgressRef.current) {
        if (now - lastVerifyTimeRef.current >= VERIFY_INTERVAL_MS) {
          lastVerifyTimeRef.current = now;

          const canvas = captureCanvasRef.current || document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            apiInProgressRef.current = true;
            canvas.toBlob((blob) => {
              if (blob) {
                void sendVerifyFrame(blob).finally(() => {
                  apiInProgressRef.current = false;
                });
              } else {
                apiInProgressRef.current = false;
              }
            }, 'image/jpeg', 0.85);
          }
        }
      }
    } catch {
      // Ignore individual frame errors
    }
  }, [drawOverlay, recognitionStatus, sendVerifyFrame]);

  // Start Camera Stream
  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('ERROR');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('ONLINE');
      setRecognitionStatus('idle');
      setDetectedUser('');
      setConfidence(0);
      cooldownUntilRef.current = 0;
      lastVerifyTimeRef.current = 0;
      apiInProgressRef.current = false;

      if (detectIntervalRef.current) window.clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = window.setInterval(() => {
        if (detectionInProgressRef.current) return;
        detectionInProgressRef.current = true;
        void detectFaces().finally(() => {
          detectionInProgressRef.current = false;
        });
      }, DETECT_INTERVAL_MS);
    } catch {
      setCameraStatus('ERROR');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (detectIntervalRef.current) {
      window.clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext('2d');
      ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
    setCameraStatus('OFFLINE');
    setRecognitionStatus('idle');
    setConfidence(0);
    setDetectedUser('');
    apiInProgressRef.current = false;
  };

  // Load Model on Mount
  useEffect(() => {
    let active = true;
    const loadModel = async () => {
      try {
        const model = await blazeface.load();
        if (!active) return;
        modelRef.current = model;
      } catch {
        // Handle gracefully
      }
    };
    void loadModel();
    return () => {
      active = false;
      stopCamera();
    };
  }, []);

  // SSE Realtime Updates
  useEffect(() => {
    const historyFetchTimer = window.setTimeout(() => {
      void fetchScanHistory();
    }, 0);

    if (typeof EventSource === 'undefined') {
      return () => window.clearTimeout(historyFetchTimer);
    }
    const sseUrl = token
      ? `${baseUrl}/face-verification/events?token=${encodeURIComponent(token)}`
      : `${baseUrl}/face-verification/events`;
    const eventsSource = new EventSource(sseUrl);

    eventsSource.addEventListener('scan', (event) => {
      try {
        const payload: ScanHistoryEntry = JSON.parse((event as MessageEvent).data);
        if (!isRecordedScan(payload)) return;

        setScanHistory((current) => {
          const next = [payload, ...current.filter((item) => item.id !== payload.id)].slice(0, MAX_HISTORY_ITEMS);
          setTodayCounts(calculateScanCounts(next));
          return next;
        });
      } catch {
        // ignore parse error
      }
    });

    return () => {
      window.clearTimeout(historyFetchTimer);
      eventsSource.close();
    };
  }, [baseUrl, fetchScanHistory, token]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>ระบบสแกนใบหน้าเข้า-ออกหอพัก</h1>
          <p>ผู้ดูแลระบบ: {user?.username || user?.email || 'Admin'} • ประตูหลัก Main Gate</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={() => void fetchScanHistory()}>
            <RefreshCw size={16} /> รีเฟรชประวัติ
          </button>
          {cameraStatus === 'ONLINE' ? (
            <button className={styles.secondaryButton} type="button" onClick={stopCamera}>
              <CameraOff size={16} /> ปิดกล้อง
            </button>
          ) : (
            <button className={styles.primaryButton} type="button" onClick={() => void startCamera()}>
              <Camera size={16} /> เปิดกล้องสแกน
            </button>
          )}
        </div>
      </header>

      {/* Overview Stats */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>สถานะกล้องสแกน</span>
          <strong style={{ color: cameraStatus === 'ONLINE' ? '#10b981' : '#f59e0b' }}>
            {cameraStatus === 'ONLINE' ? 'พร้อมทำงาน (Online)' : cameraStatus === 'ERROR' ? 'ขัดข้อง' : 'ปิดการทำงาน (Offline)'}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span>สแกนเข้าวันนี้ (Check-in)</span>
          <strong style={{ color: '#059669' }}>{todayCounts.in} ครั้ง</strong>
        </div>
        <div className={styles.statCard}>
          <span>สแกนออกวันนี้ (Check-out)</span>
          <strong style={{ color: '#2563eb' }}>{todayCounts.out} ครั้ง</strong>
        </div>
        <div className={styles.statCard}>
          <span>รวมกิจกรรมสแกน</span>
          <strong style={{ color: '#0f172a' }}>{todayCounts.total} รายการ</strong>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left: Camera Feed */}
        <section className={styles.cameraSection}>
          <div className={styles.sectionTitle}>
            <h2>สตรีมกล้องประตูทางเข้า</h2>
            <div className={styles.statusBadge}>
              <span className={cameraStatus === 'ONLINE' ? styles.statusDotOnline : styles.statusDotOffline} />
              {cameraStatus === 'ONLINE' ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>

          <div className={styles.previewWrapper}>
            <video ref={videoRef} className={styles.cameraPreview} style={{ display: cameraStatus === 'ONLINE' ? 'block' : 'none' }} muted playsInline />
            <canvas ref={overlayRef} className={styles.overlay} />

            {cameraStatus === 'OFFLINE' && (
              <div className={styles.cameraOfflinePlaceholder}>
                <CameraOff size={48} strokeWidth={1.5} />
                <p>กดปุ่ม "เปิดกล้องสแกน" ด้านบนเพื่อเริ่มตรวจจับใบหน้า</p>
              </div>
            )}

            {cameraStatus === 'ONLINE' && recognitionStatus === 'matched' && (
              <div className={`${styles.matchBanner} ${styles.matchSuccess}`}>
                <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                อนุญาตให้เข้าผ่าน: {detectedUser} ({confidence.toFixed(0)}%)
              </div>
            )}

            {cameraStatus === 'ONLINE' && recognitionStatus === 'denied' && (
              <div className={`${styles.matchBanner} ${styles.matchDenied}`}>
                <XCircle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                ปฏิเสธการเข้า: {detectedUser}
              </div>
            )}

            {cameraStatus === 'ONLINE' && recognitionStatus === 'detecting' && (
              <div className={`${styles.matchBanner} ${styles.matchDetecting}`}>
                กำลังประมวลผลเปรียบเทียบใบหน้า...
              </div>
            )}
          </div>
        </section>

        {/* Right: Live Access Feed */}
        <section className={styles.activitySection}>
          <div className={styles.sectionTitle}>
            <h2>ประวัติการสแกนเข้า-ออกล่าสุด</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>อัปเดตแบบเรียลไทม์</span>
          </div>

          <div className={styles.activityList}>
            {scanHistory.map((item, idx) => {
              const isCheckin = isCheckinAction(item);
              const name = item.student?.name || item.student_code || 'ผู้พักอาศัย';
              const room = item.student?.room ? `ห้อง ${item.student.room}` : 'หอพัก';
              const timeStr = item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString('th-TH') : new Date().toLocaleTimeString('th-TH');

              return (
                <div key={item.id || idx} className={styles.activityCard}>
                  <div className={styles.activityInfo}>
                    <div className={`${styles.activityAvatar} ${isCheckin ? styles.avatarIn : styles.avatarOut}`}>
                      {isCheckin ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className={styles.activityMeta}>
                      <h4>{name}</h4>
                      <p>{room} • ประตูหลัก • {timeStr}</p>
                    </div>
                  </div>

                  <span className={`${styles.activityBadge} ${isCheckin ? styles.badgeIn : styles.badgeOut}`}>
                    {isCheckin ? 'เข้าหอพัก' : 'ออกหอพัก'}
                  </span>
                </div>
              );
            })}

            {scanHistory.length === 0 && (
              <div className={styles.emptyState}>
                <Users size={36} strokeWidth={1.5} />
                <p>ยังไม่มีบันทึกการสแกนเข้า-ออกในขณะนี้</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <canvas ref={captureCanvasRef} className={styles.hiddenCanvas} />
    </div>
  );
};

export default MonitorPage;
