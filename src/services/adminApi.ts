import { api } from './api';

// ─── Rooms ───────────────────────────────────────────────────────────────────
export const getRooms = () => api.get('/rooms');
export const getRoomById = (id: string) => api.get(`/rooms/${id}`);
export const createRoom = (data: unknown) => api.post('/rooms', data);
export const updateRoom = (id: string, data: unknown) => api.patch(`/rooms/${id}`, data);
export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`);

// ─── Tenants ─────────────────────────────────────────────────────────────────
export const getTenants = () => api.get('/tenants');
export const getTenantById = (id: string) => api.get(`/tenants/${id}`);
export const getMyTenant = () => api.get('/tenants/me');
export const getMyTenantDocument = (documentType: 'id-card' | 'payment-slip') =>
  api.get(`/tenants/me/documents/${documentType}`, { responseType: 'blob' });
export const getTenantDocumentById = (id: string | number, documentType: 'id-card' | 'payment-slip') =>
  api.get(`/tenants/${id}/documents/${documentType}`, { responseType: 'blob' });
export const createTenant = (data: unknown) => api.post('/tenants', data);
export const updateTenant = (id: string, data: unknown) => api.patch(`/tenants/${id}`, data);
export const deleteTenant = (id: string) => api.delete(`/tenants/${id}`);

// ─── Maintenance ─────────────────────────────────────────────────────────────
export const getMaintenanceTickets = () => api.get('/maintenance');
export const createMaintenanceTicket = (data: unknown) => api.post('/maintenance', data);
export const updateMaintenanceStatus = (id: string, status: string) =>
  api.patch(`/maintenance/${id}/status`, { status });
export const deleteMaintenanceTicket = (id: string) => api.delete(`/maintenance/${id}`);
export const uploadMaintenanceImage = (data: FormData) =>
  api.post('/maintenance/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUsers = () => api.get('/users');
export const getUserById = (id: string) => api.get(`/users/${id}`);
export const createUser = (data: unknown) => api.post('/users', data);
export const updateUser = (id: string, data: unknown) => api.patch(`/users/${id}`, data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const getAuditLogs = (params?: Record<string, string | number>) => api.get('/audit-logs', { params });

// ─── Billing ────────────────────────────────────────────────────────────────
export const getBills = () => api.get('/billing');
export const getBillingReport = (params?: Record<string, string>) => api.get('/billing/report', { params });
export const getSystemSettings = () => api.get('/settings');
export const updateSystemSettings = (data: Record<string, string>) => api.patch('/settings', data);
export const getRoomBillingInfo = (roomNumber: string) =>
  api.get(`/billing/room-info/${encodeURIComponent(roomNumber)}`);
export const generateRoomBill = (data: unknown) =>
  api.post('/billing/generate-room-bill', data);
export const updateBillStatus = (id: string | number, status: string) =>
  api.patch(`/billing/${id}/status`, { status });
export const deleteBill = (id: string | number) =>
  api.delete(`/billing/${id}`);
export const getAdminBillPaymentDetails = (billId: string | number) =>
  api.get(`/payment-batches/admin/bills/${billId}/payment-details`);
export const getAdminBillSlip = (billId: string | number) =>
  api.get(`/payment-batches/admin/bills/${billId}/slip`, { responseType: 'blob' });

// ─── Visitors ────────────────────────────────────────────────────────────────
export const getVisitors = () => api.get('/visitor');
export const registerVisitor = (data: unknown) => api.post('/visitor/register', data);
export const updateVisitorStatus = (id: string, status: string) =>
  api.patch(`/visitor/${id}/status`, { status });

// ─── Face Verification ───────────────────────────────────────────────────────
export const registerFace = (data: FormData) => api.post('/face-verification/register', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const verifyFaceImage = (data: FormData) => api.post('/face-verification/verify-image', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getFaceVerificationScanHistory = () => api.get('/face-verification/scan-history');
export const getFaceTemplate = (templateId: string | number) =>
  api.get(`/face-verification/${templateId}`);
export const updateFaceTemplate = (templateId: string | number, data: FormData) =>
  api.put(`/face-verification/${templateId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteFaceTemplate = (templateId: string | number) =>
  api.delete(`/face-verification/${templateId}`);
