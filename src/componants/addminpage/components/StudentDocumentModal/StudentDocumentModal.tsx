import { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  IdCard,
  User,
  Printer,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ZoomIn,
  Loader2,
  Phone,
  AlertCircle,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { getTenantById, getTenantDocumentById } from '../../../../services/adminApi';
import styles from './StudentDocumentModal.module.css';

export interface StudentDocumentModalProps {
  isOpen: boolean;
  tenantId: string | number | null;
  initialTenant?: TenantDocumentRecord;
  onClose: () => void;
  onStatusChange?: (tenantId: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => Promise<void>;
}

type TabType = 'contract' | 'documents' | 'info';

type DocumentState = {
  url: string | null;
  mimeType: string | null;
  error: string | null;
};

interface TenantDocumentRecord {
  id: string | number;
  fullName?: string | null;
  studentId?: string | null;
  course?: string | null;
  yearLevel?: string | null;
  phone?: string | null;
  email?: string | null;
  citizenId?: string | null;
  birthDate?: string | null;
  address?: string | null;
  emergencyName?: string | null;
  emergencyRelation?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  preferredRoomType?: string | null;
  status?: string | null;
  contractData?: string | null;
  room?: {
    roomNumber?: string | null;
    floor?: number | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  APPROVED: 'อนุมัติแล้ว',
  ACTIVE: 'มีผลบังคับใช้แล้ว',
  PENDING: 'รอดำเนินการ',
  REJECTED: 'ปฏิเสธแล้ว',
  Active: 'ใช้งานอยู่',
  Pending: 'รอดำเนินการ',
  Inactive: 'ไม่ใช้งาน',
};

const displayValue = (value?: string | null) => value?.trim() || '-';

const readContract = (value?: string | null): Record<string, string> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).map(([key, entry]) => [key, String(entry ?? '')]));
  } catch {
    return {};
  }
};

const FieldBox = ({ value }: { value?: string | null }) => (
  <span className={styles.fieldBox}>{displayValue(value)}</span>
);

export const StudentDocumentModal = ({
  isOpen,
  tenantId,
  initialTenant,
  onClose,
  onStatusChange,
}: StudentDocumentModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('contract');
  const [tenant, setTenant] = useState<TenantDocumentRecord | null>(initialTenant || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [idCardDoc, setIdCardDoc] = useState<DocumentState>({ url: null, mimeType: null, error: null });
  const [paymentSlipDoc, setPaymentSlipDoc] = useState<DocumentState>({ url: null, mimeType: null, error: null });
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Keep modal scroll locked
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch full tenant details and document blobs
  useEffect(() => {
    if (!isOpen || !tenantId) return;

    let mounted = true;
    const objectUrls: string[] = [];

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getTenantById(String(tenantId));
        const record = res.data?.data ?? null;
        if (mounted) {
          setTenant(record);
        }

        // Fetch document attachments
        const loadDoc = async (
          type: 'id-card' | 'payment-slip',
          setter: (state: DocumentState) => void
        ) => {
          try {
            const docRes = await getTenantDocumentById(tenantId, type);
            const url = URL.createObjectURL(docRes.data);
            objectUrls.push(url);
            const contentType = docRes.headers?.['content-type'];
            if (mounted) {
              setter({
                url,
                mimeType: typeof contentType === 'string' ? contentType : null,
                error: null,
              });
            }
          } catch {
            if (mounted) {
              setter({ url: null, mimeType: null, error: 'ยังไม่มีไฟล์เอกสารนี้ในระบบ' });
            }
          }
        };

        await Promise.all([
          loadDoc('id-card', setIdCardDoc),
          loadDoc('payment-slip', setPaymentSlipDoc),
        ]);
      } catch (err) {
        console.error('Failed to load tenant document details:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [isOpen, tenantId]);

  const contract = useMemo(() => readContract(tenant?.contractData), [tenant?.contractData]);

  const handleStatusAction = async (newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!tenantId || !onStatusChange) return;
    try {
      setActionLoading(true);
      await onStatusChange(String(tenantId), newStatus);
      setTenant((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error('Status action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const currentStatus = String(tenant?.status || 'PENDING').toUpperCase();
  const isApproved = currentStatus === 'APPROVED' || currentStatus === 'ACTIVE';
  const isPending = currentStatus === 'PENDING';
  const isRejected = currentStatus === 'REJECTED' || currentStatus === 'INACTIVE';

  const roomDisplay = tenant?.room?.roomNumber || contract.roomNumber || tenant?.preferredRoomType || '-';
  const floorDisplay = tenant?.room?.floor
    ? `ชั้น ${tenant.room.floor}`
    : contract.floor
    ? contract.floor.startsWith('Floor') || contract.floor.startsWith('ชั้น')
      ? contract.floor
      : `ชั้น ${contract.floor}`
    : '-';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconWrap}>
              <FileText size={22} />
            </div>
            <div className={styles.headerTitleWrap}>
              <h3 className={styles.headerTitle}>
                รายละเอียดใบสมัครและสัญญาเช่า
              </h3>
              <p className={styles.headerSub}>
                {displayValue(tenant?.fullName)} • รหัสนักศึกษา {displayValue(tenant?.studentId)} • ห้อง {roomDisplay}
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <span
              className={`${styles.statusBadge} ${
                isApproved
                  ? styles.statusApproved
                  : isPending
                  ? styles.statusPending
                  : styles.statusRejected
              }`}
            >
              {isApproved && <CheckCircle2 size={13} />}
              {isPending && <AlertCircle size={13} />}
              {isRejected && <XCircle size={13} />}
              {statusLabels[currentStatus] || currentStatus}
            </span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'contract' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('contract')}
          >
            <FileText size={16} /> หนังสือสัญญาเช่า
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'documents' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <IdCard size={16} /> เอกสารแนบหลักฐาน
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'info' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={16} /> ข้อมูลผู้สมัคร
          </button>
        </div>

        {/* Body Content */}
        <div className={styles.modalBody}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Loader2 className={styles.spin} size={28} style={{ display: 'block', margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontWeight: 600 }}>กำลังโหลดข้อมูลใบสมัครและเอกสาร...</p>
            </div>
          )}

          {!loading && activeTab === 'contract' && (
            <article className={styles.contractPaper}>
              <div className={styles.contractHeader}>
                <p className={styles.contractDocTitle}>หนังสือสัญญาเช่าหอพัก</p>
                <h2 className={styles.contractBrand}>MEEDEE Dormitory</h2>
                <span className={styles.contractSubNote}>เอกสารฉบับทางการจากระบบสารสนเทศหอพัก</span>
              </div>

              <div className={styles.contractDateLine}>
                ทำที่ <FieldBox value={contract.docLocation || 'สำนักงานหอพัก MEEDEE Dormitory'} /><br />
                วันที่ <FieldBox value={contract.docDate} /> เดือน <FieldBox value={contract.docMonth} /> พ.ศ. <FieldBox value={contract.docYear} />
              </div>

              <div className={styles.contractIntro}>
                <p>
                  หนังสือสัญญาฉบับนี้ทำขึ้นระหว่าง <FieldBox value={contract.landlordName || 'ผู้บริหารหอพัก MEEDEE Dormitory'} />
                  {' '}ที่อยู่ <FieldBox value={contract.landlordAddress || '123/45 ถนนพหลโยธิน กรุงเทพมหานคร'} /> โทรศัพท์ <FieldBox value={contract.landlordPhone || '02-123-4567'} />
                  {' '}ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ผู้ให้เช่า"</strong> ฝ่ายหนึ่ง กับ
                </p>
                <p style={{ marginTop: '8px' }}>
                  <FieldBox value={tenant?.fullName || contract.tenantName} /> อายุ <FieldBox value={contract.tenantAge} /> ปี
                  {' '}ถือบัตรประจำตัวประชาชนเลขที่ <FieldBox value={tenant?.citizenId || contract.tenantCitizenId} />
                  {' '}อยู่บ้านเลขที่ <FieldBox value={tenant?.address || contract.tenantAddress} /> โทรศัพท์ <FieldBox value={tenant?.phone || contract.tenantPhone} />
                  {' '}ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>"ผู้เช่า"</strong> อีกฝ่ายหนึ่ง
                </p>
              </div>

              <div className={styles.contractSection}>
                <p>คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญาเช่าห้องพัก มีข้อความและเงื่อนไขดังต่อไปนี้:</p>

                <h4>ข้อ 1. ทรัพย์สินที่เช่า</h4>
                <p>
                  ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักเลขที่ <FieldBox value={roomDisplay} />
                  {' '}<FieldBox value={floorDisplay} /> อาคาร <FieldBox value={contract.building || 'อาคาร A'} />
                  {' '}ของหอพัก MEEDEE Dormitory เพื่อใช้เป็นที่อยู่อาศัยเท่านั้น
                </p>

                <h4>ข้อ 2. ระยะเวลาการเช่า</h4>
                <p>
                  สัญญาเช่านี้มีกำหนดระยะเวลา 1 ปี นับตั้งแต่วันที่ <FieldBox value={contract.startDate || '01/09/2569'} />
                  {' '}ถึงวันที่ <FieldBox value={contract.endDate || '31/08/2570'} />
                </p>

                <h4>ข้อ 3. อัตราค่าเช่าและการชำระเงิน</h4>
                <p>
                  ผู้เช่าตกลงชำระค่าเช่าให้แก่ผู้ให้เช่าในอัตราเดือนละ <FieldBox value={contract.monthlyRent ? `${contract.monthlyRent} บาท` : '3,500 บาท'} />
                  {' '}โดยกำหนดชำระภายในวันที่ <FieldBox value={contract.payDueDate || '5'} /> ของทุกเดือน
                </p>
                <p style={{ marginTop: '6px' }}>
                  ในวันทำสัญญานี้ ผู้เช่าได้วางเงินประกันความเสียหายและเงินมัดจำเป็นจำนวน <FieldBox value={contract.depositAmount ? `${contract.depositAmount} บาท` : '3,500 บาท'} />
                  {' '}และเงินประกันคีย์การ์ด <FieldBox value={contract.keycardDeposit ? `${contract.keycardDeposit} บาท` : '300 บาท'} /> ให้แก่ผู้ให้เช่าเรียบร้อยแล้ว
                </p>

                <h4>ข้อ 4. ค่าสาธารณูปโภคและค่าบริการ</h4>
                <ul className={styles.contractList}>
                  <li>ค่ากระแสไฟฟ้า: คิดตามมิเตอร์ที่ใช้จริง หน่วยละ <FieldBox value={contract.electricityRate || '8'} /> บาท</li>
                  <li>ค่าน้ำประปา: อัตราเหมาจ่ายห้องละ <FieldBox value={contract.waterRate || '100'} /> บาท / เดือน (หารตามจำนวนผู้พักอาศัยจริง)</li>
                  <li>ค่าบริการอินเทอร์เน็ต: <FieldBox value={contract.internetFee || 'ฟรี WiFi'} /></li>
                </ul>

                <h4>ข้อ 5. การดูแลรักษาห้องพักและกฎระเบียบ</h4>
                <p>
                  ผู้เช่าต้องปฏิบัติตามระเบียบข้อบังคับของหอพักอย่างเคร่งครัด ห้ามก่อความรำคาญ ห้ามสูบบุหรี่ในห้องพัก และห้ามนำสารเสพติดหรือสิ่งผิดกฎหมายเข้ามาในบริเวณหอพักโดยเด็ดขาด
                </p>
              </div>

              <div className={styles.contractSignatures}>
                <div className={styles.signBlock}>
                  <div className={styles.signLine} />
                  <span className={styles.signName}>({contract.landlordName || 'ผู้บริหารหอพัก MEEDEE Dormitory'})</span>
                  <span className={styles.signRole}>ผู้ให้เช่า</span>
                </div>
                <div className={styles.signBlock}>
                  <div className={styles.signLine} />
                  <span className={styles.signName}>({tenant?.fullName || contract.tenantName || 'ผู้เช่า'})</span>
                  <span className={styles.signRole}>ผู้เช่า</span>
                </div>
              </div>
            </article>
          )}

          {!loading && activeTab === 'documents' && (
            <div className={styles.attachmentsGrid}>
              {/* ID Card Document Card */}
              <div className={styles.docCard}>
                <div className={styles.docCardHeader}>
                  <h4 className={styles.docCardTitle}>
                    <IdCard size={18} color="#2563eb" /> บัตรประจำตัวประชาชน
                  </h4>
                  {tenant?.citizenId && (
                    <span style={{ fontSize: '0.78rem', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      ✓ ตรวจสอบแล้ว
                    </span>
                  )}
                </div>

                <div
                  className={styles.docPreviewBox}
                  onClick={() => idCardDoc.url && setLightboxImg(idCardDoc.url)}
                >
                  {idCardDoc.url ? (
                    <>
                      {idCardDoc.mimeType === 'application/pdf' ? (
                        <iframe className={styles.docFrame} src={idCardDoc.url} title="ID Card PDF" />
                      ) : (
                        <img className={styles.docImg} src={idCardDoc.url} alt="Thai ID Card" />
                      )}
                      <div className={styles.zoomHint}>
                        <ZoomIn size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        คลิกเพื่อดูรูปขยาย
                      </div>
                    </>
                  ) : (
                    <div className={styles.docNotice}>
                      <IdCard size={32} opacity={0.3} />
                      <p>{idCardDoc.error || 'ไม่มีรูปบัตรประชาชน'}</p>
                    </div>
                  )}
                </div>

                {/* OCR Summary */}
                {tenant?.citizenId && (
                  <div className={styles.ocrSummaryCard}>
                    <div className={styles.ocrSummaryTitle}>
                      <ShieldCheck size={15} /> ข้อมูลที่อ่านได้จากระบบ OCR
                    </div>
                    <div className={styles.ocrRow}>
                      <span>เลขบัตรประชาชน:</span>
                      <strong>{displayValue(tenant?.citizenId)}</strong>
                    </div>
                    <div className={styles.ocrRow}>
                      <span>ชื่อ-นามสกุล:</span>
                      <strong>{displayValue(tenant?.fullName)}</strong>
                    </div>
                    {tenant?.birthDate && (
                      <div className={styles.ocrRow}>
                        <span>วันเกิด:</span>
                        <strong>{displayValue(tenant?.birthDate)}</strong>
                      </div>
                    )}
                    {tenant?.address && (
                      <div className={styles.ocrRow}>
                        <span>ที่อยู่ตามบัตร:</span>
                        <strong style={{ maxWidth: '60%', textAlign: 'right' }}>{displayValue(tenant?.address)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Slip Document Card */}
              <div className={styles.docCard}>
                <div className={styles.docCardHeader}>
                  <h4 className={styles.docCardTitle}>
                    <CreditCard size={18} color="#10b981" /> สลิปหลักฐานการโอนเงิน
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    เงินมัดจำ {contract.depositAmount ? `${contract.depositAmount} บาท` : '3,500 บาท'}
                  </span>
                </div>

                <div
                  className={styles.docPreviewBox}
                  onClick={() => paymentSlipDoc.url && setLightboxImg(paymentSlipDoc.url)}
                >
                  {paymentSlipDoc.url ? (
                    <>
                      {paymentSlipDoc.mimeType === 'application/pdf' ? (
                        <iframe className={styles.docFrame} src={paymentSlipDoc.url} title="Payment Slip PDF" />
                      ) : (
                        <img className={styles.docImg} src={paymentSlipDoc.url} alt="Payment Slip" />
                      )}
                      <div className={styles.zoomHint}>
                        <ZoomIn size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        คลิกเพื่อดูรูปขยาย
                      </div>
                    </>
                  ) : (
                    <div className={styles.docNotice}>
                      <CreditCard size={32} opacity={0.3} />
                      <p>{paymentSlipDoc.error || 'ไม่มีสลิปการโอนเงิน'}</p>
                    </div>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ห้องที่สมัคร:</span>
                    <strong style={{ color: '#0f172a' }}>{roomDisplay} ({floorDisplay})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ยอดเงินมัดจำ:</span>
                    <strong style={{ color: '#166534' }}>{contract.depositAmount || '3,500'} บาท</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'info' && (
            <div>
              <div className={styles.infoSection}>
                <h4 className={styles.infoSectionTitle}>
                  <User size={18} color="#2563eb" /> ข้อมูลส่วนตัวผู้สมัคร
                </h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ชื่อ-นามสกุล</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.fullName)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>รหัสนักศึกษา</span>
                    <span className={`${styles.infoValue} ${styles.infoValueHighlight}`}>{displayValue(tenant?.studentId)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>หลักสูตร / สาขาวิชา</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.course)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ชั้นปี</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.yearLevel)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>เบอร์โทรศัพท์</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.phone)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>อีเมล</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.email)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>เลขประจำตัวประชาชน</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.citizenId)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>วันเดือนปีเกิด</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.birthDate)}</span>
                  </div>
                  <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.infoLabel}>ที่อยู่ตามทะเบียนบ้าน</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.address)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.infoSectionTitle}>
                  <Phone size={18} color="#f59e0b" /> ข้อมูลผู้ติดต่อฉุกเฉิน
                </h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ชื่อผู้ติดต่อฉุกเฉิน</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.emergencyName)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ความสัมพันธ์</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.emergencyRelation)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>เบอร์โทรติดต่อฉุกเฉิน</span>
                    <span className={`${styles.infoValue} ${styles.infoValueHighlight}`}>{displayValue(tenant?.emergencyContact)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>หมายเหตุเพิ่มเติม</span>
                    <span className={styles.infoValue}>{displayValue(tenant?.notes)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            {isPending && (
              <>
                <button
                  type="button"
                  className={styles.btnApprove}
                  onClick={() => handleStatusAction('APPROVED')}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} /> อนุมัติคำขอ
                </button>
                <button
                  type="button"
                  className={styles.btnReject}
                  onClick={() => handleStatusAction('REJECTED')}
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> ปฏิเสธ
                </button>
              </>
            )}

            {isApproved && (
              <>
                <button
                  type="button"
                  className={styles.btnRevert}
                  onClick={() => handleStatusAction('PENDING')}
                  disabled={actionLoading}
                >
                  <RotateCcw size={16} /> ยกเลิกการอนุมัติ
                </button>
                <button
                  type="button"
                  className={styles.btnReject}
                  onClick={() => handleStatusAction('REJECTED')}
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> ปฏิเสธ
                </button>
              </>
            )}

            {isRejected && (
              <>
                <button
                  type="button"
                  className={styles.btnApprove}
                  onClick={() => handleStatusAction('APPROVED')}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} /> อนุมัติอีกครั้ง
                </button>
                <button
                  type="button"
                  className={styles.btnRevert}
                  onClick={() => handleStatusAction('PENDING')}
                  disabled={actionLoading}
                >
                  <RotateCcw size={16} /> ยกเลิกการปฏิเสธ
                </button>
              </>
            )}

            <button type="button" className={styles.btnPrint} onClick={handlePrint}>
              <Printer size={16} /> พิมพ์ / บันทึก PDF
            </button>
          </div>

          <div className={styles.footerRight}>
            <button type="button" className={styles.btnClose} onClick={onClose}>
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Lightbox Zoom */}
      {lightboxImg && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxImg(null)}>
          <button
            className={styles.lightboxClose}
            onClick={() => setLightboxImg(null)}
            aria-label="Close lightbox"
          >
            <X size={22} />
          </button>
          <div className={styles.lightboxBox} onClick={(e) => e.stopPropagation()}>
            <img className={styles.lightboxImg} src={lightboxImg} alt="Document Zoom" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDocumentModal;
