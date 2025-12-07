import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load danh sách user
  const fetchUsers = async () => {
    try {
      const response = await axiosClient.get('/api/admin/users');
      setUsers(response.data);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý đổi Role
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc muốn đổi quyền user này thành ${newRole}?`)) return;
    try {
      await axiosClient.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success("Cập nhật quyền thành công");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi cập nhật");
    }
  };

  // Xử lý Ban/Unban
  const handleBanStatus = async (userId, currentStatus) => {
    const isBanned = currentStatus === 'banned';
    const action = isBanned ? 'Mở khóa' : 'Khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      await axiosClient.post(`/api/admin/users/${userId}/ban`, { 
          is_active: isBanned
      });
      toast.success(`Đã ${action} thành công`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi xử lý");
    }
  };

  const formatDate = (dateString) => {
      if (!dateString) return '---';
      try {
          return new Date(dateString).toLocaleDateString('vi-VN');
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
          return 'Invalid Date';
      }
  };

  if (loading) return <div className="admin-loading">Đang tải...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý Người dùng</h1>
        <button className="refresh-btn" onClick={fetchUsers}>🔄 Làm mới</button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Info</th>
              <th>Liên hệ</th>
              <th>Ngày tham gia</th>
              <th>Vai trò (Role)</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{opacity: user.status === 'banned' ? 0.6 : 1}}>
                <td>
                    <strong>{user.last_name} {user.first_name}</strong> 
                    {user.email_verified && (
                        <span title="Đã xác thực Email" style={{marginLeft: '5px', cursor: 'help'}}>✅</span>
                    )}
                    <br/>
                    <small className="order-uuid">{user.email}</small>
                </td>
                <td>
                    {user.phone_number || '---'} <br/>
                    <small>{user.city}</small>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                    <select 
                        className="status-select"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{
                            fontWeight: 'bold',
                            color: user.role === 'admin' ? 'red' : (user.role === 'stock_manager' ? 'blue' : 'black')
                        }}
                    >
                        <option value="customer">Khách hàng</option>
                        <option value="stock_manager">Thủ kho</option>
                        <option value="admin">Admin</option>
                    </select>
                </td>
                <td>
                    <span style={{
                        color: user.status === 'active' ? 'green' : 'red',
                        fontWeight: 'bold'
                    }}>
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                </td>
                <td>
                    <button 
                        className="refresh-btn"
                        style={{
                            color: user.status === 'active' ? 'red' : 'green', 
                            borderColor: user.status === 'active' ? 'red' : 'green'
                        }}
                        onClick={() => handleBanStatus(user.id, user.status)}
                    >
                        {user.status === 'active' ? 'Khóa (Ban)' : 'Mở khóa'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;