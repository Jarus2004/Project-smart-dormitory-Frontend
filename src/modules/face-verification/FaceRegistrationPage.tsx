import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Camera, CheckCircle2, ImagePlus, Loader2, UserRound, AlertCircle } from 'lucide-react';
import { registerFace } from '../../services/adminApi';

type RegistrationResponse = {
  statusCode: number;
  message: string;
  data: {
    id: number;
    user_id: number;
    model_name: string;
    embedding_version: string;
    created_at: string;
    updated_at: string;
  };
};

const FaceRegistrationPage = () => {
  const [userId, setUserId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const isValidUserId = useMemo(() => Number.isInteger(Number(userId)) && Number(userId) > 0, [userId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError('');
    setSuccess('');

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('กรุณาเลือกไฟล์รูปภาพก่อนบันทึกใบหน้า');
      return;
    }

    if (!isValidUserId) {
      setError('กรุณากรอก User ID เป็นตัวเลขที่ถูกต้อง');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('file', selectedFile);

      const response = await registerFace(formData);
      const payload = response.data as RegistrationResponse;

      setSuccess(payload.message || 'บันทึกใบหน้าเรียบร้อยแล้ว');
      setUserId('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const message = errorObj?.response?.data?.message || 'บันทึกใบหน้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 860, margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
          border: '1px solid #dbeafe',
          borderRadius: 20,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#2563eb',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <Camera size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: 1.2, color: '#2563eb', fontWeight: 700 }}>FACE ENROLLMENT</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 30 }}>บันทึกใบหน้าผู้พักอาศัย</h2>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 20,
          padding: 24,
          display: 'grid',
          gap: 24,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          <label style={{ display: 'grid', gap: 8, fontWeight: 600, color: '#1f2937' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserRound size={16} />
              User ID
            </span>
            <input
              type="number"
              min={1}
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="เช่น 99"
              style={{
                border: `1px solid ${isValidUserId || !userId ? '#d1d5db' : '#ef4444'}`,
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 15,
                outline: 'none',
                background: '#fff',
              }}
            />
          </label>
        </div>

        <div
          style={{
            border: '2px dashed #bfdbfe',
            borderRadius: 18,
            background: '#f8fbff',
            padding: 18,
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1d4ed8', fontWeight: 700 }}>
            <ImagePlus size={18} />
            เลือกรูปภาพใบหน้า
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{
              border: '1px solid #dbeafe',
              borderRadius: 12,
              padding: '12px 14px',
              background: '#fff',
            }}
          />

          {selectedFile && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 14, color: '#475569' }}>ไฟล์ที่เลือก: {selectedFile.name}</div>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="face preview"
                  style={{
                    width: '100%',
                    maxWidth: 360,
                    height: 240,
                    objectFit: 'cover',
                    borderRadius: 14,
                    border: '1px solid #dbeafe',
                    background: '#eef2ff',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: 12,
              padding: '12px 14px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#ecfdf5',
              border: '1px solid #bbf7d0',
              color: '#166534',
              borderRadius: 12,
              padding: '12px 14px',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            border: 'none',
            borderRadius: 12,
            padding: '14px 18px',
            background: isSubmitting ? '#93c5fd' : '#2563eb',
            color: '#fff',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              กำลังบันทึกใบหน้า...
            </>
          ) : (
            'บันทึกใบหน้า'
          )}
        </button>
      </form>
    </div>
  );
};

export default FaceRegistrationPage;
