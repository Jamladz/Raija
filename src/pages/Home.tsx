import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, Star, Clock, Bike, Heart, RefreshCw } from 'lucide-react';
import { CATEGORIES } from '../lib/data';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCartStore } from '../lib/store';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const { favorites, toggleFavorite, userMunicipality } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [homeOffers, setHomeOffers] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('rating'); // rating, deliveryTime
  
  const [locationName, setLocationName] = useState('جاري تحديد موقعك...');
  const [isLocating, setIsLocating] = useState(false);

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await res.json();
            
            const municipality = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state || '';
            
            if (municipality) {
               setLocationName(municipality);
               useCartStore.getState().setUserMunicipality(municipality);
            } else if (data.display_name) {
               const parts = data.display_name.split(',');
               const inferredMun = parts.length > 2 ? parts[parts.length - 3].trim() : parts[0].trim();
               setLocationName(inferredMun);
               useCartStore.getState().setUserMunicipality(inferredMun);
            } else {
               setLocationName('موقعك الحالي');
            }
          } catch (error) {
            console.error(error);
            setLocationName('موقعك مجهول');
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error(error);
          setLocationName('لم نتمكن من تحديد موقعك');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationName('البحث عن الموقع غير مدعوم');
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchLocation();
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const snap = await getDocs(collectionGroup(db, 'offers'));
      setHomeOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 3));
    } catch (e) {
      console.error("Error fetching offers", e);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const q = query(collection(db, 'restaurants'), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      setRestaurants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching restaurants", e);
    }
  };

  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];
    
    // Filter by municipality if available
    if (userMunicipality) {
      // Allow partial match in case of slight spelling differences
      filtered = filtered.filter(r => 
        !r.municipality || 
        r.municipality.toLowerCase().includes(userMunicipality.toLowerCase()) || 
        userMunicipality.toLowerCase().includes(r.municipality.toLowerCase())
      );
    }
    
    if (showFavorites) {
      filtered = filtered.filter(r => favorites.includes(r.id));
    }
    
    // Only show approved restaurants (or those without a status flag like legacy restaurants)
    filtered = filtered.filter(r => !r.status || r.status === 'approved');
    
    if (selectedCategory) {
      filtered = filtered.filter(r => r.categories?.includes(selectedCategory));
    }
    
    if (searchQuery) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'deliveryTime') {
        const getMins = (str: string) => parseInt(str?.split('-')[0] || '0');
        return getMins(a.deliveryTime) - getMins(b.deliveryTime);
      }
      return 0;
    });
    
    return filtered;
  }, [restaurants, showFavorites, selectedCategory, searchQuery, sortBy, favorites, userMunicipality]);

  const isRestaurantOpen = (rest: any) => {
    if (rest.acceptingOrders === false) return false;
    if (rest.workingHours?.open && rest.workingHours?.close) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = rest.workingHours.open.split(':').map(Number);
      const [closeH, closeM] = rest.workingHours.close.split(':').map(Number);
      
      const openMinutes = openH * 60 + openM;
      let closeMinutes = closeH * 60 + closeM;
      if (closeMinutes < openMinutes) closeMinutes += 24 * 60;
      
      let checkMinutes = currentMinutes;
      if (checkMinutes < openMinutes && closeMinutes > 24 * 60) checkMinutes += 24 * 60;
      
      if (checkMinutes < openMinutes || checkMinutes > closeMinutes) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen pb-8 rounded-b-[40px]" dir="rtl">
      <header className="px-6 pt-10 pb-4 stick top-0 z-40 bg-[#0F0F0F] rounded-b-3xl shadow-sm border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div className="text-white flex items-center gap-3 cursor-pointer group" onClick={fetchLocation}>
            <div className="bg-primary/20 p-2.5 rounded-2xl flex items-center justify-center">
              <MapPin className={`w-5 h-5 text-primary ${isLocating ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
            </div>
            <div>
              <p className="text-[11px] text-white/50 font-bold flex items-center gap-1 mb-1">
                التوصيل إلى
                {isLocating && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
              </p>
              <p className="text-sm font-black truncate max-w-[160px] text-white/90">{locationName}</p>
            </div>
          </div>
          <div 
            className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all border border-white/5"
            onClick={() => navigate('/profile')}
          >
            <span className="text-xs font-black text-white px-2">انا</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="عن ماذا تبحث اليوم؟ (بيتزا، برغر...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 text-white placeholder:text-white/40 rounded-2xl py-4 pr-14 pl-4 focus:outline-none focus:ring-1 focus:ring-primary border border-white/10 transition-all font-medium text-sm"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
        </div>
      </header>


      {/* Offers Banner */}
      <div className="px-6 mt-6">
        {homeOffers.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 scrollbar-hide snap-x">
            {homeOffers.map((offer, i) => (
              <motion.div 
                key={offer.id}
                whileTap={{ scale: 0.98 }}
                className={`min-w-[280px] w-full snap-center bg-gradient-to-r ${i % 2 === 0 ? 'from-red-600 to-red-900' : 'from-indigo-600 to-indigo-900'} rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden h-36 flex items-center border border-white/5`}
              >
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 w-2/3">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold mb-2 inline-block" dir="ltr">{offer.discountValue}</span>
                  <h2 className="text-xl font-black mb-1 leading-tight">{offer.title}</h2>
                  <p className="text-xs font-medium text-white/80 line-clamp-2">{offer.description}</p>
                </div>
                <div className="absolute left-[-20px] top-0 bottom-0 w-[60%] opacity-80 pointer-events-none">
                   <img src={offer.image || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500"} alt="offer" className="object-cover w-full h-full mix-blend-overlay" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            whileHover={{ scale: 0.98 }}
            className="bg-gradient-to-r from-red-600 to-red-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden h-36 flex items-center border border-white/5"
          >
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 w-2/3">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold mb-2 inline-block">جديد</span>
              <h2 className="text-2xl font-black mb-1 leading-tight">توصيل مجاني</h2>
              <p className="text-xs font-medium text-white/80">على طلباتك الأولى معنا!</p>
            </div>
            <div className="absolute left-[-20px] top-0 bottom-0 w-[60%] opacity-80 pointer-events-none">
               <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500" alt="burger" className="object-cover w-full h-full mix-blend-overlay" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Categories */}
      <div className="mt-8">
        <div className="px-6 flex justify-between items-end mb-4">
          <h3 className="text-xl font-black text-white/90">اكتشف</h3>
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`text-xs font-bold transition-colors ${selectedCategory === null ? 'text-primary' : 'text-white/40 hover:text-white/80'}`}
          >
            عرض الكل
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 px-6 pb-2 scrollbar-hide snap-x">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
              whileTap={{ scale: 0.95 }}
              key={cat.id}
              className="flex flex-col items-center gap-2 min-w-[76px] snap-start"
            >
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl transition-all cursor-pointer ${selectedCategory === cat.name ? 'bg-primary text-white shadow-[0_4px_20px_rgba(200,30,30,0.3)]' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'}`}>
                <span>{cat.icon}</span>
              </div>
              <span className={`text-[11px] font-bold ${selectedCategory === cat.name ? 'text-white' : 'text-white/50'}`}>{cat.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="mt-8 px-6 flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-white/90">{showFavorites ? 'المفضلة لديك' : 'كل المطاعم'}</h3>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFavorites(!showFavorites)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showFavorites ? 'bg-red-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            <Heart className={`w-4 h-4 ${showFavorites ? 'fill-white' : ''}`} />
          </button>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-9 h-9 opacity-0 absolute pointer-events-none"
            id="sortBtn"
          >
            <option value="rating">تصفية: الأعلى تقييماً</option>
            <option value="deliveryTime">تصفية: الأسرع توصيلاً</option>
          </select>
          <label 
            htmlFor="sortBtn"
            className="w-9 h-9 bg-white/5 text-white/50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </label>
        </div>
      </div>

      {/* Popular Restaurants */}
      <div className="px-6 mb-20">
        <div className="space-y-4">
          {filteredRestaurants.map((rest) => {
            const isFav = favorites.includes(rest.id);
            return (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/restaurant/${rest.id}`)}
                key={rest.id} 
                className="bg-white rounded-[24px] overflow-hidden shadow-sm cursor-pointer relative group flex flex-col"
              >
                <div className="h-44 w-full relative">
                  <img src={rest.coverImage} alt={rest.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Favorite Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(rest.id); }}
                    className="absolute top-4 left-4 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-colors z-10"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                    <div>
                      <h4 className="font-black text-xl text-white mb-1">{rest.name}</h4>
                      <p className="text-xs text-white/80 font-medium">{rest.categories ? rest.categories.join(' • ') : 'وجبات سريعة'} {rest.municipality ? ` • ${rest.municipality}` : ''}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-white">{rest.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 bg-white flex justify-between items-center border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    {isRestaurantOpen(rest) ? (
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                    <span className={`text-xs font-bold ${isRestaurantOpen(rest) ? 'text-green-600' : 'text-red-500'}`}>
                      {isRestaurantOpen(rest) ? 'مفتوح الآن' : 'مغلق'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{rest.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                      <Bike className="w-3.5 h-3.5" />
                      <span>{rest.deliveryFee === 0 ? 'توصيل مجاني' : `${rest.deliveryFee} د.ج`}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
          {filteredRestaurants.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-white/80 font-bold mb-1">لا توجد نتائج</h3>
              <p className="text-white/40 text-sm">لم نجد مطاعم مطابقة لبحثك في منطقتك.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
