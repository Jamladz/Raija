import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerWithEmail, loginWithEmail, auth, logout } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { UserCircle, Mail, X } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailMode, setEmailMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [userType, setUserType] = useState<'customer' | 'owner'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Force sign out when landing on the login page to clear any old sessions
    // as per user request to not find a logged in account 'dkvago5@gmail.com'
    logout().catch(console.error);
  }, []);

  const openModal = (type: 'customer' | 'owner') => {
    setUserType(type);
    setEmailMode('login');
    setErrorMessage('');
    setShowEmailModal(true);
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (emailMode === 'register') {
        const displayName = userType === 'owner' ? 'Owner' : 'Customer';
        await registerWithEmail(email, password, displayName, userType);
        checkRoleAndRedirect(email, userType);
      } else if (emailMode === 'login') {
        await loginWithEmail(email, password);
        checkRoleAndRedirect(email, userType);
      } else if (emailMode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setErrorMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
        setEmailMode('login');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMessage("عذراً، هذا النوع من تسجيل الدخول غير مفعل. الرجاء تفعيله من إعدادات Firebase.");
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage("البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.");
        setEmailMode('login');
      } else if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        setErrorMessage("بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.");
      } else {
        setErrorMessage(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkRoleAndRedirect = (userEmail: string, type: 'customer' | 'owner') => {
    if (userEmail.toLowerCase() === 'sekanedrmessaif@gmail.com'.toLowerCase()) {
      navigate('/admin');
    } else {
      if (type === 'owner') {
        navigate('/owner');
      } else {
        navigate('/home');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=1000&auto=format&fit=crop)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center w-full max-w-md px-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(139,0,0,0.6)] border-4 border-primary-light">
            <span className="text-4xl font-bold text-white tracking-wider">J<span className="text-secondary">b</span></span>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-white mb-4"
        >
          جيبلي - Jibli
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-300 text-lg mb-12 font-medium"
        >
          {t('welcome')}
        </motion.p>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-4"
        >
          <button 
            onClick={() => navigate('/home')}
            className="w-full bg-white text-black py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-xl"
          >
            طلب كزائر
          </button>
          
          <button 
            onClick={() => openModal('customer')}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 text-white py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            <UserCircle className="w-6 h-6" />
            الدخول كزبون
          </button>
          
          <div className="relative py-4">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
             </div>
             <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-white/50">لأصحاب الأعمال</span>
             </div>
          </div>
          
          <button 
            onClick={() => openModal('owner')}
            className="w-full bg-white/5 backdrop-blur-md text-white/80 py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white transition-colors border border-white/10 text-base"
          >
            <Mail className="w-5 h-5" />
            دخول أصحاب المطاعم
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showEmailModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative"
              dir="rtl"
            >
              <button onClick={() => setShowEmailModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {emailMode === 'login' 
                  ? (userType === 'owner' ? 'دخول أصحاب المطاعم' : 'تسجيل الدخول') 
                  : emailMode === 'register' 
                    ? (userType === 'owner' ? 'تسجيل مطعم جديد' : 'إنشاء حساب زبون') 
                    : 'استعادة كلمة المرور'}
              </h2>
              <p className="text-gray-500 mb-6 font-medium text-sm">
                 {emailMode === 'login' ? 'مرحباً بعودتك! ادخل بياناتك للمتابعة.' : emailMode === 'register' ? 'إنشاء حساب جديد للتمتع بكافة الميزات.' : 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور.'}
              </p>
              
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mb-4">
                  {errorMessage}
                </div>
              )}
              
              <form onSubmit={handleEmailAction} className="space-y-4">
                <input 
                  type="email" 
                  placeholder="البريد الإلكتروني" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900"
                />
                
                {emailMode !== 'forgot' && (
                  <input 
                    type="password" 
                    placeholder="كلمة المرور" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-primary/50 text-gray-900"
                  />
                )}

                <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold mt-2 shadow-lg hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {isLoading ? 'جاري التحميل...' : emailMode === 'login' ? 'دخول' : emailMode === 'register' ? 'تسجيل' : 'إرسال الرابط'}
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 text-sm text-gray-500 font-bold items-center border-t border-gray-100 pt-4">
                {emailMode === 'login' && (
                  <>
                    <button onClick={() => setEmailMode('register')} className="text-primary hover:underline">إنشاء حساب جديد؟</button>
                    <button onClick={() => setEmailMode('forgot')} className="text-gray-400 hover:text-gray-700">نسيت كلمة المرور؟</button>
                  </>
                )}
                {(emailMode === 'register' || emailMode === 'forgot') && (
                  <button onClick={() => setEmailMode('login')} className="text-primary hover:underline">لدي حساب بالفعل، تسجيل الدخول</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
