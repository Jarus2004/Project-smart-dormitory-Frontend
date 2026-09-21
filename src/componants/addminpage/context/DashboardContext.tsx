import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getBills, getRooms, getTenants, getMaintenanceTickets, getUsers } from '../../../services/adminApi';
import { useAuth } from '../../../contexts/useAuth';
import { resolveApiBaseUrl } from '../../../services/api-url';
import { createRealtimeSocket } from '../../../services/realtime';
import type { UserRole, UserStatus } from '../types/user';
import type { MaintenanceRequest } from '../types/maintenance';
import type { Room } from '../types/room';
import type { Student, StudentStatus } from '../types/student';
import { DashboardContext, type BillRecord, type DashboardContextValue, type DashboardMetric, type FinancialOverview, type MonthlySeries } from './dashboard-context';
import type { ActivityItem, UserRecord } from '../types/user';

interface BackendUserSummary {
  id?: number;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BackendTenantSummary {
  fullName?: string | null;
  checkInDate?: string | null;
  userId?: number | null;
  user?: BackendUserSummary | null;
}

interface BackendRoom {
  id: number | string;
  roomNumber?: string | null;
  number?: string | null;
  floor?: number | null;
  building?: string | null;
  capacity?: number | null;
  status?: string | null;
  tenants?: BackendTenantSummary[];
  tenant?: BackendTenantSummary | null;
  checkInDate?: string | null;
}

interface BackendTenant extends BackendTenantSummary {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  contact?: string | null;
  yearLevel?: string | null;
  year?: string | null;
  status?: string | null;
  preferredRoomType?: string | null;
  room?: { roomNumber?: string | null; building?: string | null } | null;
}

interface BackendMaintenanceTicket {
  id: number | string;
  status?: string | null;
  category?: string | null;
  title?: string | null;
  description?: string | null;
  studentName?: string | null;
  tenantId?: number | null;
  tenant?: BackendTenantSummary | null;
  roomNumber?: string | null;
  room?: { roomNumber?: string | null } | null;
  createdAt?: string | null;
  submittedAt?: string | null;
  assignedStaff?: string | null;
  contactTime?: string | null;
}

interface BackendUser {
  id: number | string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  isOnline?: boolean | null;
  lastLogin?: string | null;
}

interface BackendBill {
  id: number | string;
  amount?: number | string | null;
  status?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
}

const EMPTY_ROOMS: Room[] = [];
const EMPTY_STUDENTS: Student[] = [];
const EMPTY_MAINTENANCE: MaintenanceRequest[] = [];
const EMPTY_USERS: UserRecord[] = [];
const EMPTY_BILLS: BillRecord[] = [];

const statusMap: Record<string, Room['status']> = {
  OCCUPIED: 'Occupied',
  AVAILABLE: 'Available',
  MAINTENANCE: 'Maintenance',
  Occupied: 'Occupied',
  Available: 'Available',
  Maintenance: 'Maintenance',
};

const normalizeRoom = (r: BackendRoom): Room => {
  const studentsList: string[] = Array.isArray(r.tenants)
    ? r.tenants.map((t) => t.fullName || '').filter(Boolean)
    : (r.tenant?.fullName
        ? r.tenant.fullName.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []);

  const occupiedCount = studentsList.length;
  const capacity = r.capacity ?? 4;
  const rawStatus: string = r.status ?? '';
  
  const mappedStatus: Room['status'] = statusMap[rawStatus] === 'Maintenance'
    ? 'Maintenance'
    : occupiedCount >= capacity
      ? 'Occupied'
      : 'Available';

  const building: string =
    r.building ??
    (r.floor ? `ตึก ${String.fromCharCode(64 + Math.ceil(r.floor / 2))}` : 'ตึก A');

  const checkInDate = Array.isArray(r.tenants) && r.tenants.length > 0
    ? (r.tenants[0].checkInDate?.split?.('T')?.[0] ?? '')
    : (r.tenant?.checkInDate?.split?.('T')?.[0] ?? r.checkInDate ?? '');

  return {
    id: String(r.id),
    number: r.roomNumber ?? r.number ?? '',
    floor: r.floor ?? 0,
    building,
    capacity,
    occupied: occupiedCount,
    status: mappedStatus,
    students: studentsList,
    checkInDate,
  };
};

const normalizeTenant = (t: BackendTenant): Student => {
  const rawStatus = String(t.status || 'PENDING').toUpperCase();
  let dbStatus: StudentStatus = 'Pending';
  if (rawStatus === 'ACTIVE' || rawStatus === 'APPROVED') dbStatus = 'Active';
  else if (rawStatus === 'INACTIVE' || rawStatus === 'REJECTED') dbStatus = 'Inactive';

  const displayName = t.fullName || t.name || t.user?.username || t.user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return {
    id: String(t.id),
    name: displayName,
    email: t.email || t.user?.email || '',
    room: t.room?.roomNumber || t.preferredRoomType || 'ยังไม่ได้จัดห้อง',
    building: t.room?.building || 'หอพักหลัก',
    year: t.yearLevel || t.year || '-',
    contact: t.phone || t.contact || t.user?.phone || '-',
    checkInDate: t.checkInDate ? t.checkInDate.split('T')[0] : '-',
    status: dbStatus,
    avatar: initials || 'ST',
  };
};

const normalizeMaintenance = (m: BackendMaintenanceTicket): MaintenanceRequest => {
  const rawStatus = String(m.status || 'PENDING').toUpperCase();
  let normalizedStatus: MaintenanceRequest['status'] = 'Pending';
  if (rawStatus === 'APPROVED' || rawStatus === 'IN_PROGRESS') {
    normalizedStatus = 'In Progress';
  } else if (rawStatus === 'RESOLVED' || rawStatus === 'COMPLETED' || rawStatus === 'CLOSED') {
    normalizedStatus = 'Completed';
  } else if (rawStatus === 'CANCELLED') {
    normalizedStatus = 'Cancelled';
  }

  const categoryMap: Record<string, string> = {
    ELECTRICAL: 'ระบบไฟฟ้า',
    PLUMBING: 'ระบบประปา',
    CLEANING: 'ทำความสะอาด',
    SECURITY: 'ระบบความปลอดภัย',
    OTHER: 'ทั่วไป',
  };
  const uiTitle = categoryMap[m.category ?? ''] || m.title || 'แจ้งซ่อมทั่วไป';

  let displayDesc = m.description ?? '';
  let imageUrl: string | undefined = undefined;
  if (displayDesc.startsWith('[IMAGE:')) {
    const endIdx = displayDesc.indexOf(']');
    if (endIdx !== -1) {
      const filename = displayDesc.substring(7, endIdx);
      imageUrl = `${resolveApiBaseUrl()}/maintenance/images/${filename}`;
      displayDesc = displayDesc.substring(endIdx + 1).replace(/^\s*\|\s*/, '');
    }
  }

  return {
    id: String(m.id),
    title: uiTitle,
    studentName: m.studentName || m.tenant?.fullName || 'ผู้พักอาศัย',
    roomNumber: m.roomNumber || m.room?.roomNumber || '-',
    description: displayDesc,
    imageUrl,
    status: normalizedStatus,
    submittedAt: m.submittedAt ? m.submittedAt.split('T')[0] : (m.createdAt ? m.createdAt.split('T')[0] : '-'),
    assignedStaff: m.assignedStaff || 'ช่างประจำหอพัก',
    contactTime: m.contactTime || '09:00 - 17:00 น.',
  };
};

const normalizeUser = (u: BackendUser): UserRecord => {
  const roleUpper = String(u.role || '').toUpperCase();
  const mappedRole: UserRole = roleUpper === 'ADMIN' ? 'Admin' : (roleUpper === 'STAFF' ? 'Staff' : 'Student');
  const mappedStatus: UserStatus = u.status === 'Inactive' ? 'Inactive' : (u.status === 'Pending' ? 'Pending' : 'Active');

  return {
    id: String(u.id),
    name: u.username || u.email || 'ผู้ใช้งาน',
    username: u.username || '',
    email: u.email || '',
    role: mappedRole,
    status: mappedStatus,
    isOnline: Boolean(u.isOnline),
    lastLogin: (() => {
      if (!u.lastLogin) return '-';
      const parsed = new Date(u.lastLogin);
      if (Number.isNaN(parsed.getTime())) return '-';
      return parsed.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    })(),
  };
};

const normalizeBill = (b: BackendBill): BillRecord => ({
  id: String(b.id),
  amount: Number(b.amount ?? 0),
  status: String(b.status ?? 'UNPAID').toUpperCase(),
  dueDate: b.dueDate ?? b.createdAt ?? '',
});

const formatBaht = (value: number) => `฿${value.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;

const buildFinancials = (bills: BillRecord[]): FinancialOverview => {
  const totalRent = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paid = bills.filter((bill) => bill.status === 'PAID').reduce((sum, bill) => sum + bill.amount, 0);
  const outstanding = bills
    .filter((bill) => ['UNPAID', 'OVERDUE', 'VERIFYING'].includes(bill.status))
    .reduce((sum, bill) => sum + bill.amount, 0);

  return {
    totalRent: formatBaht(totalRent),
    waterAndElectricity: 'ตามมิเตอร์',
    outstandingPayments: formatBaht(outstanding),
    netIncome: formatBaht(paid),
  };
};

const monthFormatter = new Intl.DateTimeFormat('th-TH', { month: 'short' });

const buildSeries = (bills: BillRecord[]): MonthlySeries[] => {
  const monthMap = new Map<string, MonthlySeries>();

  bills.forEach((bill) => {
    const parsedDate = bill.dueDate ? new Date(bill.dueDate) : new Date();
    const month = Number.isNaN(parsedDate.getTime()) ? 'ปัจจุบัน' : monthFormatter.format(parsedDate);
    const current = monthMap.get(month) ?? { month, income: 0, expenses: 0 };

    if (bill.status === 'PAID') {
      current.income += bill.amount;
    } else {
      current.expenses += bill.amount;
    }

    monthMap.set(month, current);
  });

  return Array.from(monthMap.values()).slice(-6);
};

const buildActivities = (
  users: UserRecord[],
  maintenance: MaintenanceRequest[],
): ActivityItem[] => {
  const maintenanceActivities = maintenance.slice(0, 5).map((request) => ({
    id: `maintenance-${request.id}`,
    userName: request.studentName || 'ผู้พักอาศัย',
    activity: `แจ้งซ่อม ${request.title} (ห้อง ${request.roomNumber})`,
    timestamp: request.submittedAt || '-',
  }));

  const onlineActivities = users
    .filter((user) => user.isOnline)
    .slice(0, 3)
    .map((user) => ({
      id: `online-${user.id}`,
      userName: user.username || user.name || user.email,
      activity: 'เข้าสู่ระบบ',
      timestamp: 'เมื่อสักครู่',
    }));

  return [...onlineActivities, ...maintenanceActivities].slice(0, 8);
};

const buildMetrics = (
  students: Student[],
  rooms: Room[],
  maintenance: MaintenanceRequest[],
  bills: BillRecord[],
): DashboardMetric[] => {
  const availableRooms = rooms.filter((r) => r.status === 'Available').length;
  const pendingRequests = maintenance.filter((m) => m.status === 'Pending').length;
  const overdueBills = bills.filter((bill) => bill.status === 'OVERDUE' || bill.status === 'UNPAID').length;
  const buildings = new Set(rooms.map((r) => r.building).filter(Boolean)).size || 1;

  return [
    { id: 'students', label: 'ผู้พักอาศัยทั้งหมด', value: String(students.length), icon: 'Users' },
    { id: 'buildings', label: 'จำนวนอาคาร', value: String(buildings), icon: 'Building2' },
    { id: 'rooms', label: 'ห้องพักว่าง', value: String(availableRooms), icon: 'DoorOpen' },
    { id: 'requests', label: 'แจ้งซ่อมรอดำเนินการ', value: String(pendingRequests), icon: 'ClipboardList' },
    { id: 'overdue', label: 'บิลค้างชำระ', value: String(overdueBills), icon: 'ReceiptText' },
  ];
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await getRooms();
      const data = res.data?.data ?? res.data ?? [];
      setRooms((Array.isArray(data) ? data : []).map(normalizeRoom));
    } catch {
      // Ignored
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await getTenants();
      const data = res.data?.data ?? res.data ?? [];
      setStudents((Array.isArray(data) ? data : []).map(normalizeTenant));
    } catch {
      // Ignored
    }
  }, []);

  const updateStudentStatus = useCallback((id: string, status: Student['status']) => {
    setStudents((currentStudents) => currentStudents.map((student) => (
      student.id === id ? { ...student, status } : student
    )));
  }, []);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await getMaintenanceTickets();
      const data = res.data?.data ?? res.data ?? [];
      setMaintenance((Array.isArray(data) ? data : []).map(normalizeMaintenance));
    } catch {
      // Ignored
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      const data = res.data?.data ?? res.data ?? [];
      setUsers((Array.isArray(data) ? data : []).map(normalizeUser));
    } catch {
      // Ignored
    }
  }, []);

  const fetchBills = useCallback(async () => {
    try {
      const res = await getBills();
      const data = res.data?.data ?? res.data ?? [];
      setBills((Array.isArray(data) ? data : []).map(normalizeBill));
    } catch {
      // Ignored
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        fetchRooms(),
        fetchTenants(),
        fetchMaintenance(),
        fetchUsers(),
        fetchBills(),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchRooms, fetchTenants, fetchMaintenance, fetchUsers, fetchBills]);

  useEffect(() => {
    if (!token) return;

    const loadTimer = window.setTimeout(() => {
      void loadAll();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [token, loadAll]);

  // Universal Real-time Auto-refresh via Socket.IO
  useEffect(() => {
    if (!token) return;
    const socket = createRealtimeSocket(token);

    const reloadData = () => {
      void loadAll();
    };

    socket.on('billStatusUpdated', reloadData);
    socket.on('tenantStatusUpdated', reloadData);
    socket.on('userStatusUpdated', reloadData);
    socket.on('maintenanceStatusUpdated', reloadData);
    socket.on('visitorStatusUpdated', reloadData);
    socket.on('visitorScanEvent', reloadData);
    socket.on('notificationAlert', reloadData);

    return () => {
      socket.off('billStatusUpdated', reloadData);
      socket.off('tenantStatusUpdated', reloadData);
      socket.off('userStatusUpdated', reloadData);
      socket.off('maintenanceStatusUpdated', reloadData);
      socket.off('visitorStatusUpdated', reloadData);
      socket.off('visitorScanEvent', reloadData);
      socket.off('notificationAlert', reloadData);
      socket.disconnect();
    };
  }, [token, loadAll]);

  const visibleRooms = token ? rooms : EMPTY_ROOMS;
  const visibleStudents = token ? students : EMPTY_STUDENTS;
  const visibleMaintenance = token ? maintenance : EMPTY_MAINTENANCE;
  const visibleUsers = token ? users : EMPTY_USERS;
  const visibleBills = token ? bills : EMPTY_BILLS;

  const metrics = useMemo(
    () => buildMetrics(visibleStudents, visibleRooms, visibleMaintenance, visibleBills),
    [visibleStudents, visibleRooms, visibleMaintenance, visibleBills],
  );

  const financials = useMemo(() => buildFinancials(visibleBills), [visibleBills]);
  const series = useMemo(() => buildSeries(visibleBills), [visibleBills]);
  const activities = useMemo(() => buildActivities(visibleUsers, visibleMaintenance), [visibleUsers, visibleMaintenance]);

  const value = useMemo<DashboardContextValue>(() => ({
    metrics,
    financials,
    series,
    activities,
    rooms: visibleRooms,
    students: visibleStudents,
    maintenance: visibleMaintenance,
    users: visibleUsers,
    bills: visibleBills,
    loading,
    error,
    updateStudentStatus,
    refetchRooms: fetchRooms,
    refetchTenants: fetchTenants,
    refetchMaintenance: fetchMaintenance,
    refetchUsers: fetchUsers,
  }), [
    metrics,
    financials,
    series,
    activities,
    visibleRooms,
    visibleStudents,
    visibleMaintenance,
    visibleUsers,
    visibleBills,
    loading,
    error,
    updateStudentStatus,
    fetchRooms,
    fetchTenants,
    fetchMaintenance,
    fetchUsers,
  ]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
