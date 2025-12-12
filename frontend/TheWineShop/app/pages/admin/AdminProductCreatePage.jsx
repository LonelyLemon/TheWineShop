import React from 'react';
import ProductForm from '../../components/admin/ProductForm';
import { Link } from 'react-router-dom';

const AdminProductCreatePage = () => {
  return (
    <div style={{maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem'}}>
        <Link to="/admin/products" style={{display: 'inline-block', marginBottom: '1rem', textDecoration: 'none', color: '#666'}}>
            ← Quay lại danh sách
        </Link>
        
        <ProductForm isEdit={false} />
    </div>
  );
};

export default AdminProductCreatePage;