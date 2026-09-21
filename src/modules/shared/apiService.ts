import { api } from '../../services/api';

export const sharedApi = {
  async getHealth() {
    return api.get('/health');
  },
  async getMe() {
    return api.get('/auth/me');
  },
  async getRooms() {
    return api.get('/rooms');
  },
  async getTenants() {
    return api.get('/tenants');
  },
  async getUsers() {
    return api.get('/users');
  },
  async getVisitors() {
    return api.get('/visitor');
  },
  async getBills() {
    return api.get('/billing');
  },
  async getPaymentQr(billId: number) {
    return api.get(`/billing/${billId}/payment-qr`, { responseType: 'blob' });
  },
  async uploadBillSlip(billId: number, file: File, idempotencyKey: string) {
    const formData = new FormData();
    formData.append('slipImage', file);
    return api.post(`/billing/${billId}/upload-slip`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Idempotency-Key': idempotencyKey,
      },
    });
  },
  async createPaymentBatch(billIds: number[], idempotencyKey: string) {
    return api.post('/payment-batches', { billIds }, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  },
  async getPaymentBatch(batchId: number) {
    return api.get(`/payment-batches/${batchId}`);
  },
  async getPaymentBatchQr(batchId: number) {
    return api.get(`/payment-batches/${batchId}/payment-qr`, { responseType: 'blob' });
  },
  async uploadPaymentBatchSlip(batchId: number, file: File) {
    const formData = new FormData();
    formData.append('slipImage', file);
    return api.post(`/payment-batches/${batchId}/upload-slip`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async getPaymentBatchStatus(batchId: number) {
    return api.get(`/payment-batches/${batchId}/status`);
  },
  async getMaintenanceTickets() {
    return api.get('/maintenance');
  },
};
