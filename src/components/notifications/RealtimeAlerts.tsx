import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, TriangleAlert, WifiOff, X } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../services/api';
import { createRealtimeSocket } from '../../services/realtime';
import { NotificationContext, useNotifications, type AlertItem, type AlertTone } from './notification-context';
import styles from './RealtimeAlerts.module.css';

interface RealtimePayload {
  id?: number | string;
  type?: string;
  status?: string;
  payload?: string | Record<string, unknown>;
  message?: string;
  createdAt?: string;
}

const eventLabels: Record<string, string> = {
  RENT_DUE: 'แจ้งเตือนค่าเช่า',
  RENT_OVERDUE: 'ค่าเช่าเกินกำหนด',
  MAINTENANCE_COMPLETED: 'แจ้งซ่อม',
  VISITOR_ARRIVAL: 'ผู้มาติดต่อ',
  GENERIC: 'แจ้งเตือนระบบ',
  MAINTENANCE_STATUS: 'แจ้งซ่อม',
  VISITOR_STATUS: 'ผู้มาติดต่อ',
  PAYMENT_SLIP: 'ตรวจสลิป',
  DOOR_COMMAND: 'ประตู',
};

const getPayloadMessage = (payload: RealtimePayload) => {
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.payload === 'string') {
    try {
      const parsed = JSON.parse(payload.payload) as { message?: unknown };
      if (typeof parsed.message === 'string') return parsed.message;
    } catch {
      return payload.payload;
    }
  }
  if (payload.payload && typeof payload.payload === 'object' && typeof payload.payload.message === 'string') {
    return payload.payload.message;
  }
  return payload.status ? `สถานะปัจจุบัน: ${payload.status}` : 'มีรายการใหม่เข้ามา';
};

const toAlert = (eventName: string, payload: RealtimePayload, stableId?: string): AlertItem => ({
  id: stableId ?? (eventName === 'notificationAlert' && payload.id !== undefined
    ? `notification-${payload.id}`
    : `${eventName}-${payload.id ?? Date.now()}-${Math.random()}`),
  title: eventLabels[payload.type ?? ''] ?? (eventName === 'notificationAlert' ? 'แจ้งเตือนใหม่' : 'อัปเดตระบบ'),
  message: getPayloadMessage(payload),
  tone: payload.status === 'FAILED' ? 'error' : payload.status === 'PAID' || payload.status === 'RESOLVED' ? 'success' : 'info',
  createdAt: payload.createdAt ?? new Date().toISOString(),
  read: false,
});

const systemAlert = (title: string, message: string, tone: AlertTone): AlertItem => ({
  id: `${title}-${Date.now()}-${Math.random()}`,
  title,
  message,
  tone,
  createdAt: new Date().toISOString(),
  read: false,
});

const ALERT_STORAGE_KEY = 'admin:notification-alerts';
const ALERT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const readStoredAlerts = (): AlertItem[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) ?? '[]') as AlertItem[];
    const cutoff = Date.now() - ALERT_MAX_AGE_MS;
    return stored.filter((alert) => alert && typeof alert.id === 'string' && new Date(alert.createdAt).getTime() >= cutoff);
  } catch {
    return [];
  }
};

const saveStoredAlerts = (alerts: AlertItem[]) => {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [toastAlerts, setToastAlerts] = useState<AlertItem[]>([]);
  const socketRef = useRef<ReturnType<typeof createRealtimeSocket> | null>(null);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!token || !isAdmin) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    let active = true;
    const storedAlerts = readStoredAlerts();
    saveStoredAlerts(storedAlerts);
    const hydrateId = window.setTimeout(() => {
      if (active) setAlerts(storedAlerts);
    }, 0);
    void api.get('/notifications').then((response) => {
      if (!active) return;
      const records = Array.isArray(response.data?.data) ? response.data.data : [];
      const serverAlerts = records
        .filter((record: { createdAt?: string }) => record.createdAt && Date.now() - new Date(record.createdAt).getTime() <= ALERT_MAX_AGE_MS)
        .map((record: RealtimePayload & { createdAt: string; id: number }) => toAlert('notificationAlert', record, `notification-${record.id}`));
      setAlerts((current) => {
        const merged = [...current, ...serverAlerts].filter((alert, index, all) => all.findIndex((item) => item.id === alert.id) === index);
        saveStoredAlerts(merged);
        return merged.slice(0, 50);
      });
    }).catch(() => undefined);

    const socket = createRealtimeSocket(token);
    socketRef.current = socket;
    const timers = timersRef.current;
    let networkState = typeof navigator === 'undefined' || navigator.onLine;
    let realtimeWasUnhealthy = false;
    const addAlert = (alert: AlertItem) => {
      setAlerts((current) => {
        const next = [alert, ...current.filter((item) => item.id !== alert.id)].slice(0, 50);
        saveStoredAlerts(next);
        return next;
      });
      setToastAlerts((current) => [alert, ...current].slice(0, 5));
      const timer = window.setTimeout(() => setToastAlerts((current) => current.filter((item) => item.id !== alert.id)), 8000);
      timers.set(alert.id, timer);
    };
    const handleNotification = (payload: RealtimePayload) => addAlert(toAlert('notificationAlert', payload));
    const handleBillStatus = (payload: RealtimePayload) => addAlert(toAlert('billStatusUpdated', payload));
    const handleMaintenanceStatus = (payload: RealtimePayload) => addAlert(toAlert('maintenanceStatusUpdated', payload));
    const handleVisitorScan = (payload: RealtimePayload) => addAlert(toAlert('visitorScanEvent', payload));
    const handleSocketError = () => {
      realtimeWasUnhealthy = true;
      addAlert(systemAlert('Realtime เชื่อมต่อไม่ได้', 'การแจ้งเตือนสดกำลังพยายามเชื่อมต่อใหม่', 'warning'));
    };
    const handleDisconnect = () => {
      realtimeWasUnhealthy = true;
      if (!navigator.onLine) {
        handleOffline();
        return;
      }
      addAlert(systemAlert('Realtime หลุดการเชื่อมต่อ', 'การแจ้งเตือนสดหยุดชั่วคราว', 'warning'));
    };
    const handleSocketConnect = () => {
      if (realtimeWasUnhealthy) {
        addAlert(systemAlert('เชื่อมต่อระบบสำเร็จ', 'ระบบแจ้งเตือนพร้อมใช้งานอีกครั้ง', 'success'));
        realtimeWasUnhealthy = false;
      }
      handleOnline();
    };
    const handleOnline = () => {
      if (networkState) return;
      networkState = true;
      addAlert(systemAlert('กลับมาออนไลน์แล้ว', 'ระบบพร้อมรับการแจ้งเตือนอีกครั้ง', 'success'));
    };
    const handleOffline = () => {
      if (!networkState) return;
      networkState = false;
      addAlert(systemAlert('อินเทอร์เน็ตขัดข้อง', 'ระบบจะแจ้งเตือนต่อเมื่อเชื่อมต่อกลับมา', 'error'));
    };
    const networkCheckId = window.setInterval(() => {
      if (navigator.onLine) {
        handleOnline();
      } else {
        handleOffline();
      }
    }, 1000);
    const handleClientAlert = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; message?: string; tone?: AlertTone }>).detail;
      addAlert(systemAlert(detail.title ?? 'ระบบแจ้งเตือน', detail.message ?? 'เกิดข้อผิดพลาด', detail.tone ?? 'error'));
    };
    const handleClientSuccess = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; message?: string }>).detail;
      addAlert(systemAlert(detail.title ?? 'ดำเนินการสำเร็จ', detail.message ?? 'บันทึกข้อมูลสำเร็จ', 'success'));
    };

    socket.on('notificationAlert', handleNotification);
    socket.on('billStatusUpdated', handleBillStatus);
    socket.on('maintenanceStatusUpdated', handleMaintenanceStatus);
    socket.on('visitorScanEvent', handleVisitorScan);
    socket.on('connect_error', handleSocketError);
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleDisconnect);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('client:alert', handleClientAlert);
    window.addEventListener('client:success', handleClientSuccess);
    if (!navigator.onLine) handleOffline();

    return () => {
      socket.off('notificationAlert', handleNotification);
      socket.off('billStatusUpdated', handleBillStatus);
      socket.off('maintenanceStatusUpdated', handleMaintenanceStatus);
      socket.off('visitorScanEvent', handleVisitorScan);
      socket.off('connect_error', handleSocketError);
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('client:alert', handleClientAlert);
      window.removeEventListener('client:success', handleClientSuccess);
      window.clearInterval(networkCheckId);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      window.clearTimeout(hydrateId);
      active = false;
    };
  }, [isAdmin, token]);

  const markAllRead = () => {
    setAlerts((current) => {
      const next = current.map((alert) => ({ ...alert, read: true }));
      saveStoredAlerts(next);
      return next;
    });
    setToastAlerts([]);
  };

  const value = {
    alerts,
    toastAlerts,
    dismissToast: (id: string) => {
      setToastAlerts((current) => current.filter((alert) => alert.id !== id));
      const timer = timersRef.current.get(id);
      if (timer) window.clearTimeout(timer);
      timersRef.current.delete(id);
    },
    markAllRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

const RealtimeAlerts = () => {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { toastAlerts, dismissToast } = useNotifications();

  return (
    <aside className={styles.alertStack} aria-live="polite" aria-label="การแจ้งเตือนระบบ">
      {(token && isAdmin ? toastAlerts : []).map((alert) => {
        const Icon = alert.tone === 'success' ? CheckCircle2 : alert.tone === 'error' ? WifiOff : alert.tone === 'warning' ? TriangleAlert : Bell;
        return (
          <div className={`${styles.alert} ${styles[alert.tone]}`} key={alert.id}>
            <Icon size={19} aria-hidden="true" />
            <div className={styles.content}>
              <strong>{alert.title}</strong>
              {alert.message !== alert.title && <span>{alert.message}</span>}
            </div>
            <button type="button" className={styles.close} onClick={() => dismissToast(alert.id)} aria-label="ปิดการแจ้งเตือน">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </aside>
  );
};

export default RealtimeAlerts;