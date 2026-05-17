import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, logout } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Settings, Users, Store, CreditCard, Menu, X, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app we'd check if `auth.currentUser` is superAdmin
    // For now we assume if they can see this, they are admin
    if (auth.currentUser?.email?.toLowerCase() !== 'sekanedrmessaif@gmail.com'.toLowerCase()) {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const restSnapshot = await getDocs(collection(db, 'restaurants'));
      const restData = restSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(restData);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (e: any) {
      console.error("Firestore error in AdminDashboard:", e.message);
      alert("Firestore error: " + e.message);
    }
  };

  const handleActivateSubscription = async (restaurantId: string, durationMonths: number) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    try {
      await setDoc(doc(db, 'subscriptions', restaurantId), {
        restaurantId,
        status: 'active',
        plan: 'pro',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Subscription activated successfully');
    } catch (e) {
      console.error(e);
      alert('Error activating subscription');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-black text-primary">لوحة الإدارة</h2>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
          <X className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 space-y-2">
        <button 
          onClick={() => { setActiveTab('restaurants'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'restaurants' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Store className="w-5 h-5" /> المطاعم
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Users className="w-5 h-5" /> المستخدمين
        </button>
        <button 
          onClick={() => { setActiveTab('subscriptions'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'subscriptions' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-5 h-5" /> الاشتراكات
        </button>
        <div className="my-6 border-t border-gray-100"></div>
        <button 
          onClick={() => navigate('/home')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <LayoutDashboard className="w-5 h-5" /> العودة للتطبيق
        </button>
      </nav>
      <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all">
        <LogOut className="w-5 h-5" /> تسجيل خروج
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center px-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 bg-gray-50 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 mr-4">لوحة الإدارة</h1>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Desktop & Mobile */}
      <div className={`fixed inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 p-6 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 mt-16 md:mt-0 overflow-x-hidden">
        {activeTab === 'restaurants' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">إدارة المطاعم</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 text-right">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">اسم المطعم</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">موقع</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">هاتف</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {restaurants.map(rest => (
                    <tr key={rest.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={rest.logo || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          <span className="font-bold text-gray-900">{rest.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{rest.location || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm" dir="ltr">{rest.phone || '-'}</td>
                      <td className="px-6 py-4">
                        {rest.status === 'pending' ? (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">قيد المراجعة</span>
                        ) : rest.status === 'approved' ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">مقبول</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{rest.status || 'نشط'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {rest.status === 'pending' && (
                            <>
                              <button 
                                className="text-white bg-green-500 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-600 transition" 
                                onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, 'restaurants', rest.id), { 
                                      status: 'approved',
                                      adminId: rest.adminId,
                                      createdAt: rest.createdAt,
                                      updatedAt: serverTimestamp()
                                    });
                                    fetchData();
                                  } catch (err: any) {
                                    alert(err.message);
                                  }
                                }}
                              >
                                قبول
                              </button>
                              <button 
                                className="text-white bg-red-500 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-600 transition" 
                                onClick={async () => {
                                  if(confirm('هل أنت متأكد من رفض هذا المطعم؟')) {
                                    try {
                                      await updateDoc(doc(db, 'restaurants', rest.id), { 
                                        status: 'rejected',
                                        adminId: rest.adminId,
                                        createdAt: rest.createdAt,
                                        updatedAt: serverTimestamp()
                                      });
                                      fetchData();
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }
                                }}
                              >
                                رفض
                              </button>
                            </>
                          )}
                          <div className="flex flex-col gap-1">
                             <button className="text-primary text-xs font-bold hover:underline" onClick={() => handleActivateSubscription(rest.id, 1)}>
                               تفعيل اشتراك
                             </button>
                             <button className="text-red-500 text-xs font-bold hover:underline" onClick={async () => {
                                if(confirm('إلغاء الاشتراك؟')) {
                                   try {
                                     await updateDoc(doc(db, 'subscriptions', rest.id), { status: 'inactive' });
                                     alert('تم إيقاف الاشتراك');
                                   } catch(e) { }
                                }
                             }}>
                               إلغاء الاشتراك
                             </button>
                             <button className="text-blue-500 text-xs font-bold hover:underline" onClick={async () => {
                                const email = prompt('ادخل البريد الإلكتروني للمطعم لإرسال رابط إعادة تعيين كلمة المرور');
                                if (email) {
                                  try {
                                    await sendPasswordResetEmail(auth, email);
                                    alert('تم إرسال رابط التعيين');
                                  } catch(e:any) {
                                    alert('خطأ: ' + e.message);
                                  }
                                }
                             }}>
                               استرجاع كلمة السر
                             </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {restaurants.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا يوجد مطاعم</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">إدارة المستخدمين</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 text-right">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">الاسم / البريد</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">الدور</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ التسجيل</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{u.displayName || '-'}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role === 'owner' ? 'صاحب مطعم' : 'زبون'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('ar-DZ') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-500 text-xs font-bold hover:underline" onClick={async () => {
                          if (u.email) {
                            try {
                              await sendPasswordResetEmail(auth, u.email);
                              alert('تم إرسال رابط التعيين');
                            } catch(e:any) {
                              alert('خطأ: ' + e.message);
                            }
                          } else {
                            prompt('المستخدم لا يملك بريد مقترن. ادخل البريد:');
                          }
                        }}>
                          استرجاع كلمة السر
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-500">لا يوجد مستخدمين</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
