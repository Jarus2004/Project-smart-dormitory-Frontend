import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, FileText, IdCard, Image, Loader2, Printer, ShieldCheck } from 'lucide-react';
import { getMyTenant, getMyTenantDocument } from '../../../services/adminApi';
import UserPageHeader from '../components/UserPageHeader/UserPageHeader';
import styles from './StudentDocuments.module.css';

type TenantDocumentRecord = {
  fullName?: string | null;
  studentId?: string | null;
  course?: string | null;
  yearLevel?: string | null;
  phone?: string | null;
  email?: string | null;
  emergencyName?: string | null;
  emergencyRelation?: string | null;
  emergencyContact?: string | null;
  citizenId?: string | null;
  address?: string | null;
  birthDate?: string | null;
  preferredRoomType?: string | null;
  notes?: string | null;
  contractData?: string | null;
  idCardImagePath?: string | null;
  paymentSlipPath?: string | null;
  status?: string | null;
  room?: { roomNumber?: string | null } | null;
};

type DocumentState = { url: string | null; mimeType: string | null; error: string | null };

const readContract = (value?: string | null): Record<string, string> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, entry]) => [key, String(entry ?? '')]));
  } catch {
    return {};
  }
};

const displayValue = (value?: string | null) => value?.trim() || '-';
const statusLabels: Record<string, string> = {
  APPROVED: 'อนุมัติแล้ว',
  ACTIVE: 'มีผลบังคับใช้แล้ว',
  PENDING: 'รอดำเนินการ',
  REJECTED: 'ปฏิเสธแล้ว',
};

// Box component for highlighting filled fields in the contract
const FieldBox = ({ value }: { value?: string | null }) => {
  return <span className={styles.fieldBox}>{displayValue(value)}</span>;
};

const StudentDocuments = () => {
  const [tenant, setTenant] = useState<TenantDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAttachments, setShowAttachments] = useState(true);
  const [idCard, setIdCard] = useState<DocumentState>({ url: null, mimeType: null, error: null });
  const [paymentSlip, setPaymentSlip] = useState<DocumentState>({ url: null, mimeType: null, error: null });

  useEffect(() => {
    let mounted = true;
    const objectUrls: string[] = [];

    const loadDocuments = async () => {
      try {
        const tenantResponse = await getMyTenant();
        const record = tenantResponse.data?.data as TenantDocumentRecord | null;
        if (!mounted) return;
        setTenant(record);

        if (!record) return;

        const loadFile = async (type: 'id-card' | 'payment-slip', setter: (state: DocumentState) => void) => {
          try {
            const response = await getMyTenantDocument(type);
            const url = URL.createObjectURL(response.data);
            objectUrls.push(url);
            const contentType = response.headers['content-type'];
            if (mounted) setter({ url, mimeType: typeof contentType === 'string' ? contentType : null, error: null });
          } catch {
            if (mounted) setter({ url: null, mimeType: null, error: 'ยังไม่มีไฟล์เอกสารนี้ในระบบ' });
          }
        };

        await Promise.all([
          loadFile('id-card', setIdCard),
          loadFile('payment-slip', setPaymentSlip),
        ]);
      } catch (requestError: unknown) {
        const message = axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message
          : undefined;
        if (mounted) setError(message || 'ไม่สามารถโหลดข้อมูลเอกสารได้');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDocuments();
    return () => {
      mounted = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const contract = readContract(tenant?.contractData);

  const renderDocument = (document: DocumentState, alt: string) => {
    if (!document.url) return <div className={styles.noticeBox}>{document.error || 'ไม่มีไฟล์เอกสาร'}</div>;
    if (document.mimeType === 'application/pdf') {
      return <iframe className={styles.documentFrame} src={document.url} title={alt} />;
    }
    return <img className={styles.documentPreview} src={document.url} alt={alt} />;
  };

  return (
    <div className={styles.page}>
      <UserPageHeader backLabel="กลับหน้าหลัก" />

      <main className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroBadge}>
            <FileText size={16} /> ใบสัญญาและเอกสาร
          </div>
          <h1 className={styles.heroTitle}>เอกสารสัญญาเช่าหอพัก</h1>
          <p className={styles.heroDesc}>
            หนังสือสัญญาเช่าห้องพักที่ได้รับการอนุมัติและมีผลบังคับใช้
          </p>
        </div>

        {loading && (
          <div className={styles.noticeBox}>
            <Loader2 className={styles.spin} size={18} /> กำลังโหลดเอกสารสัญญา...
          </div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        {!loading && !error && !tenant && (
          <div className={styles.noticeBox}>ไม่พบข้อมูลสัญญาเช่าในระบบ</div>
        )}

        {tenant && (
          <>
            {/* Action Bar with Status and Print Button */}
            <div className={styles.actionBar}>
              <div className={styles.statusIndicator}>
                <span className={styles.statusDot} />
                <span className={styles.statusText}>
                  สถานะเอกสาร: <strong>{statusLabels[tenant.status?.toUpperCase() ?? ''] ?? displayValue(tenant.status)}</strong>
                </span>
              </div>
              <button type="button" className={styles.printBtn} onClick={() => window.print()}>
                <Printer size={16} /> พิมพ์ / บันทึก PDF
              </button>
            </div>

            {/* Official Rental Contract Document Paper */}
            <article className={styles.contractPaper}>
              <div className={styles.contractHeader}>
                <p className={styles.contractDocTitle}>หนังสือสัญญาเช่าหอพัก</p>
                <h2 className={styles.contractBrand}>SMART DORMITORY</h2>
                <span className={styles.contractSubNote}>เอกสารฉบับทางการจากระบบสารสนเทศหอพัก</span>
              </div>

              <div className={styles.contractDateLine}>
                ทำที่ <FieldBox value={contract.docLocation} /><br />
                วันที่ <FieldBox value={contract.docDate} /> เดือน <FieldBox value={contract.docMonth} /> พ.ศ. <FieldBox value={contract.docYear} />
              </div>

              <div className={styles.contractIntro}>
                <p>
                  หนังสือสัญญาฉบับนี้ทำขึ้นระหว่าง <FieldBox value={contract.landlordName} />
                  {' '}ที่อยู่ <FieldBox value={contract.landlordAddress} /> โทรศัพท์ <FieldBox value={contract.landlordPhone} />
                  {' '}ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้ให้เช่า” ฝ่ายหนึ่ง กับ
                </p>
                <p>
                  <FieldBox value={contract.tenantName || tenant.fullName} /> อายุ <FieldBox value={contract.tenantAge} /> ปี
                  {' '}เลขบัตรประชาชน <FieldBox value={contract.tenantCitizenId || tenant.citizenId} />
                  {' '}ที่อยู่ <FieldBox value={contract.tenantAddress || tenant.address} />
                  {' '}โทรศัพท์ <FieldBox value={contract.tenantPhone || tenant.phone} /> ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้เช่า” อีกฝ่ายหนึ่ง
                </p>
                <p>
                  คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญาเช่าห้องพัก โดยมีรายละเอียดและเงื่อนไขดังต่อไปนี้
                </p>
              </div>

              <ul className={styles.contractClauses}>
                <li>
                  <span className={styles.clauseTitle}>ข้อ 1. ห้องพักและระยะเวลาเช่า:</span>
                  <p>
                    ผู้ให้เช่าตกลงให้ผู้เช่าเช่าห้องเลขที่ <FieldBox value={contract.roomNumber || tenant.room?.roomNumber || tenant.preferredRoomType} /> อาคาร <FieldBox value={contract.building} /> ชั้น <FieldBox value={contract.floor} /> ตั้งแต่วันที่ <FieldBox value={contract.startDate} /> ถึงวันที่ <FieldBox value={contract.endDate} />
                  </p>
                </li>
                <li>
                  <span className={styles.clauseTitle}>ข้อ 2. ค่าเช่าและเงินประกัน:</span>
                  <p>
                    ผู้เช่าตกลงชำระค่าเช่าเดือนละ <FieldBox value={contract.monthlyRent} /> บาท เงินประกัน <FieldBox value={contract.depositAmount} /> บาท และค่ามัดจำกุญแจ/คีย์การ์ด <FieldBox value={contract.keycardDeposit} /> บาท โดยชำระภายในวันที่ <FieldBox value={contract.payDueDate} /> ของทุกเดือน
                  </p>
                </li>
                <li>
                  <span className={styles.clauseTitle}>ข้อ 3. ค่าสาธารณูปโภคและค่าใช้จ่ายอื่น:</span>
                  <p>
                    ค่าไฟฟ้าหน่วยละ <FieldBox value={contract.electricityRate} /> บาท ค่าน้ำประปาหน่วยละ <FieldBox value={contract.waterRate} /> บาท ค่าอินเทอร์เน็ต <FieldBox value={contract.internetFee} /> และค่าใช้จ่ายอื่น <FieldBox value={contract.otherExpenses} /> บาท ตามรายการเรียกเก็บจริงของหอพัก
                  </p>
                </li>
                <li>
                  <span className={styles.clauseTitle}>ข้อ 4. การใช้ห้องพักและทรัพย์สิน:</span>
                  <p>
                    ผู้เช่าต้องใช้ห้องพักเพื่อการอยู่อาศัย รักษาความสะอาดและทรัพย์สินของหอพัก ไม่ดัดแปลงห้อง ไม่ก่อเหตุรบกวน และต้องรับผิดชอบความเสียหายที่เกิดจากการกระทำของตนหรือผู้ที่ผู้เช่าอนุญาตให้เข้าพัก
                  </p>
                </li>
                <li>
                  <span className={styles.clauseTitle}>ข้อ 5. การสิ้นสุดสัญญา:</span>
                  <p>
                    ผู้เช่าต้องแจ้งความประสงค์ย้ายออกล่วงหน้าไม่น้อยกว่า <FieldBox value={contract.advanceNoticeDays} /> วัน และส่งคืนกุญแจ/คีย์การ์ดพร้อมห้องพักในสภาพเรียบร้อยก่อนสิ้นสุดการเช่า
                  </p>
                </li>
                <li>
                  <span className={styles.clauseTitle}>ข้อ 6. ข้อตกลงเพิ่มเติม:</span>
                  <p>
                    <FieldBox value={tenant.notes} />
                  </p>
                </li>
              </ul>

              <p className={styles.contractClosing}>
                คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญานี้โดยตลอดแล้ว จึงได้จัดทำเอกสารฉบับนี้ไว้เป็นหลักฐาน
              </p>

              <div className={styles.signatureGrid}>
                <div className={styles.signatureItem}>
                  <div className={styles.signatureDottedLine}>ลงชื่อ ........................................................ ผู้ให้เช่า</div>
                  <div className={styles.signatureName}>({displayValue(contract.landlordName)})</div>
                </div>
                <div className={styles.signatureItem}>
                  <div className={styles.signatureDottedLine}>ลงชื่อ ........................................................ ผู้เช่า</div>
                  <div className={styles.signatureName}>({displayValue(contract.tenantName || tenant.fullName)})</div>
                </div>
                <div className={styles.signatureItem}>
                  <div className={styles.signatureDottedLine}>ลงชื่อ ........................................................ พยาน</div>
                  <div className={styles.signatureName}>( ........................................................ )</div>
                </div>
                <div className={styles.signatureItem}>
                  <div className={styles.signatureDottedLine}>ลงชื่อ ........................................................ พยาน</div>
                  <div className={styles.signatureName}>( ........................................................ )</div>
                </div>
              </div>
            </article>

            {/* Attachments Section (ID Card & Payment Slip) */}
            <section className={styles.attachmentsSection}>
              <div className={styles.attachmentsHeader} onClick={() => setShowAttachments((prev) => !prev)}>
                <div className={styles.attachmentsTitle}>
                  <ShieldCheck size={20} color="#2563eb" />
                  <span>เอกสารแนบประกอบสัญญา (บัตรประชาชน & สลิปโอนเงิน)</span>
                </div>
                <button type="button" className={styles.toggleBtn}>
                  {showAttachments ? <>ซ่อนเอกสาร <ChevronUp size={16} /></> : <>แสดงเอกสาร <ChevronDown size={16} /></>}
                </button>
              </div>

              {showAttachments && (
                <div className={styles.attachmentsGrid}>
                  <div className={styles.attachmentCard}>
                    <div className={styles.attachmentCardHeader}>
                      <IdCard size={18} color="#2563eb" /> สำเนาบัตรประชาชน
                    </div>
                    {renderDocument(idCard, 'สำเนาบัตรประชาชนที่แนบในใบสมัคร')}
                  </div>

                  <div className={styles.attachmentCard}>
                    <div className={styles.attachmentCardHeader}>
                      <Image size={18} color="#2563eb" /> สลิปหลักฐานการชำระเงิน
                    </div>
                    {renderDocument(paymentSlip, 'หลักฐานการชำระเงินที่แนบในใบสมัคร')}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDocuments;
