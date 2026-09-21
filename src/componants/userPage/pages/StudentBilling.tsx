import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, CreditCard, Download, LoaderCircle, Upload, XCircle } from 'lucide-react';
import { sharedApi } from '../../../modules/shared/apiService';
import UserPageHeader from '../components/UserPageHeader/UserPageHeader';
import styles from './StudentBilling.module.css';

interface Bill {
  id: number;
  amount: string | number;
  dueDate: string;
  status: string;
  description?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  UNPAID: { label: 'ยังไม่ชำระ', tone: 'warning' },
  OVERDUE: { label: 'เกินกำหนด', tone: 'danger' },
  VERIFYING: { label: 'กำลังตรวจสอบ', tone: 'info' },
  PAID: { label: 'ชำระแล้ว', tone: 'success' },
  FAILED: { label: 'ตรวจสอบไม่ผ่าน', tone: 'danger' },
};

const formatAmount = (amount: string | number) =>
  Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StudentBilling = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrBillId, setQrBillId] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File | undefined>>({});
  const [submittingBillId, setSubmittingBillId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const loadBills = async () => {
      try {
        const response = await sharedApi.getBills();
        if (!active) return;
        setBills((response.data?.data ?? []) as Bill[]);
        setError('');
      } catch {
        if (active) setError('ไม่สามารถโหลดรายการบิลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadBills();
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (qrUrl) URL.revokeObjectURL(qrUrl);
  }, [qrUrl]);

  const handleQr = async (billId: number) => {
    setQrBillId(billId);
    setError('');
    if (qrUrl) URL.revokeObjectURL(qrUrl);
    setQrUrl('');
    try {
      const response = await sharedApi.getPaymentQr(billId);
      setQrUrl(URL.createObjectURL(response.data));
    } catch {
      setError('ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง');
      setQrBillId(null);
    }
  };

  const handleSubmit = async (billId: number) => {
    const file = selectedFiles[billId];
    if (!file) {
      setError('กรุณาเลือกไฟล์สลิปก่อนส่งตรวจสอบ');
      return;
    }

    setSubmittingBillId(billId);
    setError('');
    try {
      await sharedApi.uploadBillSlip(billId, file, crypto.randomUUID());
      setSelectedFiles((current) => ({ ...current, [billId]: undefined }));
      const response = await sharedApi.getBills();
      setBills((response.data?.data ?? []) as Bill[]);
    } catch (submissionError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(submissionError)
        ? submissionError.response?.data?.message
        : undefined;
      setError(message ?? 'ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmittingBillId(null);
    }
  };

  return (
    <div className={styles.page}>
      <UserPageHeader backLabel="กลับหน้าหลัก" />

      <main className={styles.main}>
        <div className={styles.heading}>
          <div className={styles.headingIcon}><CreditCard size={24} /></div>
          <div>
            <p className={styles.eyebrow}>STUDENT BILLING</p>
            <h1>ค่าใช้จ่ายและการชำระเงิน</h1>
            <p>ตรวจสอบยอดค้างชำระ สแกน QR และส่งสลิปตรวจสอบ</p>
          </div>
        </div>

        {error && <div className={styles.error} role="alert"><XCircle size={17} /> {error}</div>}

        {loading ? (
          <div className={styles.empty}><LoaderCircle className={styles.spinner} size={28} /> กำลังโหลดรายการบิล...</div>
        ) : bills.length === 0 ? (
          <div className={styles.empty}><CreditCard size={34} /><p>ยังไม่มีรายการบิล</p></div>
        ) : (
          <section className={styles.billList}>
            {bills.map((bill) => {
              const status = STATUS_CONFIG[bill.status] ?? { label: bill.status, tone: 'info' };
              const payable = bill.status === 'UNPAID' || bill.status === 'OVERDUE';
              return (
                <article className={styles.billCard} key={bill.id}>
                  <div className={styles.billTop}>
                    <div>
                      <p className={styles.billLabel}>ใบแจ้งหนี้ #{bill.id}</p>
                      <h2>{formatAmount(bill.amount)} บาท</h2>
                    </div>
                    <span className={`${styles.status} ${styles[status.tone]}`}>
                      {bill.status === 'PAID' ? <CheckCircle2 size={14} /> : null}{status.label}
                    </span>
                  </div>
                  <p className={styles.description}>{bill.description || 'ค่าใช้จ่ายหอพักประจำเดือน'}</p>
                  <p className={styles.dueDate}>ครบกำหนด {new Date(bill.dueDate).toLocaleDateString('th-TH')}</p>

                  {payable && (
                    <div className={styles.actions}>
                      <button className={styles.qrButton} onClick={() => void handleQr(bill.id)} disabled={qrBillId === bill.id}>
                        {qrBillId === bill.id ? <LoaderCircle className={styles.spinner} size={16} /> : <Download size={16} />}
                        แสดง QR Code
                      </button>
                      <label className={styles.fileButton}>
                        <Upload size={16} />
                        {selectedFiles[bill.id]?.name ?? 'เลือกสลิป'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSelectedFiles((current) => ({ ...current, [bill.id]: event.target.files?.[0] }))} />
                      </label>
                      <button className={styles.submitButton} onClick={() => void handleSubmit(bill.id)} disabled={submittingBillId === bill.id}>
                        {submittingBillId === bill.id ? <LoaderCircle className={styles.spinner} size={16} /> : <Upload size={16} />}
                        ส่งตรวจสอบ
                      </button>
                    </div>
                  )}

                  {qrBillId === bill.id && qrUrl && (
                    <div className={styles.qrPanel}>
                      <img src={qrUrl} alt={`QR Code สำหรับใบแจ้งหนี้ ${bill.id}`} />
                      <p>สแกน QR ด้วยแอปธนาคาร แล้วอัปโหลดสลิปด้านบน</p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentBilling;