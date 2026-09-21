import { useMemo, useState, useCallback } from 'react';
import { useDashboard } from '../../context/useDashboard';
import MaintenanceCard from '../../components/MaintenanceCard/MaintenanceCard';
import StatCard from '../../components/StatCard/StatCard';
import { CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, Hammer } from 'lucide-react';
import type { MaintenanceRequest } from '../../types/maintenance';
import styles from './MaintenancePage.module.css';

const tabs = ['All', 'Pending', 'In Progress', 'Completed'] as const;
const tabLabels = { All: 'ทั้งหมด', Pending: 'รอดำเนินการ', 'In Progress': 'กำลังดำเนินการ', Completed: 'เสร็จสิ้น' } as const;

type Tab = (typeof tabs)[number];

interface MaintenanceGroup {
  key: string;
  studentName: string;
  roomNumber: string;
  requests: MaintenanceRequest[];
  pendingCount: number;
  unseenCount: number;
}

const buildGroupKey = (request: MaintenanceRequest) => (
  request.reporterKey || `${request.studentName}-${request.roomNumber}`
);

const viewedStorageKey = 'admin:viewed-maintenance-ids';

const readViewedIds = () => {
  try {
    const raw = localStorage.getItem(viewedStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set<string>();
  }
};

const MaintenancePage = () => {
  const { maintenance, loading } = useDashboard();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => readViewedIds());

  const isUnseenPending = useCallback((request: MaintenanceRequest) => (
    request.status === 'Pending' && !viewedIds.has(request.id)
  ), [viewedIds]);

  const markRequestsViewed = (requests: MaintenanceRequest[]) => {
    setViewedIds((current) => {
      const next = new Set(current);
      requests.forEach((request) => {
        if (request.status === 'Pending') {
          next.add(request.id);
        }
      });
      localStorage.setItem(viewedStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const filteredMaintenance = useMemo(() => {
    if (activeTab === 'All') return maintenance;
    return maintenance.filter((request) => request.status === activeTab);
  }, [activeTab, maintenance]);

  const groupedMaintenance = useMemo<MaintenanceGroup[]>(() => {
    const groups = new Map<string, MaintenanceGroup>();

    filteredMaintenance.forEach((request) => {
      const key = buildGroupKey(request);
      const current = groups.get(key);

      if (current) {
        current.requests.push(request);
        if (request.status === 'Pending') {
          current.pendingCount += 1;
        }
        if (isUnseenPending(request)) {
          current.unseenCount += 1;
        }
        return;
      }

      groups.set(key, {
        key,
        studentName: request.studentName,
        roomNumber: request.roomNumber,
        requests: [request],
        pendingCount: request.status === 'Pending' ? 1 : 0,
        unseenCount: isUnseenPending(request) ? 1 : 0,
      });
    });

    return Array.from(groups.values());
  }, [filteredMaintenance, isUnseenPending]);



  const pendingCount = maintenance.filter((item) => item.status === 'Pending').length;
  const unseenPendingCount = maintenance.filter((item) => item.status === 'Pending' && !viewedIds.has(item.id)).length;

  if (loading) {
    return <div className={styles.skeleton}>กำลังโหลดรายการแจ้งซ่อม...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>การปฏิบัติงาน</p>
          <h2 className={styles.titleWithAlert}>
            รายการแจ้งซ่อมบำรุง
            {unseenPendingCount > 0 && <span className={styles.alertDot} aria-label="มีรายการแจ้งซ่อมใหม่" />}
          </h2>
        </div>
      </div>

      <section className={styles.statsGrid}>
        <StatCard label="รายการทั้งหมด" value={maintenance.length.toString()} icon={ClipboardList} />
        <StatCard label="รอดำเนินการ" value={pendingCount.toString()} icon={Clock3} />
        <StatCard label="กำลังดำเนินการ" value={maintenance.filter((item) => item.status === 'In Progress').length.toString()} icon={Hammer} />
        <StatCard label="เสร็จสิ้น" value={maintenance.filter((item) => item.status === 'Completed').length.toString()} icon={CheckCircle2} />
      </section>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button key={tab} className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`} onClick={() => setActiveTab(tab)}>
            {tabLabels[tab]}
            {(tab === 'All' || tab === 'Pending') && unseenPendingCount > 0 && <span className={styles.tabDot} />}
          </button>
        ))}
      </div>

      <section className={styles.list}>
        {groupedMaintenance.map((group) => {
          const isGroupOpen = openGroups[group.key] ?? (group.unseenCount > 0);
          return (
            <article key={group.key} className={styles.group}>
              <button
                type="button"
                className={styles.groupHeader}
                onClick={() => {
                  setOpenGroups((current) => ({ ...current, [group.key]: !isGroupOpen }));
                  if (group.unseenCount > 0) {
                    markRequestsViewed(group.requests);
                  }
                }}
                aria-expanded={isGroupOpen}
              >
                <span className={styles.groupTitle}>
                  {isGroupOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span>
                    {group.studentName || 'ไม่ระบุผู้แจ้ง'}
                    <small>ห้อง {group.roomNumber || '-'}</small>
                  </span>
                </span>
                <span className={styles.groupMeta}>
                  {group.unseenCount > 0 && <span className={styles.alertDot} aria-label="มีรายการใหม่" />}
                  <strong>{group.requests.length}</strong> รอบที่แจ้ง
                </span>
              </button>

              {isGroupOpen && (
                <div className={styles.groupBody}>
                  {group.requests.map((request, index) => (
                    <div key={request.id} className={styles.requestRound}>
                      <div className={styles.roundLabel}>รอบที่ {group.requests.length - index}</div>
                      <MaintenanceCard request={request} compact onViewed={() => markRequestsViewed([request])} />
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default MaintenancePage;
