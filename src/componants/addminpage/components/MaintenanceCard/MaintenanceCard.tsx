import { useState, useEffect, useRef } from 'react';
import { Trash2, X } from 'lucide-react';
import styles from './MaintenanceCard.module.css';
import type { MaintenanceRequest } from '../../types/maintenance';
import { deleteMaintenanceTicket, updateMaintenanceStatus } from '../../../../services/adminApi';
import { useDashboard } from '../../context/useDashboard';

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  compact?: boolean;
  onViewed?: () => void;
}

const statusClassName = (status: MaintenanceRequest['status']) => {
  switch (status) {
    case 'Pending':
      return styles.pending;
    case 'In Progress':
      return styles.inProgress;
    default:
      return styles.completed;
  }
};

interface ExtendedCSSProperties extends React.CSSProperties {
  WebkitUserDrag?: 'none' | 'auto' | 'element' | 'inherit' | 'initial' | 'revert' | 'unset';
}

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const getRequestErrorMessage = (err: unknown, fallback: string) => {
  const errorObj = err as AxiosErrorResponse | undefined;
  const status = errorObj?.response?.status;
  const message = errorObj?.response?.data?.message || errorObj?.message || fallback;
  return status ? `${fallback} (${status}): ${message}` : message;
};

const MaintenanceCard = ({ request, compact = false, onViewed }: MaintenanceCardProps) => {
  const { refetchMaintenance } = useDashboard();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when Lightbox is active
  useEffect(() => {
    if (zoomImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoomImage]);

  // Bind active (non-passive) wheel and touchmove events to prevent background double scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const newScale = Math.min(4, Math.max(1, scale - e.deltaY * 0.003));
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleTouchMoveEvent = (e: TouchEvent) => {
      if (scale > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    wrapper.addEventListener('wheel', handleWheelEvent, { passive: false });
    wrapper.addEventListener('touchmove', handleTouchMoveEvent, { passive: false });

    return () => {
      wrapper.removeEventListener('wheel', handleWheelEvent);
      wrapper.removeEventListener('touchmove', handleTouchMoveEvent);
    };
  }, [zoomImage, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setHasDragged(false); // Reset drag indicator
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Check if mouse actually moved beyond a small click threshold (e.g. 5 pixels)
    const currentX = e.clientX - dragStart.x;
    const currentY = e.clientY - dragStart.y;
    const deltaX = Math.abs(currentX - position.x);
    const deltaY = Math.abs(currentY - position.y);
    if (deltaX > 5 || deltaY > 5) {
      setHasDragged(true);
    }

    setPosition({
      x: currentX,
      y: currentY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setHasDragged(false); // Reset drag indicator
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    
    const currentX = touch.clientX - dragStart.x;
    const currentY = touch.clientY - dragStart.y;
    const deltaX = Math.abs(currentX - position.x);
    const deltaY = Math.abs(currentY - position.y);
    if (deltaX > 5 || deltaY > 5) {
      setHasDragged(true);
    }

    setPosition({
      x: currentX,
      y: currentY
    });
  };


  const handleCloseLightbox = () => {
    setZoomImage(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setHasDragged(false);
  };

  const handleTransition = async (nextStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setUpdating(true);
      setError(null);
      await updateMaintenanceStatus(request.id, nextStatus);
      await refetchMaintenance();
    } catch (err) {
      setError(getRequestErrorMessage(err, 'Failed to update status'));
    } finally {
      setUpdating(false);
    }
  };

  const openDetails = () => {
    onViewed?.();
    setShowDetails(true);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const confirmed = window.confirm(`ลบรายการแจ้งซ่อม "${request.title}" หรือไม่?`);
    if (!confirmed) return;

    try {
      setUpdating(true);
      setError(null);
      await deleteMaintenanceTicket(request.id);
      setShowDetails(false);
      await refetchMaintenance();
    } catch (err) {
      setError(getRequestErrorMessage(err, 'Failed to delete maintenance request'));
    } finally {
      setUpdating(false);
    }
  };

  const renderActions = (isModal = false) => {
    const raw = String(request.rawStatus || '').toUpperCase();
    
    const revertTargets: Record<string, { label: string; status: string }> = {
      APPROVED:    { label: '↩️ ย้อนการอนุมัติ', status: 'PENDING' },
      IN_PROGRESS: { label: '↩️ ย้อนเป็นเพิ่งอนุมัติ', status: 'APPROVED' },
      RESOLVED:    { label: '↩️ ย้อนกลับไปดำเนินการ', status: 'IN_PROGRESS' },
      CLOSED:      { label: '↩️ เปิดใบแจ้งซ่อมใหม่', status: 'RESOLVED' },
      CANCELLED:   { label: '↩️ กู้คืนรายการ', status: 'PENDING' },
    };

    const revertInfo = revertTargets[raw];

    return (
      <div className={isModal ? styles.modalActions : styles.actions} onClick={e => e.stopPropagation()}>
        {revertInfo && (
          <button className={styles.actionBtnRevert} onClick={(e) => handleTransition(revertInfo.status, e)} disabled={updating}>
            {revertInfo.label}
          </button>
        )}

        {raw === 'PENDING' && (
          <>
            <button className={styles.actionBtnApprove} onClick={(e) => handleTransition('APPROVED', e)} disabled={updating}>
              ✅ อนุมัติคำขอ
            </button>
            <button className={styles.actionBtnCancel} onClick={(e) => handleTransition('CANCELLED', e)} disabled={updating}>
              ❌ ยกเลิกคำขอ
            </button>
          </>
        )}
        
        {raw === 'APPROVED' && (
          <>
            <button className={styles.actionBtnProgress} onClick={(e) => handleTransition('IN_PROGRESS', e)} disabled={updating}>
              ⚙️ เริ่มดำเนินการ
            </button>
            <button className={styles.actionBtnCancel} onClick={(e) => handleTransition('CANCELLED', e)} disabled={updating}>
              ❌ ยกเลิกคำขอ
            </button>
          </>
        )}

        {raw === 'IN_PROGRESS' && (
          <>
            <button className={styles.actionBtnSuccess} onClick={(e) => handleTransition('RESOLVED', e)} disabled={updating}>
              🛠️ แก้ไขเสร็จสิ้น
            </button>
            <button className={styles.actionBtnCancel} onClick={(e) => handleTransition('CANCELLED', e)} disabled={updating}>
              ❌ ยกเลิกคำขอ
            </button>
          </>
        )}

        {raw === 'RESOLVED' && (
          <button className={styles.actionBtnClose} onClick={(e) => handleTransition('CLOSED', e)} disabled={updating}>
            🔒 ปิดใบแจ้งซ่อม
          </button>
        )}

        <button className={styles.actionBtnDelete} onClick={(e) => handleDelete(e)} disabled={updating} title="ลบรายการแจ้งซ่อม">
          <Trash2 size={14} /> ลบ
        </button>
      </div>
    );
  };

  // Split description back to Issue / Description if split by ' — '
  const desc = request.description || '';
  const hasDelimiter = desc.includes(' — ');
  const issueText = hasDelimiter ? desc.split(' — ')[0] : desc;
  const detailText = hasDelimiter ? desc.split(' — ').slice(1).join(' — ') : '';
  const statusText = request.status === 'Pending' ? '🟡 รอดำเนินการ' :
    request.status === 'In Progress' ? '🔵 กำลังดำเนินการ' :
    request.status === 'Completed' ? '🟢 เสร็จสิ้น' : '🔴 ยกเลิก';
  const statusBadge = (
    <span className={`${styles.badge} ${statusClassName(request.status)}`}>
      {statusText}
      {request.rawStatus && ` (${request.rawStatus})`}
    </span>
  );

  return (
    <>
      {compact ? (
        <article className={styles.compactCard} onClick={openDetails}>
          <div className={styles.compactMain}>
            <div className={styles.compactDate}>{request.submittedAt}</div>
            <div className={styles.compactText}>
              <strong>{request.title}</strong>
              <span>{issueText || '-'}</span>
            </div>
          </div>
          <div className={styles.compactMeta}>
            <span>{request.contactTime && request.contactTime !== '-' ? request.contactTime : 'ไม่ระบุเวลาเข้าซ่อม'}</span>
            {statusBadge}
          </div>
          {error && <div className={styles.errorText} onClick={e => e.stopPropagation()}>⚠️ {error}</div>}
          {renderActions(false)}
        </article>
      ) : (
      <article className={styles.card} onClick={openDetails} style={{ cursor: 'pointer' }}>
        <div className={styles.header}>
          <div>
            <p className={styles.title}>{request.title}</p>
            <p className={styles.description}>{issueText}</p>
          </div>
          {statusBadge}
        </div>
        
        <div className={styles.grid}>
          <div>
            <p className={styles.label}>นักศึกษา</p>
            <p className={styles.value}>{request.studentName}</p>
          </div>
          <div>
            <p className={styles.label}>ห้องพัก</p>
            <p className={styles.value}>{request.roomNumber}</p>
          </div>
          <div>
            <p className={styles.label}>วันที่ส่งเรื่อง</p>
            <p className={styles.value}>{request.submittedAt}</p>
          </div>
          <div>
            <p className={styles.label}>ผู้รับผิดชอบ</p>
            <p className={styles.value}>{request.assignedStaff}</p>
          </div>
        </div>

        {request.contactTime && request.contactTime !== '-' && (
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>📅 วันเวลาที่สะดวกให้ช่างเข้า:</span>
            <span className={styles.contactValue}>{request.contactTime}</span>
          </div>
        )}

        {error && <div className={styles.errorText} onClick={e => e.stopPropagation()}>⚠️ {error}</div>}
        
        {renderActions(false)}
      </article>
      )}

      {/* Details Pop-up Modal */}
      {showDetails && (
        <div className={styles.overlay} onClick={() => setShowDetails(false)}>
          <div className={styles.popModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popHeader}>
              <h3 className={styles.popTitle}>🔍 รายละเอียดคำขอแจ้งซ่อมบำรุง</h3>
              <button onClick={() => setShowDetails(false)} className={styles.popCloseBtn}><X size={18} /></button>
            </div>

            <div className={styles.popBody}>
              <div className={styles.popRow}>
                <div className={styles.popField}>
                  <label className={styles.popLabel}>ประเภทปัญหา</label>
                  <span className={styles.popValue}>{request.title}</span>
                </div>
                <div className={styles.popField}>
                  <label className={styles.popLabel}>หมายเลขห้อง</label>
                  <span className={styles.popValue}>ห้อง {request.roomNumber}</span>
                </div>
              </div>

              <div className={styles.popRow}>
                <div className={styles.popField}>
                  <label className={styles.popLabel}>ผู้แจ้ง (นักศึกษา)</label>
                  <span className={[styles.popValue, styles.highlightText].join(' ')}>{request.studentName}</span>
                </div>
                <div className={styles.popField}>
                  <label className={styles.popLabel}>วันที่ส่งเรื่อง</label>
                  <span className={styles.popValue}>{request.submittedAt}</span>
                </div>
              </div>

              <div className={styles.popFieldFull}>
                <label className={styles.popLabel}>หัวข้อปัญหา (Issue)</label>
                <span className={styles.popDescTitle}>{issueText || '-'}</span>
              </div>

              <div className={styles.popFieldFull}>
                <label className={styles.popLabel}>รายละเอียดเพิ่มเติม (Description)</label>
                <p className={styles.popDescBody}>{detailText || '-'}</p>
              </div>

              {request.imageUrl && (
                <div className={styles.popFieldFull}>
                  <label className={styles.popLabel}>📷 รูปภาพอาการชำรุดที่ส่งมา</label>
                  <div className={styles.popImageContainer} onClick={(e) => { e.stopPropagation(); setZoomImage(true); }}>
                    <img
                      src={request.imageUrl}
                      alt="รูปอาการชำรุด"
                      className={styles.popImage}
                      title="คลิกเพื่อขยายภาพ"
                    />
                    <div className={styles.popImageHint}>🔍 คลิกเพื่อขยาย</div>
                  </div>
                </div>
              )}

              <div className={styles.popFieldFull}>
                <label className={styles.popLabel}>วันเวลาที่สะดวกให้ช่างมาดำเนินการ</label>
                <div className={styles.popTimeBox}>
                  📅 {request.contactTime && request.contactTime !== '-' ? request.contactTime : 'ไม่ได้ระบุ'}
                </div>
              </div>

              <div className={styles.popFieldFull}>
                <label className={styles.popLabel}>สถานะปัจจุบัน</label>
                <div style={{ marginTop: '4px' }}>
                  <span className={`${styles.badge} ${statusClassName(request.status)}`}>
                    {request.status === 'Pending' ? '🟡 รอดำเนินการ' :
                     request.status === 'In Progress' ? '🔵 กำลังดำเนินการ' :
                     request.status === 'Completed' ? '🟢 เสร็จสิ้น' : '🔴 ยกเลิก'} 
                     {request.rawStatus && ` (${request.rawStatus})`}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.popFooter}>
              <div className={styles.popFooterActions}>
                {renderActions(true)}
              </div>
              <button className={styles.popBtnClose} onClick={() => setShowDetails(false)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox — rendered OUTSIDE modal so position:fixed is not trapped by transform */}
      {zoomImage && request.imageUrl && (
        <div 
          className={`${styles.lightboxOverlay} ${scale > 1 ? styles.isZoomed : ''}`} 
          onClick={handleCloseLightbox}
        >
          <div 
            className={styles.lightboxBox} 
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <button 
              className={styles.lightboxClose} 
              onClick={handleCloseLightbox}
              title="ปิด"
            >
              <X size={22} />
            </button>
            <div 
              ref={wrapperRef}
              className={styles.lightboxImgWrapper}
              style={{ overflow: 'hidden', cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
              <img 
                src={request.imageUrl} 
                alt="รูปอาการชำรุด (ขยาย)" 
                className={styles.lightboxImg} 
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasDragged) return;
                  if (scale > 1) {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  } else {
                    setScale(2.2);
                  }
                }}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                } as ExtendedCSSProperties}
                title={scale > 1 ? "คลิกเพื่อย่อรูปภาพ หรือคลิกภาพแล้วลากเพื่อเลื่อนดูส่วนต่าง ๆ" : "คลิกเพื่อขยายด่วน หรือใช้ตัวปรับระดับสไลเดอร์ด้านล่าง"}
              />
            </div>
            
            {/* Control Bar */}
            <div className={styles.zoomControlBar} onClick={(e) => e.stopPropagation()}>
              <button 
                className={styles.zoomBtn} 
                onClick={() => {
                  const s = Math.max(1, scale - 0.25);
                  setScale(s);
                  if (s === 1) setPosition({ x: 0, y: 0 });
                }}
                disabled={scale <= 1}
              >
                -
              </button>
              <input 
                type="range" 
                min="1" 
                max="4" 
                step="0.05" 
                value={scale} 
                className={styles.zoomRange}
                onChange={(e) => {
                  const s = parseFloat(e.target.value);
                  setScale(s);
                  if (s === 1) setPosition({ x: 0, y: 0 });
                }} 
              />
              <button 
                className={styles.zoomBtn} 
                onClick={() => setScale(Math.min(4, scale + 0.25))}
                disabled={scale >= 4}
              >
                +
              </button>
              <span className={styles.zoomText}>{Math.round(((scale - 1) / 3) * 100)}%</span>
              
              {(scale > 1 || position.x !== 0 || position.y !== 0) && (
                <button 
                  className={styles.resetBtn} 
                  onClick={() => {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                >
                  รีเซ็ต
                </button>
              )}
            </div>
            
            <div className={styles.zoomHint}>
              💡 ใช้เมาส์หมุน Scroll หรือคลิกเมาส์ลาก (Drag to pan) รูปภาพเพื่อเลื่อนสำรวจรายละเอียดได้
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenanceCard;
