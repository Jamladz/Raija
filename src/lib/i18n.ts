import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: {
      "welcome": "اطلب وجبتك أو احجز طاولتك في ثوان",
      "login_google": "تسجيل بواسطة Google",
      "login_guest": "دخول كضيف",
      "search": "بحث...",
      "pizza": "بيتزا",
      "burger": "برغر",
      "shawarma": "شاورما",
      "grill": "مشويات",
      "sweets": "حلويات",
      "cafe": "مقاهي",
      "healthy": "أكلات صحية",
      "algerian": "أكلات جزائرية",
      "today_offers": "عروض اليوم",
      "free_delivery": "توصيل مجاني",
      "top_rated": "الأعلى تقييماً",
      "nearby": "مطاعم قريبة",
      "cart": "السلة",
      "total": "المجموع",
      "delivery": "توصيل",
      "pickup": "استلام",
      "reserve": "حجز طاولة"
    }
  },
  fr: {
    translation: {
      "welcome": "Commandez votre repas ou réservez en quelques secondes",
      // ... more translations
    }
  },
  en: {
    translation: {
      "welcome": "Order your meal or reserve a table in seconds",
      // ... more translations
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ar", // Default to Arabic
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
