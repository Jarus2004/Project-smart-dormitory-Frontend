import { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Users,
  Zap,
  Droplets,
  Home,
  Calendar,
  Sparkles,
  ShieldAlert,
  Loader2,
  Eye,
  X,
} from 'lucide-react';
import { getBills, getRooms, generateRoomBill, deleteBill, getAdminBillPaymentDetails, getAdminBillSlip } from '../../../../services/adminApi';
import styles from './IncomeAndExpensesPage.module.css';

interface TenantInfo {
  id: number;
  fullName?: string;
  studentId?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  user?: {
    id?: number;
    username?: string;
    email?: string;
  };
}

interface RoomRecord {
  id: number;
  roomNumber: string;
  floor?: number;
  status?: string;
  capacity?: number;
  monthlyRent: number | string;
  tenants?: TenantInfo[];
}

interface BillRecord {
  id: number;
  tenantId: number;
  roomId?: number;
  amount: number | string;
  dueDate: string;
  status: 'UNPAID' | 'VERIFYING' | 'PAID' | 'OVERDUE';
  description?: string;
  paidAt?: string | null;
  createdAt: string;
  room?: {
    id?: number;
    roomNumber?: string;
    floor?: number;
  };
  tenant?: {
    id?: number;
    fullName?: string;
    studentId?: string;
    phone?: string;
    user?: {
      username?: string;
      email?: string;
    };
  };
}

interface PaymentDetailRecord {
  id: number;
  amount?: number | string | null;
  slipAmount?: number | string | null;
  status: string;
  provider?: string | null;
  providerTransactionId?: string | null;
  transferAt?: string | null;
  failureReason?: string | null;
  verifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PaymentDetails {
  bill: {
    id: number;
    status: string;
  };
  payments: PaymentDetailRecord[];
  batches: PaymentDetailRecord[];
}

const formatCurrency = (amount: number | string | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getCurrentThaiMonth = () => {
  return new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};

const getDefaultDueDate = () => {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(5);
  return nextMonth.toISOString().split('T')[0];
};

const IncomeAndExpensesPage = () => {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(true);

  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [customRent, setCustomRent] = useState<number | string>('');
  const [electricUnits, setElectricUnits] = useState<number | string>(0);
  const [electricRate] = useState<number>(8);
  const [waterAmount] = useState<number>(100);
  const [billingMonth, setBillingMonth] = useState(getCurrentThaiMonth());
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'INDIVIDUAL' | 'ROOM_GROUP'>('INDIVIDUAL');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentSlipUrl, setPaymentSlipUrl] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [billsRes, roomsRes] = await Promise.all([getBills(), getRooms()]);
        if (cancelled) return;
        const billsData = Array.isArray(billsRes.data?.data) ? billsRes.data.data : [];
        const roomsData = Array.isArray(roomsRes.data?.data) ? roomsRes.data.data : [];
        setBills(billsData);
        setRooms(roomsData);
        // Allow typing room directly without forced prefill
      } catch (err) {
        if (!cancelled) console.error('Failed to load billing data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.roomNumber.toUpperCase() === selectedRoomNumber.trim().toUpperCase());
  }, [rooms, selectedRoomNumber]);

  const activeTenants = useMemo(() => {
    if (!selectedRoom || !Array.isArray(selectedRoom.tenants)) return [];
    return selectedRoom.tenants.filter((t) => t.isActive !== false);
  }, [selectedRoom]);

  const rentTotal = typeof customRent === 'string' ? parseFloat(customRent) || 0 : customRent;
  const eUnits = typeof electricUnits === 'string' ? parseFloat(electricUnits) || 0 : electricUnits;
  const electricTotal = Math.max(0, eUnits) * electricRate;
  const waterTotal = waterAmount;
  const roomGrandTotal = rentTotal + electricTotal + waterTotal;
  const tenantCount = activeTenants.length;
  const amountPerPerson = tenantCount > 0 ? Math.round((roomGrandTotal / tenantCount) * 100) / 100 : 0;

  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);
    if (!selectedRoomNumber.trim()) {
      setFormFeedback({ type: 'error', message: 'กรุณาระบุเลขห้อง' });
      return;
    }
    if (!selectedRoom) {
      setFormFeedback({ type: 'error', message: `ไม่พบข้อมูลห้องพักเลขที่ ${selectedRoomNumber}` });
      return;
    }
    if (tenantCount === 0) {
      setFormFeedback({ type: 'error', message: `ห้อง ${selectedRoom.roomNumber} ยังไม่มีผู้พักอาศัยที่ลงทะเบียนในระบบไม่สามารถออกบิลและหารค่าใช้จ่ายได้` });
      return;
    }
    if (!Number.isFinite(rentTotal) || rentTotal < 0) {
      setFormFeedback({ type: 'error', message: 'กรุณาระบุค่าเช่าห้องเป็นจำนวนเงิน THB ที่ถูกต้อง' });
      return;
    }
    setSubmitting(true);
    try {
      await generateRoomBill({ roomNumber: selectedRoomNumber, electricUnits: eUnits, electricRate, waterAmount, dueDate, billingMonth, customRent: rentTotal });
      setFormFeedback({ type: 'success', message: `สร้างและส่งบิลห้อง ${selectedRoom.roomNumber} ให้นักศึกษา ${tenantCount} คนสำเร็จ (คนละ ${formatCurrency(amountPerPerson)})` });
      const billsRes = await getBills();
      if (Array.isArray(billsRes.data?.data)) setBills(billsRes.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFormFeedback({ type: 'error', message: e?.response?.data?.message || e?.message || 'เกิดข้อผิดพลาดในการสร้างบิล' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (!window.confirm('คุณต้องการลบบิลนี้ใช่หรือไม่?')) return;
    try {
      await deleteBill(billId);
      setBills((prev) => prev.filter((b) => b.id !== billId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message || 'ไม่สามารถลบบิลได้');
    }
  };

  const closePaymentDetails = () => {
    if (paymentSlipUrl) URL.revokeObjectURL(paymentSlipUrl);
    setPaymentSlipUrl('');
    setPaymentDetails(null);
  };

  const handleViewPaymentDetails = async (billId: number) => {
    setDetailsLoading(true);
    setFormFeedback(null);
    try {
      const [detailsResponse, slipResponse] = await Promise.allSettled([
        getAdminBillPaymentDetails(billId),
        getAdminBillSlip(billId),
      ]);
      if (detailsResponse.status !== 'fulfilled') throw detailsResponse.reason;
      setPaymentDetails(detailsResponse.value.data?.data ?? null);
      if (slipResponse.status === 'fulfilled') setPaymentSlipUrl(URL.createObjectURL(slipResponse.value.data));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormFeedback({ type: 'error', message: e?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการชำระเงินได้' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      if (b.description && b.description.includes('ประจำเดือน')) {
        const match = b.description.match(/ประจำเดือน\s+([^\s(]+(?:\s+\d+)?)/);
        if (match && match[1]) set.add(match[1]);
      } else if (b.dueDate) {
        const d = new Date(b.dueDate);
        if (!isNaN(d.getTime())) {
          set.add(d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }));
        }
      }
    });
    return Array.from(set);
  }, [bills]);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const roomNum = b.room?.roomNumber || '';
      const tenantName = b.tenant?.fullName || b.tenant?.user?.username || b.tenant?.user?.email || '';
      const studentId = b.tenant?.studentId || '';
      const matchesSearch = !searchQuery || roomNum.toLowerCase().includes(searchQuery.toLowerCase()) || tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      let matchesMonth = true;
      if (monthFilter !== 'ALL') {
        matchesMonth = Boolean(b.description && b.description.includes(monthFilter)) || formatDate(b.dueDate).includes(monthFilter);
      }
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [bills, searchQuery, statusFilter, monthFilter]);

  const totals = useMemo(() => {
    const list = filteredBills;
    const totalBilled = list.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalPaid = list.filter((b) => b.status === 'PAID').reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalUnpaid = list.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE').reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalVerifying = list.filter((b) => b.status === 'VERIFYING').length;
    return { totalBilled, totalPaid, totalUnpaid, totalVerifying, count: list.length };
  }, [filteredBills]);

  const groupedByRoom = useMemo(() => {
    const groups: { [roomNumber: string]: { roomNumber: string; bills: BillRecord[] } } = {};
    filteredBills.forEach((b) => {
      const rn = b.room?.roomNumber || 'ไม่ระบุห้อง';
      if (!groups[rn]) groups[rn] = { roomNumber: rn, bills: [] };
      groups[rn].bills.push(b);
    });
    return Object.values(groups);
  }, [filteredBills]);

  return (
    <div className={styles.page}>
      <section className={styles.pageIntro}>
        <div>
          <p className={styles.kicker}>ศูนย์ปฏิบัติการการเงิน</p>
          <h2>ระบบจัดการบิล</h2>
          <p className={styles.subtitle}>
            คำนวณค่าน้ำค่าไฟอัตโนมัติ หารเฉลี่ยตามจำนวนผู้พักอาศัยจริงในห้อง และส่งบิลให้นักศึกษารายบุคคล
          </p>
        </div>
        <div className={styles.actions}>
          <button className={showGenerator ? styles.secondaryButton : styles.primaryButton} type="button" onClick={() => setShowGenerator((v) => !v)}>
            <Plus size={18} />
            {showGenerator ? 'ซ่อนฟอร์มสร้างบิล' : '+ สร้างบิลประจำเดือน'}
          </button>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article className={`${styles.summaryCard} ${styles.totalCard}`}>
          <div className={styles.summaryIcon}><Receipt size={24} /></div>
          <div>
            <span>ยอดเรียกเก็บทั้งหมด</span>
            <strong>{formatCurrency(totals.totalBilled)}</strong>
            <small>{totals.count} รายการบิล</small>
          </div>
        </article>
        <article className={`${styles.summaryCard} ${styles.paidCard}`}>
          <div className={styles.summaryIcon}><CheckCircle2 size={24} /></div>
          <div>
            <span>ชำระเงินแล้ว</span>
            <strong style={{ color: '#16a34a' }}>{formatCurrency(totals.totalPaid)}</strong>
            <small>{filteredBills.filter((b) => b.status === 'PAID').length} บิลที่ชำระแล้ว</small>
          </div>
        </article>
        <article className={`${styles.summaryCard} ${styles.unpaidCard}`}>
          <div className={styles.summaryIcon}><AlertCircle size={24} /></div>
          <div>
            <span>ค้างชำระ / รอชำระ</span>
            <strong style={{ color: '#dc2626' }}>{formatCurrency(totals.totalUnpaid)}</strong>
            <small>{filteredBills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE').length} บิลที่ค้างชำระ</small>
          </div>
        </article>
        <article className={`${styles.summaryCard} ${styles.verifyingCard}`}>
          <div className={styles.summaryIcon}><Clock size={24} /></div>
          <div>
            <span>รอตรวจสอบสลิป</span>
            <strong style={{ color: '#d97706' }}>{totals.totalVerifying} รายการ</strong>
            <small>รอยืนยันหลักฐานโอนเงิน</small>
          </div>
        </article>
      </section>

      {showGenerator && (
        <section className={styles.generatorCard}>
          <div className={styles.generatorHeader}>
            <div>
              <h3><Sparkles size={20} /> ออกบิลด่วนและคำนวณค่าน้ำค่าไฟอัตโนมัติ</h3>
              <p>กรอกเลขห้องและระบุหน่วยไฟที่ใช้ ระบบจะคำนวณและหารตามจำนวนผู้พักจริงในห้องทันที</p>
            </div>
          </div>
          {formFeedback && (
            <div className={formFeedback.type === 'error' ? styles.warningBanner : styles.infoBanner}>
              {formFeedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{formFeedback.message}</span>
            </div>
          )}
          <form onSubmit={handleGenerateBills}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label><Home size={15} /> เลขห้องพัก (พิมพ์หรือเลือก)</label>
                <input
                  type="text"
                  list="rooms-list"
                  placeholder="พิมพ์เลขห้อง เช่น 111"
                  value={selectedRoomNumber}
                  onChange={(e) => {
                    setSelectedRoomNumber(e.target.value);
                    setCustomRent('');
                  }}
                  required
                />
                <datalist id="rooms-list">
                  {rooms.map((r) => (
                    <option key={r.id} value={r.roomNumber}>
                      ห้อง {r.roomNumber} (ชั้น {r.floor || '-'}) - ค่าเช่า ฿{Number(r.monthlyRent).toLocaleString()}
                    </option>
                  ))}
                </datalist>
                <span className={styles.helperText}>
                  {selectedRoomNumber.trim() ? (
                    selectedRoom ? (
                      tenantCount > 0 ? (
                        <span className={styles.highlightText}>✓ ห้อง {selectedRoom.roomNumber} (มีผู้พักอาศัย {tenantCount} คน)</span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>⚠️ ห้อง {selectedRoom.roomNumber} ยังไม่มีผู้พักอาศัยในระบบ</span>
                      )
                    ) : (
                      <span style={{ color: '#dc2626' }}>⚠️ ไม่พบข้อมูลห้อง {selectedRoomNumber} ในระบบ</span>
                    )
                  ) : (
                    'พิมพ์หรือเลือกเลขห้องพัก เช่น 111'
                  )}
                </span>
              </div>
              <div className={styles.formGroup}>
                <label><Receipt size={15} /> ค่าเช่าห้อง (Sandbox / THB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="เช่น 100"
                  value={customRent === '' ? Number(selectedRoom?.monthlyRent || 0) : customRent}
                  onChange={(e) => setCustomRent(e.target.value)}
                  required
                />
                <span className={styles.helperText}>
                  ค่าเริ่มต้นจากห้อง ฿{Number(selectedRoom?.monthlyRent || 0).toLocaleString('th-TH')} แก้เป็นยอดทดลองได้
                </span>
              </div>
              <div className={styles.formGroup}>
                <label><Zap size={15} /> หน่วยไฟฟ้าที่ใช้ (หน่วย)</label>
                <input type="number" min="0" step="any" placeholder="เช่น 0" value={electricUnits} onChange={(e) => setElectricUnits(e.target.value)} required />
                <span className={styles.helperText}>
                  อัตราคงที่ <strong>8 บาท / หน่วย</strong> = ฿{(Math.max(0, Number(eUnits || 0)) * 8).toLocaleString()}
                </span>
              </div>
              <div className={styles.formGroup}>
                <label><Droplets size={15} /> ค่าน้ำประปา (เหมาจ่าย)</label>
                <input type="text" value="100 บาท / ห้อง" disabled style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                <span className={styles.helperText}>อัตราเหมาจ่ายคงที่ตามสัญญา</span>
              </div>
              <div className={styles.formGroup}>
                <label><Calendar size={15} /> รอบเดือน & กำหนดชำระ</label>
                <input type="text" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} placeholder="เช่น กันยายน 2569" required />
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ marginTop: '6px' }} required />
              </div>
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewTitle}>
                <Receipt size={16} /> สรุปการคำนวณห้อง {selectedRoomNumber || '-'} (Real-time Preview)
              </div>
              <div className={styles.breakdownGrid}>
                <div className={styles.breakdownItem}><span>ค่าเช่าห้องพัก</span><strong>{formatCurrency(rentTotal)}</strong></div>
                <div className={styles.breakdownItem}><span>ค่าไฟ ({eUnits} หน่วย @8บ.)</span><strong>{formatCurrency(electricTotal)}</strong></div>
                <div className={styles.breakdownItem}><span>ค่าน้ำ (เหมาจ่าย)</span><strong>{formatCurrency(waterTotal)}</strong></div>
                <div className={styles.breakdownItem}>
                  <span>จำนวนผู้พักจริง</span>
                  <strong style={{ color: tenantCount > 0 ? '#0284c7' : '#dc2626' }}>
                    {tenantCount} คน {tenantCount > 0 ? `(หาร ${tenantCount})` : '(ไม่มีผู้เช่า)'}
                  </strong>
                </div>
                <div className={styles.grandTotalItem}><span>ยอดรวมทั้งห้อง</span><strong>{formatCurrency(roomGrandTotal)}</strong></div>
              </div>
              <div className={styles.splitResult}>
                <div>
                  <div className={styles.splitInfo}>ผู้พักอาศัยที่จะได้รับบิลในห้องนี้:</div>
                  <div className={styles.tenantListPreview}>
                    {activeTenants.length > 0 ? (
                      activeTenants.map((t, idx) => (
                        <span key={t.id} className={styles.tenantTag}>
                          <Users size={12} />
                          {idx + 1}. {t.fullName || t.user?.username || t.user?.email || 'ไม่ระบุชื่อ'}
                          {t.studentId ? ` (${t.studentId})` : ''}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.84rem' }}>
                        ⚠️ ไม่พบรายชื่อผู้พักอาศัยในห้องนี้ ไม่สามารถหารค่าใช้จ่ายได้
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.splitAmount}>
                  <label>ยอดต่อคน:</label>
                  <strong>{formatCurrency(amountPerPerson)}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="submit" className={styles.primaryButton} disabled={submitting || tenantCount === 0}>
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" />กำลังสร้างและส่งบิล...</>
                ) : (
                  `สร้างและส่งบิลให้ทุกคนในห้อง ${selectedRoomNumber} (${tenantCount} คน)`
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.tableSection}>
        <div className={styles.tableToolbar}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>ประวัติและสถานะการชำระเงิน</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              ตรวจสอบรายการบิลทั้งหมด ดูว่าห้องไหนจ่ายแล้วและใครเป็นคนจ่าย
            </p>
          </div>
          <div className={styles.searchAndFilters}>
            <div className={styles.searchBox}>
              <Search size={16} color="#64748b" />
              <input type="text" placeholder="ค้นหาเลขห้อง / ชื่อ / รหัส นศ." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <select className={styles.filterSelect} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="ALL">ทุกรอบเดือน</option>
              {availableMonths.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">ทุกสถานะ</option>
              <option value="UNPAID">รอชำระ (UNPAID)</option>
              <option value="VERIFYING">รอตรวจสลิป (VERIFYING)</option>
              <option value="PAID">ชำระแล้ว (PAID)</option>
              <option value="OVERDUE">เกินกำหนด (OVERDUE)</option>
            </select>
            <div className={styles.viewToggle}>
              <button type="button" className={viewMode === 'INDIVIDUAL' ? styles.activeView : ''} onClick={() => setViewMode('INDIVIDUAL')}>รายบุคคล</button>
              <button type="button" className={viewMode === 'ROOM_GROUP' ? styles.activeView : ''} onClick={() => setViewMode('ROOM_GROUP')}>รวมรายห้อง</button>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#0284c7' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>กำลังโหลดข้อมูลบิล...</p>
          </div>
        )}

        {!loading && (viewMode === 'INDIVIDUAL' ? (
          <div className={styles.tableWrap}>
            {filteredBills.length === 0 ? (
              <div className={styles.emptyState}>
                <Receipt size={40} />
                <p>ไม่พบรายการบิลที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ห้อง</th>
                    <th>ผู้พัก / นักศึกษา</th>
                    <th>ยอดเงิน (ต่อคน)</th>
                    <th>รายละเอียดบิล</th>
                    <th>กำหนดชำระ</th>
                    <th>สถานะ</th>
                    <th>วันที่ชำระ</th>
                    <th style={{ textAlign: 'right' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => {
                    const tenantName = b.tenant?.fullName || b.tenant?.user?.username || b.tenant?.user?.email || 'ไม่ระบุชื่อ';
                    return (
                      <tr key={b.id}>
                        <td><span className={styles.roomBadge}><Home size={13} /> {b.room?.roomNumber || '-'}</span></td>
                        <td className={styles.tenantCell}>
                          <strong>{tenantName}</strong>
                          <small>รหัส: {b.tenant?.studentId || '-'}</small>
                        </td>
                        <td className={styles.amountCell}>{formatCurrency(b.amount)}</td>
                        <td style={{ maxWidth: '300px', fontSize: '0.8rem', color: '#475569' }}>{b.description || 'ค่าห้องพักประจำเดือน'}</td>
                        <td>{formatDate(b.dueDate)}</td>
                        <td>
                          {b.status === 'PAID' && <span className={`${styles.statusBadge} ${styles.statusPaid}`}><CheckCircle2 size={12} /> ชำระแล้ว</span>}
                          {b.status === 'UNPAID' && <span className={`${styles.statusBadge} ${styles.statusUnpaid}`}><AlertCircle size={12} /> รอชำระ</span>}
                          {b.status === 'VERIFYING' && <span className={`${styles.statusBadge} ${styles.statusVerifying}`}><Clock size={12} /> รอตรวจสลิป</span>}
                          {b.status === 'OVERDUE' && <span className={`${styles.statusBadge} ${styles.statusOverdue}`}><ShieldAlert size={12} /> เกินกำหนด</span>}
                        </td>
                        <td>
                          {b.paidAt ? <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatDate(b.paidAt)}</span> : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actionCell} style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className={styles.dangerButton} title="ลบบิล" onClick={() => handleDeleteBill(b.id)}>
                              <Trash2 size={13} />
                            </button>
                            <button type="button" className={styles.secondaryButton} title="ดูข้อมูลสลิปและผลตรวจ" onClick={() => void handleViewPaymentDetails(b.id)}>
                              <Eye size={13} /> ดูผลตรวจ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className={styles.roomGroupsGrid}>
            {groupedByRoom.length === 0 ? (
              <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                <Receipt size={40} />
                <p>ไม่พบรายการบิลที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              groupedByRoom.map((group) => {
                const totalRoomAmount = group.bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
                const paidCount = group.bills.filter((b) => b.status === 'PAID').length;
                const isAllPaid = paidCount === group.bills.length && group.bills.length > 0;
                return (
                  <div key={group.roomNumber} className={styles.roomGroupCard}>
                    <div className={styles.roomGroupHeader}>
                      <div>
                        <h4>ห้อง {group.roomNumber}</h4>
                        <span>รวม {formatCurrency(totalRoomAmount)} ({group.bills.length} คน)</span>
                      </div>
                      <div>
                        {isAllPaid
                          ? <span className={`${styles.statusBadge} ${styles.statusPaid}`}><CheckCircle2 size={12} /> ชำระครบทุกท่าน</span>
                          : <span className={`${styles.statusBadge} ${styles.statusUnpaid}`}>ชำระแล้ว {paidCount}/{group.bills.length} คน</span>}
                      </div>
                    </div>
                    <div className={styles.roomTenantList}>
                      {group.bills.map((b) => {
                        const tenantName = b.tenant?.fullName || b.tenant?.user?.username || b.tenant?.user?.email || 'ไม่ระบุชื่อ';
                        return (
                          <div key={b.id} className={styles.roomTenantRow}>
                            <div className={styles.roomTenantInfo}>
                              <strong>{tenantName}</strong>
                              <small>รหัส: {b.tenant?.studentId || '-'} | ครบกำหนด: {formatDate(b.dueDate)}</small>
                            </div>
                            <div className={styles.roomTenantBill}>
                              <strong>{formatCurrency(b.amount)}</strong>
                              {b.status === 'PAID'
                                ? <span className={`${styles.statusBadge} ${styles.statusPaid}`}>✓ จ่ายแล้ว</span>
                                : <span className={`${styles.statusBadge} ${styles.statusUnpaid}`}>รอระบบตรวจสอบ</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}
      </section>

      {paymentDetails && (
        <div role="presentation" onClick={closePaymentDetails} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(15, 23, 42, .62)' }}>
          <section role="dialog" aria-modal="true" aria-label="รายละเอียดการชำระเงิน" onClick={(event) => event.stopPropagation()} style={{ position: 'relative', width: 'min(760px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: 24, borderRadius: 16, background: '#fff' }}>
            <button type="button" onClick={closePaymentDetails} aria-label="ปิด" style={{ position: 'absolute', top: 16, right: 16, border: 0, background: 'transparent', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ marginTop: 0 }}>รายละเอียดการชำระเงิน บิล #{paymentDetails.bill?.id}</h3>
            <p>สถานะบิล: <strong>{paymentDetails.bill?.status}</strong></p>
            {[...paymentDetails.batches, ...paymentDetails.payments].map((payment, index) => (
              <div key={`${payment.id}-${index}`} style={{ marginTop: 12, padding: 14, borderRadius: 10, background: '#f8fafc' }}>
                <p><strong>สถานะการตรวจ:</strong> {payment.status}</p>
                <p><strong>ยอดรายการ:</strong> ฿{Number(payment.slipAmount ?? payment.amount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
                <p><strong>วันเวลาโอน:</strong> {payment.transferAt ? new Date(payment.transferAt).toLocaleString('th-TH') : '-'}</p>
                <p><strong>เลขอ้างอิงธุรกรรม:</strong> {payment.providerTransactionId || '-'}</p>
              </div>
            ))}
            {paymentSlipUrl ? <img src={paymentSlipUrl} alt="สลิปการชำระเงิน" style={{ display: 'block', maxWidth: '100%', maxHeight: 420, margin: '20px auto 0', objectFit: 'contain' }} /> : <p>ยังไม่มีไฟล์สลิปที่บันทึกไว้</p>}
          </section>
        </div>
      )}
      {detailsLoading && <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'grid', placeItems: 'center', background: 'rgba(15, 23, 42, .25)' }}><Loader2 className="animate-spin" /></div>}
    </div>
  );
};

export default IncomeAndExpensesPage;

