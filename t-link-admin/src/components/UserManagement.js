import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import '../styles/UserManagement.css'; // ตรวจสอบว่า Path ถูกต้องตามโครงสร้างโฟลเดอร์

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState(""); // เก็บคำค้นหา ⌨️
  const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบัน 📍
  const usersPerPage = 20; // จำนวนรายชื่อต่อหน้า 📄

  // แปลงตัวเลขเป็นชื่อระดับสมาชิก
  const getMemberLevelName = (level) => {
    const levels = {
      1: "Bronze 🥉",
      2: "Silver 🥈",
      3: "Gold 🥇",
      4: "Platinum 💿",
      5: "Diamond 💎",
      6: "Crown / VIP 👑"
    };
    return levels[level] || "ทั่วไป";
  };

  // เปิด Modal แก้ไข
  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  // บันทึกข้อมูลธนาคารและระดับสมาชิก
  const handleSaveAll = async () => {
    try {
      // 1. อัปเดตที่ wallets (ธนาคาร, ระดับ, และอัปเดตชื่อแฝงในนี้ด้วย)
      const walletRef = doc(db, "wallets", editingUser.uid);
      await updateDoc(walletRef, {
        accountName: editingUser.accountName || "",
        bankName: editingUser.bankName || "",
        accountNumber: editingUser.accountNumber || "",
        memberLevel: Number(editingUser.memberLevel),
        displayName: editingUser.displayName || "",
        creditScore: Number(editingUser.creditScore)
      });

      // 2. อัปเดตที่ users (ข้อมูลหลักของผู้ใช้)
      const userRef = doc(db, "users", editingUser.uid);
      await updateDoc(userRef, {
        displayName: editingUser.displayName || ""
      });

      alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // ระบบบวก/ลบเงิน (ใช้ increment เพื่อความแม่นยำ)
  const handleUpdateBalance = async (uid, amount, type) => {
    if (!amount || isNaN(amount)) return alert("กรุณาระบุจำนวนเงินเป็นตัวเลข");
    
    const adjustment = type === 'add' ? Number(amount) : -Number(amount);
    try {
      const walletRef = doc(db, "wallets", uid);
      await updateDoc(walletRef, {
        balance: increment(adjustment)
      });
      alert("ปรับปรุงยอดเงินเรียบร้อยแล้ว!");
      // อัปเดตยอดเงินใน Modal ทันทีเพื่อให้เห็นผล
      setEditingUser(prev => ({ ...prev, balance: prev.balance + adjustment }));
    } catch (error) {
      console.error("Error updating balance: ", error);
    }
  };

  // ระงับการใช้งาน
  const handleBan = async (uid, currentStatus) => {
    try {
      const walletRef = doc(db, "wallets", uid);
      await updateDoc(walletRef, {
        isBanned: !currentStatus
      });
      alert("อัปเดตสถานะเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error updating ban status: ", error);
    }
  };

  // --- 3. ดึงข้อมูลจาก Firebase (Real-time) ---
useEffect(() => {
    let usersData = [];
    let walletsData = {};
    // ฟังก์ชันสำหรับรวมข้อมูลและอัปเดต State
    const combineAndSetData = () => {
      const combined = usersData.map(user => ({
        ...user,
        ...(walletsData[user.uid] || {})
      }));
      setUsers(combined);
    };
    // Snapshot 1: ติดตามการเปลี่ยนแปลงในคอลเลกชัน users 👤
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      combineAndSetData();
    });
    // Snapshot 2: ติดตามการเปลี่ยนแปลงในคอลเลกชัน wallets 💰
    const unsubWallets = onSnapshot(collection(db, "wallets"), (snapshot) => {
      const dataMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // ใช้ uid จากข้อมูลข้างใน หรือ doc.id ตามโครงสร้าง DB ของคุณ
        const uid = data.uid || doc.id; 
        dataMap[uid] = data;
      });
      walletsData = dataMap;
      combineAndSetData();
    });
    return () => {
      unsubUsers();
      unsubWallets();
    };
  }, []);

  const filteredUsers = users.filter(user => {
    const s = searchTerm.toLowerCase();
    return (
      user.phoneNumber?.toLowerCase().includes(s) ||
      user.displayId?.toString().includes(s) ||
      user.displayName?.toLowerCase().includes(s) ||
      user.accountName?.toLowerCase().includes(s) ||
      user.accountNumber?.toLowerCase().includes(s)
    );
  });
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // --- 4. ส่วนแสดงผล UI ---
  return (
    <div className="admin-container">
      <h2>จัดการผู้ใช้ทั้งหมด 👥</h2>
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="ค้นหาเบอร์, ID, ชื่อ, เลขบัญชี..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // รีเซ็ตไปหน้า 1 เสมอเมื่อเริ่มค้นหาใหม่
          }}
        />
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>เบอร์โทรศัพท์</th>
              <th>ID (6 หลัก)</th>
              <th>ชื่อแสดงผล</th>
              <th>ระดับสมาชิก</th>
              <th>ยอดเงินคงเหลือ</th>
              <th>คะแนนเครดิต</th>
              <th>ข้อมูลบัญชี</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={user.uid}>
                <td>{indexOfFirstUser + index + 1}</td>
                <td>{user.phoneNumber}</td>
                <td>{user.displayId}</td>
                <td>{user.displayName || "ไม่มีชื่อ"}</td>
                <td>{getMemberLevelName(user.memberLevel)}</td>
                <td>{user.balance?.toLocaleString()} บาท</td>
                <td>{user.creditScore}</td>
                <td className="account-info">
                  {user.accountName}<br/>
                  {user.bankName}<br/>
                  {user.accountNumber}
                </td>
                <td>
                  <button onClick={() => handleEdit(user)}>แก้ไข</button>
                  <button onClick={() => handleBan(user.uid, user.isBanned)}>
                    {user.isBanned ? "ปลดระงับ" : "ระงับ"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          ก่อนหน้า
        </button>
        <span>หน้า {currentPage} จาก {totalPages}</span>
        <button 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          ถัดไป
        </button>
      </div>

      {/* Modal แก้ไขข้อมูล */}
      {editingUser && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>แก้ไขผู้ใช้: <span>{editingUser.displayName}</span> 📝</h2>
        <button className="close-icon" onClick={() => setEditingUser(null)}>&times;</button>
      </div>
      
      <div className="modal-body">
        {/* กลุ่มที่ 1: การเงิน */}
        <div className="settings-group">
          <h3><i className="emoji">💰</i> จัดการยอดเงิน</h3>
          <p className="current-stat">ยอดปัจจุบัน: <strong>{editingUser.balance?.toLocaleString()} บาท</strong></p>
          <div className="balance-control">
            <input type="number" placeholder="0.00" id="amountInput" />
            <div className="btn-row">
              <button className="btn-add" onClick={() => handleUpdateBalance(editingUser.uid, document.getElementById('amountInput').value, 'add')}>เพิ่มเงิน</button>
              <button className="btn-sub" onClick={() => handleUpdateBalance(editingUser.uid, document.getElementById('amountInput').value, 'subtract')}>หักเงิน</button>
            </div>
          </div>
        </div>

        {/* กลุ่มที่ 2: ข้อมูลทั่วไป */}
        <div className="settings-group">
          <h3><i className="emoji">👤</i> ข้อมูลทั่วไป & ธนาคาร</h3>
          <div className="grid-inputs">
            <div className="input-box">
              <label>ชื่อแสดงผล</label>
              <input type="text" value={editingUser.displayName || ''} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} />
            </div>
            <div className="input-box">
              <label>ธนาคาร</label>
              <input type="text" value={editingUser.bankName || ''} onChange={(e) => setEditingUser({...editingUser, bankName: e.target.value})} />
            </div>
            <div className="input-box">
              <label>ชื่อบัญชี</label>
              <input type="text" value={editingUser.accountName || ''} onChange={(e) => setEditingUser({...editingUser, accountName: e.target.value})} />
            </div>
            <div className="input-box">
              <label>เลขที่บัญชี</label>
              <input type="text" value={editingUser.accountNumber || ''} onChange={(e) => setEditingUser({...editingUser, accountNumber: e.target.value})} />
            </div>
          </div>
        </div>

        {/* กลุ่มที่ 3: เครดิตและระดับ */}
        <div className="settings-group">
          <h3><i className="emoji">💎</i> สิทธิพิเศษ & เครดิต</h3>
          <div className="input-box">
            <label>คะแนนเครดิต</label>
            <input type="number" value={editingUser.creditScore || 0} onChange={(e) => setEditingUser({...editingUser, creditScore: Number(e.target.value)})} />
          </div>
          <label className="label-title">ระดับสมาชิก</label>
          <div className="level-grid">
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <label key={l} className={`level-card ${Number(editingUser.memberLevel) === l ? 'active' : ''}`}>
                <input type="radio" name="memberLevel" checked={Number(editingUser.memberLevel) === l}
                  onChange={() => setEditingUser({ ...editingUser, memberLevel: l })} />
                {getMemberLevelName(l)}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-cancel" onClick={() => setEditingUser(null)}>ยกเลิก</button>
        <button className="btn-save" onClick={handleSaveAll}>บันทึกการเปลี่ยนแปลง</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default UserManagement;