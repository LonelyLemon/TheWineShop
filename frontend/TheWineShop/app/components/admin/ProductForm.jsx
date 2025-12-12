import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../../pages/LoginPage.css';

const ProductForm = ({ initialData, isEdit }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const schema = yup.object().shape({
    name: yup.string().required('Tên sản phẩm là bắt buộc'),
    category_id: yup.string().required('Vui lòng chọn danh mục'),
    price: yup.number().typeError('Giá phải là số').positive('Giá phải lớn hơn 0').required(),
    alcohol_percentage: yup.number().typeError('Nhập số').min(0).max(100).nullable(),
    volume: yup.number().typeError('Nhập số (ml)').positive().nullable(),
    vintage: yup.number().typeError('Nhập năm').min(1900).max(new Date().getFullYear()).nullable(),
    country: yup.string().nullable(),
    region: yup.string().nullable(),
    description: yup.string().nullable(),
    image_url: yup.string().url('Link ảnh không hợp lệ').nullable()
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/api/products/categories');
        setCategories(res.data);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        toast.error("Lỗi tải danh mục");
      }
    };
    fetchCategories();

    if (isEdit && initialData) {
        Object.keys(initialData).forEach(key => setValue(key, initialData[key]));
        if(initialData.images && initialData.images.length > 0) {
            setValue('image_url', initialData.images[0].image_url);
        }
        if(initialData.category) {
            setValue('category_id', initialData.category.id);
        }
    }
  }, [initialData, isEdit, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        images: data.image_url ? [data.image_url] : []
      };

      if (isEdit) {
        await axiosClient.patch(`/api/products/wines/${initialData.id}`, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await axiosClient.post('/api/products/wines', payload);
        toast.success("Tạo sản phẩm thành công!");
      }
      navigate('/admin/products');

    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box" style={{maxWidth: '800px', margin: '0 auto'}}>
        <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
            {isEdit ? 'Cập nhật Sản phẩm' : 'Thêm Sản phẩm mới'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
            
            <div style={{flex: 1, minWidth: '300px'}}>
                <div className="form-group">
                    <label>Tên sản phẩm (*)</label>
                    <input type="text" {...register('name')} className={errors.name ? 'input-error' : ''} />
                    <p className="error-text">{errors.name?.message}</p>
                </div>

                <div className="form-group">
                    <label>Danh mục (*)</label>
                    <select {...register('category_id')} className={errors.category_id ? 'input-error' : ''} style={{width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}>
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <p className="error-text">{errors.category_id?.message}</p>
                </div>

                <div className="form-group">
                    <label>Giá bán (VND) (*)</label>
                    <input type="number" {...register('price')} />
                    <p className="error-text">{errors.price?.message}</p>
                </div>

                <div className="form-group">
                    <label>Link Ảnh (URL)</label>
                    <input type="text" {...register('image_url')} placeholder="https://..." />
                    <p className="error-text">{errors.image_url?.message}</p>
                </div>
            </div>

            <div style={{flex: 1, minWidth: '300px'}}>
                <div style={{display: 'flex', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Nồng độ (%)</label>
                        <input type="number" step="0.1" {...register('alcohol_percentage')} />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Dung tích (ml)</label>
                        <input type="number" {...register('volume')} />
                    </div>
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Xuất xứ (Quốc gia)</label>
                        <input type="text" {...register('country')} />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Vùng</label>
                        <input type="text" {...register('region')} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Niên vụ (Năm)</label>
                    <input type="number" {...register('vintage')} />
                </div>
                
                 <div className="form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea {...register('description')} rows="4" style={{width: '100%', padding: '10px', border: '1px solid #ccc'}}></textarea>
                </div>
            </div>

            <div style={{width: '100%', marginTop: '10px'}}>
                <button type="submit" disabled={loading} className="login-btn">
                    {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ProductForm;