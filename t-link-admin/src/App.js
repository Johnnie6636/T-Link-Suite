import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 1. หน้าแรกของเว็บให้แสดง Login 🔐 */}
          <Route path="/" element={<Login />} />

          {/* 2. นำ ProtectedRoute มาหุ้ม UserManagement ไว้ 🔐 */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } 
          />

          {/* 3. ถ้าพิมพ์ URL มั่ว ให้ส่งกลับไปหน้า Login ↩️ */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;