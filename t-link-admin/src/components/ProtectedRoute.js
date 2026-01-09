import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null); // null = กำลังตรวจสอบ, true = เป็นแอดมิน, false = ไม่ใช่
  const user = auth.currentUser;

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        // 🔍 ไปดึงข้อมูลจากคอลเลกชัน users โดยใช้ UID
        const userRef = doc(db, "users", user.uid); 
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, [user]);

  // ระหว่างรอโหลดข้อมูล
  if (isAdmin === null) return <div>กำลังตรวจสอบสิทธิ์... ⏳</div>;

  // ถ้าไม่ใช่แอดมิน ให้เด้งไปหน้า Login หรือหน้าแจ้งเตือน
  if (!isAdmin) {
    alert("ขออภัย เฉพาะแอดมินเท่านั้นที่เข้าถึงส่วนนี้ได้");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;