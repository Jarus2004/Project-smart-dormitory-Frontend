import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  DoorOpen,
  Gauge,
  ReceiptText,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wrench,
  Activity,
  Layers,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useDashboard } from '../../context/useDashboard';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import ChartCard from '../../components/ChartCard/ChartCard';
import StatCard from '../../components/StatCard/StatCard';
import styles from './DashboardPage.module.css';

// StatCard expects a ComponentType, not a JSX.Element
const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  Users,
  Building2,
  DoorOpen,
  ClipboardList,
  ReceiptText,
};

export const DashboardPage: React.FC = () => {
  const { metrics, activities, financials, series, rooms, students, maintenance, users, bills, error, loading } = useDashboard();

  const businessHealth = useMemo(() => {
    const occupiedRooms = rooms.filter((room) => room.status === 'Occupied').length;
    const availableRooms = rooms.filter((room) => room.status === 'Available').length;
    const pendingMaintenance = maintenance.filter((request) => request.status === 'Pending').length;
    const resolvedMaintenance = maintenance.filter((request) => request.status === 'Completed').length;
    const onlineUsers = users.filter((user) => user.isOnline).length;
    const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

    const totalBillsCount = bills.length;
    const paidBillsCount = bills.filter((b) => b.status === 'PAID').length;
    const collectionRate = totalBillsCount > 0 ? Math.round((paidBillsCount / totalBillsCount) * 100) : 100;

    return {
      occupiedRooms,
      availableRooms,
      pendingMaintenance,
      resolvedMaintenance,
      onlineUsers,
      occupancyRate,
      collectionRate,
      activeStudents: students.filter((student) => student.status === 'Active').length,
    };
  }, [maintenance, rooms, students, users, bills]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonGrid}>
          <RefreshCw size={24} className="animate-spin" />
          <span>กำลังโหลดข้อมูลระบบ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Real-time Operations &amp; Management</p>
          <h2>ศูนย์ควบคุมหอพักอัจฉริยะ</h2>
          <p className={styles.heroText}>
            ภาพรวมการดำเนินงานแบบเรียลไทม์ · อัปเดตอัตโนมัติผ่าน WebSocket ทุกครั้งที่สถานะเปลี่ยนแปลง
          </p>
        </div>
        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Row 0: 5-Column Stat Cards */}
      <section className={styles.statsGrid}>
        {metrics.map((metric) => {
          const IconComponent = iconMap[metric.icon] ?? Users;
          return (
            <StatCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              icon={IconComponent}
            />
          );
        })}
      </section>

      {/* Row 1: Business Health & Operational Status (50/50 Balanced Grid) */}
      <section className={styles.balancedGrid}>
        {/* Card 1: Business Health */}
        <article className={styles.dashCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Business Health</p>
              <h3 className={styles.cardTitle}>สุขภาพการดำเนินธุรกิจ</h3>
            </div>
            <div className={styles.headerIcon}>
              <Gauge size={20} color="#6366f1" />
            </div>
          </div>

          <div className={styles.indicatorBar}>
            <div style={{ width: `${Math.max(5, businessHealth.occupancyRate)}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
          </div>

          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><Activity size={15} color="#6366f1" /> อัตราการเข้าพัก</span>
              <strong className={styles.rowValue} style={{ color: '#6366f1' }}>{businessHealth.occupancyRate}%</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><DoorOpen size={15} color="#64748b" /> ห้องที่มีผู้เช่าอยู่</span>
              <strong className={styles.rowValue}>{businessHealth.occupiedRooms} ห้อง</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><DoorOpen size={15} color="#10b981" /> ห้องว่างพร้อมรับผู้เช่า</span>
              <strong className={styles.rowValue} style={{ color: '#10b981' }}>{businessHealth.availableRooms} ห้อง</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><UserCheck size={15} color="#3b82f6" /> นักศึกษาที่ Active</span>
              <strong className={styles.rowValue}>{businessHealth.activeStudents} คน</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><Wrench size={15} color="#f59e0b" /> งานแจ้งซ่อมรอดำเนินการ</span>
              <strong className={styles.rowValue} style={{ color: businessHealth.pendingMaintenance > 0 ? '#ef4444' : '#10b981' }}>
                {businessHealth.pendingMaintenance} รายการ
              </strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><Users size={15} color="#8b5cf6" /> ผู้ดูแลที่ออนไลน์อยู่</span>
              <strong className={styles.rowValue}>{businessHealth.onlineUsers} คน</strong>
            </div>
          </div>
        </article>

        {/* Card 2: Operational Status */}
        <article className={styles.dashCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Operational Status</p>
              <h3 className={styles.cardTitle}>สถานะระบบปฏิบัติการ</h3>
            </div>
            <div className={styles.headerIcon}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </div>

          <div className={styles.indicatorBar}>
            <div style={{ width: '100%', background: '#10b981' }} />
          </div>

          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><ShieldCheck size={15} color="#10b981" /> ระบบความปลอดภัย-Auth</span>
              <span className={styles.statusPillGreen}>ทำงานอยู่ (Live)</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><Clock size={15} color="#3b82f6" /> ช่องทางการอัปเดต</span>
              <strong className={styles.rowValue}>WebSocket Real-time</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><CreditCard size={15} color="#f59e0b" /> ยอดค่าเช่าเรียกเก็บได้</span>
              <strong className={styles.rowValue}>{financials.totalRent}</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><CheckCircle2 size={15} color="#10b981" /> รายได้สุทธิ</span>
              <strong className={styles.rowValue} style={{ color: '#10b981' }}>{financials.netIncome}</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><Wrench size={15} color="#10b981" /> งานซ่อมเสร็จสิ้นแล้ว</span>
              <strong className={styles.rowValue}>{businessHealth.resolvedMaintenance} รายการ</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}><Layers size={15} color="#6366f1" /> อัตราการชำระเงิน</span>
              <strong className={styles.rowValue} style={{ color: '#10b981' }}>{businessHealth.collectionRate}%</strong>
            </div>
          </div>
        </article>
      </section>

      {/* Row 2: Monthly Trends & Financial Overview (50/50 Balanced Grid) */}
      <section className={styles.balancedGrid}>
        <ChartCard data={series} />

        <article className={styles.dashCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Billing &amp; Finance</p>
              <h3 className={styles.cardTitle}>ภาพรวมบิลและการเงิน</h3>
            </div>
            <div className={styles.headerIcon}>
              <ReceiptText size={20} color="#6366f1" />
            </div>
          </div>

          <div className={styles.indicatorBar}>
            <div style={{ width: `${businessHealth.collectionRate}%`, background: 'linear-gradient(90deg, #2563eb, #10b981)' }} />
          </div>

          <div className={styles.dataRows}>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}>ยอดค่าเช่ารวมที่เรียกเก็บ</span>
              <strong className={styles.rowValue}>{financials.totalRent}</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}>ค่าน้ำ / ค่าไฟฟ้า</span>
              <strong className={styles.rowValue}>{financials.waterAndElectricity}</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}>ยอดค้างชำระ / ยังไม่จ่าย</span>
              <strong className={styles.rowValue} style={{ color: '#ef4444' }}>{financials.outstandingPayments}</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}>รายได้สุทธิหลังหักค่าใช้จ่าย</span>
              <strong className={styles.rowValue} style={{ color: '#10b981' }}>{financials.netIncome}</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}>อัตราการชำระเงิน</span>
              <strong className={styles.rowValue} style={{ color: '#10b981' }}>{businessHealth.collectionRate}%</strong>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.rowLabel}>สถานะบิล</span>
              <strong className={styles.rowValue}>อัปเดตอัตโนมัติ</strong>
            </div>
          </div>
        </article>
      </section>

      {/* Row 3: Activity Feed */}
      <section>
        <ActivityFeed items={activities} />
      </section>
    </div>
  );
};

export default DashboardPage;
