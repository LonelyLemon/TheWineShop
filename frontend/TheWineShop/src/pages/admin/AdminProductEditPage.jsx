import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductForm from '../../components/admin/ProductForm';
import axiosClient from '../../api/axiosClient';

const AdminProductEditPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axiosClient.get(`/api/products/wines/${id}`);
        setProduct(res.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        console.error("Lỗi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>Đang tải dữ liệu...</div>;
  if (!product) return <div>Không tìm thấy sản phẩm</div>;

  return (
    <div style={{maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem'}}>
        <Link to="/admin/products" style={{display: 'inline-block', marginBottom: '1rem', textDecoration: 'none', color: '#666'}}>
            ← Quay lại danh sách
        </Link>
        
        <ProductForm isEdit={true} initialData={product} />
    </div>
  );
};

export default AdminProductEditPage;