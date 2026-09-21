import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, LoaderCircle, Upload, XCircle } from 'lucide-react';
import { sharedApi } from '../../../modules/shared/apiService';
import UserPageHeader from '../components/UserPageHeader/UserPageHeader';
import styles from './StudentBillingBatch.module.css';

type Bill = {
  id: number;
  amount: number | string;
  rentAmount?: number | string;
  electricAmount?: number | string;
  waterAmount?: number | string;
  penaltyAmount?: number | string;
  dueDate: string;
  status: string;
  description?: string | null;
};

type Batch = {
  id: number;
  amount: number;
  status: string;
  account: { bankName: string; accountName: string; accountNumber: string; promptPayNumber: string };
  items: Array<{ billId: number; amount: number; bill: Bill }>;
};

const money = (value: number | string | undefined) => Number(value ?? 0).toLocaleString('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const StudentBillingBatch = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [step, setStep] = useState<'select' | 'payment' | 'result'>('select');
  const [resultStatus, setResultStatus] = useState<'PAID' | 'FAILED' | 'MANUAL_REVIEW' | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [slip, setSlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refreshBills = async () => {
    try {
      const response = await sharedApi.getBills();
      setBills((response.data?.data ?? []) as Bill[]);
    } catch {
      setError('ไม่สามารถโหลดรายการบิลได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

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
  useEffect(() => () => { if (qrUrl) URL.revokeObjectURL(qrUrl); }, [qrUrl]);

  useEffect(() => {
    const batchId = batch?.id;
    const batchStatus = batch?.status;
    if (!batchId || step !== 'payment' || batchStatus !== 'VERIFYING') return undefined;
    let active = true;
    const intervalId = window.setInterval(async () => {
      try {
        const response = await sharedApi.getPaymentBatchStatus(batchId);
        const nextBatch = response.data?.data as Batch;
        if (!active) return;
        setBatch(nextBatch);
        if (nextBatch.status === 'PAID' || nextBatch.status === 'FAILED' || nextBatch.status === 'MANUAL_REVIEW') {
          setResultStatus(nextBatch.status);
          setStep('result');
        }
      } catch { /* Keep polling while the provider result is pending. */ }
    }, 3000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, [batch?.id, batch?.status, step]);

  const selectedBills = useMemo(() => bills.filter((bill) => selectedIds.includes(bill.id)), [bills, selectedIds]);
  const selectedTotal = selectedBills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const toggleBill = (billId: number) => {
    setSelectedIds((current) => current.includes(billId)
      ? current.filter((id) => id !== billId)
      : [...current, billId]);
  };

  const startPayment = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const response = await sharedApi.createPaymentBatch(selectedIds, crypto.randomUUID());
      const nextBatch = response.data?.data as Batch;
      const qrResponse = await sharedApi.getPaymentBatchQr(nextBatch.id);
      setQrUrl(URL.createObjectURL(qrResponse.data));
      setBatch(nextBatch);
      setStep('payment');
    } catch (requestError: unknown) {
      setBatch(null);
      setStep('select');
      setQrUrl('');
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      setError(message ?? 'ไม่สามารถเตรียมการชำระเงินได้');
    } finally {
      setBusy(false);
    }
  };

  const uploadSlip = async () => {
    if (!batch || !slip) return;
    setBusy(true);
    setError('');
    try {
      const response = await sharedApi.uploadPaymentBatchSlip(batch.id, slip);
      const nextBatch = response.data?.data as Batch;
      setBatch(nextBatch);
      setSlip(null);
      if (nextBatch.status === 'PAID' || nextBatch.status === 'FAILED' || nextBatch.status === 'MANUAL_REVIEW') {
        setResultStatus(nextBatch.status);
        setStep('result');
      }
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      setError(message ?? 'ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <UserPageHeader backLabel="กลับหน้าหลัก" />

      <main className={styles.main}>
        <div className={styles.heading}><div className={styles.headingIcon}><CreditCard size={24} /></div><div><p className={styles.eyebrow}>STUDENT BILLING</p><h1>ค่าใช้จ่ายและการชำระเงิน</h1><p>{step === 'select' ? 'เลือกบิลที่ต้องการชำระพร้อมกัน' : 'ตรวจสอบรายละเอียดและชำระเงิน'}</p></div></div>
        {error && <div className={styles.error}><XCircle size={17} /> {error}</div>}

        {step === 'select' && (loading ? <div className={styles.empty}><LoaderCircle className={styles.spinner} /> กำลังโหลดรายการบิล...</div> : (
          <>
            <section className={styles.selectionCard}><div><h2>รายการค้างชำระ</h2><p>{selectedIds.length} รายการที่เลือก</p></div><div className={styles.totalPreview}><span>ยอดรวม</span><strong>{money(selectedTotal)} บาท</strong></div></section>
            <section className={styles.billList}>{bills.filter((bill) => bill.status === 'UNPAID' || bill.status === 'OVERDUE').map((bill) => <button className={`${styles.billCard} ${selectedIds.includes(bill.id) ? styles.selected : ''}`} key={bill.id} onClick={() => toggleBill(bill.id)}><span className={styles.billIcon}><CreditCard size={22} /></span><span className={styles.billContent}><strong>บิล #{bill.id}</strong><span>{bill.description || 'ค่าใช้จ่ายหอพัก'}</span><b>{money(bill.amount)} บาท</b></span><span className={`${styles.checkbox} ${selectedIds.includes(bill.id) ? styles.checked : ''}`}>{selectedIds.includes(bill.id) ? '✓' : ''}</span></button>)}</section>
            <button className={styles.primaryButton} disabled={!selectedIds.length || busy} onClick={() => void startPayment()}>{busy ? <LoaderCircle className={styles.spinner} /> : <ChevronRight size={18} />} เลือกแล้ว ชำระเงิน {selectedIds.length ? `(${money(selectedTotal)} บาท)` : ''}</button>
          </>
        ))}

        {step === 'payment' && batch && <section className={styles.paymentPanel}>
          <button className={styles.linkButton} onClick={() => setStep('select')}><ArrowLeft size={16} /> กลับไปเลือกรายการ</button>
          <h2>รายละเอียดการชำระเงิน</h2>
          <div className={styles.detailRows}>{batch.items.map((item) => <div className={styles.detailBlock} key={item.billId}><strong>บิล #{item.billId}</strong><span>ค่าเช่า <b>{money(item.bill.rentAmount)} บาท</b></span><span>ค่าไฟ <b>{money(item.bill.electricAmount)} บาท</b></span><span>ค่าน้ำ <b>{money(item.bill.waterAmount)} บาท</b></span><span>ค่าปรับ <b>{money(item.bill.penaltyAmount)} บาท</b></span><span className={styles.rowTotal}>รวมบิลนี้ <b>{money(item.bill.amount)} บาท</b></span></div>)}</div>
          <div className={styles.grandTotal}><span>ยอดชำระทั้งหมด</span><strong>{money(batch.amount)} บาท</strong></div>
          <div className={styles.account}><h3>โอนเงินไปยังบัญชีนี้</h3><p>{batch.account.bankName}</p><strong>{batch.account.accountName}</strong><p>เลขบัญชี {batch.account.accountNumber}</p><p>PromptPay {batch.account.promptPayNumber}</p></div>
          {qrUrl ? <img className={styles.qr} src={qrUrl} alt="QR Code ชำระเงิน" /> : <LoaderCircle className={styles.largeSpinner} />}
          <p className={styles.instruction}>สแกน QR Code ด้านล่างด้วยแอปธนาคาร แล้วรอผลการโอนเงิน</p>
          {batch.status === 'VERIFYING' ? <div className={styles.waiting}><LoaderCircle className={styles.spinner} /> กำลังรอการยืนยันการชำระเงิน...</div> : <div className={styles.uploadArea}><label className={styles.fileButton}><Upload size={17} /> {slip?.name ?? 'เลือกสลิปการโอนเงิน'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSlip(event.target.files?.[0] ?? null)} /></label><button className={styles.primaryButton} disabled={!slip || busy} onClick={() => void uploadSlip()}>{busy ? <LoaderCircle className={styles.spinner} /> : <Upload size={17} />} ยืนยันการชำระเงิน</button></div>}
        </section>}

        {step === 'result' && <section className={`${styles.resultPanel} ${resultStatus === 'PAID' ? styles.resultSuccess : styles.resultFailed}`}><div className={styles.resultIcon}>{resultStatus === 'PAID' ? <CheckCircle2 size={100} /> : <XCircle size={100} />}</div><h2>{resultStatus === 'PAID' ? 'ชำระเงินเรียบร้อยแล้ว' : 'การชำระเงินไม่ถูกต้อง'}</h2><p>{resultStatus === 'PAID' ? 'ระบบยืนยันการชำระเงินของคุณสำเร็จ' : 'กรุณาตรวจสอบสลิปและลองทำรายการใหม่อีกครั้ง'}</p><button className={styles.primaryButton} onClick={() => { setStep('select'); setBatch(null); setResultStatus(null); setSelectedIds([]); void refreshBills(); }}>กลับไปรายการบิล</button></section>}
      </main>
    </div>
  );
};

export default StudentBillingBatch;
