import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, Plus, X, Upload, Clock, CheckCircle, Wrench, AlertCircle, ChevronRight, type LucideIcon } from 'lucide-react';
import { getMaintenanceTickets, createMaintenanceTicket, getMyTenant, uploadMaintenanceImage } from '../../../services/adminApi';
import UserPageHeader from '../components/UserPageHeader/UserPageHeader';
import styles from './StudentMaintenance.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Ticket {
  id: number;
  category: string;
  description: string;
  status: string;
  contactTime: string | null;
  createdAt: string;
  room?: { roomNumber: string };
}

interface TenantInfo {
  roomId: number | null;
  room?: { roomNumber: string };
}

type MaintenanceCategory = 'ELECTRICAL' | 'PLUMBING' | 'CLEANING' | 'SECURITY' | 'OTHER';

interface CreateMaintenanceTicketPayload {
  category: MaintenanceCategory;
  description: string;
  contactTime?: string;
  roomId?: number;
}

interface MaintenanceForm {
  category: MaintenanceCategory;
  description: string;
  note: string;
  contactTime: string;
}

const CATEGORY_OPTIONS: Array<{ value: MaintenanceCategory; label: string }> = [
  { value: 'ELECTRICAL', label: 'ไฟฟ้า' },
  { value: 'PLUMBING', label: '🚿 ประปา' },
  { value: 'CLEANING', label: '🧹 ความสะอาด' },
  { value: 'SECURITY', label: '🔒 ความปลอดภัย' },
  { value: 'OTHER', label: '📋 อื่นๆ' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  PENDING:     { label: 'รอดำเนินการ',     color: '#f59e0b', icon: Clock },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', color: '#10b981', icon: Wrench },
  APPROVED:    { label: 'อนุมัติแล้ว',     color: '#10b981', icon: CheckCircle },
  RESOLVED:    { label: 'เสร็จสิ้น',       color: '#10b981', icon: CheckCircle },
  COMPLETED:   { label: 'เสร็จสิ้น',       color: '#10b981', icon: CheckCircle },
  CANCELLED:   { label: 'ยกเลิก',          color: '#ef4444', icon: X },
  CLOSED:      { label: 'ปิดงาน',           color: '#ef4444', icon: X },
};

// ─── Component ───────────────────────────────────────────────────────────────
const StudentMaintenance = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState<MaintenanceForm>({
    category: 'ELECTRICAL',
    description: '',
    note: '',
    contactTime: '',
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const [ticketsRes, tenantRes] = await Promise.all([
          getMaintenanceTickets(),
          getMyTenant(),
        ]);
        if (!active) return;
        setTickets(ticketsRes.data?.data ?? []);
        setTenant(tenantRes.data?.data ?? null);
      } catch {
        // Keep the page usable when the initial request fails.
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();
    return () => { active = false; };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const resetModal = () => {
    setForm({ category: 'ELECTRICAL', description: '', note: '', contactTime: '' });
    setImageFile(null);
    setSubmitError('');
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issueText = form.note.trim();
    const detailText = form.description.trim();
    // Build combined description: backend requires >= 5 chars
    const combinedDesc = issueText && detailText
      ? `${issueText} — ${detailText}`
      : issueText || detailText;

    if (combinedDesc.length < 5) {
      setSubmitError('กรุณากรอกรายละเอียดปัญหาอย่างน้อย 5 ตัวอักษร');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      let finalDescription = combinedDesc;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await uploadMaintenanceImage(uploadData);
        const filename = uploadRes.data?.data?.filename;
        if (filename) {
          finalDescription = `[IMAGE:${filename}] | ${combinedDesc}`;
        }
      }

      const payload: CreateMaintenanceTicketPayload = {
        category: form.category,
        description: finalDescription,
        contactTime: form.contactTime || undefined,
      };
      if (tenant?.roomId) payload.roomId = tenant.roomId;

      await createMaintenanceTicket(payload);
      const [ticketsRes, tenantRes] = await Promise.all([
        getMaintenanceTickets(),
        getMyTenant(),
      ]);
      setTickets(ticketsRes.data?.data ?? []);
      setTenant(tenantRes.data?.data ?? null);
      resetModal();
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setSubmitError(message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <UserPageHeader backLabel="ย้อนกลับ" />

      {/* Page Content */}
      <main className={styles.main}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageIcon}><Bell size={22} /></div>
            <div>
              <h1 className={styles.pageTitle}>แจ้งซ่อมบำรุง</h1>
              <p className={styles.pageSubtitle}>
                ห้องพัก: <strong>{tenant?.room?.roomNumber ?? 'ยังไม่ได้รับการจัดสรรห้อง'}</strong>
              </p>
            </div>
          </div>
          <button id="btn-new-maintenance" className={styles.newBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> แจ้งซ่อมรายการใหม่
          </button>
        </div>

        {/* Tickets List */}
        <section className={styles.ticketSection}>
          <h2 className={styles.sectionTitle}>My Maintenance Requests</h2>

          {loading ? (
            <div className={styles.empty}>
              <div className={styles.spinner} />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className={styles.empty}>
              <Wrench size={40} className={styles.emptyIcon} />
              <p className={styles.emptyText}>ยังไม่มีรายการแจ้งซ่อม</p>
              <p className={styles.emptyHint}>กดปุ่ม "แจ้งซ่อมรายการใหม่" เพื่อสร้างรายการใหม่</p>
            </div>
          ) : (
            <div className={styles.ticketList}>
              {tickets.map((ticket) => {
                const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG['PENDING'];
                const StatusIcon = cfg.icon;
                const catLabel = CATEGORY_OPTIONS.find(c => c.value === ticket.category)?.label ?? ticket.category;
                
                let displayDesc = ticket.description || '';
                if (displayDesc.startsWith('[IMAGE:')) {
                  const endIdx = displayDesc.indexOf(']');
                  if (endIdx !== -1) {
                    displayDesc = displayDesc.substring(endIdx + 1).replace(/^\s*\|\s*/, '');
                  }
                }

                // Show only the issue text (before the dash) for clean list display
                const showDesc = displayDesc.split(' — ')[0] || displayDesc;

                return (
                  <div key={ticket.id} className={styles.ticketCard}>
                    <div className={styles.ticketLeft}>
                      <span className={styles.ticketCat}>{catLabel}</span>
                      <p className={styles.ticketDesc}>{showDesc}</p>
                      <p className={styles.ticketDate}>
                        {new Date(ticket.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                        {ticket.room && <> · ห้อง {ticket.room.roomNumber}</>}
                      </p>
                    </div>
                    <div className={styles.ticketRight}>
                      <span className={styles.ticketStatus} style={{ background: cfg.color + '1a', color: cfg.color }}>
                        <StatusIcon size={13} /> {cfg.label}
                      </span>
                      <ChevronRight size={16} className={styles.ticketArrow} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={resetModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>แจ้งซ่อมรายการใหม่</h2>
              <button className={styles.closeBtn} onClick={resetModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Category */}
              <div className={styles.field}>
                <label className={styles.label}>ประเภทปัญหา</label>
                <select
                  className={styles.select}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as MaintenanceCategory }))}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Room Number (read-only from tenant) */}
              <div className={styles.field}>
                <label className={styles.label}>หมายเลขห้อง</label>
                <input
                  className={styles.input}
                  value={tenant?.room?.roomNumber ?? 'ยังไม่ได้รับการจัดสรรห้อง'}
                  readOnly
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>

              {/* Issue / Description */}
              <div className={styles.field}>
                <label className={styles.label}>ปัญหาที่พบ <span className={styles.required}>*</span></label>
                <input
                  className={styles.input}
                  placeholder="ระบุปัญหาโดยย่อ"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>รายละเอียด <span className={styles.required}>*</span></label>
                <textarea
                  className={styles.textarea}
                  placeholder="ระบุรายละเอียดปัญหา..."
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Contact Time */}
              <div className={styles.field}>
                <label className={styles.label}>วันเวลาที่สะดวกให้ช่างมา</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={form.contactTime}
                  onChange={e => setForm(f => ({ ...f, contactTime: e.target.value }))}
                />
              </div>

              {/* Image Upload */}
              <div className={styles.field}>
                <label className={styles.label}>แนบรูปภาพ (ถ้ามี)</label>
                <label className={styles.uploadArea} htmlFor="img-upload">
                  <Upload size={18} />
                  <span>{imageFile ? imageFile.name : 'อัปโหลดไฟล์จากเครื่อง'}</span>
                  <input
                    id="img-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {submitError && (
                <div className={styles.errorBox}>
                  <AlertCircle size={15} /> {submitError}
                </div>
              )}

              {/* Buttons */}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={resetModal}>
                  ยกเลิก
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'กำลังส่ง...' : 'ส่งรายการแจ้งซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMaintenance;
