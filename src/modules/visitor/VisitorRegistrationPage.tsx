import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, FileScan, IdCard, Loader2, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { registerVisitor } from '../../services/adminApi';
import { api } from '../../services/api';
import styles from './VisitorRegistrationPage.module.css';

type VisitorForm = {
  fullName: string;
  visitorStatus: string;
  age: string;
  dateOfBirth: string;
  idCardNumber: string;
  address: string;
  contactRoom: string;
  purpose: string;
};

const initialForm: VisitorForm = {
  fullName: '',
  visitorStatus: '',
  age: '',
  dateOfBirth: '',
  idCardNumber: '',
  address: '',
  contactRoom: '',
  purpose: '',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
};

const VisitorRegistrationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<VisitorForm>(initialForm);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const updateField = (field: keyof VisitorForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('ไฟล์บัตรประชาชนต้องมีขนาดไม่เกิน 10 MB');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setIdCardFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setSuccess('');
  };

  const runOcr = async () => {
    if (!idCardFile) {
      setError('กรุณาเลือกรูปบัตรประชาชนก่อนใช้งาน OCR');
      return;
    }
    setIsOcrLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', idCardFile);
      const response = await api.post('/ocr/identity-card', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const ocrData = response.data?.data ?? response.data;
      setForm((current) => ({
        ...current,
        fullName: ocrData.fullName ?? ocrData.name ?? current.fullName,
        dateOfBirth: ocrData.dateOfBirth ?? ocrData.birthDate ?? current.dateOfBirth,
        idCardNumber: ocrData.idCardNumber ?? ocrData.citizenId ?? current.idCardNumber,
        address: ocrData.address ?? current.address,
      }));
      setSuccess('อ่านข้อมูลจากบัตรเรียบร้อยแล้ว กรุณาตรวจสอบความถูกต้องก่อนส่ง');
    } catch (ocrError) {
      setError(getErrorMessage(ocrError, 'ระบบ OCR ยังไม่พร้อมใช้งาน กรุณากรอกข้อมูลด้วยตนเอง'));
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!idCardFile) {
      setError('กรุณาถ่ายหรืออัปโหลดบัตรประชาชนก่อนส่งข้อมูล');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerVisitor({
        guestName: form.fullName,
        purpose: form.purpose || form.visitorStatus,
        expectedEntryTime: new Date().toISOString(),
        visitorStatus: form.visitorStatus,
        age: form.age ? Number(form.age) : undefined,
        dateOfBirth: form.dateOfBirth,
        idCardNumber: form.idCardNumber,
        address: form.address,
        contactRoom: form.contactRoom,
        idCardFile: idCardFile.name,
      });
      setSuccess('ลงทะเบียนผู้มาติดต่อเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ');
      setForm(initialForm);
      setIdCardFile(null);
      setPreviewUrl(null);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'ลงทะเบียนไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> กลับหน้าหลัก
        </button>
        <span className={styles.brand}>SMART DORMITORY</span>
      </header>

      <div className={styles.content}>
        <section className={styles.intro}>
          <div className={styles.iconBadge}><UserRound size={25} /></div>
          <p className={styles.kicker}>VISITOR REGISTRATION</p>
          <h1>ลงทะเบียนผู้มาติดต่อ</h1>
          <p className={styles.lead}>กรอกข้อมูลเพื่อขอเข้าเยี่ยมผู้พักอาศัย ข้อมูลจะถูกส่งให้เจ้าหน้าที่ตรวจสอบก่อนอนุมัติ</p>
          <div className={styles.trustRow}><CheckCircle2 size={17} /> ไม่ต้องเข้าสู่ระบบ · ข้อมูลส่งผ่านระบบอย่างปลอดภัย</div>
        </section>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.sectionHeading}><UserRound size={19} /><div><h2>ข้อมูลผู้มาติดต่อ</h2><p>ข้อมูลพื้นฐานสำหรับการตรวจสอบ</p></div></div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}><span>ชื่อ-นามสกุล <b>*</b></span><input required value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="เช่น สมชาย ใจดี" /></label>
            <label className={styles.field}><span>สถานะผู้มาติดต่อ <b>*</b></span><select required value={form.visitorStatus} onChange={(event) => updateField('visitorStatus', event.target.value)}><option value="">เลือกสถานะ</option><option value="ญาติ">ญาติ</option><option value="เพื่อน">เพื่อน</option><option value="ผู้ติดต่อทั่วไป">ผู้ติดต่อทั่วไป</option><option value="ช่าง/ผู้ให้บริการ">ช่าง / ผู้ให้บริการ</option></select></label>
            <label className={styles.field}><span>อายุ <b>*</b></span><input required type="number" min="1" max="120" value={form.age} onChange={(event) => updateField('age', event.target.value)} placeholder="อายุ (ปี)" /></label>
            <label className={styles.field}><span>วันเดือนปีเกิด</span><input type="date" value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} /></label>
            <label className={styles.field}><span>ห้อง/ผู้พักที่ต้องการติดต่อ</span><input value={form.contactRoom} onChange={(event) => updateField('contactRoom', event.target.value)} placeholder="เช่น ห้อง 301 หรือชื่อผู้พัก" /></label>
            <label className={styles.field}><span>วัตถุประสงค์</span><input value={form.purpose} onChange={(event) => updateField('purpose', event.target.value)} placeholder="เช่น มาเยี่ยม พูดคุย หรือส่งของ" /></label>
          </div>

          <div className={styles.sectionHeading}><IdCard size={19} /><div><h2>ข้อมูลบัตรประชาชน</h2><p>ถ่ายบัตรให้เห็นข้อมูลชัดเจน หรือกรอกข้อมูลด้วยตนเอง</p></div></div>
          <div className={styles.documentLayout}>
            <label className={styles.uploadBox} htmlFor="visitor-id-card"><FileScan size={28} /><strong>{idCardFile ? idCardFile.name : 'ถ่ายหรืออัปโหลดบัตรประชาชน'}</strong><span>JPG, PNG หรือ WEBP · ไม่เกิน 10 MB</span><input id="visitor-id-card" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} /></label>
            {previewUrl && <img className={styles.preview} src={previewUrl} alt="ตัวอย่างบัตรประชาชน" />}
          </div>
          <button type="button" className={styles.ocrButton} onClick={() => void runOcr()} disabled={!idCardFile || isOcrLoading}><FileScan size={17} /> {isOcrLoading ? <><Loader2 className={styles.spin} size={17} /> กำลังอ่านข้อมูล...</> : 'อ่านข้อมูลจากบัตรด้วย OCR'}</button>

          <div className={styles.fieldGrid}>
            <label className={styles.field}><span>เลขบัตรประชาชน</span><input inputMode="numeric" maxLength={13} value={form.idCardNumber} onChange={(event) => updateField('idCardNumber', event.target.value.replace(/\D/g, ''))} placeholder="เลข 13 หลัก" /></label>
            <label className={`${styles.field} ${styles.fullWidth}`}><span>ที่อยู่</span><textarea rows={3} value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="บ้านเลขที่ หมู่ ถนน ตำบล อำเภอ จังหวัด" /></label>
          </div>

          {error && <div className={styles.messageError}>{error}</div>}
          {success && <div className={styles.messageSuccess}><CheckCircle2 size={18} /> {success}</div>}
          <button className={styles.submitButton} type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className={styles.spin} size={18} /> กำลังส่งข้อมูล...</> : 'ส่งข้อมูลลงทะเบียน'}</button>
          <p className={styles.requiredNote}>ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก</p>
        </form>
      </div>
    </main>
  );
};

export default VisitorRegistrationPage;