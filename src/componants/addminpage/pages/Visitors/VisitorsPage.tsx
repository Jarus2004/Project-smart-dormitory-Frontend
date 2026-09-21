import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, LogIn, LogOut, Plus, Search, UserPlus, Users, X, XCircle } from 'lucide-react';
import { getVisitors, registerVisitor, updateVisitorStatus } from '../../../../services/adminApi';
import styles from './VisitorsPage.module.css';

type VisitorStatus = 'REGISTERED' | 'VERIFYING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'EXPIRED';

type VisitorRecord = {
  id: number;
  guestName: string;
  purpose?: string | null;
  status: VisitorStatus;
  expectedEntryTime?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
  room?: { id?: number; roomNumber?: string } | null;
  tenant?: { id?: number; fullName?: string | null; studentId?: string | null } | null;
};

const labels: Record<VisitorStatus, string> = {
  REGISTERED: 'ลงทะเบียนแล้ว',
  VERIFYING: 'รอตรวจสอบ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CHECKED_IN: 'เข้าหอพักแล้ว',
  CHECKED_OUT: 'ออกจากหอพักแล้ว',
  EXPIRED: 'หมดอายุ/ยกเลิก',
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString('th-TH') : '-');

const VisitorsPage = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | VisitorStatus>('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Register Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formGuestName, setFormGuestName] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formExpectedTime, setFormExpectedTime] = useState('');

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const response = await getVisitors();
      setVisitors(Array.isArray(response.data?.data) ? response.data.data : []);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ไม่สามารถโหลดข้อมูลผู้มาเยือนได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const visitorsLoadTimer = window.setTimeout(() => {
      void loadVisitors();
    }, 0);

    return () => window.clearTimeout(visitorsLoadTimer);
  }, []);

  const filteredVisitors = useMemo(
    () =>
      visitors.filter((visitor) => {
        const searchable = `${visitor.guestName} ${visitor.purpose ?? ''} ${visitor.room?.roomNumber ?? ''} ${
          visitor.tenant?.fullName ?? ''
        }`.toLowerCase();
        return (statusFilter === 'ALL' || visitor.status === statusFilter) && searchable.includes(query.toLowerCase());
      }),
    [query, statusFilter, visitors]
  );

  const changeStatus = async (visitor: VisitorRecord, status: VisitorStatus) => {
    setUpdatingId(visitor.id);
    setError(null);
    try {
      await updateVisitorStatus(String(visitor.id), status);
      await loadVisitors();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ไม่สามารถเปลี่ยนสถานะผู้มาเยือนได้');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGuestName.trim()) {
      setError('กรุณากรอกชื่อผู้มาติดต่อ');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await registerVisitor({
        guestName: formGuestName.trim(),
        purpose: formPurpose.trim() || undefined,
        expectedEntryTime: formExpectedTime ? new Date(formExpectedTime).toISOString() : undefined,
      });

      setShowModal(false);
      setFormGuestName('');
      setFormPurpose('');
      setFormExpectedTime('');
      await loadVisitors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถลงทะเบียนผู้มาติดต่อได้');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = useMemo(() => {
    let pending = 0;
    let checkedIn = 0;
    let checkedOut = 0;

    visitors.forEach((v) => {
      if (v.status === 'REGISTERED' || v.status === 'VERIFYING') pending++;
      if (v.status === 'CHECKED_IN') checkedIn++;
      if (v.status === 'CHECKED_OUT') checkedOut++;
    });

    return { total: visitors.length, pending, checkedIn, checkedOut };
  }, [visitors]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ระบบบริหารจัดการหอพัก</p>
          <h2>จัดการผู้มาติดต่อ (Visitor Access)</h2>
          <p>บันทึกการเข้า-ออก อนุมัติผู้มาเยือน และตรวจสอบประวัติแบบเรียลไทม์</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={() => setShowModal(true)}>
          <Plus size={18} /> ลงทะเบียนผู้มาเยือนใหม่
        </button>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Stats Cards */}
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={22} />
          </div>
          <div className={styles.statDetails}>
            <strong>{counts.total}</strong>
            <span>ผู้มาติดต่อทั้งหมด</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fefce8', color: '#ca8a04' }}>
            <Clock3 size={22} />
          </div>
          <div className={styles.statDetails}>
            <strong>{counts.pending}</strong>
            <span>รอตรวจสอบ / อนุมัติ</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
            <LogIn size={22} />
          </div>
          <div className={styles.statDetails}>
            <strong>{counts.checkedIn}</strong>
            <span>อยู่ในหอพัก (Checked-in)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f8fafc', color: '#64748b' }}>
            <LogOut size={22} />
          </div>
          <div className={styles.statDetails}>
            <strong>{counts.checkedOut}</strong>
            <span>ออกแล้ว (Checked-out)</span>
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input
            placeholder="ค้นหาชื่อผู้มาติดต่อ, ห้อง, ผู้พัก..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.toolbarActions}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | VisitorStatus)}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Visitors List */}
      <section className={styles.list}>
        {filteredVisitors.map((visitor) => (
          <article key={visitor.id} className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemHeader}>
                <span className={styles.guestName}>{visitor.guestName}</span>
                <span className={`${styles.badge} ${styles[`badge_${visitor.status}`]}`}>
                  {labels[visitor.status]}
                </span>
              </div>
              <p className={styles.itemPurpose}>
                {visitor.purpose || 'ไม่มีระบุวัตถุประสงค์'} • ห้อง {visitor.room?.roomNumber || '-'}
              </p>
              <span className={styles.itemDetail}>
                ผู้รับการติดต่อ: {visitor.tenant?.fullName || '-'} • เวลาที่คาดว่าจะเข้า: {formatDate(visitor.expectedEntryTime)}
              </span>
            </div>

            <div className={styles.itemTimestamps}>
              <span>เวลาเข้า: {formatDate(visitor.checkedInAt)}</span>
              <span>เวลาออก: {formatDate(visitor.checkedOutAt)}</span>
            </div>

            <div className={styles.itemActions}>
              {visitor.status === 'REGISTERED' && (
                <>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                    disabled={updatingId === visitor.id}
                    onClick={() => void changeStatus(visitor, 'VERIFYING')}
                  >
                    <Clock3 size={15} /> เริ่มตรวจสอบ
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    disabled={updatingId === visitor.id}
                    onClick={() => void changeStatus(visitor, 'EXPIRED')}
                  >
                    <XCircle size={15} /> ยกเลิก
                  </button>
                </>
              )}

              {visitor.status === 'VERIFYING' && (
                <>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                    disabled={updatingId === visitor.id}
                    onClick={() => void changeStatus(visitor, 'APPROVED')}
                  >
                    <CheckCircle2 size={15} /> อนุมัติ
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    disabled={updatingId === visitor.id}
                    onClick={() => void changeStatus(visitor, 'REJECTED')}
                  >
                    <XCircle size={15} /> ปฏิเสธ
                  </button>
                </>
              )}

              {visitor.status === 'APPROVED' && (
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                  disabled={updatingId === visitor.id}
                  onClick={() => void changeStatus(visitor, 'CHECKED_IN')}
                >
                  <LogIn size={15} /> Check-in เข้าหอพัก
                </button>
              )}

              {visitor.status === 'CHECKED_IN' && (
                <button
                  className={`${styles.actionBtn}`}
                  disabled={updatingId === visitor.id}
                  onClick={() => void changeStatus(visitor, 'CHECKED_OUT')}
                >
                  <LogOut size={15} /> Check-out ออกจากหอพัก
                </button>
              )}
            </div>
          </article>
        ))}

        {filteredVisitors.length === 0 && !loading && (
          <div className={styles.empty}>
            <Users size={40} strokeWidth={1.5} />
            <p>ไม่พบรายการผู้มาติดต่อตามเงื่อนไขที่เลือก</p>
          </div>
        )}
      </section>

      {/* Modal: ลงทะเบียนผู้มาเยือนใหม่ */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>ลงทะเบียนผู้มาติดต่อใหม่</h3>
              <button className={styles.closeButton} type="button" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => void handleRegisterSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className={styles.formGroup}>
                <label>ชื่อ-นามสกุล ผู้มาติดต่อ *</label>
                <input
                  required
                  placeholder="เช่น นายสมศักดิ์ รักดี"
                  value={formGuestName}
                  onChange={(e) => setFormGuestName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>วัตถุประสงค์ในการเข้าพบ</label>
                <input
                  placeholder="เช่น มาส่งพัสดุ / มาพบเพื่อนร่วมห้อง"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>เวลาที่คาดว่าจะเข้าพบ</label>
                <input
                  type="datetime-local"
                  value={formExpectedTime}
                  onChange={(e) => setFormExpectedTime(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelButton} type="button" onClick={() => setShowModal(false)}>
                  ยกเลิก
                </button>
                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                  <UserPlus size={16} />
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการลงทะเบียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsPage;
