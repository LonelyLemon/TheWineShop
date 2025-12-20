import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { ShoppingCart, Star } from 'lucide-react';

const ProductCard = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);
  
  // Giả lập giá mix 6 nếu backend chưa có trường này (Backend nên trả về field này)
  const priceSingle = product.price;
  const priceMix6 = product.price_mix_6 || (product.price * 0.85); 
  const saving = Math.round(((priceSingle - priceMix6) / priceSingle) * 100);

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* 1. Hình ảnh */}
      <div className="relative pt-4 px-4 pb-2 bg-gray-50 flex justify-center h-64">
        {/* Badge Vùng miền */}
        <span className="absolute top-2 left-2 bg-white text-xs font-semibold px-2 py-1 border rounded text-gray-600">
          {product.region || 'France'}
        </span>
        <img 
          src={product.image_url || "https://via.placeholder.com/150x400"} 
          alt={product.name}
          className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
        />
      </div>

      {/* 2. Thông tin */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-1 mb-2">
           {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className={i < (product.rating || 4) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
           ))}
           <span className="text-xs text-gray-400 ml-1">({product.reviews_count || 12})</span>
        </div>
        
        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>

        {/* 3. Giá & Nút mua (Pricing Engine UI) */}
        <div className="mt-auto space-y-3">
          {/* Box Giá Mix-6 Nổi Bật */}
          <div className="flex justify-between items-center border border-wine-600 bg-wine-50 rounded px-3 py-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-wine-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                SAVE {saving}%
             </div>
             <div>
                <p className="text-xs text-wine-800 font-bold uppercase tracking-wide">Mix Any 6</p>
                <p className="text-2xl font-extrabold text-wine-800">£{priceMix6.toFixed(2)}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-gray-500 line-through">£{priceSingle.toFixed(2)}</p>
             </div>
          </div>

          {/* Giá lẻ */}
          <div className="flex justify-between px-1">
             <span className="text-sm text-gray-500">Single Bottle</span>
             <span className="text-sm font-semibold">£{priceSingle.toFixed(2)}</span>
          </div>

          <button 
            onClick={() => addItem(product)}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingCart size={18} />
            Add to Basket
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;