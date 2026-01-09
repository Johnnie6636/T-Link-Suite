import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // สำหรับ Error Handling
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin'); // เมื่อสำเร็จ ให้ Redirect ไปหน้าจัดการผู้ใช้
    } catch (err) {
      // ส่วนนี้คือ Error Handling ที่คุณต้องการ
      console.error(err.code);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่');
      }
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleLogin}>
        <h2>แอดมินเข้าสู่ระบบ</h2>
        {error && <p className="error-msg">{error}</p>}
        
        <div className="input-group">
          <label>อีเมลแอดมิน</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="input-group">
          <label>รหัสผ่าน</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="remember-row">
          <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
          <span>จดจำการเข้าสู่ระบบ</span>
        </div>

        <button type="submit" className="login-btn">เข้าสู่ระบบ</button>
      </form>
    </div>
  );
}

export default Login;