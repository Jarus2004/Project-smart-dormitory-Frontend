import { useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Users, UserCheck, Clock3, SearchCheck } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useDashboard } from '../../context/useDashboard';
import DataTable from '../../components/DataTable/DataTable';
import FilterDropdown from '../../components/FilterDropdown/FilterDropdown';
import SearchBar from '../../components/SearchBar/SearchBar';
import StatCard from '../../components/StatCard/StatCard';
import Badge from '../../components/Badge/Badge';
import StudentDocumentModal from '../../components/StudentDocumentModal/StudentDocumentModal';
import type { Student } from '../../types/student';
import styles from './StudentsPage.module.css';
import { deleteTenant, updateTenant } from '../../../../services/adminApi';

const studentStatusLabels = { Active: 'ใช้งานอยู่', Pending: 'รอดำเนินการ', Inactive: 'ไม่ใช้งาน' };

const getActionErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ (ADMIN)';
    }
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const StudentsPage = () => {
  const { students, loading, refetchTenants, updateStudentStatus } = useDashboard();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('All Buildings');

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesBuilding = buildingFilter === 'All Buildings' || student.building === buildingFilter;
      const matchesQuery = !query.trim() ||
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.room.toLowerCase().includes(query.toLowerCase()) ||
        student.email.toLowerCase().includes(query.toLowerCase()) ||
        student.contact.toLowerCase().includes(query.toLowerCase());
      return matchesBuilding && matchesQuery;
    });
  }, [buildingFilter, query, students]);

  const handleStatusChange = useCallback(async (studentId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      setUpdatingId(studentId);
      setActionError(null);
      await updateTenant(studentId, { status });
      updateStudentStatus(
        studentId,
        status === 'APPROVED' ? 'Active' : status === 'REJECTED' ? 'Inactive' : 'Pending',
      );
      await refetchTenants();
    } catch (error) {
      setActionError(getActionErrorMessage(error, 'ไม่สามารถอัปเดตสถานะผู้พักอาศัยได้'));
    } finally {
      setUpdatingId(null);
    }
  }, [refetchTenants, updateStudentStatus]);

  const handleView = useCallback((student: Student) => {
    setSelectedStudentId(student.id);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (student: Student) => {
    if (!window.confirm(`ยืนยันการลบข้อมูลผู้พักอาศัย ${student.name} หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้`)) return;

    try {
      setUpdatingId(student.id);
      setActionError(null);
      await deleteTenant(student.id);
      await refetchTenants();
      if (selectedStudentId === student.id) {
        setIsModalOpen(false);
        setSelectedStudentId(null);
      }
    } catch (error) {
      setActionError(getActionErrorMessage(error, 'ไม่สามารถลบข้อมูลผู้พักอาศัยได้'));
    } finally {
      setUpdatingId(null);
    }
  }, [refetchTenants, selectedStudentId]);

  const columns = useMemo<ColumnDef<Student, unknown>[]>(() => [
    {
      accessorKey: 'avatar',
      header: 'รูปโปรไฟล์',
      cell: ({ row }) => <span className={styles.avatarCell}>{row.original.avatar}</span>,
    },
    {
      accessorKey: 'name',
      header: 'ชื่อ-นามสกุล',
    },
    {
      accessorKey: 'id',
      header: 'รหัสผู้พัก',
    },
    {
      accessorKey: 'year',
      header: 'ชั้นปี / ระดับ',
    },
    {
      accessorKey: 'room',
      header: 'ห้องพัก',
    },
    {
      accessorKey: 'contact',
      header: 'เบอร์ติดต่อ',
    },
    {
      accessorKey: 'email',
      header: 'อีเมล',
    },
    {
      accessorKey: 'checkInDate',
      header: 'วันที่เข้าพัก',
    },
    {
      accessorKey: 'status',
      header: 'สถานะ',
      cell: ({ row }) => {
        const s = row.original.status;
        const tone = s === 'Active' ? 'success' : s === 'Pending' ? 'warning' : 'neutral';
        return <Badge tone={tone}>{studentStatusLabels[s] ?? s}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'การจัดการ',
      cell: ({ row }) => {
        const student = row.original;
        const isUpdating = updatingId === student.id;

        return (
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.viewButton}
              onClick={() => handleView(student)}
              title="ดูเอกสารและรายละเอียด"
            >
              ดูเอกสาร
            </button>
            {student.status === 'Pending' && (
              <>
                <button
                  type="button"
                  className={styles.approveButton}
                  onClick={() => void handleStatusChange(student.id, 'APPROVED')}
                  disabled={isUpdating}
                >
                  อนุมัติ
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={() => void handleStatusChange(student.id, 'REJECTED')}
                  disabled={isUpdating}
                >
                  ปฏิเสธ
                </button>
              </>
            )}
            {student.status === 'Active' && (
              <button
                type="button"
                className={styles.deactivateButton}
                onClick={() => void handleStatusChange(student.id, 'REJECTED')}
                disabled={isUpdating}
              >
                ระงับสิทธิ์
              </button>
            )}
            {student.status === 'Inactive' && (
              <button
                type="button"
                className={styles.approveButton}
                onClick={() => void handleStatusChange(student.id, 'APPROVED')}
                disabled={isUpdating}
              >
                เปิดใช้งาน
              </button>
            )}
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => void handleDelete(student)}
              disabled={isUpdating}
              title="ลบข้อมูล"
            >
              ลบ
            </button>
          </div>
        );
      },
    },
  ], [handleDelete, handleStatusChange, handleView, updatingId]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === 'Active').length;
    const pending = students.filter((s) => s.status === 'Pending').length;
    return { total, active, pending };
  }, [students]);

  const buildingOptions = useMemo(() => {
    const buildings = Array.from(new Set(students.map((s) => s.building).filter(Boolean)));
    return ['All Buildings', ...buildings];
  }, [students]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Tenant Management</p>
          <h1>จัดการข้อมูลนักศึกษาและผู้พักอาศัย</h1>
          <p>ตรวจสอบสถานะ อนุมัติคำขอเข้าพัก และจัดการเอกสารผู้พักอาศัยแบบเรียลไทม์</p>
        </div>
      </header>

      {actionError && (
        <div className={styles.errorAlert}>
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}>×</button>
        </div>
      )}

      <section className={styles.statsGrid}>
        <StatCard label="ผู้พักอาศัยทั้งหมด" value={String(stats.total)} icon={Users} />
        <StatCard label="กำลังพักอาศัย (Active)" value={String(stats.active)} icon={UserCheck} />
        <StatCard label="รออนุมัติคำขอ (Pending)" value={String(stats.pending)} icon={Clock3} />
        <StatCard label="อาคารที่เปิดให้บริการ" value={String(Math.max(1, buildingOptions.length - 1))} icon={SearchCheck} />
      </section>

      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="ค้นหาชื่อ, ห้อง, อีเมล, เบอร์ติดต่อ..."
          />
          <FilterDropdown
            value={buildingFilter}
            options={buildingOptions}
            onChange={setBuildingFilter}
          />
        </div>

        {loading ? (
          <div className={styles.loadingState}>กำลังโหลดข้อมูลผู้พักอาศัย...</div>
        ) : (
          <DataTable data={filteredStudents} columns={columns} />
        )}
      </section>

      {selectedStudentId && (
        <StudentDocumentModal
          tenantId={selectedStudentId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStudentId(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentsPage;
