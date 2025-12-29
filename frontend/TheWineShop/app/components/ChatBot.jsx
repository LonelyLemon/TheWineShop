import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [mode, setMode] = useState('menu'); 
  
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Xin chào! Tôi là trợ lý ảo AI. Tôi có thể giúp gì cho bạn?' }
  ]);
  const [adminMessages, setAdminMessages] = useState([]);
  
  const [inputStr, setInputStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [aiMessages, adminMessages, isOpen, mode]);

  useEffect(() => {
    if (isOpen && mode === 'menu') {
      axiosClient.get('/api/chat/status')
        .then(res => setAdminOnline(res.data.online))
        .catch(() => setAdminOnline(false));
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (mode === 'admin') {
        axiosClient.get('/api/chat/history').then(res => {
            const history = res.data.map(m => ({
                sender: m.sender === 'me' ? 'user' : 'admin',
                text: m.message
            }));
            setAdminMessages(history);
        });

        const token = localStorage.getItem('access_token');
        if(!token) {
            setAdminMessages(prev => [...prev, {sender: 'admin', text: 'Vui lòng đăng nhập để chat với nhân viên.'}]);
            return;
        }

        ws.current = new WebSocket(`ws://localhost:8000/api/chat/ws?token=${token}`);

        ws.current.onopen = () => {
            console.log("Connected to Admin Chat");
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setAdminMessages(prev => [...prev, { sender: 'admin', text: data.message }]);
        };

        ws.current.onclose = () => {
            console.log("Disconnected form Admin Chat");
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }
  }, [mode]);


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputStr.trim()) return;

    if (mode === 'ai') {
        const userMsg = { sender: 'user', text: inputStr };
        setAiMessages(prev => [...prev, userMsg]);
        setInputStr('');
        setLoading(true);

        try {
            const historyPayloads = aiMessages.map(msg => ({
                role: msg.sender === 'ai' ? 'assistant' : 'user',
                content: msg.text 
            }));
            
            const response = await axiosClient.post('/api/ai/chat', {
                message: userMsg.text,
                history: historyPayloads
            });

            const aiMsg = { sender: 'ai', text: response.data.reply };
            setAiMessages(prev => [...prev, aiMsg]);
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setAiMessages(prev => [...prev, { sender: 'ai', text: 'Lỗi kết nối AI.' }]);
        } finally {
            setLoading(false);
        }

    } else if (mode === 'admin') {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const userMsg = { sender: 'user', text: inputStr };
            setAdminMessages(prev => [...prev, userMsg]);
            
            ws.current.send(JSON.stringify({ message: inputStr }));
            setInputStr('');
        } else {
            alert("Mất kết nối với máy chủ chat.");
        }
    }
  };

  const renderMessageText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\[ID:.*?\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            {mode !== 'menu' && (
                <button className="back-btn" onClick={() => setMode('menu')}>⬅</button>
            )}
            <h3>
                {mode === 'menu' ? 'TheWineShop Support' : 
                 mode === 'ai' ? '🤖 Trợ lý ảo AI' : '👨‍💼 Hỗ trợ trực tuyến'}
            </h3>
            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>X</button>
          </div>

          <div className="chatbot-messages">
            
            {mode === 'menu' && (
                <div className="chat-menu">
                    <p>Xin chào! Bạn cần hỗ trợ gì hôm nay?</p>
                    <button className="menu-btn ai-btn" onClick={() => setMode('ai')}>
                        🤖 Sử dụng Trợ lý ảo (AI)
                        <span className="sub-text">Tư vấn, tìm rượu, mua hàng tự động</span>
                    </button>
                    <button className="menu-btn admin-btn" onClick={() => setMode('admin')}>
                        👨‍💼 Chat với Admin
                        <span className="sub-text">
                            {adminOnline ? '🟢 Đang trực tuyến' : '⚪ Hiện đang vắng mặt (Sẽ trả lời sau)'}
                        </span>
                    </button>
                </div>
            )}

            {mode === 'ai' && aiMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {renderMessageText(msg.text)}
              </div>
            ))}

            {mode === 'admin' && adminMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}

            {loading && <div className="typing-indicator">Đang soạn tin...</div>}
            <div ref={messagesEndRef} />
          </div>

          {mode !== 'menu' && (
            <form className="chatbot-input-area" onSubmit={handleSendMessage}>
                <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                disabled={loading}
                />
                <button type="submit" disabled={loading || !inputStr.trim()}>
                ➤
                </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;