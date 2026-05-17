import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CheckCircle2, Clock, ChefHat, Bike, PackageOpen, ArrowRight, MapPin } from 'lucide-react';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const STATUS_STEPS = [
  { id: 'pending', label: 'قيد الانتظار', icon: Clock },
  { id: 'accepted', label: 'تم القبول', icon: CheckCircle2 },
  { id: 'preparing', label: 'جاري التحضير', icon: ChefHat },
  { id: 'delivering', label: 'في الطريق', icon: Bike },
  { id: 'completed', label: 'تم التسليم', icon: PackageOpen },
];

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Order not found");
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
      setIsLoading(false);
    });

    return () => unsub();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">الطلب غير موجود</h2>
        <button onClick={() => navigate('/home')} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status) || 0;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-gray-50 min-h-screen pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-30">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">تتبع الطلب</h1>
      </div>

      <div className="p-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
           <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
                <p className="font-bold text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500 mb-1">المبلغ الإجمالي</p>
                <p className="font-black text-primary text-lg">{order.totalAmount + (order.deliveryFee || 0)} د.ج</p>
              </div>
           </div>

           {isCancelled ? (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 font-bold border border-red-100">
               <CheckCircle2 className="w-5 h-5 shrink-0" />
               تم إلغاء الطلب
             </div>
           ) : (
             <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.4rem] before:translate-x-[-50%] before:w-0.5 before:h-full before:bg-gray-100 rtl:before:mr-[1.4rem] rtl:before:-translate-x-0 rtl:before:ml-0">
               {STATUS_STEPS.map((step, idx) => {
                 const stepPast = idx < currentStepIndex;
                 const stepCurrent = idx === currentStepIndex;
                 const stepFuture = idx > currentStepIndex;
                 const Icon = step.icon;

                 return (
                   <div key={step.id} className="relative z-10 flex gap-4">
                     <div 
                       className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-4 border-white transition-colors duration-500 ${
                         stepPast || stepCurrent ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                       }`}
                     >
                        <Icon className="w-4 h-4" />
                     </div>
                     <div className="pt-2">
                       <p className={`font-bold transition-colors ${stepPast || stepCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                         {step.label}
                       </p>
                       {stepCurrent && (
                         <p className="text-sm text-gray-500 mt-1 animate-pulse">
                           {step.id === 'pending' ? 'ننتظر قبول المطعم' : step.id === 'preparing' ? 'يتم تجهيز طلبك الآن' : 'في الطريق إليك'}
                         </p>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">تفاصيل الطلب</h3>
          <div className="space-y-3">
             {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-xs">
                        {item.quantity}x
                      </div>
                      <span className="text-sm font-bold text-gray-800">{item.name}</span>
                   </div>
                   <span className="text-sm font-medium text-gray-600">{item.price * item.quantity} د.ج</span>
                </div>
             ))}
          </div>
        </div>

        {/* Live Delivery Map */}
        {!isCancelled && order.status === 'delivering' && hasValidKey && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-6 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
           >
             <h3 className="font-bold text-gray-900 mb-4 px-2 flex items-center gap-2">
               <Bike className="w-5 h-5 text-primary" />
               تتبع المندوب مباشر
             </h3>
             <div className="w-full h-64 rounded-2xl overflow-hidden relative">
               <APIProvider apiKey={API_KEY} version="weekly">
                 <Map
                   defaultCenter={{lat: 36.7538, lng: 3.0588}} // Basic center
                   defaultZoom={14}
                   mapId="DELIVERY_MAP_ID"
                   internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                   disableDefaultUI={true}
                 >
                   {/* Restaurant Marker */}
                   <AdvancedMarker position={{lat: 36.756, lng: 3.055}}>
                      <div className="bg-white p-2 border-2 border-primary rounded-full shadow-lg">
                         <ChefHat className="w-4 h-4 text-primary" />
                      </div>
                   </AdvancedMarker>
                   
                   {/* Driver Marker */}
                   <AdvancedMarker position={{lat: 36.7538, lng: 3.0588}}>
                      <div className="bg-secondary p-2 rounded-full shadow-lg animate-bounce">
                         <Bike className="w-4 h-4 text-white" />
                      </div>
                   </AdvancedMarker>

                   {/* User Marker */}
                   <AdvancedMarker position={{lat: 36.750, lng: 3.062}}>
                      <div className="bg-blue-500 p-2 border-2 border-white rounded-full shadow-lg">
                         <MapPin className="w-4 h-4 text-white" />
                      </div>
                   </AdvancedMarker>
                 </Map>
               </APIProvider>
             </div>
             <p className="text-center text-sm font-bold mt-4 text-gray-600">المندوب يصل خلال 15 دقيقة</p>
           </motion.div>
        )}
      </div>
    </div>
  );
}
