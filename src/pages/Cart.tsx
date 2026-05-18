import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, CheckCircle2, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export default function Cart() {
  const navigate = useNavigate();
  const { items, restaurantId, removeItem, updateQuantity, getTotal, clearCart, userMunicipality } = useCartStore();
  const [orderType, setOrderType] = useState('delivery');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Checking out details
  const [customerName, setCustomerName] = useState(auth.currentUser?.displayName || '');
  const [municipality, setMunicipality] = useState(userMunicipality || '');
  const [neighborhood, setNeighborhood] = useState('');
  const [phone, setPhone] = useState(auth.currentUser?.phoneNumber || '');
  const [isLocating, setIsLocating] = useState(false);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  
  // Phone verification (Real via Firebase)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  useEffect(() => {
    if (restaurantId) {
      getDoc(doc(db, 'restaurants', restaurantId)).then((snap: any) => {
        if (snap.exists()) {
          setRestaurantData(snap.data());
        }
      });
    }
  }, [restaurantId]);

  const deliveryFee = restaurantData?.deliveryFee !== undefined ? restaurantData.deliveryFee : 250;
  const total = getTotal();
  const finalTotal = total + (orderType === 'delivery' ? deliveryFee : 0);

  const getLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
            const data = await res.json();
            
            const mun = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state || '';
            if (mun) {
               setMunicipality(mun);
            }
            const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
            if (road) {
               setNeighborhood(road);
            }
          } catch (error) {
            console.error(error);
            alert('تعذر جلب العنوان من الموقع.');
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error(error);
          setIsLocating(false);
          alert('تعذر تحديد الموقع، يرجى كتابة العنوان يدوياً.');
        }
      );
    } else {
      setIsLocating(false);
      alert('المتصفح لا يدعم تحديد الموقع.');
    }
  };

  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const processOrder = async () => {
    setIsLoading(true);
    try {
      const orderData = {
        restaurantId: restaurantId || 'rest_1',
        userId: auth.currentUser?.uid || 'guest',
        items: items,
        totalAmount: finalTotal,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        status: 'pending',
        type: orderType,
        paymentMethod: 'cash',
        customerDetails: {
           name: customerName,
           address: orderType === 'delivery' ? (municipality ? `${municipality} - ${neighborhood}` : neighborhood) : null,
           phone: phone
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(docRef.id);
      setCompletedOrderDetails({
        id: docRef.id,
        ...orderData,
        createdAt: new Date(),
        restaurantName: restaurantData?.name || 'المطعم'
      });
      setIsSuccess(true);
      setShowVerifyModal(false);
      clearCart();
      window.scrollTo(0, 0);
    } catch(e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
      setIsLoading(false);
      alert("حدث خطأ أثناء الطلب");
    }
  };

  const handleCheckout = async () => {
    if (!customerName) {
       alert("الرجاء إدخال اسمك");
       return;
    }
    if (orderType === 'delivery') {
       if (!municipality) {
          alert("الرجاء تحديد البلدية");
          return;
       }
       if (!neighborhood) {
          alert("الرجاء كتابة اسم الحي");
          return;
       }
    }
    if (!phone || phone.length < 9) {
       alert("الرجاء إدخال رقم هاتف صحيح");
       return;
    }
    
    if (!isVerified) {
       sendVerificationCode();
       return;
    }
    
    processOrder();
  };

  const sendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
      
      let formattedPhone = phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+213' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      const recaptchaVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowVerifyModal(true);
    } catch (error: any) {
      console.error("Error sending SMS", error);
      alert("حدث خطأ أثناء إرسال الكود. يرجى المحاولة لاحقاً وتأكد من تفعيل خدمة Phone Auth في مشروع Firebase الخاص بك.");
      
      // Fallback for demonstration if Phone Auth fails/is not enabled
      alert("للتجربة كعرض توضيحي فقط، سنقوم بإظهار المودال (الكود: 1234)");
      setShowVerifyModal(true);
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCodeAndProceed = async () => {
    // Check fallback
    if (!confirmationResult && verificationCode === '1234') {
       setIsVerified(true);
       processOrder();
       return;
    }

    if (!confirmationResult) {
      alert("حدث خطأ، يرجى إعادة المحاولة");
      return;
    }

    setIsVerifyingCode(true);
    try {
      await confirmationResult.confirm(verificationCode);
      setIsVerified(true);
      processOrder();
    } catch (error) {
       alert("الرمز غير صحيح، يرجى التأكد.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const downloadReceipt = async () => {
     if (receiptRef.current) {
        try {
           const html2canvas = (await import('html2canvas')).default;
           const canvas = await html2canvas(receiptRef.current, { scale: 2 });
           const dataUrl = canvas.toDataURL('image/png');
           const link = document.createElement('a');
           link.download = `receipt-${orderId}.png`;
           link.href = dataUrl;
           link.click();
        } catch (err) {
           console.error("Error creating receipt", err);
           alert("حدث خطأ أثناء حفظ الفاتورة");
        }
     }
  };

  if (isSuccess && orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
           <div ref={receiptRef} className="bg-white p-6 rounded-3xl shadow-xl relative overflow-hidden" dir="rtl">
              <div className="text-center mb-6 pt-4">
                 <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-1">تمت الطلبية بنجاح!</h2>
                 <p className="text-gray-500 text-sm">رقم الطلب: #{orderId.slice(-6).toUpperCase()}</p>
                 <p className="text-gray-500 font-bold mt-1 text-sm">{completedOrderDetails?.restaurantName}</p>
              </div>

              <div className="border-t border-dashed border-gray-200 py-4 mb-4">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">الاسم:</span>
                    <span className="font-bold text-gray-900">{completedOrderDetails?.customerDetails?.name}</span>
                 </div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">الهاتف:</span>
                    <span className="font-bold text-gray-900" dir="ltr">{completedOrderDetails?.customerDetails?.phone}</span>
                 </div>
                 {completedOrderDetails?.type === 'delivery' && (
                   <div className="flex justify-between items-center mb-2 text-left">
                      <span className="text-gray-500 text-sm whitespace-nowrap ml-4">التوصيل إلى:</span>
                      <span className="font-bold text-gray-900 text-sm truncate">{completedOrderDetails?.customerDetails?.address}</span>
                   </div>
                 )}
              </div>

              <div className="border-t border-dashed border-gray-200 py-4 mb-4">
                 <h4 className="font-bold text-gray-900 mb-3 text-sm">الطلبات</h4>
                 {completedOrderDetails?.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center mb-2 text-sm">
                       <span className="text-gray-700">{item.quantity}x {item.name}</span>
                       <span className="font-bold text-gray-900">{item.price * item.quantity} د.ج</span>
                    </div>
                 ))}
                 {completedOrderDetails?.type === 'delivery' && (
                   <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-gray-700">رسوم التوصيل</span>
                      <span className="font-bold text-gray-900">{completedOrderDetails.deliveryFee === 0 ? 'مجاني' : `${completedOrderDetails.deliveryFee} د.ج`}</span>
                   </div>
                 )}
              </div>

              <div className="border-t border-solid border-gray-900 py-4 pt-4 mt-2 flex justify-between items-center">
                 <span className="font-black text-gray-900 text-lg">المجموع الكلي</span>
                 <span className="font-black text-primary text-xl">{completedOrderDetails?.totalAmount} د.ج</span>
              </div>
           </div>
           
           <div className="mt-8 space-y-3">
              <button onClick={downloadReceipt} className="w-full bg-dark text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#111] transition-colors">
                 حفظ الفاتورة
              </button>
              <button onClick={() => navigate('/home')} className="w-full bg-white text-gray-700 font-bold py-4 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                 العودة للرئيسية
              </button>
              <button onClick={() => navigate(`/track/${orderId}`)} className="text-primary font-bold text-center block w-full mt-4 underline text-sm">
                 تتبع الطلب
              </button>
           </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gray-50 text-center" dir="rtl">
        <div className="w-32 h-32 bg-gray-200 rounded-full mb-6 opacity-50 flex items-center justify-center">
           <span className="text-5xl">🛒</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">السلة فارغة</h2>
        <p className="text-gray-500 mb-8">أضف بعض الأطباق اللذيذة من مطاعمك المفضلة</p>
        <button 
          onClick={() => navigate('/home')}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition"
        >
          اكتشف المطاعم
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">سلة المشتريات</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* Order Type Tabs */}
        <div className="bg-white p-1 rounded-2xl flex border border-gray-100 shadow-sm">
          {['delivery', 'pickup', 'dine_in'].map((type) => {
            const labels: any = { delivery: 'توصيل', pickup: 'استلام', dine_in: 'طاولة' };
            const isActive = orderType === type;
            return (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="space-y-4">

        {/* Customer Details */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">معلومات التوصيل والاتصال</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">الاسم الكريم <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="اسمك هنا..." 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">رقم الهاتف <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="tel" 
                placeholder="0550..." 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-12 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 ring-primary/20 text-left"
              />
            </div>
            {!isVerified && phone.length >= 9 && (
               <p className="text-xs text-orange-500 font-bold">سيتم إرسال كود تحقق لهذا الرقم</p>
            )}
            {isVerified && (
               <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                 <ShieldCheck className="w-4 h-4" /> رقم مؤكد
               </p>
            )}
          </div>

          {orderType === 'delivery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                 <label className="text-sm font-bold text-gray-700">التوصيل إلى <span className="text-red-500">*</span></label>
                 <button 
                  onClick={getLocation} 
                  disabled={isLocating}
                  className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/20 transition disabled:opacity-50"
                 >
                  <MapPin className="w-3 h-3" />
                  {isLocating ? 'جاري التحديد...' : 'تحديد موقعي'}
                 </button>
              </div>
              <div className="flex gap-3">
                 <div className="flex-1 space-y-2">
                   <label className="text-xs font-bold text-gray-500 block">البلدية</label>
                   <input 
                     type="text"
                     placeholder="مثال: القبة" 
                     value={municipality}
                     onChange={(e) => setMunicipality(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 ring-primary/20"
                   />
                 </div>
                 <div className="flex-[2] space-y-2">
                   <label className="text-xs font-bold text-gray-500 block">الحي (إجباري)</label>
                   <input 
                     type="text"
                     placeholder="اسم الحي / الشارع / المبنى" 
                     value={neighborhood}
                     onChange={(e) => setNeighborhood(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 ring-primary/20"
                   />
                 </div>
              </div>
            </div>
          )}
        </div>

          <AnimatePresence>
            {items.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 50 }}
                key={item.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 bg-gray-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-black text-primary">{item.price} د.ج</span>
                    <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      <button 
                        onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-md bg-white text-gray-800 flex items-center justify-center shadow-sm disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md bg-white text-gray-800 flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Promo Code */}
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="كوبون خصم" 
            className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 font-medium text-sm focus:outline-none focus:ring-2 ring-primary/20 shadow-sm"
          />
          <button className="bg-black text-white px-6 rounded-xl font-bold text-sm shrink-0 shadow-sm">تطبيق</button>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500">
            <span>المجموع</span>
            <span>{total} د.ج</span>
          </div>
          {orderType === 'delivery' && (
            <div className="flex justify-between items-center text-sm font-medium text-gray-500">
              <span>رسوم التوصيل</span>
              <span className={deliveryFee === 0 ? "text-green-500 font-bold" : ""}>
                {deliveryFee === 0 ? 'مجاني' : `${deliveryFee} د.ج`}
              </span>
            </div>
          )}
          <hr className="border-gray-100 my-4" />
          <div className="flex justify-between items-center">
            <span className="font-black text-gray-900 text-lg">المجموع النهائي</span>
            <span className="font-black text-primary text-xl">{finalTotal} د.ج</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button 
          onClick={handleCheckout}
          disabled={isLoading || isSendingCode}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(139,0,0,0.3)] hover:bg-primary-dark transition-colors disabled:opacity-70"
        >
          {isLoading ? 'جاري تأكيد الطلب...' : isSendingCode ? 'جاري إرسال الكود...' : `تأكيد الطلب (${finalTotal} د.ج) - الدفع عند الاستلام`}
        </button>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
             <motion.div
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-white rounded-3xl p-6 w-full max-w-sm"
             >
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-center mb-2">تأكيد رقم الهاتف</h3>
                <p className="text-sm text-gray-500 text-center mb-6">لقد أرسلنا كود التفعيل إلى الرقم {phone}</p>
                <input 
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  dir="ltr"
                  className="w-full text-center text-3xl tracking-[1em] font-black bg-gray-50 border border-gray-200 rounded-xl py-4 focus:outline-none focus:ring-2 ring-primary mb-4"
                />
                <div className="flex gap-2">
                   <button 
                     onClick={() => setShowVerifyModal(false)}
                     className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 rounded-xl"
                   >
                     إلغاء
                   </button>
                   <button 
                     onClick={verifyCodeAndProceed}
                     disabled={isVerifyingCode || verificationCode.length < 4}
                     className="flex-1 py-3 font-bold text-white bg-primary rounded-xl disabled:opacity-50"
                   >
                     {isVerifyingCode ? 'جاري التأكيد...' : 'تأكيد'}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div id="recaptcha-container"></div>
    </div>
  );
}
