export const CATEGORIES = [
  { id: '1', name: 'بيتزا', icon: '🍕' },
  { id: '2', name: 'برغر', icon: '🍔' },
  { id: '3', name: 'شاورما', icon: '🥙' },
  { id: '4', name: 'مشويات', icon: '🥩' },
  { id: '5', name: 'حلويات', icon: '🍰' },
  { id: '6', name: 'مقاهي', icon: '☕' },
  { id: '7', name: 'أكلات صحية', icon: '🥗' },
  { id: '8', name: 'أكلات جزائرية', icon: '🍲' },
  { id: '9', name: 'مشروبات', icon: '🥤' },
];

export const ALGERIAN_DRINKS = [
  { id: 'coca', name: 'كوكا كولا', icon: '🥤', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500' },
  { id: 'pepsi', name: 'بيبسي', icon: '🥤', image: 'https://images.unsplash.com/photo-1629203851288-7ececec5f8ac?auto=format&fit=crop&w=500' },
  { id: 'selecto', name: 'حمود بوعلام (سيلكتو)', icon: '🍎', image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=500' },
  { id: 'hamoud_blanc', name: 'حمود بوعلام (أبيض)', icon: '🍋', image: 'https://images.unsplash.com/photo-1603394630850-69b36fd524b1?auto=format&fit=crop&w=500' },
  { id: 'mirinda', name: 'ميرندا', icon: '🍊', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=500' },
  { id: 'sevenup', name: 'سفن أب', icon: '🍋', image: 'https://images.unsplash.com/photo-1623190875960-b6f72c1c0a0c?auto=format&fit=crop&w=500' },
  { id: 'ifri', name: 'عصير إفري', icon: '🧃', image: 'https://images.unsplash.com/photo-1622597467836-f30c9f1acb0c?auto=format&fit=crop&w=500' },
  { id: 'rouiba', name: 'عصير رويبة', icon: '🥭', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500' },
  { id: 'water', name: 'ماء معدني', icon: '💧', image: 'https://images.unsplash.com/photo-1559839914-16aae821f57d?auto=format&fit=crop&w=500' },
  { id: 'tea', name: 'شاي', icon: '🫖', image: 'https://images.unsplash.com/photo-1544787219-7f47cc415cb9?auto=format&fit=crop&w=500' },
  { id: 'coffee', name: 'قهوة', icon: '☕', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500' },
];

export const RESTAURANTS = [
  {
    id: 'rest_1',
    name: 'التاج الذهبي للمشويات',
    coverImage: 'https://images.unsplash.com/photo-1544025162-811114bd4871?q=80&w=1000&auto=format&fit=crop',
    logo: 'https://api.dicebear.com/9.x/initials/svg?seed=Taj&backgroundColor=8B0000',
    location: 'الجزائر العاصمة، ديدوش مراد',
    phone: '0555 12 34 56',
    hours: '11:00 - 23:30',
    isOpen: true,
    deliveryFee: 250,
    deliveryTime: '30-45 دقيقة',
    rating: 4.8,
    reviewCount: 342,
    categories: ['مشويات', 'أكلات جزائرية']
  },
  {
    id: 'rest_2',
    name: 'بيتزا نابولي',
    coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    logo: 'https://api.dicebear.com/9.x/initials/svg?seed=PN&backgroundColor=FF8C00',
    location: 'وهران، واجهة البحر',
    phone: '0770 98 76 54',
    hours: '10:00 - 01:00',
    isOpen: true,
    deliveryFee: 150,
    deliveryTime: '20-30 دقيقة',
    rating: 4.6,
    reviewCount: 890,
    categories: ['بيتزا', 'وجبات سريعة']
  },
  {
    id: 'rest_3',
    name: 'قصر الشاورما',
    coverImage: 'https://images.unsplash.com/photo-1648981977931-1e9bfbb83c48?w=800&auto=format&fit=crop',
    logo: 'https://api.dicebear.com/9.x/initials/svg?seed=SH&backgroundColor=000000',
    location: 'قسنطينة، سيدي مبروك',
    phone: '0661 55 44 33',
    hours: '11:00 - 00:00',
    isOpen: false,
    deliveryFee: 200,
    deliveryTime: '25-40 دقيقة',
    rating: 4.3,
    reviewCount: 150,
    categories: ['شاورما']
  }
];

export const MENU_ITEMS = [
  {
    id: 'm1',
    restaurantId: 'rest_1',
    category: 'مشويات',
    name: 'طبق مشكل عائلي',
    description: 'تشكيلة من الكباب، الشيش طاووق، واللحم المشوي مع الأرز والبطاطا المقلية',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: 'm2',
    restaurantId: 'rest_1',
    category: 'أكلات جزائرية',
    name: 'كسكسي باللحم',
    description: 'كسكسي تقليدي مع الخضار ولحم الغنم الصافي',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop',
    rating: 4.7
  },
  {
    id: 'm3',
    restaurantId: 'rest_2',
    category: 'بيتزا',
    name: 'بيتزا مارغريتا',
    description: 'صلصة طماطم طازجة، جبن موزاريلا، ريحان',
    price: 600,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop',
    rating: 4.5
  }
];
