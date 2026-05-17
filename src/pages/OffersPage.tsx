import { motion } from 'motion/react';
import { TicketPercent, TrendingUp, Heart, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OffersPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-8 rounded-b-[40px] px-6 pt-12" dir="rtl">
      <div className="flex items-center gap-2 mb-8 mt-4">
        <TicketPercent className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-black text-gray-900">أقوى العروض</h1>
      </div>

      <div className="space-y-6">
        <motion.div 
          whileHover={{ scale: 0.98 }}
          className="bg-gradient-to-l from-[#111] to-[#222] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-44"
        >
          <div className="absolute left-[-20px] top-[-20px] w-24 h-24 bg-primary/30 blur-2xl rounded-full"></div>
          <div className="relative z-10 w-2/3">
             <h3 className="text-2xl font-black mb-1">وجبة التوفير</h3>
             <p className="text-sm text-white/70 mb-3">عرض حصري لنهاية الأسبوع</p>
             <div className="flex items-center gap-2 mt-2">
                 <span className="text-xl font-bold text-primary">1500 د.ج</span>
                 <span className="text-sm line-through text-white/40">2000 د.ج</span>
             </div>
          </div>
          <div className="absolute left-[-40px] top-[-20px] bottom-0 w-1/2 opacity-70 mix-blend-luminosity">
             <img src="https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=500" alt="offer" className="object-cover w-full h-full" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 0.98 }}
          className="bg-gradient-to-r from-primary to-[#8B0000] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-44"
        >
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/20 blur-2xl rounded-full"></div>
          <div className="relative z-10 w-2/3">
             <h3 className="text-2xl font-black mb-1">خصم 50%</h3>
             <p className="text-sm text-white/80 mb-3">على جميع أنواع البرغر المزدوج</p>
             <div className="flex items-center gap-2 mt-2">
                 <span className="text-xl font-bold text-white">450 د.ج</span>
                 <span className="text-sm line-through text-white/50">900 د.ج</span>
             </div>
          </div>
          <div className="absolute left-[-30px] top-0 bottom-0 w-[60%] opacity-90 mix-blend-luminosity transform scale-125">
             <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500" alt="burger" className="object-cover w-full h-full" />
          </div>
        </motion.div>

        <div className="pt-6">
           <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              الأكثر طلباً اليوم
           </h2>
           
           <div className="space-y-4">
               {[1, 2, 3].map((item) => (
                   <div key={item} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=150" alt="pizza" className="w-16 h-16 rounded-xl object-cover" />
                         <div>
                            <h4 className="font-bold text-gray-900 text-sm">بيتزا نابولي رقم {item}</h4>
                            <p className="text-xs text-gray-500">من مطعم العائلة</p>
                            <span className="font-bold text-primary mt-1 block">500 د.ج</span>
                         </div>
                      </div>
                      <button onClick={() => navigate('/home')} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-red-50 transition-colors">
                         <ShoppingBag className="w-4 h-4" />
                      </button>
                   </div>
               ))}
           </div>
        </div>
      </div>
    </div>
  );
}
