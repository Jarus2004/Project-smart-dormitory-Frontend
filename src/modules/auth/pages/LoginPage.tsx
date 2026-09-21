import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/useAuth';
import { ArrowLeft, CheckCircle2, LogIn, Loader2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      role: string;
      username?: string;
      isOnline?: boolean;
    };
    token?: string;
  };
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'STUDENT' | 'ADMIN' | 'VISITOR';
}

const initialRegisterForm: RegisterForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'STUDENT',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setSuccess('');

    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });

      const { user } = response.data.data;
      login(user);

      if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else if (user.role === 'STUDENT') {
        navigate('/student');
      } else {
        setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'การเข้าสู่ระบบล้มเหลว กรุณาตรวจสอบข้อมูล'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        username: registerForm.username || undefined,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role,
      });
      setEmail(registerForm.email);
      setPassword('');
      setRegisterForm(initialRegisterForm);
      setSuccess('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
      setIsRegister(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูล'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (register: boolean) => {
    setIsRegister(register);
    setError('');
    setSuccess('');
  };

  const updateRegisterField = <K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) => {
    setRegisterForm((current) => ({ ...current, [field]: value }));
  };

  const renderField = (field: keyof RegisterForm, label: string, type = 'text', placeholder = '') => (
    <div className="input-group">
      <label htmlFor={`register-${field}`}>{label}</label>
      <input
        id={`register-${field}`}
        type={type}
        placeholder={placeholder}
        value={String(registerForm[field])}
        onChange={(e) => updateRegisterField(field, e.target.value)}
        className="input-field"
        required={field !== 'username'}
        disabled={isLoading}
      />
    </div>
  );

  return (
    <div className="full-screen-center">
      <div className={`auth-shell ${isRegister ? 'is-register' : ''}`}>
        <div className="auth-switcher" role="tablist" aria-label="เลือกประเภทการใช้งาน">
          <button type="button" className={!isRegister ? 'active' : ''} onClick={() => switchMode(false)} role="tab" aria-selected={!isRegister}>
            <LogIn size={17} /> เข้าสู่ระบบ
          </button>
          <button type="button" className={isRegister ? 'active' : ''} onClick={() => switchMode(true)} role="tab" aria-selected={isRegister}>
            <UserPlus size={17} /> สมัครสมาชิก
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-face auth-login-face">
            <div className="auth-header">
              <h1>MEEDEE DORMITORY</h1>
              <p>ยินดีต้อนรับสู่ หอพักมีดี</p>
            </div>

            {success && <div className="success-message"><CheckCircle2 size={18} />{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">อีเมล (Email Address)</label>
            <input
              id="email"
              type="email"
              placeholder="admin@smart-dormitory.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">รหัสผ่าน (Password)</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              disabled={isLoading}
            />
              </div>

              <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="lucide-spin" />
                กำลังตรวจสอบข้อมูล...
              </>
            ) : (
              <>
                <LogIn size={18} />
                เข้าสู่ระบบ
              </>
            )}
              </button>
            </form>
            <button type="button" className="text-action" onClick={() => switchMode(true)}>ยังไม่มีบัญชี? สมัครสมาชิก</button>
          </div>

          <div className="auth-face auth-register-face">
            <div className="auth-header register-header">
              <button type="button" className="back-action" onClick={() => switchMode(false)}><ArrowLeft size={17} /> กลับเข้าสู่ระบบ</button>
              <span className="auth-kicker">JOIN THE COMMUNITY</span>
              <h1>สร้างบัญชีใหม่</h1>
              <p>กรอกข้อมูลเพื่อเริ่มต้นใช้งาน MEEDEE Dormitory</p>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleRegister} className="auth-form register-form">
              <div className="form-grid">
                {renderField('username', 'ชื่อผู้ใช้', 'text', 'ชื่อผู้ใช้ของคุณ')}
                {renderField('email', 'อีเมล *', 'email', 'name@example.com')}
              </div>
              <div className="form-grid">
                {renderField('password', 'รหัสผ่าน *', 'password', 'อย่างน้อย 8 ตัวอักษร')}
                {renderField('confirmPassword', 'ยืนยันรหัสผ่าน *', 'password', 'กรอกรหัสผ่านอีกครั้ง')}
              </div>
              <div className="input-group">
                <label htmlFor="register-role">สมัครในฐานะ *</label>
                <select id="register-role" className="input-field" value={registerForm.role} onChange={(e) => updateRegisterField('role', e.target.value as RegisterForm['role'])} disabled={isLoading}>
                  <option value="STUDENT">นักศึกษา</option>
                  <option value="ADMIN">เจ้าหน้าที่</option>
                </select>
              </div>
              <label className="terms-check"><input type="checkbox" required disabled={isLoading} /> ฉันยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว</label>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? <><Loader2 size={18} className="lucide-spin" /> กำลังสร้างบัญชี...</> : <><UserPlus size={18} /> สร้างบัญชี</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
