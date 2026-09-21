import axios from 'axios';
import { resolveApiBaseUrl } from './api-url.js';

// Resolve the backend URL from Vite env first, then fall back to the local backend.
const API_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token automatically before hit API
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

const getActionLabel = (method: string | undefined, url: string | undefined, data: unknown): string | null => {
  const path = (url ?? '').toLowerCase();
  if (path.includes('/auth/heartbeat')) return null;
  if (path.includes('upload-slip') || path.includes('upload')) return 'อัปโหลดสลิป';
  if (path.includes('door-command')) {
    const command = typeof data === 'string' ? data.toLowerCase() : JSON.stringify(data ?? '').toLowerCase();
    return command.includes('close') || command.includes('ปิด') ? 'ปิดประตู' : 'เปิดประตู';
  }
  if (path.includes('/maintenance') && method === 'POST') return 'สร้างรายการแจ้งซ่อม';
  if (path.includes('/visitor') && ['PUT', 'PATCH', 'POST'].includes(method ?? '')) {
    const payload = typeof data === 'string' ? data.toLowerCase() : JSON.stringify(data ?? '').toLowerCase();
    if (payload.includes('approved')) return 'อนุมัติผู้มาติดต่อ';
  }
  if (method === 'DELETE') return 'ลบข้อมูล';
  return null;
};

// Response Interceptor: Kick out users if token expired (401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    const actionLabel = getActionLabel(method, response.config.url, response.config.data);
    const isAdmin = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') ?? '{}').role === 'ADMIN';
      } catch {
        return false;
      }
    })();
    if (isAdmin && actionLabel) {
      window.dispatchEvent(new CustomEvent('client:success', {
        detail: {
          title: actionLabel,
          message: actionLabel,
        },
      }));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isAdmin = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') ?? '{}').role === 'ADMIN';
      } catch {
        return false;
      }
    })();
    if (status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    if (isAdmin && (!status || status >= 500)) {
      const isNetworkError = !error.response;
      const title = isNetworkError ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' : 'เซิร์ฟเวอร์มีปัญหา';
      const message = isNetworkError
        ? 'ตรวจสอบอินเทอร์เน็ตหรือรอให้เซิร์ฟเวอร์กลับมาใช้งาน'
        : (error.response?.data?.message ?? `เซิร์ฟเวอร์ตอบกลับข้อผิดพลาด (${status})`);
      window.dispatchEvent(new CustomEvent('client:alert', {
        detail: {
          title,
          message,
          tone: 'error',
        },
      }));
    }
    return Promise.reject(error);
  }
);
