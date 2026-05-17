import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { UserCircle, PackageOpen, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function Profile() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const userOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      userOrders.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setOrders(userOrders);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-gray-100 p-6 rounded-full text-gray-400 mb-6">
          <UserCircle className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">أنت تتصفح كزائر</h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          قم بتسجيل الدخول أو إنشاء حساب جديد للتمتع بكافة المزايا وتتبع طلباتك.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-primary text-white py-4 px-8 rounded-xl font-bold hover:bg-primary-dark transition shadow-lg"
        >
          تسجيل الدخول / إنشاء حساب
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-primary text-white pt-12 pb-24 px-6 rounded-b-[40px] relative">
         <div className="flex items-center mb-8">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
              <ChevronLeft className="w-6 h-6 rotate-180" />
           </button>
           <h1 className="text-xl font-bold mx-auto pr-8">حسابي</h1>
         </div>
         
         <div className="flex items-center gap-4">
           <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 backdrop-blur-md">
             <UserCircle className="w-10 h-10 text-white" />
           </div>
           <div>
             <h2 className="text-2xl font-bold">{user.displayName || 'زبون مميز'}</h2>
             <p className="text-white/70 text-sm mt-1">{user.email}</p>
           </div>
         </div>
      </div>

      <div className="px-6 -mt-12 space-y-6">
        
        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex justify-between items-center text-center">
           <div className="flex-1 border-l border-gray-100">
              <span className="block text-2xl font-black text-gray-900">{orders.length}</span>
              <span className="text-xs text-gray-500 font-bold">إجمالي الطلبات</span>
           </div>
           <div className="flex-1">
              <span className="block text-2xl font-black text-primary">0</span>
              <span className="text-xs text-gray-500 font-bold">نقاط الولاء</span>
           </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
           <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition">
             <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
                   <Settings className="w-5 h-5" />
                </div>
                <span className="font-bold text-gray-700">إعدادات الحساب</span>
             </div>
             <ChevronLeft className="w-5 h-5 text-gray-400" />
           </button>
           
           <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition mt-1">
             <div className="flex items-center gap-3">
                <div className="bg-red-50 text-red-500 p-2 rounded-xl">
                   <LogOut className="w-5 h-5" />
                </div>
                <span className="font-bold text-red-600">تسجيل الخروج</span>
             </div>
           </button>
        </div>

        {/* Order History */}
        <div>
           <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">الطلبات السابقة</h3>
           {orders.length > 0 ? (
             <div className="space-y-4">
               {orders.map((order) => (
                 <motion.div 
                   key={order.id}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => navigate('/cart')}
                   className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between"
                 >
                    <div className="flex items-center gap-4">
                       <div className="bg-gray-50 p-3 rounded-2xl">
                          <PackageOpen className="w-6 h-6 text-gray-400" />
                       </div>
                       <div>
                         <p className="font-bold text-gray-900">طلب #{order.id.slice(-6).toUpperCase()}</p>
                         <p className="text-xs text-gray-500 mt-1">
                           {order.createdAt?.toDate().toLocaleDateString('ar-DZ')}
                         </p>
                       </div>
                    </div>
                    <div className="text-left">
                       <p className="font-black text-primary">{order.totalAmount} د.ج</p>
                       <p className="text-xs text-gray-500 mt-1">{order.status === 'pending' ? 'قيد المعالجة' : order.status === 'completed' ? 'مكتمل' : 'نشط'}</p>
                    </div>
                 </motion.div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
               <PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
               <p className="text-gray-500 font-bold">لا توجد طلبات سابقة</p>
               <button onClick={() => navigate('/home')} className="text-primary text-sm font-bold mt-2 hover:underline">
                 تصفح المطاعم الآن
               </button>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
