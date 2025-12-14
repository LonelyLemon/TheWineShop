import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './ReviewSection.css';

const ReviewSection = ({ wineId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);

    const checkUser = () => {
        const token = localStorage.getItem('access_token');
        if (token) setUser(true);
    };

    const fetchReviews = useCallback(async () => {
        try {
            const res = await axiosClient.get(`/api/products/wines/${wineId}/reviews`);
            setReviews(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [wineId]);

    useEffect(() => {
        fetchReviews();
        checkUser();
    }, [fetchReviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.info("Vui lòng đăng nhập để đánh giá");
            return;
        }
        setSubmitting(true);
        try {
            await axiosClient.post(`/api/products/wines/${wineId}/reviews`, {
                rating,
                comment
            });
            toast.success("Cảm ơn đánh giá của bạn!");
            setComment('');
            setRating(5);
            fetchReviews();
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Lỗi gửi đánh giá");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (num) => {
        return "⭐".repeat(num);
    };

    return (
        <div className="review-section">
            <h3>Đánh giá khách hàng ({reviews.length})</h3>

            <div className="review-list">
                {loading ? <p>Đang tải...</p> : (
                    reviews.length === 0 ? <p className="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên!</p> :
                    reviews.map(r => (
                        <div key={r.id} className="review-item">
                            <div className="review-header">
                                <strong>{r.user_name}</strong>
                                <span className="review-date">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="review-rating">{renderStars(r.rating)}</div>
                            <p className="review-comment">{r.comment}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="review-form-container">
                <h4>Viết đánh giá của bạn</h4>
                {!user ? (
                    <p><a href="/login">Đăng nhập</a> để viết đánh giá.</p>
                ) : (
                    <form onSubmit={handleSubmit} className="review-form">
                        <div className="form-group">
                            <label>Mức độ hài lòng:</label>
                            <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
                                <option value="5">5 sao - Tuyệt vời</option>
                                <option value="4">4 sao - Rất tốt</option>
                                <option value="3">3 sao - Bình thường</option>
                                <option value="2">2 sao - Tệ</option>
                                <option value="1">1 sao - Rất tệ</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <textarea 
                                rows="3" 
                                placeholder="Chia sẻ cảm nhận của bạn về hương vị..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                            ></textarea>
                        </div>
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReviewSection;