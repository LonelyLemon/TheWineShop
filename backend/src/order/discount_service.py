from datetime import datetime
from decimal import Decimal
from sqlalchemy.future import select
from sqlalchemy import and_, or_

from src.core.database import SessionDep
from src.product.models import Promotion
from src.order.models import Cart
from src.user.models import User

class DiscountService:
    async def calculate_discount(
        self, 
        db: SessionDep, 
        cart: Cart, 
        user: User, 
        coupon_code: str = None
    ):
        """
        Trả về: (discount_amount, promotion_id)
        """
        now = datetime.utcnow()
        total_price = sum(item.quantity * item.price_at_add for item in cart.items)
        total_quantity = sum(item.quantity for item in cart.items)
        
        applied_promo = None
        
        if coupon_code:
            stmt = select(Promotion).where(
                Promotion.code == coupon_code.upper(),
                Promotion.is_active == True,
                Promotion.start_date <= now,
                Promotion.end_date >= now
            )
            result = await db.execute(stmt)
            promo = result.scalar_one_or_none()
            
            if promo:
                applied_promo = promo
        
        else:
            stmt = select(Promotion).where(
                Promotion.code == None,
                Promotion.is_active == True,
                Promotion.start_date <= now,
                Promotion.end_date >= now
            )
            result = await db.execute(stmt)
            active_promos = result.scalars().all()
            
            valid_promos = []
            for p in active_promos:
                if p.trigger_type == 'volume' and total_quantity < p.min_quantity:
                    continue
                
                if p.trigger_type == 'vip':
                    if user.role not in ['admin', 'stock_manager']: 
                         continue
                
                valid_promos.append(p)
            
            if valid_promos:
                applied_promo = max(valid_promos, key=lambda x: x.discount_percentage)

        discount_amount = Decimal(0)
        promo_id = None
        
        if applied_promo:
            percent = Decimal(str(applied_promo.discount_percentage))
            discount_amount = (total_price * percent) / 100
            promo_id = applied_promo.id
            
        return discount_amount, promo_id

discount_service = DiscountService()