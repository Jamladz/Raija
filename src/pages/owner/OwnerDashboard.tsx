import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { ChefHat, ShoppingBag, Settings, Plus, Edit2, Trash2, Home, CheckCircle2, X, Image as ImageIcon, MapPin, Bell, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, ALGERIAN_DRINKS } from '../../lib/data';
import { ALGERIA_WILAYAS, MUNICIPALITIES } from '../../lib/locationData';

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', description: '', image: '' });
  const [offers, setOffers] = useState<any[]>([]);
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [newOffer, setNewOffer] = useState({ title: '', description: '', discountValue: '', image: '' });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  const [needsInfo, setNeedsInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  // For Editing Restaurant
  const [editRestaurant, setEditRestaurant] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchDashboardData(user);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchDashboardData = async (userParam?: any) => {
    const user = userParam || auth.currentUser;
    if (!user) return;
    try {
      let restId = null;
      const q = query(collection(db, 'restaurants'), where('adminId', '==', user.uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        restId = snap.docs[0].id;
      }

      if (!restId) {
        setNeedsInfo(true);
        setLoading(false);
        return;
      }
      
      const restSnap = await getDoc(doc(db, 'restaurants', restId));
      if (restSnap.exists()) {
        setRestaurant({ id: restSnap.id, ...restSnap.data() });
      }

      const subSnap = await getDoc(doc(db, 'subscriptions', restId));
      if (subSnap.exists()) {
        setSubscription({ id: subSnap.id, ...subSnap.data() });
      }
      
      const menuSnap = await getDocs(collection(db, 'restaurants', restId, 'menuItems'));
      setMenuItems(menuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const offersSnap = await getDocs(collection(db, 'restaurants', restId, 'offers'));
      setOffers(offersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Listen to active orders
      const ordersQuery = query(collection(db, 'orders'), where('restaurantId', '==', restId));
      onSnapshot(ordersQuery, (snap) => {
         const ords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         ords.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
         
         // Highlight new orders
         setOrders(prevOrders => {
           if (prevOrders.length > 0 && ords.length > prevOrders.length) {
              const newO = ords.filter(o => !prevOrders.find(po => po.id === o.id));
              if (newO.length > 0) {
                 setNotifications(prev => [...prev, ...newO.map((n: any) => `طلب جديد! #${n.id.slice(-6).toUpperCase()} بـ ${n.totalAmount} د.ج`)]);
                 if (activeTab !== 'orders') {
                    setUnreadOrders(prev => prev + newO.length);
                 }
                 setTimeout(() => {
                   setNotifications(prev => prev.slice(1));
                 }, 5000); // Disappear after 5 seconds
              }
           }
           return ords;
         });
      }, (error) => {
        console.error("Orders Snapshot Error:", error);
        alert("Firestore Orders Error: " + error.message);
      });
      
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const handleCategoryToggle = (catName: string) => {
     if (selectedCategories.includes(catName)) {
        setSelectedCategories(selectedCategories.filter(c => c !== catName));
     } else {
        setSelectedCategories([...selectedCategories, catName]);
     }
  };

  const handleCompleteInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const phone = formData.get('phone') as string;
    const googleMapsUrl = formData.get('googleMapsUrl') as string;
    const wilaya = formData.get('wilaya') as string;
    const municipality = formData.get('municipality') as string;
    
    if (!name || !location || !phone || !wilaya || !municipality) return;
    if (selectedCategories.length === 0) {
      alert("الرجاء اختيار تصنيف واحد على الأقل");
      return;
    }
    
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      
      const newRestId = `rest_${Date.now()}`;
      await setDoc(doc(db, 'restaurants', newRestId), {
        name,
        location,
        phone,
        googleMapsUrl: googleMapsUrl || null,
        categories: selectedCategories,
        wilaya,
        municipality,
        adminId: user.uid,
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=150',
        coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800',
        isOpen: false,
        rating: 0,
        reviewCount: 0
      });
      
      await setDoc(doc(db, 'subscriptions', newRestId), {
        restaurantId: newRestId,
        status: 'trial',
        plan: 'free',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setNeedsInfo(false);
      fetchDashboardData(user);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
     try {
       await updateDoc(doc(db, 'orders', orderId), {
         status,
         updatedAt: serverTimestamp()
       });
     } catch (e) {
       console.error(e);
     }
  };

  const handleToggleAcceptingOrders = async () => {
    try {
      const newStatus = !restaurant.acceptingOrders;
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        acceptingOrders: newStatus,
        updatedAt: serverTimestamp()
      });
      setRestaurant({ ...restaurant, acceptingOrders: newStatus });
    } catch (e: any) {
      alert("خطأ: " + e.message);
    }
  };

  const handleSaveSettings = async () => {
    if (!editRestaurant) return;
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        name: editRestaurant.name,
        location: editRestaurant.location,
        phone: editRestaurant.phone,
        wilaya: editRestaurant.wilaya || null,
        municipality: editRestaurant.municipality || null,
        googleMapsUrl: editRestaurant.googleMapsUrl || null,
        coverImage: editRestaurant.coverImage,
        workingHours: editRestaurant.workingHours || null,
        workingDays: editRestaurant.workingDays || [],
        deliveryFee: editRestaurant.deliveryFee || 0,
        updatedAt: serverTimestamp()
      });
      setRestaurant({ ...restaurant, ...editRestaurant });
      alert("تم حفظ الإعدادات بنجاح");
    } catch (e: any) {
      alert("خطأ: " + e.message);
    }
    setIsSavingSettings(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">جاري التحميل...</div>;
  }

  if (needsInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg">
           <h2 className="text-2xl font-black text-gray-900 mb-2">أكمل بيانات مطعمك 🚀</h2>
           <p className="text-gray-500 mb-6 font-medium">الرجاء إدخال معلومات المطعم للبدء بتلقي الطلبات. سيتم مراجعة حسابك من طرف الإدارة بعد الإكمال.</p>
           
           <form onSubmit={handleCompleteInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المطعم</label>
                <input name="name" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" placeholder="مثال: مطعم البركة" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الولاية</label>
                  <select 
                    id="newWilaya"
                    name="wilaya" 
                    required 
                    onChange={(e) => {
                      const munSelect = document.getElementById('newMunicipality') as HTMLSelectElement;
                      if(munSelect) {
                         const muns = MUNICIPALITIES[e.target.value] || [];
                         munSelect.innerHTML = '<option value="">اختر البلدية</option>' + muns.map(m => `<option value="${m}">${m}</option>`).join('');
                         munSelect.disabled = muns.length === 0;
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900"
                  >
                    <option value="">اختر الولاية</option>
                    {ALGERIA_WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">البلدية</label>
                  <select 
                    id="newMunicipality"
                    name="municipality" 
                    required 
                    disabled 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900 disabled:opacity-50"
                  >
                    <option value="">اختر البلدية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الموقع (العنوان كاملاً)</label>
                <input name="location" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" placeholder="الجزائر العاصمة..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رابط خريطة جوجل (اختياري)</label>
                <input name="googleMapsUrl" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900 text-left" dir="ltr" placeholder="https://maps.app.goo.gl/..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <input name="phone" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900 text-left" dir="ltr" placeholder="0550..." />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تصنيفات المطعم (اختر ما يناسبك)</label>
                <div className="flex flex-wrap gap-2">
                   {CATEGORIES.map(cat => (
                     <button
                       type="button"
                       key={cat.id}
                       onClick={() => handleCategoryToggle(cat.name)}
                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                         selectedCategories.includes(cat.name)
                           ? 'bg-primary/10 border-primary text-primary shadow-sm'
                           : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                       }`}
                     >
                       <span>{cat.icon}</span> {cat.name}
                     </button>
                   ))}
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg mt-6 shadow-[0_8px_20px_rgba(139,0,0,0.2)] hover:bg-primary-dark hover:-translate-y-1 transition-all">حفظ وإرسال للمراجعة</button>
           </form>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">حدث خطأ. الرجاء المحاولة لاحقاً.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0" dir="rtl">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-dark text-white p-4 flex justify-between items-center sticky top-0 z-40 border-b border-white/10">
         <div className="flex items-center gap-3">
           <img src={restaurant.logo || "https://via.placeholder.com/50"} className="w-10 h-10 rounded-xl bg-white/10 p-1" />
           <h2 className="text-lg font-black truncate max-w-[150px]">{restaurant.name}</h2>
         </div>
         <button onClick={() => navigate('/')} className="p-2 border border-white/20 rounded-xl hover:bg-white/10">
           <Home className="w-5 h-5 text-white/80" />
         </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden md:flex w-72 bg-dark text-white border-l border-white/10 p-6 flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-8">
           <img src={restaurant.logo || "https://via.placeholder.com/50"} className="w-14 h-14 rounded-2xl bg-white/10 p-1" />
           <div>
             <h2 className="text-xl font-black">{restaurant.name}</h2>
             <p className="text-xs text-secondary font-bold mt-1">{subscription?.status === 'active' ? 'اشتراك مفعل' : 'اشتراك منتهي'}</p>
           </div>
        </div>
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveTab('orders'); setUnreadOrders(0); }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'orders' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3"><ShoppingBag className="w-5 h-5" /> الطلبات النشطة</div>
            {unreadOrders > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadOrders}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'menu' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ChefHat className="w-5 h-5" /> إدارة المنيو
          </button>
          <button 
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'offers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Plus className="w-5 h-5" /> إدارة العروض
          </button>
          <button 
            onClick={() => {
               setActiveTab('settings');
               if (!editRestaurant) {
                 setEditRestaurant({ ...restaurant });
               }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
              activeTab === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" /> إعدادات المطعم
          </button>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <button onClick={() => navigate('/')} className="text-white/50 hover:text-white flex items-center gap-2 px-4 py-2 mt-4">
             <Home className="w-5 h-5" /> العودة للرئيسية
          </button>
          <button onClick={async () => { const { logout } = await import('../../lib/firebase'); await logout(); navigate('/login'); }} className="text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 px-4 py-2 rounded-xl transition-colors">
             <LogOut className="w-5 h-5" /> تسجيل خروج
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around p-2 pb-6">
          <button 
            onClick={() => { setActiveTab('orders'); setUnreadOrders(0); }}
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] relative ${activeTab === 'orders' ? 'text-primary' : 'text-gray-400'}`}
          >
            <ShoppingBag className={`w-5 h-5 mb-1 ${activeTab === 'orders' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">الطلبات</span>
            {unreadOrders > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${activeTab === 'menu' ? 'text-primary' : 'text-gray-400'}`}
          >
            <ChefHat className={`w-5 h-5 mb-1 ${activeTab === 'menu' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold">المنيو</span>
          </button>
          <button 
            onClick={() => {
               setActiveTab('settings');
               if (!editRestaurant) {
                 setEditRestaurant({ ...restaurant });
               }
            }}
            className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${activeTab === 'settings' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Settings className={`w-5 h-5 mb-1 flex-shrink-0 ${activeTab === 'settings' ? 'fill-primary/20' : ''}`} />
            <span className="text-[10px] font-bold h-3">الإعدادات</span>
          </button>
          <button 
            onClick={async () => { const { logout } = await import('../../lib/firebase'); await logout(); navigate('/login'); }}
            className="flex flex-col items-center p-2 rounded-xl min-w-[60px] text-red-500"
          >
            <LogOut className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">خروج</span>
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 relative min-w-0">
        
        {/* Toast Notifications */}
        <div className="fixed top-8 left-8 z-50 flex flex-col gap-2">
           <AnimatePresence>
             {notifications.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-primary text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3"
                >
                   <Bell className="w-5 h-5 animate-pulse" />
                   {msg}
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
        
        {/* Subscription Banner */}
        {subscription?.status !== 'active' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-8 flex items-center justify-between border border-red-100">
             <div className="flex items-center gap-3">
               <strong className="font-black">تنبيه!</strong>
               اشتراكك منتهي الصلاحية، الرجاء التواصل مع الإدارة لتجديد الاشتراك لتلقي الطلبات وإدارة منتجاتك.
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">الطلبات النشطة</h3>
              
              <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-xl shadow-sm border border-gray-100">
                <span className="font-bold text-sm text-gray-700">استقبال الطلبات:</span>
                <button 
                  onClick={handleToggleAcceptingOrders}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${restaurant.acceptingOrders !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <motion.div 
                    layout
                    className="w-6 h-6 bg-white rounded-full shadow-md"
                    animate={{ x: restaurant.acceptingOrders !== false ? -24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className="text-xs font-bold w-12 text-center text-gray-500">
                  {restaurant.acceptingOrders !== false ? 'مفتوح' : 'مغلق'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {orders.filter(o => !['cancelled', 'completed'].includes(o.status)).map(order => (
                 <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                       <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{order.status}</span>
                       <span className="text-sm font-bold text-gray-500">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    
                    {order.customerDetails && (
                      <div className="mb-4 bg-gray-50 p-3 rounded-xl text-sm space-y-2 border border-gray-100">
                         <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700">الزبون:</span>
                            <span className="font-bold text-primary">{order.customerDetails.name || 'غير محدد'}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700">رقم الهاتف:</span>
                            <span className="font-mono text-gray-600" dir="ltr">{order.customerDetails.phone}</span>
                         </div>
                         {order.type === 'delivery' && order.customerDetails.address && (
                            <div className="pt-2 mt-2 border-t border-gray-200">
                               <span className="font-bold text-gray-700 block mb-1">عنوان التوصيل:</span>
                               <span className="text-gray-600 text-xs leading-relaxed block">{order.customerDetails.address}</span>
                            </div>
                         )}
                         {order.type !== 'delivery' && (
                            <div className="pt-2 mt-2 border-t border-gray-200">
                               <span className="font-bold text-gray-700 block mb-1">نوع الطلب:</span>
                               <span className="text-gray-600 font-bold block">{order.type === 'pickup' ? 'استلام من المطعم' : 'طاولة'}</span>
                            </div>
                         )}
                      </div>
                    )}
                    
                    <div className="space-y-2 mb-4">
                       {order.items.map((it:any, i:number) => (
                         <div key={i} className="flex justify-between text-sm">
                           <span>{it.quantity}x {it.name}</span>
                           <span className="font-bold text-gray-600">{it.price * it.quantity} د.ج</span>
                         </div>
                       ))}
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center mb-6">
                       <span className="text-sm text-gray-500">الإجمالي:</span>
                       <span className="font-black text-lg text-primary">{order.totalAmount} د.ج</span>
                    </div>
                    <div className="flex gap-2">
                       {order.status === 'pending' && (
                         <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="flex-1 bg-gray-900 text-white font-bold py-2 rounded-xl text-sm">قبول الطلب</button>
                       )}
                       {order.status === 'accepted' && (
                         <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-secondary text-white font-bold py-2 rounded-xl text-sm">بدء التحضير</button>
                       )}
                       {order.status === 'preparing' && (
                         <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="flex-1 bg-primary text-white font-bold py-2 rounded-xl text-sm">تسليم للمندوب</button>
                       )}
                       {order.status === 'delivering' && (
                         <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-green-500 text-white font-bold py-2 rounded-xl text-sm">تم التوصيل</button>
                       )}
                       <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100">إلغاء</button>
                    </div>
                 </div>
               ))}
               {orders.filter(o => !['cancelled', 'completed'].includes(o.status)).length === 0 && (
                 <div className="col-span-full py-12 text-center text-gray-400 font-bold">لا يوجد طلبات نشطة حالياً</div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">المنيو</h3>
              <button disabled={subscription?.status !== 'active'} onClick={() => setIsAddingItem(true)} className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                 <Plus className="w-5 h-5" /> إضافة منتج
              </button>
            </div>
            
            <AnimatePresence>
              {(isAddingItem || editingItem) && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-gray-900">{editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
                      <button onClick={() => { setIsAddingItem(false); setEditingItem(null); setNewItem({ name: '', price: '', category: '', description: '', image: '' }); }} className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">صورة المنتج</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()} 
                          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer overflow-hidden relative"
                        >
                          {newItem.image ? (
                            <img src={newItem.image} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm font-bold text-gray-500">اضغط لرفع صورة</span>
                              <span className="text-xs text-gray-400 mt-1">يُفضل أقل من 1MB</span>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 400; // compress
                                  const scaleSize = MAX_WIDTH / img.width;
                                  canvas.width = MAX_WIDTH;
                                  canvas.height = img.height * scaleSize;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                                  setNewItem({ ...newItem, image: canvas.toDataURL('image/jpeg', 0.7) });
                                };
                                img.src = e.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنتج</label>
                          <input 
                            type="text" 
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full font-medium" 
                            value={newItem.name} 
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">السعر (د.ج)</label>
                          <input 
                            type="number" 
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full font-medium" 
                            value={newItem.price} 
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">التصنيف</label>
                          <select 
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full font-medium text-gray-900" 
                            value={newItem.category} 
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} 
                          >
                            <option value="">اختر تصنيفاً</option>
                            {CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                            <option value="other">آخر...</option>
                          </select>
                        </div>
                        
                        {!editingItem && newItem.category === 'مشروبات' && (
                          <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">إضافة مشروب سريع</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                               {ALGERIAN_DRINKS.map(drink => (
                                  <button
                                    key={drink.id}
                                    type="button"
                                    onClick={() => setNewItem({ ...newItem, name: drink.name, image: drink.image })}
                                    className="flex-shrink-0 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary/10 hover:border-primary/50 transition-all flex flex-col items-center gap-1 min-w-[80px]"
                                  >
                                    <span className="text-xl">{drink.icon}</span>
                                    {drink.name}
                                  </button>
                               ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
                          <textarea 
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full font-medium h-24 resize-none" 
                            value={newItem.description} 
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} 
                          />
                        </div>
                      </div>
                      
                      <button 
                        disabled={!newItem.name || !newItem.price}
                        onClick={async () => {
                          try {
                            if (editingItem) {
                              await updateDoc(doc(db, 'restaurants', restaurant.id, 'menuItems', editingItem.id), {
                                name: newItem.name,
                                price: parseFloat(newItem.price),
                                category: newItem.category || 'عام',
                                description: newItem.description,
                                image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500',
                                updatedAt: serverTimestamp()
                              });
                            } else {
                              await setDoc(doc(collection(db, 'restaurants', restaurant.id, 'menuItems')), {
                                name: newItem.name,
                                price: parseFloat(newItem.price),
                                category: newItem.category || 'عام',
                                restaurantId: restaurant.id,
                                description: newItem.description,
                                image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500',
                                createdAt: serverTimestamp(),
                                updatedAt: serverTimestamp()
                              });
                            }
                            setNewItem({ name: '', price: '', category: '', description: '', image: '' });
                            setIsAddingItem(false);
                            setEditingItem(null);
                            fetchDashboardData();
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }} 
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-4 shadow-lg disabled:opacity-50 hover:bg-primary-dark transition"
                      >
                        {editingItem ? 'حفظ التعديلات' : 'حفظ وإضافة للمنيو'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
               <table className="w-full">
                 <thead className="bg-gray-50 text-right">
                   <tr>
                     <th className="px-6 py-4 text-sm font-bold text-gray-600">المنتج</th>
                     <th className="px-6 py-4 text-sm font-bold text-gray-600">الوصف</th>
                     <th className="px-6 py-4 text-sm font-bold text-gray-600">التصنيف</th>
                     <th className="px-6 py-4 text-sm font-bold text-gray-600">السعر</th>
                     <th className="px-6 py-4 text-sm font-bold text-gray-600 w-24"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {menuItems.map(item => (
                     <tr key={item.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                           <span className="font-bold text-gray-900">{item.name}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={item.description}>{item.description}</td>
                       <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                       <td className="px-6 py-4 font-black text-secondary">{item.price} د.ج</td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <button onClick={() => {
                               setEditingItem(item);
                               setNewItem({
                                 name: item.name,
                                 price: item.price.toString(),
                                 category: item.category,
                                 description: item.description,
                                 image: item.image
                               });
                            }} className="p-2 text-gray-400 hover:text-primary transition bg-white shadow-sm border border-gray-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => {
                               if (confirm('هل أنت متأكد من حذف المنتج؟')) {
                                   deleteDoc(doc(db, 'restaurants', restaurant.id, 'menuItems', item.id)).then(() => fetchDashboardData());
                               }
                            }} className="p-2 text-gray-400 hover:text-red-500 transition bg-white shadow-sm border border-gray-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {menuItems.length === 0 && (
                     <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا يوجد منتجات في المنيو</td></tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && editRestaurant && (
          <div className="max-w-2xl bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">إعدادات المطعم</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">غلاف المطعم (صورة الواجهة)</label>
                <div 
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer overflow-hidden relative"
                  onClick={() => coverImageRef.current?.click()}
                >
                  {editRestaurant.coverImage ? (
                    <img src={editRestaurant.coverImage} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm font-bold text-gray-500">تغيير الصورة</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={coverImageRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setEditRestaurant({ ...editRestaurant, coverImage: e.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المطعم</label>
                <input 
                  type="text" 
                  value={editRestaurant.name}
                  onChange={(e) => setEditRestaurant({...editRestaurant, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الولاية</label>
                  <select 
                    value={editRestaurant.wilaya || ''}
                    onChange={(e) => setEditRestaurant({...editRestaurant, wilaya: e.target.value, municipality: ''})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900"
                  >
                    <option value="">اختر الولاية</option>
                    {ALGERIA_WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">البلدية</label>
                  <select 
                    value={editRestaurant.municipality || ''}
                    onChange={(e) => setEditRestaurant({...editRestaurant, municipality: e.target.value})}
                    disabled={!editRestaurant.wilaya}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900 disabled:opacity-50"
                  >
                    <option value="">اختر البلدية</option>
                    {editRestaurant.wilaya && MUNICIPALITIES[editRestaurant.wilaya]?.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">موقع المطعم (العنوان كاملاً)</label>
                <input 
                  type="text" 
                  value={editRestaurant.location}
                  onChange={(e) => setEditRestaurant({...editRestaurant, location: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <input 
                  type="text" 
                  value={editRestaurant.phone}
                  onChange={(e) => setEditRestaurant({...editRestaurant, phone: e.target.value})}
                  dir="ltr"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900 text-left" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رابط خريطة جوجل</label>
                <input 
                  type="text" 
                  value={editRestaurant.googleMapsUrl || ''}
                  onChange={(e) => setEditRestaurant({...editRestaurant, googleMapsUrl: e.target.value})}
                  dir="ltr"
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900 text-left" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">وقت الفتح (مثال: 08:00)</label>
                  <input 
                    type="time" 
                    value={editRestaurant.workingHours?.open || ''}
                    onChange={(e) => setEditRestaurant({...editRestaurant, workingHours: { ...editRestaurant.workingHours, open: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">وقت الإغلاق (مثال: 23:00)</label>
                  <input 
                    type="time" 
                    value={editRestaurant.workingHours?.close || ''}
                    onChange={(e) => setEditRestaurant({...editRestaurant, workingHours: { ...editRestaurant.workingHours, close: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">أيام العمل</label>
                  <div className="flex flex-wrap gap-2">
                    {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => {
                       const days = editRestaurant.workingDays || [];
                       const isSelected = days.includes(day);
                       return (
                         <button 
                           key={day} 
                           type="button" 
                           onClick={() => {
                             if (isSelected) {
                               setEditRestaurant({ ...editRestaurant, workingDays: days.filter((d:string) => d !== day) });
                             } else {
                               setEditRestaurant({ ...editRestaurant, workingDays: [...days, day] });
                             }
                           }}
                           className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                         >
                           {day}
                         </button>
                       );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">سعر التوصيل (د.ج) - اترك 0 للتوصيل المجاني</label>
                <input 
                  type="number" 
                  value={editRestaurant.deliveryFee || 0}
                  onChange={(e) => setEditRestaurant({...editRestaurant, deliveryFee: Number(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900" 
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-6 shadow-lg disabled:opacity-50 hover:bg-primary-dark transition"
              >
                {isSavingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">إدارة العروض</h3>
                <p className="text-gray-500 text-sm font-medium">أضف عروض وخصومات مميزة للزبائن</p>
              </div>
              <button 
                onClick={() => setIsAddingOffer(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary-dark transition shadow-lg shadow-primary/30"
              >
                <Plus className="w-5 h-5" /> إضافة عرض
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(offer => (
                <div key={offer.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={offer.image || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=150'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{offer.title}</h4>
                    <p className="text-xs text-gray-500 mb-2 truncate max-w-[200px]">{offer.description}</p>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md mb-2 inline-block text-xs font-bold text-left" dir="ltr">{offer.discountValue}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      if (confirm('حذف العرض؟')) {
                        await deleteDoc(doc(db, 'restaurants', restaurant.id, 'offers', offer.id));
                        setOffers(prev => prev.filter(o => o.id !== offer.id));
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition bg-gray-50 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {offers.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-gray-50">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">لا توجد عروض حالياً</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isAddingOffer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-md">
                     <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-bold">إضافة عرض جديد</h3>
                       <button onClick={() => setIsAddingOffer(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"><X className="w-5 h-5"/></button>
                     </div>
                     <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">عنوان العرض *</label>
                          <input required value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" placeholder="مثال: خصم 50% على البيتزا" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">تفاصيل العرض</label>
                          <input value={newOffer.description} onChange={e => setNewOffer({...newOffer, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" placeholder="مثال: صالح ليومين فقط!" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">قيمة الخصم المطلقة أو النسبة (مثال: -20% أو -500 د.ج)</label>
                          <input value={newOffer.discountValue} onChange={e => setNewOffer({...newOffer, discountValue: e.target.value})} dir="ltr" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-left" placeholder="-20%" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">صورة العرض (اختياري)</label>
                          <div 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setNewOffer({ ...newOffer, image: e.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}
                            className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer overflow-hidden relative"
                          >
                            {newOffer.image ? (
                              <img src={newOffer.image} className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-500">رفع صورة</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!newOffer.title) return alert('العنوان مطلوب');
                            const offerData = { ...newOffer, createdAt: serverTimestamp() };
                            const docRef = doc(collection(db, 'restaurants', restaurant.id, 'offers'));
                            await setDoc(docRef, offerData);
                            setOffers([{ id: docRef.id, ...offerData }, ...offers]);
                            setIsAddingOffer(false);
                            setNewOffer({ title: '', description: '', discountValue: '', image: '' });
                          }}
                          className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-4"
                        >حفظ العرض</button>
                     </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
