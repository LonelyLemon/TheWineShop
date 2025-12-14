import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import './ReviewSection.css';

const ReviewSection = ({ wineId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await axiosClient.get(`/api/products/wines/${wineId}/reviews`);
      setReviews(res.data);
    } catch (error) {
      console.error("Lỗi tải đánh giá", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [wineId]);

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
      toast.success("Cảm ơn bạn đã đánh giá!");
      setComment('');
      setRating(5);
      fetchReviews();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Gửi đánh giá thất bại (Có thể bạn đã đánh giá rồi?)");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-section">
      <h3 className="review-title">Đánh giá sản phẩm ({reviews.length})</h3>

      <div className="review-form-container">
        {user ? (
            <form onSubmit={handleSubmit} className="review-form">
                <div className="rating-select">
                    <span>Chọn đánh giá: </span>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star} 
                            type="button" 
                            className={`star-btn ${star <= rating ? 'active' : ''}`}
                            onClick={() => setRating(star)}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <textarea 
                    className="review-input"
                    placeholder="Viết cảm nhận của bạn về loại rượu này..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                />
                <button type="submit" className="submit-review-btn" disabled={submitting}>
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
            </form>
        ) : (
            <div className="login-prompt">
                Vui lòng <a href="/login">đăng nhập</a> để viết đánh giá.
            </div>
        )}
      </div>

      <div className="review-list">
        {reviews.length === 0 && <p className="no-reviews">Chưa có đánh giá nào.</p>}
        {reviews.map(review => (
            <div key={review.id} className="review-item">
                <div className="review-header">
                    <span className="reviewer-name">{review.user_name}</span>
                    <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </span>
                </div>
                <div className="review-stars">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <p className="review-content">{review.comment}</p>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;