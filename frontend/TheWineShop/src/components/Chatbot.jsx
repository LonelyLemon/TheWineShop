import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './Chatbot.css';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Xin chào! Mình là trợ lý ảo của TheWineShop. Bạn đang tìm loại rượu vang như thế nào? (ví dụ: vang đỏ, ngọt, cho buổi tiệc, ngân sách khoảng...)',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      suggestedProducts: [],
      adminHint: 'Khi cần tư vấn chi tiết, bạn có thể yêu cầu kết nối với nhân viên đang online.',
    },
  ]);

  const navigate = useNavigate();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      from: 'user',
      text: input,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/api/chat/message', {
        message: currentInput,
      });

      const data = res.data;
      const botMessage = {
        from: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: data.suggested_products || [],
        adminHint: data.admin_hint,
        canConnectToAdmin: data.can_connect_to_admin,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const botMessage = {
        from: 'bot',
        text: 'Xin lỗi, hiện tại hệ thống đang bận. Bạn vui lòng thử lại sau hoặc liên hệ trực tiếp với nhân viên nhé.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleProductClick = (productId) => {
    setOpen(false);
    navigate(`/products/${productId}`);
  };

  const handleConnectAdmin = () => {
    const botMessage = {
      from: 'bot',
      text: 'Mình đã ghi nhận yêu cầu kết nối với nhân viên. Tạm thời hệ thống demo chưa bật realtime chat, nhưng đây là nơi để tích hợp live chat (ví dụ: WebSocket, Chatwoot, v.v.).',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <div className="chatbot-container">
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">TW</div>
              <div>
                <div className="chatbot-title">TheWineShop Assistant</div>
                <div className="chatbot-subtitle">Gợi ý rượu vang & kết nối nhân viên</div>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((m, idx) => (
              <div key={idx}>
                <div className={`chatbot-message ${m.from}`}>
                  <div>{m.text}</div>

                  {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                    <div className="chatbot-products">
                      {m.suggestedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="chatbot-product-item"
                          onClick={() => handleProductClick(p.id)}
                        >
                          <div className="chatbot-product-name">{p.name}</div>
                          <div className="chatbot-product-meta">
                            {p.category && `${p.category} • `}
                            {p.country && `${p.country} `}
                            {p.region && `- ${p.region}`}
                          </div>
                          <div className="chatbot-product-meta">
                            {p.price?.toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.adminHint && (
                    <div className="chatbot-admin-hint">{m.adminHint}</div>
                  )}
                  {m.canConnectToAdmin && (
                    <div
                      className="chatbot-connect-admin"
                      onClick={handleConnectAdmin}
                    >
                      Kết nối với nhân viên tư vấn gần nhất
                    </div>
                  )}
                </div>
                <div className="chatbot-time">{m.time}</div>
              </div>
            ))}
          </div>

          <div className="chatbot-footer">
            <input
              className="chatbot-input"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="chatbot-send-btn"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? '...' : 'Gửi'}
            </button>
          </div>
        </div>
      )}

      <button className="chatbot-toggle-btn" onClick={() => setOpen((v) => !v)}>
        💬
      </button>
    </div>
  );
};

export default Chatbot;



