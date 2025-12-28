import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: 'Xin chào! Tôi là trợ lý ảo của TheWineShop. Tôi có thể giúp bạn tìm loại rượu phù hợp cho bữa tiệc hoặc làm quà không ? Hoặc hãy cho tôi biết nếu bạn cần tôi hỗ trợ trong quá trình sử dụng ứng dụng.' 
    }
  ]);
  const [inputStr, setInputStr] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputStr.trim()) return;

    const userMsg = { sender: 'user', text: inputStr };
    setMessages(prev => [...prev, userMsg]);
    setInputStr('');
    setLoading(true);

    try {
      const historyPayloads = messages.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: userMsg.text
      }));
      
      const response = await axiosClient.post('/api/ai/chat', {
        message: userMsg.text,
        history: historyPayloads
      });

      const aiMsg = { sender: 'ai', text: response.data.reply };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Bạn vui lòng thử lại sau nhé.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
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
            <h3>🍷 Trợ lý TheWineShop</h3>
            <button className="close-chat-btn" onClick={() => setIsOpen(false)}>X</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {renderMessageText(msg.text)}
              </div>
            ))}
            {loading && <div className="typing-indicator">Đang soạn tin...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Nhập câu hỏi của bạn..." 
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !inputStr.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;