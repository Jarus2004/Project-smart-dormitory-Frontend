import { useCallback, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Eye, Loader2, Pencil, Save, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useDashboard } from '../../context/useDashboard';
import DataTable from '../../components/DataTable/DataTable';
import Modal from '../../components/Modal/Modal';
import Badge from '../../components/Badge/Badge';
import type { UserRecord } from '../../types/user';
import { deleteUser, getAuditLogs, getBillingReport, getSystemSettings, updateSystemSettings, updateUser } from '../../../../services/adminApi';
import styles from './AdminPanelPage.module.css';

const tabs = ['User Management', 'Reports', 'System Settings', 'Activity Logs'] as const;
const tabLabels = {
  'User Management': 'จัดการผู้ใช้งาน',
  Reports: 'รายงาน',
  'System Settings': 'ตั้งค่าระบบ',
  'Activity Logs': 'ประวัติกิจกรรม',
};
const roleLabels = { Admin: 'ผู้ดูแลระบบ', Staff: 'เจ้าหน้าที่', Student: 'นักศึกษา' };

type Tab = (typeof tabs)[number];
type ModalMode = 'view' | 'edit' | null;

interface UserFormState {
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'STUDENT';
  password: string;
}

interface AuditLogRecord {
  id: number;
  method: string;
  path: string;
  ip?: string | null;
  duration?: number | null;
  createdAt: string;
  user?: { id: number; username?: string | null; email: string } | null;
}

interface BillingReport {
  currency: string;
  totalBills: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  verifyingAmount: number;
  countByStatus: Record<string, number>;
  monthly: Array<{ month: string; amount: number; paidAmount: number; billCount: number; paidCount: number }>;
}

type SystemSettings = Record<string, string>;

const emptyUserForm: UserFormState = {
  username: '',
  email: '',
  role: 'STUDENT',
  password: '',
};

const roleToFormValue = (role?: string): UserFormState['role'] => {
  const normalized = String(role ?? '').toUpperCase();
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'STAFF') return 'STAFF';
  return 'STUDENT';
};

const getActionErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const formatReportCurrency = (value: number) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const defaultSystemSettings: SystemSettings = {
  academicYear: '2026/2027',
  currentTerm: 'ภาคเรียนที่ 2',
  maxOccupants: '4',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  emailNotifications: 'true',
  smsNotifications: 'true',
  pushNotifications: 'true',
  twoFactorAuthentication: 'true',
  sessionTimeoutMinutes: '30',
  passwordPolicy: 'ปลอดภัยสูง',
};

const AdminPanelPage = () => {
  const { users, loading, refetchUsers } = useDashboard();
  const [activeTab, setActiveTab] = useState<Tab>('User Management');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMethod, setAuditMethod] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [billingReport, setBillingReport] = useState<BillingReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const loadAuditLogs = async (page = auditPage) => {
    setAuditLoading(true);
    try {
      const response = await getAuditLogs({
        page,
        limit: 25,
        ...(auditMethod ? { method: auditMethod } : {}),
      });
      const data = response.data?.data;
      setAuditLogs(Array.isArray(data?.items) ? data.items : []);
      setAuditPage(data?.pagination?.page ?? page);
    } catch (error) {
      setActionError(getActionErrorMessage(error, 'ไม่สามารถโหลดประวัติกิจกรรมได้'));
    } finally {
      setAuditLoading(false);
    }
  };

  const loadBillingReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await getBillingReport();
      setBillingReport(response.data?.data ?? null);
    } catch (error) {
      setReportError(getActionErrorMessage(error, 'ไม่สามารถโหลดรายงานการเงินได้'));
    } finally {
      setReportLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const response = await getSystemSettings();
      setSystemSettings({ ...defaultSystemSettings, ...(response.data?.data?.settings ?? {}) });
    } catch (error) {
      setSettingsError(getActionErrorMessage(error, 'ไม่สามารถโหลดการตั้งค่าระบบได้'));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'Activity Logs') void loadAuditLogs(1);
    if (tab === 'Reports') void loadBillingReport();
    if (tab === 'System Settings') void loadSystemSettings();
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage(null);
    setSettingsError(null);
    try {
      await updateSystemSettings(systemSettings);
      setSettingsMessage('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    } catch (error) {
      setSettingsError(getActionErrorMessage(error, 'ไม่สามารถบันทึกการตั้งค่าได้'));
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleOpenView = useCallback((user: UserRecord) => {
    setSelectedUser(user);
    setModalMode('view');
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((user: UserRecord) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username || user.name || '',
      email: user.email,
      role: roleToFormValue(user.role),
      password: '',
    });
    setModalMode('edit');
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setSelectedUser(null);
    setUserForm(emptyUserForm);
    setActionError(null);
  };

  const handleSaveUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;
    setSavingUserId(selectedUser.id);
    setActionError(null);
    try {
      await updateUser(selectedUser.id, {
        username: userForm.username.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        ...(userForm.password.trim() ? { password: userForm.password.trim() } : {}),
      });
      await refetchUsers();
      handleCloseModal();
    } catch (error) {
      setActionError(getActionErrorMessage(error, 'ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้'));
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = useCallback(async (user: UserRecord) => {
    if (!window.confirm(`ยืนยันการลบผู้ใช้งาน ${user.name} (${user.email}) หรือไม่?`)) return;
    setSavingUserId(user.id);
    setActionError(null);
    try {
      await deleteUser(user.id);
      await refetchUsers();
    } catch (error) {
      setActionError(getActionErrorMessage(error, 'ไม่สามารถลบผู้ใช้งานได้'));
    } finally {
      setSavingUserId(null);
    }
  }, [refetchUsers]);

  const columns = useMemo<ColumnDef<UserRecord, unknown>[]>(() => [
    {
      accessorKey: 'name',
      header: 'ชื่อผู้ใช้งาน',
    },
    {
      accessorKey: 'email',
      header: 'อีเมล',
    },
    {
      accessorKey: 'role',
      header: 'บทบาท / สิทธิ์',
      cell: ({ row }) => <span className={styles.roleTag}>{roleLabels[row.original.role] ?? row.original.role}</span>,
    },
    {
      accessorKey: 'isOnline',
      header: 'สถานะออนไลน์',
      cell: ({ row }) => {
        const isOnline = row.original.isOnline;
        return <Badge tone={isOnline ? 'success' : 'neutral'}>{isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</Badge>;
      },
    },
    {
      accessorKey: 'lastLogin',
      header: 'เข้าสู่ระบบล่าสุด',
    },
    {
      id: 'actions',
      header: 'การจัดการ',
      cell: ({ row }) => {
        const user = row.original;
        const isBusy = savingUserId === user.id;
        return (
          <div className={styles.actionButtons}>
            <button type="button" className={styles.iconButton} onClick={() => handleOpenView(user)} title="ดูข้อมูล">
              <Eye size={16} />
            </button>
            <button type="button" className={styles.iconButton} onClick={() => handleOpenEdit(user)} title="แก้ไข">
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.deleteButton}`}
              onClick={() => void handleDeleteUser(user)}
              disabled={isBusy}
              title="ลบ"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ], [handleDeleteUser, handleOpenEdit, handleOpenView, savingUserId]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>System Administration</p>
          <h1>แผงควบคุมระบบ (Admin Panel)</h1>
          <p>จัดการบัญชีผู้ใช้งาน ความปลอดภัย รายงานการเงิน และตรวจสอบบันทึกกิจกรรมแบบเรียลไทม์</p>
        </div>
      </header>

      <nav className={styles.tabsNav}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      {actionError && (
        <div className={styles.errorAlert}>
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}>×</button>
        </div>
      )}

      {activeTab === 'User Management' && (
        <section className={styles.tableCard}>
          {loading ? (
            <div className={styles.loadingState}>กำลังโหลดรายชื่อผู้ใช้งาน...</div>
          ) : (
            <DataTable data={users} columns={columns} />
          )}
        </section>
      )}

      {activeTab === 'Reports' && (
        <section className={styles.reportSection}>
          {reportLoading ? (
            <div className={styles.loadingState}>กำลังโหลดรายงานการเงิน...</div>
          ) : reportError ? (
            <div className={styles.errorAlert}>{reportError}</div>
          ) : billingReport ? (
            <div className={styles.reportGrid}>
              <div className={styles.reportCard}>
                <h4>ยอดเรียกเก็บรวม</h4>
                <strong>{formatReportCurrency(billingReport.totalAmount)}</strong>
                <span>{billingReport.totalBills} บิลทั้งหมด</span>
              </div>
              <div className={styles.reportCard}>
                <h4>ชำระเงินแล้ว</h4>
                <strong style={{ color: '#10b981' }}>{formatReportCurrency(billingReport.paidAmount)}</strong>
                <span>{billingReport.countByStatus?.PAID ?? 0} บิล</span>
              </div>
              <div className={styles.reportCard}>
                <h4>รอตรวจสอบ / ค้างชำระ</h4>
                <strong style={{ color: '#ef4444' }}>{formatReportCurrency(billingReport.unpaidAmount + billingReport.verifyingAmount)}</strong>
                <span>{(billingReport.countByStatus?.UNPAID ?? 0) + (billingReport.countByStatus?.VERIFYING ?? 0)} บิล</span>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {activeTab === 'System Settings' && (
        <section className={styles.settingsSection}>
          {settingsLoading ? (
            <div className={styles.loadingState}>กำลังโหลดการตั้งค่า...</div>
          ) : (
            <form onSubmit={handleSaveSettings} className={styles.settingsForm}>
              {settingsMessage && <div className={styles.successAlert}>{settingsMessage}</div>}
              {settingsError && <div className={styles.errorAlert}>{settingsError}</div>}
              
              <div className={styles.formRow}>
                <label>ปีการศึกษาปัจจุบัน</label>
                <input
                  type="text"
                  value={systemSettings.academicYear || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, academicYear: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <label>ภาคการศึกษา</label>
                <input
                  type="text"
                  value={systemSettings.currentTerm || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, currentTerm: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <label>เวลาเช็คอินห้องพัก</label>
                <input
                  type="text"
                  value={systemSettings.checkInTime || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, checkInTime: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <label>เวลาเช็คเอาท์ห้องพัก</label>
                <input
                  type="text"
                  value={systemSettings.checkOutTime || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, checkOutTime: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.saveBtn} disabled={settingsSaving}>
                {settingsSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึกการตั้งค่า
              </button>
            </form>
          )}
        </section>
      )}

      {activeTab === 'Activity Logs' && (
        <section className={styles.tableCard}>
          <div className={styles.logFilters}>
            <input
              type="text"
              placeholder="กรองด้วย Method (GET, POST...)"
              value={auditMethod}
              onChange={(e) => setAuditMethod(e.target.value)}
            />
            <button type="button" onClick={() => void loadAuditLogs(1)}>ค้นหา</button>
          </div>
          {auditLoading ? (
            <div className={styles.loadingState}>กำลังโหลดบันทึกกิจกรรม...</div>
          ) : (
            <div className={styles.logsList}>
              {auditLogs.map((log) => (
                <div key={log.id} className={styles.logItem}>
                  <span className={styles.methodTag}>{log.method}</span>
                  <span className={styles.pathText}>{log.path}</span>
                  <span className={styles.userText}>{log.user?.username || log.user?.email || 'ระบบ / ไม่ระบุ'}</span>
                  <span className={styles.timeText}>{new Date(log.createdAt).toLocaleString('th-TH')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isModalOpen && selectedUser && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={modalMode === 'edit' ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'รายละเอียดผู้ใช้งาน'}
        >
          {modalMode === 'view' ? (
            <div className={styles.viewModalContent}>
              <p><strong>ชื่อผู้ใช้:</strong> {selectedUser.username || selectedUser.name}</p>
              <p><strong>อีเมล:</strong> {selectedUser.email}</p>
              <p><strong>บทบาท:</strong> {roleLabels[selectedUser.role] ?? selectedUser.role}</p>
              <p><strong>สถานะออนไลน์:</strong> {selectedUser.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</p>
              <p><strong>เข้าสู่ระบบล่าสุด:</strong> {selectedUser.lastLogin}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveUser} className={styles.editModalForm}>
              <div className={styles.formRow}>
                <label>ชื่อผู้ใช้งาน</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>อีเมล</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>บทบาท</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserFormState['role'] })}
                >
                  <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                  <option value="STAFF">เจ้าหน้าที่ (STAFF)</option>
                  <option value="STUDENT">นักศึกษา (STUDENT)</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <label>รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelBtn}>ยกเลิก</button>
                <button type="submit" className={styles.saveBtn} disabled={savingUserId === selectedUser.id}>
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminPanelPage;
