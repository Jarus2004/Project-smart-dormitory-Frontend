import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, ImageUp, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { verifyFaceImage } from '../../services/adminApi';

type FaceVerificationResult = {
  matched: boolean;
  user_id: number | null;
  similarity: number;
  processing_time_ms: number;
  message: string;
};

type ApiEnvelope = {
  statusCode: number;
  message: string;
  data: FaceVerificationResult;
};

const FaceVerificationPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<FaceVerificationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraReady(true);
    } catch {
      setError('ไม่สามารถเปิดกล้องได้ กรุณาอัปโหลดรูปภาพแทน');
      setIsCameraReady(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraReady(true);
      } catch {
        if (mounted) {
          setError('ไม่สามารถเปิดกล้องได้ กรุณาอัปโหลดรูปภาพแทน');
          setIsCameraReady(false);
        }
      }
    };

    void initCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError('');
    setResult(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video) {
      setError('กล้องยังไม่พร้อมใช้งาน');
      return;
    }

    setIsCapturing(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas not available');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Unable to capture image'));
          }
        }, 'image/jpeg', 0.92);
      });

      const file = new File([blob], 'capture-face.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setIsCapturing(false);
    } catch {
      setIsCapturing(false);
      setError('จับภาพจากกล้องไม่สำเร็จ กรุณาลองใหม่หรือใช้การอัปโหลดรูปภาพ');
    }
  };

  const submitVerification = async (event?: FormEvent) => {
    event?.preventDefault();

    if (!selectedFile) {
      setError('กรุณาเลือกภาพหรือถ่ายภาพจากกล้องก่อน');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('threshold', '0.65');

      const response = await verifyFaceImage(formData);
      const payload = response.data as ApiEnvelope;
      setResult(payload.data);
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const message = errorObj?.response?.data?.message || 'การยืนยันใบหน้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 980, margin: '0 auto' }}>
      <header style={{ maxWidth: 1040, width: '100%', margin: '0 auto', padding: '20px 24px 8px', display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => navigate('/student')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)', transition: 'all 0.2s ease' }}
        >
          <ArrowLeft size={16} /> กลับหน้าหลัก
        </button>
      </header>
      <div style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #f8fafc 100%)', border: '1px solid #a5f3fc', borderRadius: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: '#0f766e', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <p style={{ margin: 0, letterSpacing: 1.2, fontSize: 12, color: '#0f766e', fontWeight: 700 }}>FACE VERIFICATION</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 30 }}>ยืนยันใบหน้าผู้พักอาศัย</h2>
          </div>
        </div>
      </div>

      <form onSubmit={submitVerification} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 24, display: 'grid', gap: 24, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 20 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 18, background: '#f8fafc', padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>กล้อง</strong>
              <span style={{ fontSize: 12, color: isCameraReady ? '#166534' : '#b45309', background: isCameraReady ? '#ecfdf5' : '#fff7ed', borderRadius: 999, padding: '4px 8px', border: `1px solid ${isCameraReady ? '#bbf7d0' : '#fed7aa'}` }}>
                {isCameraReady ? 'พร้อมใช้งาน' : 'ไม่พร้อม'}
              </span>
            </div>

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 12, background: '#0f172a' }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={captureFromCamera} disabled={isCapturing || !isCameraReady} style={{ border: 'none', borderRadius: 10, background: '#0f766e', color: '#fff', padding: '10px 14px', fontWeight: 700, cursor: isCapturing || !isCameraReady ? 'not-allowed' : 'pointer', opacity: isCapturing || !isCameraReady ? 0.6 : 1 }}>
                {isCapturing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> กำลังจับภาพ</> : 'ถ่ายภาพจากกล้อง'}
              </button>
              <button type="button" onClick={startCamera} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}>
                รีเฟรชกล้อง
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 18, background: '#f8fafc', padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>อัปโหลดรูปภาพ</strong>
              <ImageUp size={18} color="#2563eb" />
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ border: '1px solid #dbeafe', borderRadius: 12, padding: '12px 14px', width: '100%', background: '#fff' }}
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt="verification preview"
                style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 12, border: '1px solid #dbeafe', marginTop: 12 }}
              />
            )}
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: '#b91c1c' }}>
            <TriangleAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={isSubmitting || !selectedFile} style={{ border: 'none', borderRadius: 12, padding: '14px 18px', background: isSubmitting || !selectedFile ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: isSubmitting || !selectedFile ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              กำลังยืนยันใบหน้า...
            </>
          ) : (
            'ยืนยันใบหน้า'
          )}
        </button>

        {result && (
          <div style={{ border: '1px solid #bbf7d0', background: result.matched ? '#ecfdf5' : '#fff7ed', borderRadius: 16, padding: 18, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: result.matched ? '#166534' : '#9a5b00' }}>
              {result.matched ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
              {result.matched ? 'ใบหน้าตรงกัน' : 'ใบหน้าไม่ตรงกับข้อมูลที่ลงทะเบียน'}
            </div>

            <div style={{ color: '#334155' }}>
              <div>ความคล้ายคลึง: {result.similarity.toFixed(2)}</div>
              <div>เวลา: {result.processing_time_ms} ms</div>
              <div>ข้อความ: {result.message}</div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FaceVerificationPage;
