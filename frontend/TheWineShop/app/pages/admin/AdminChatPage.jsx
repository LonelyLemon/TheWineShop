import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import './AdminChatPage.css';

const AdminChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputStr, setInputStr] = useState('');
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const cleanupWs = connectWebSocket();

    return () => {
      if (cleanupWs) cleanupWs();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axiosClient.get('/api/chat/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách chat:", err);
    }
  };

  const fetchUserHistory = async (userId) => {
    try {
        const res = await axiosClient.get(`/api/chat/history?target_user_id=${userId}`);
        const history = res.data.map(m => ({
            sender: m.sender === 'admin' ? 'me' : 'customer',
            text: m.message
        }));
        
        setMessages(prev => ({
            ...prev,
            [userId]: history
        }));
    } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
    }
  };

  const handleSelectUser = (user) => {
      setSelectedUser(user);
      fetchUserHistory(user.id);
  };

  const handleEndConversation = async () => {
      if (!selectedUser) return;
      if (!window.confirm(`Bạn có chắc muốn kết thúc và xóa đoạn chat với ${selectedUser.full_name}?`)) return;

      try {
          await axiosClient.delete(`/api/chat/conversation/${selectedUser.id}`);
          
          setConversations(prev => prev.filter(u => u.id !== selectedUser.id));
          setMessages(prev => {
              const newState = {...prev};
              delete newState[selectedUser.id];
              return newState;
          });
          setSelectedUser(null);
          alert("Đã kết thúc hội thoại.");

      } catch (err) {
          alert("Lỗi khi kết thúc hội thoại");
          console.log(err)
      }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const apiHost = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
        : 'ws://localhost:8000';
    const wsUrl = `${apiHost}/api/chat/ws?token=${token}`;
    
    console.log("Admin connecting to WS:", wsUrl);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    ws.current.onopen = () => {
      console.log("Admin Connected to Chat System");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message' && data.sender_role === 'customer') {
        const senderId = data.sender_id;
        
        setMessages(prev => ({
          ...prev,
          [senderId]: [...(prev[senderId] || []), { sender: 'customer', text: data.message }]
        }));

        setConversations(prev => {
            const exists = prev.find(u => u.id === senderId);
            if (!exists) {
                return [{ id: senderId, full_name: data.sender_name }, ...prev];
            }
            return prev;
        });
      }
    };

    return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
        }
    };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputStr.trim() || !selectedUser) return;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ 
            message: inputStr,
            receiver_id: selectedUser.id 
        }));

        setMessages(prev => ({
            ...prev,
            [selectedUser.id]: [...(prev[selectedUser.id] || []), { sender: 'me', text: inputStr }]
        }));
        
        setInputStr('');
    } else {
        alert("Mất kết nối!");
    }
  };

  return (
    <div className="admin-chat-container">
      <div className="chat-sidebar">
        <h3>💬 Hỗ trợ khách hàng</h3>
        <div className="user-list">
            {conversations.length === 0 && <p className="empty-text">Chưa có tin nhắn nào.</p>}
            
            {conversations.map(user => (
                <div 
                    key={user.id} 
                    className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                    onClick={() => handleSelectUser(user)}
                >
                    <div className="avatar">{user.full_name.charAt(0)}</div>
                    <div className="info">
                        <span className="name">{user.full_name}</span>
                        <span className="email">{user.email}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="chat-main">
        {!selectedUser ? (
            <div className="no-selection">
                <p>👈 Chọn một khách hàng để bắt đầu chat</p>
            </div>
        ) : (
            <>
                <div className="chat-header-bar" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>Chat với: <strong>{selectedUser.full_name}</strong></span>
                    <button 
                        onClick={handleEndConversation}
                        style={{background: '#ff4d4f', color: 'white', padding: '5px 10px', fontSize: '12px'}}
                    >
                        Kết thúc hội thoại
                    </button>
                </div>
                
                <div className="chat-messages-area">
                    {(messages[selectedUser.id] || []).map((msg, idx) => (
                        <div key={idx} className={`chat-bubble ${msg.sender === 'me' ? 'me' : 'them'}`}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-bar" onSubmit={handleSendMessage}>
                    <input 
                        type="text" 
                        placeholder="Nhập tin nhắn..." 
                        value={inputStr}
                        onChange={e => setInputStr(e.target.value)}
                    />
                    <button type="submit">Gửi</button>
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default AdminChatPage;