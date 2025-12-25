import React, { useEffect, useState, useRef } from 'react';
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
  
  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const fileInputRef = useRef(null);

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
    image_url: yup.string().nullable() 
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
            const firstImg = initialData.images[0];
            setPreviewImg(firstImg.image_url);
        }
        if(initialData.category) {
            setValue('category_id', initialData.category.id);
        }
    }
  }, [initialData, isEdit, setValue]);

  const handleImageChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImg(true);
      try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await axiosClient.post('/api/media/upload/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          const { s3_key, url } = response.data;
          
          setPreviewImg(url);
          setValue('image_url', s3_key, { shouldDirty: true });
          
          toast.success("Đã tải ảnh lên");
      } catch (error) {
          console.error(error);
          toast.error("Lỗi upload ảnh");
      } finally {
          setUploadingImg(false);
      }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data };
      
      if (data.image_url && !data.image_url.startsWith('http')) {
          payload.images = [data.image_url];
      } else {
          delete payload.images;
          delete payload.image_url; 
      }

      if (isEdit) {
        await axiosClient.patch(`/api/products/wines/${initialData.id}`, payload);
        toast.success("Cập nhật thành công!");
      } else {
        if (!payload.images || payload.images.length === 0) {
            toast.warning("Chưa có ảnh sản phẩm");
        }
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

                {/* --- IMAGE UPLOAD SECTION --- */}
                <div className="form-group">
                    <label>Hình ảnh sản phẩm</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                        <div 
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                border: '1px dashed #ccc', 
                                borderRadius: '4px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f9f9f9'
                            }}
                        >
                            {previewImg ? (
                                <img src={previewImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <span style={{fontSize: '2rem', color: '#ddd'}}>📷</span>
                            )}
                        </div>
                        
                        <div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                            <button 
                                type="button" 
                                className="login-btn" 
                                style={{ width: 'auto', padding: '5px 15px', fontSize: '0.8rem', backgroundColor: '#666' }}
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploadingImg}
                            >
                                {uploadingImg ? 'Đang tải...' : 'Chọn ảnh'}
                            </button>
                            <p style={{fontSize: '0.8rem', color: '#888', marginTop: '5px'}}>
                                Định dạng: jpg, png, webp. Max 5MB.
                            </p>
                        </div>
                    </div>
                </div>
                {/* --------------------------- */}
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
                <button type="submit" disabled={loading || uploadingImg} className="login-btn">
                    {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ProductForm;