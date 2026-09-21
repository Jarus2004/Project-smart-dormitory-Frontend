import { useState } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import { api } from '../../../../services/api';
import type { OcrData } from '../../types/tenant';
import styles from './DocumentUpload.module.css';

interface DocumentUploadProps {
  idCardFile: File | null;
  setIdCardFile: (file: File | null) => void;
  paymentSlipFile: File | null;
  setPaymentSlipFile: (file: File | null) => void;
  onUploadSuccess: (data: { idCardImagePath: string; paymentSlipPath: string; ocrData: OcrData }) => void;
}

interface UploadDocumentsResponse {
  statusCode: number;
  data: {
    idCardImagePath: string;
    paymentSlipPath: string;
    ocrData?: OcrData;
  };
}

const DocumentUpload = ({
  idCardFile,
  setIdCardFile,
  paymentSlipFile,
  setPaymentSlipFile,
  onUploadSuccess,
}: DocumentUploadProps) => {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleIdCardChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setOcrError('ไฟล์บัตรประชาชนขนาดเกิน 10 MB');
        return;
      }
      setIdCardFile(file);
      setOcrError(null);
    }
  };

  const handlePaymentSlipChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setOcrError('ไฟล์สลิปจ่ายเงินขนาดเกิน 10 MB');
        return;
      }
      setPaymentSlipFile(file);
      setOcrError(null);
    }
  };

  const handleVerify = async () => {
    if (!idCardFile || !paymentSlipFile) return;

    setOcrLoading(true);
    setOcrError(null);

    try {
      const formData = new FormData();
      formData.append('idCard', idCardFile);
      formData.append('paymentSlip', paymentSlipFile);

      const response = await api.post<UploadDocumentsResponse>('/tenants/upload-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.statusCode === 200 || response.status === 200) {
        const payload = response.data.data;
        // Trigger success callback to update parent state and auto-advance
        onUploadSuccess({
          idCardImagePath: payload.idCardImagePath,
          paymentSlipPath: payload.paymentSlipPath,
          ocrData: payload.ocrData ?? {},
        });
      } else {
        setOcrError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลหลักฐาน กรุณาอัปโหลดอีกครั้ง');
      }
    } catch (err: unknown) {
      console.error('Verify error:', err);
      const msg = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setOcrError(msg || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง');
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>ขั้นตอนที่ 3: อัปโหลดบัตรประชาชนและสลิปชำระเงิน</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        กรุณาอัปโหลดรูปภาพบัตรประชาชนของท่าน และสลิปหลักฐานการโอนเงินชำระมัดจำเฉลี่ย เพื่อส่งให้ระบบตรวจสอบอัตโนมัติ
      </p>

      <div className={styles.uploadGrid}>
        {/* Dropzone 1: ID Card */}
        <label
          htmlFor="id-card-upload"
          className={`${styles.uploadBox} ${idCardFile ? styles.uploadBoxFilled : ''}`}
        >
          <span className={styles.uploadBoxIcon}>🪪</span>
          <span className={styles.uploadBoxTitle}>1. บัตรประชาชน</span>
          <span className={styles.uploadBoxSubtitle}>รองรับ JPG, PNG, WEBP, PDF (ไม่เกิน 10MB)</span>
          <input
            id="id-card-upload"
            type="file"
            accept="image/*,application/pdf"
            className={styles.fileInput}
            onChange={handleIdCardChange}
          />
          {idCardFile && <div className={styles.uploadBoxFile}>✅ {idCardFile.name}</div>}
        </label>

        {/* Dropzone 2: Payment Slip */}
        <label
          htmlFor="slip-upload"
          className={`${styles.uploadBox} ${paymentSlipFile ? styles.uploadBoxFilled : ''}`}
        >
          <span className={styles.uploadBoxIcon}>💵</span>
          <span className={styles.uploadBoxTitle}>2. สลิปโอนเงิน</span>
          <span className={styles.uploadBoxSubtitle}>รองรับ JPG, PNG, WEBP, PDF (ไม่เกิน 10MB)</span>
          <input
            id="slip-upload"
            type="file"
            accept="image/*,application/pdf"
            className={styles.fileInput}
            onChange={handlePaymentSlipChange}
          />
          {paymentSlipFile && <div className={styles.uploadBoxFile}>✅ {paymentSlipFile.name}</div>}
        </label>
      </div>

      <div className={styles.details}>
        <p>💡 คำแนะนำ: รูปภาพควรชัดเจนและเห็นตัวหนังสือและใบหน้า/QR Code เต็มแผ่น</p>
      </div>

      {ocrLoading && (
        <div className={styles.ocrLoading}>
          <div className={styles.ocrLoadingSpinner}></div>
          <div>กำลังส่งรูปภาพไปยังระบบตรวจสอบ Backend และประมวลผล OCR...</div>
        </div>
      )}

      {ocrError && (
        <div className={styles.ocrError}>
          <span>⚠️ {ocrError}</span>
        </div>
      )}

      <div className={styles.uploadFieldsRow}>
        <button
          type="button"
          className={styles.verifyButton}
          disabled={!idCardFile || !paymentSlipFile || ocrLoading}
          onClick={handleVerify}
        >
          {ocrLoading ? 'กำลังส่งข้อมูลไปเซิร์ฟเวอร์...' : '🚀 อัปโหลดและตรวจสอบหลักฐาน'}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
