import React from 'react';
import { Link } from 'react-router-dom';

const BLOG_POSTS = [
    {
        id: 1,
        title: "Cách Cầm Ly Rượu Vang Đúng Chuẩn Sang Trọng",
        excerpt: "Cầm ly rượu vang không chỉ là thói quen mà còn ảnh hưởng đến nhiệt độ và hương vị của rượu. Hãy cùng tìm hiểu...",
        date: "28/12/2024",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: 2,
        title: "Phân Biệt Vang Cựu Thế Giới và Tân Thế Giới",
        excerpt: "Sự khác biệt giữa vang Pháp, Ý so với vang Mỹ, Chile nằm ở đâu? Phong cách làm rượu nào phù hợp với bạn?",
        date: "25/12/2024",
        image: "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?auto=format&fit=crop&q=80&w=600"
    },
    {
        id: 3,
        title: "Top 5 Chai Vang Đỏ Cho Bữa Tiệc Tất Niên",
        excerpt: "Gợi ý những chai vang đỏ đậm đà, phù hợp với các món thịt nướng và không khí ấm cúng của dịp cuối năm.",
        date: "20/12/2024",
        image: "https://images.unsplash.com/photo-1559563362-c667ba5f5480?auto=format&fit=crop&q=80&w=600"
    }
];

const BlogPage = () => {
  return (
    <div className="container" style={{padding: '40px 20px', maxWidth: '1200px', margin: '0 auto'}}>
        <h1 style={{textAlign: 'center', marginBottom: '10px', color: '#722F37'}}>Kiến Thức Rượu Vang</h1>
        <p style={{textAlign: 'center', marginBottom: '40px', color: '#666'}}>Khám phá thế giới rượu vang đầy màu sắc</p>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px'}}>
            {BLOG_POSTS.map(post => (
                <article key={post.id} style={{border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s'}}>
                    <div style={{height: '200px', overflow: 'hidden'}}>
                        <img src={post.image} alt={post.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    </div>
                    <div style={{padding: '20px'}}>
                        <div style={{fontSize: '0.85rem', color: '#888', marginBottom: '8px'}}>{post.date}</div>
                        <h3 style={{fontSize: '1.2rem', margin: '0 0 10px', color: '#333'}}>{post.title}</h3>
                        <p style={{fontSize: '0.95rem', color: '#666', lineHeight: '1.5', marginBottom: '15px'}}>{post.excerpt}</p>
                        <Link to="#" style={{color: '#722F37', fontWeight: 'bold', textDecoration: 'none'}}>Đọc thêm →</Link>
                    </div>
                </article>
            ))}
        </div>
    </div>
  );
};

export default BlogPage;