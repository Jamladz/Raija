import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, MapPin, Phone, Share2, Heart, Plus } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { addItem, items, restaurantId: cartRestaurantId, getTotal } = useCartStore();

  const [showReservation, setShowReservation] = useState(false);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!id) return;
      try {
        const restSnap = await getDoc(doc(db, 'restaurants', id));
        if (restSnap.exists()) {
          setRestaurant({ id, ...restSnap.data() });
        }
        
        const menuSnap = await getDocs(collection(db, 'restaurants', id, 'menuItems'));
        const items = menuSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMenuItems(items);

        const uniqueCats = Array.from(new Set(items.map((i: any) => i.category || 'عام'))).filter(Boolean) as string[];
        setCategories(uniqueCats);
        if (uniqueCats.length > 0) setActiveCategory(uniqueCats[0]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRestaurantData();
  }, [id]);
  
  if (!restaurant) return <div className="min-h-screen text-white flex items-center justify-center bg-dark">جاري التحميل...</div>;

  const checkIfOpen = () => {
    if (restaurant.acceptingOrders === false) return false;
    
    if (restaurant.workingHours?.open && restaurant.workingHours?.close) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [openH, openM] = restaurant.workingHours.open.split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      
      const [closeH, closeM] = restaurant.workingHours.close.split(':').map(Number);
      let closeMinutes = closeH * 60 + closeM;
      
      if (closeMinutes < openMinutes) {
        // Closes past midnight
        closeMinutes += 24 * 60;
      }
      
      let checkMinutes = currentMinutes;
      if (checkMinutes < openMinutes && closeMinutes > 24 * 60) {
         checkMinutes += 24 * 60;
      }
      
      if (checkMinutes < openMinutes || checkMinutes > closeMinutes) {
        return false;
      }
    }
    return true;
  };

  const isCurrentlyOpen = restaurant ? checkIfOpen() : false;

  const handleAddToCart = () => {
    if (selectedItem) {
      if (cartRestaurantId && cartRestaurantId !== restaurant.id) {
        // Automatically clear cart if they add from another restaurant without confirm since window.confirm doesn't work in iframes reliably
      }
      addItem({
        id: selectedItem.id + Date.now().toString(), // unique instance
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        price: Number(selectedItem.price),
        quantity: 1,
        image: selectedItem.image,
        addons: []
      }, restaurant.id);
      setSelectedItem(null);
    }
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      {/* Cover Image & Header Nav */}
      <div className="relative h-72 w-full">
        <img src={restaurant.coverImage} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/40 to-dark/60" />
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pt-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/90 hover:bg-black/60 transition">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/90 hover:bg-black/60 transition">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Restaurant Info Card (Overlapping) */}
        <div className="absolute -bottom-16 left-6 right-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-[28px] p-5 shadow-2xl border border-white/10 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-[20px] overflow-hidden shrink-0 shadow-xl border-2 border-white/20">
              <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-white leading-tight">{restaurant.name}</h1>
                {!isCurrentlyOpen && (
                   <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap backdrop-blur-sm">مغلق حالياً</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/60 mt-1">
                <Star className="w-4 h-4 text-secondary fill-secondary" />
                <span className="font-bold text-white/90">{restaurant.rating}</span>
                <span>({restaurant.reviewCount} تقييم)</span>
              </div>
              {(restaurant.workingHours?.open || restaurant.workingDays?.length > 0) && (
                <div className="text-xs text-white/50 mt-1">
                   {restaurant.workingHours?.open && restaurant.workingHours?.close && (
                     <span>🕒 {restaurant.workingHours.open} - {restaurant.workingHours.close}</span>
                   )}
                   {restaurant.workingDays?.length > 0 && (
                     <span className="mx-2">• أيام العمل: {restaurant.workingDays.join('، ')}</span>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Details */}
      <div className="mt-20 px-6 space-y-4">
        <a 
          href={restaurant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.location)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-1 items-start gap-3 bg-white/5 backdrop-blur-md p-4 rounded-[20px] shadow-lg border border-white/10 hover:bg-white/10 transition cursor-pointer"
        >
          <div className="bg-primary/20 p-2.5 rounded-xl text-primary shrink-0 border border-primary/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1 font-medium">الموقع</p>
            <p className="text-sm font-bold text-white/90">{restaurant.location}</p>
          </div>
        </a>
        <a 
          href={`tel:${restaurant.phone}`}
          className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-4 rounded-[20px] shadow-lg border border-white/10 hover:bg-white/10 transition cursor-pointer"
        >
          <div className="bg-secondary/20 p-2.5 rounded-xl text-secondary shrink-0 border border-secondary/20">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-white/50 mb-1 font-medium">رقم الهاتف (انقر للاتصال)</p>
            <p className="text-sm font-bold text-white/90" dir="ltr">{restaurant.phone}</p>
          </div>
        </a>
        <button 
          onClick={() => setShowReservation(true)}
          className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[20px] py-4 font-bold shadow-xl hover:bg-white/20 transition"
        >
          حجز طاولة
        </button>
      </div>

      {/* Menu Categories */}
      <div className="mt-8 sticky top-0 bg-dark z-30 py-3 shadow-md border-b border-white/5">
        <div className="flex overflow-x-auto gap-2 px-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="mt-4 px-6 space-y-4 pb-24">
        {menuItems.filter(m => m.category === activeCategory).map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="bg-white/5 backdrop-blur-md rounded-[20px] p-3 flex gap-4 shadow-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 shadow-xl relative border border-white/10">
               <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent pointer-events-none"></div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-dark/80 backdrop-blur-md rounded-tl-xl rounded-br-xl flex items-center justify-center border-l border-t border-white/20">
                 <button className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                    <Plus className="w-5 h-5" />
                 </button>
               </div>
            </div>
            <div className="flex-1 py-1">
              <h4 className="font-bold text-white text-base">{item.name}</h4>
              <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
              <div className="mt-auto pt-2 flex justify-between items-center">
                <span className="font-black text-secondary">{item.price} د.ج</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {items.length > 0 && cartRestaurantId === restaurant.id && (
        <div className="fixed bottom-6 left-6 right-6 z-40">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full bg-primary text-white p-4 rounded-full font-bold shadow-[0_10px_30px_rgba(139,0,0,0.5)] flex items-center justify-between border border-white/10 hover:bg-primary-dark transition-all"
          >
             <div className="flex items-center gap-2">
               <div className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">{items.length} أطباق</div>
             </div>
             <span className="text-lg">متابعة الطلب</span>
             <span className="font-black text-white/90">{getTotal()} د.ج</span>
          </button>
        </div>
      )}

      {/* Product Details Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl bg-dark/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] z-50 overflow-hidden shadow-2xl"
            >
              <div className="h-64 w-full relative">
                 <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-dark/90 to-transparent"></div>
                 <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/40 border border-white/10 text-white/90 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition"
                 >
                   ✕
                 </button>
              </div>
              <div className="p-6 relative z-10 -mt-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-5 mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black text-white">{selectedItem.name}</h3>
                    <span className="text-xl font-black text-secondary whitespace-nowrap mr-4">
                      {selectedItem.price} د.ج
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{selectedItem.description}</p>
                </div>
                
                {isCurrentlyOpen ? (
                  <button 
                    onClick={handleAddToCart}
                    className="w-full bg-primary text-white py-4 rounded-[20px] font-bold text-lg shadow-[0_10px_30px_rgba(139,0,0,0.4)] hover:bg-[#a00] transition-colors border border-white/10"
                  >
                    إضافة للسلة • {selectedItem.price} د.ج
                  </button>
                ) : (
                  <div className="w-full bg-gray-500 text-white py-4 rounded-[20px] font-bold text-lg text-center opacity-80 cursor-not-allowed">
                     عذراً، المطعم لا يستقبل طلبات حالياً
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reservation Modal Overlay */}
      <AnimatePresence>
        {showReservation && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md"
              onClick={() => setShowReservation(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl bg-dark/95 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] z-50 p-6 shadow-2xl"
            >
                  <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">حجز طاولة</h3>
                <button 
                  onClick={() => setShowReservation(false)}
                  className="w-10 h-10 bg-white/5 border border-white/10 text-white/70 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const guestsStr = formData.get('guests') as string;
                const date = formData.get('date') as string;
                const time = formData.get('time') as string;
                
                if (!auth.currentUser) {
                  alert("الرجاء تسجيل الدخول لحجز طاولة");
                  navigate('/');
                  return;
                }
                if (!date || !time) {
                  alert("الرجاء تحديد التاريخ والوقت");
                  return;
                }

                try {
                   const { addDoc, serverTimestamp, collection } = await import('firebase/firestore');
                   await addDoc(collection(db, 'reservations'), {
                     userId: auth.currentUser.uid,
                     restaurantId: restaurant.id,
                     guestsCount: parseInt(guestsStr) || 1,
                     date,
                     time,
                     status: 'pending',
                     createdAt: serverTimestamp(),
                     updatedAt: serverTimestamp()
                   });
                   alert('تم الحجز بنجاح!');
                   setShowReservation(false);
                } catch(err: any) {
                   console.error(err);
                   alert("فشل الحجز: " + err.message);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">عدد الأشخاص</label>
                  <select name="guests" className="w-full border border-white/10 rounded-[16px] px-4 py-3 bg-white/5 text-white focus:ring-2 ring-secondary/50 outline-none appearance-none">
                    <option value="1" className="bg-dark">1 شخص</option>
                    <option value="2" className="bg-dark">2 أشخاص</option>
                    <option value="3" className="bg-dark">3 أشخاص</option>
                    <option value="4" className="bg-dark">4 أشخاص</option>
                    <option value="5" className="bg-dark">5+ أشخاص</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">التاريخ</label>
                    <input name="date" type="date" required className="w-full border border-white/10 rounded-[16px] px-4 py-3 bg-white/5 text-white focus:ring-2 ring-secondary/50 outline-none color-scheme-dark" style={{ colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-2">الوقت</label>
                    <input name="time" type="time" required className="w-full border border-white/10 rounded-[16px] px-4 py-3 bg-white/5 text-white focus:ring-2 ring-secondary/50 outline-none color-scheme-dark" style={{ colorScheme: 'dark' }} />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-secondary text-white py-4 rounded-[20px] font-bold text-lg mt-8 shadow-[0_10px_30px_rgba(255,140,0,0.3)] hover:bg-secondary-light transition-colors border border-white/10"
                >
                  تأكيد الحجز
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
