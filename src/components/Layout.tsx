import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, TicketPercent, ShoppingBag, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCartStore } from '../lib/store';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useCartStore(state => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const tabs = [
    { name: 'الرئيسية', icon: Home, path: '/home' },
    { name: 'العروض', icon: TicketPercent, path: '/offers' },
    { name: 'السلة', icon: ShoppingBag, path: '/cart', badge: cartCount },
    { name: 'حسابي', icon: User, path: '/profile' }
  ];

  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col md:max-w-2xl lg:max-w-4xl" dir="rtl">
      {/* Decorative Background Elements */}
      <div className="fixed top-[-100px] right-[-100px] w-96 h-96 bg-primary rounded-full blur-[120px] opacity-20 pointer-events-none z-[-1]"></div>
      <div className="fixed bottom-[-100px] left-[-100px] w-80 h-80 bg-secondary rounded-full blur-[100px] opacity-10 pointer-events-none z-[-1]"></div>

      <div className="flex-1 pb-24 z-10 w-full min-h-screen">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10 rounded-t-[32px] px-6 py-4 z-50">
        <div className="flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-1 p-2"
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-white/10 text-primary-light shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-white/40 hover:text-white"
                )}>
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {tab.badge > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-secondary text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-[#111]">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold transition-all duration-300",
                  isActive ? "text-primary-light opacity-100" : "text-white/40 opacity-0 transform translate-y-2 absolute -bottom-2"
                )}>
                  {tab.name}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
