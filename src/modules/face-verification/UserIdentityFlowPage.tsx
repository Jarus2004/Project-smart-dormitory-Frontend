import { CheckCircle2, RotateCcw, ImageUp, Camera, CameraOff, AlertCircle } from 'lucide-react';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { registerFace } from '../../services/adminApi';
import UserPageHeader from '../../componants/userPage/components/UserPageHeader/UserPageHeader';

type CaptureStep = {
  key: string;
  label: string;
  detail: string;
  required: boolean;
};

const captureSteps: CaptureStep[] = [
  { key: 'front', label: 'หน้าตรง', detail: 'มองตรงมาที่กล้อง ระดับสายตา ไม่เอียงศีรษะ', required: true },
  { key: 'left', label: 'หันซ้าย', detail: 'เอียงหน้าไปทางซ้ายเล็กน้อย ประมาณ 30 องศา', required: true },
  { key: 'right', label: 'หันขวา', detail: 'เอียงหน้าไปทางขวาเล็กน้อย ประมาณ 30 องศา', required: true },
  { key: 'up', label: 'เงยหน้า', detail: 'เงยหน้าขึ้นเล็กน้อย ให้เห็นโครงคางชัดเจน', required: true },
  { key: 'down', label: 'ก้มหน้า', detail: 'ก้มหน้าลงเล็กน้อย ให้เห็นหน้าผากชัดเจน', required: true },
];

const UserIdentityFlowPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [captures, setCaptures] = useState<Record<string, { file: File; previewUrl: string }>>({});
  const capturesRef = useRef(captures);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const activeStep = captureSteps[currentStepIndex];

  // Stop the camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start the camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setError('');
    } catch {
      setError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องในเบราว์เซอร์');
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    capturesRef.current = captures;
  }, [captures]);

  useEffect(() => {
    const cameraStartTimer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    return () => {
      window.clearTimeout(cameraStartTimer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const isAllCaptured = useMemo(() => {
    return captureSteps.every((step) => Boolean(captures[step.key]));
  }, [captures]);

  const handleCleanUpPreviews = (record: Record<string, { file: File; previewUrl: string }>) => {
    Object.values(record).forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };

  const handleCapture = () => {
    if (!videoRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `face-${activeStep.key}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      setCaptures((prev) => {
        if (prev[activeStep.key]?.previewUrl) {
          URL.revokeObjectURL(prev[activeStep.key].previewUrl);
        }
        return {
          ...prev,
          [activeStep.key]: { file, previewUrl },
        };
      });

      // Advance to next uncaptured step
      const nextIndex = captureSteps.findIndex((step, idx) => idx > currentStepIndex && !capturesRef.current[step.key]);
      if (nextIndex !== -1) {
        setCurrentStepIndex(nextIndex);
      } else {
        const anyUncaptured = captureSteps.findIndex((step) => !capturesRef.current[step.key] && step.key !== activeStep.key);
        if (anyUncaptured !== -1) {
          setCurrentStepIndex(anyUncaptured);
        }
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCaptures((prev) => {
      if (prev[activeStep.key]?.previewUrl) {
        URL.revokeObjectURL(prev[activeStep.key].previewUrl);
      }
      return {
        ...prev,
        [activeStep.key]: { file, previewUrl },
      };
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetAll = () => {
    handleCleanUpPreviews(captures);
    setCaptures({});
    setCurrentStepIndex(0);
    setError('');
    setSubmitted(false);
    setSubmitting(false);
    void startCamera();
  };

  // Submit and handle complete or rollback on reject
  const handleSubmit = async () => {
    if (!user) {
      setError('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      return;
    }

    setSubmitting(true);
    setError('');
    setUploadProgress('กำลังเริ่มต้นบันทึกข้อมูลใบหน้า...');

    try {
      for (let i = 0; i < captureSteps.length; i++) {
        const step = captureSteps[i];
        const capture = captures[step.key];
        if (!capture) {
          throw new Error(`กรุณาถ่ายภาพมุม ${step.label} ให้ครบถ้วนก่อนส่งข้อมูล`);
        }

        setUploadProgress(`กำลังบันทึกภาพมุม ${step.label} (${i + 1}/${captureSteps.length})...`);
        const fd = new FormData(); fd.append('userId', String(user.id)); fd.append('file', capture.file); await registerFace(fd);
      }

      setUploadProgress('บันทึกข้อมูลใบหน้าสำเร็จ 5 มุมเรียบร้อย!');
      setSubmitted(true);
      stopCamera();

      // Automatically navigate back after success
      setTimeout(() => {
        navigate('/student');
      }, 1500);
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj.response?.data?.message || errorObj.message || 'บันทึกใบหน้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setError(msg);
      setSubmitting(false);
      setSubmitted(false);
      // Rollback: re-activate camera so user can capture or retry immediately
      void startCamera();
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 20px', display: 'grid', gap: 20 }}>
      <UserPageHeader onBack={stopCamera} />

      {/* Main Card */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            บันทึกใบหน้าสำหรับการเข้า-ออกหอพัก
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            กรุณาถ่ายภาพใบหน้าตามมุมที่กำหนดให้ครบทั้ง 5 มุม เพื่อความแม่นยำในการสแกน
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c', fontSize: '0.875rem', marginBottom: 16 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>บันทึกใบหน้าสำเร็จเรียบร้อย</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>ระบบกำลังนำท่านกลับสู่หน้าหลัก...</p>
          </div>
        ) : (
          <>
            {/* Step Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {captureSteps.map((step, idx) => {
                const isCaptured = Boolean(captures[step.key]);
                const isActive = idx === currentStepIndex;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 999,
                      border: isActive ? '2px solid #2563eb' : isCaptured ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                      background: isActive ? '#eff6ff' : isCaptured ? '#ecfdf5' : '#f8fafc',
                      color: isActive ? '#1d4ed8' : isCaptured ? '#059669' : '#64748b',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isCaptured ? <CheckCircle2 size={14} color="#059669" /> : <span>{idx + 1}.</span>}
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Camera View & Action */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 'min(100%, 420px)', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid #dbeafe', boxShadow: '0 0 0 2px #2563eb, 0 18px 36px rgba(37,99,235,0.16)' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted playsInline />

                {!isCameraActive && (
                  <div style={{ position: 'absolute', color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                    <CameraOff size={40} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>กล้องยังไม่ได้เริ่มทำงาน</p>
                  </div>
                )}

                {/* Instruction Tag */}
                <div style={{ position: 'absolute', top: 32, left: 24, right: 24, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)', padding: '8px 14px', borderRadius: 10, color: '#ffffff', textAlign: 'center', fontSize: '0.85rem' }}>
                  <strong>{activeStep.label}:</strong> {activeStep.detail}
                </div>
              </div>

              {/* Thumbnails Preview Panel */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>รูปภาพ 5 มุม</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
                  {captureSteps.map((step) => {
                    const capture = captures[step.key];
                    return (
                      <div
                        key={step.key}
                        onClick={() => {
                          const idx = captureSteps.findIndex((s) => s.key === step.key);
                          if (idx !== -1) setCurrentStepIndex(idx);
                        }}
                        style={{
                          borderRadius: 8,
                          overflow: 'hidden',
                          aspectRatio: '1/1',
                          background: '#f1f5f9',
                          border: step.key === activeStep.key ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                      >
                        {capture?.previewUrl ? (
                          <img src={capture.previewUrl} alt={step.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                            {step.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ImageUp size={14} /> อัปโหลดรูปแทน
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </div>
            </div>

            {/* Bottom Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={handleResetAll}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} /> ล้างและถ่ายใหม่ทั้งหมด
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!isCameraActive || submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: isCameraActive ? 'pointer' : 'not-allowed',
                    opacity: isCameraActive ? 1 : 0.6,
                  }}
                >
                  <Camera size={16} /> ถ่ายภาพมุม "{activeStep.label}"
                </button>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!isAllCaptured || submitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: isAllCaptured ? '#059669' : '#cbd5e1',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: isAllCaptured && !submitting ? 'pointer' : 'not-allowed',
                  }}
                >
                  {submitting ? uploadProgress : 'บันทึกใบหน้า (ครบ 5 มุม)'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserIdentityFlowPage;
