import React from 'react';
import './HomePage.css';

const AboutPage = () => {
  return (
    <div className="container" style={{padding: '40px 20px', maxWidth: '1000px', margin: '0 auto'}}>
        <h1 style={{textAlign: 'center', marginBottom: '30px', color: '#722F37'}}>Về The Wine Shop</h1>
        
        <div style={{display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '50px'}}>
            <div style={{flex: 1}}>
                <img 
                    src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80&w=800" 
                    alt="Wine Cellar" 
                    style={{width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
            </div>
            <div style={{flex: 1, fontSize: '1.1rem', lineHeight: '1.6'}}>
                <p>
                    Chào mừng bạn đến với <strong>The Wine Shop</strong> - Điểm đến tin cậy cho những người yêu thích rượu vang.
                    Được thành lập với niềm đam mê bất tận về hương vị và văn hóa rượu vang, chúng tôi cam kết mang đến những chai vang chất lượng nhất từ các vùng nho nổi tiếng trên thế giới.
                </p>
                <p>
                    Từ những chai vang đỏ Bordeaux đậm đà, vang trắng New Zealand thanh mát cho đến những chai Champagne nổ giòn tan, 
                    mỗi sản phẩm tại The Wine Shop đều được tuyển chọn kỹ lưỡng bởi các chuyên gia Sommelier hàng đầu.
                </p>
            </div>
        </div>

        <div style={{textAlign: 'center', background: '#f9f9f9', padding: '40px', borderRadius: '12px'}}>
            <h2 style={{color: '#333'}}>Sứ Mệnh Của Chúng Tôi</h2>
            <p style={{maxWidth: '700px', margin: '10px auto', fontSize: '1.1rem'}}>
                "Mang tinh hoa rượu vang thế giới đến bàn tiệc Việt, nâng tầm trải nghiệm thưởng thức và kết nối mọi người qua những ly vang tuyệt hảo."
            </p>
        </div>
    </div>
  );
};

export default AboutPage;