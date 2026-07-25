import React, { useRef } from 'react';
import { Customer, LogisticsRule } from '../types';
import { MessageSquare, PenTool, BookOpen, FileText, Clock, X, Building2, MapPin, Camera, Sparkles, Phone, ShieldCheck, UserCheck } from 'lucide-react';

interface RightSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  activeTab: 'chat' | 'quickOrder' | 'rules' | 'chatHistory' | 'history' | 'catalog';
  onSelectTab: (tab: 'chat' | 'quickOrder' | 'rules' | 'chatHistory' | 'history' | 'catalog') => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  rulesCount?: number;
  ordersCount?: number;
}

export const RightSideDrawer: React.FC<RightSideDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  activeTab,
  onSelectTab,
  onAvatarUpdate,
  rulesCount = 0,
  ordersCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('גודל הקובץ חורג מ-5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl && onAvatarUpdate) {
        onAvatarUpdate(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const navItems = [
    {
      id: 'chat' as const,
      label: 'צ\'אט אינטראקטיבי עם נועה AI',
      desc: 'מפרטי מוצרים, בירור מלאים והזמנות',
      icon: MessageSquare,
      badge: 'AI חי',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'quickOrder' as const,
      label: 'כלי עזר לכתיבת הזמנה',
      desc: 'רישום הזמנה בטאב הלקוח ובדרייב',
      icon: PenTool,
      badge: 'בזמן אמת',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'history' as const,
      label: 'מעקב וסטטוס הזמנות חי',
      desc: 'שלבי אספקה, משאית ומנוף',
      icon: Clock,
      badge: `${ordersCount} הזמנות`,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'chatHistory' as const,
      label: 'תיעוד שיחות ודרישות',
      desc: 'שקיפות מלאה מול הגיליון והדרייב',
      icon: FileText,
      badge: 'שקיפות',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'rules' as const,
      label: 'ספר חוקים לוגיסטי',
      desc: 'חוקי ברזל מסונכרנים מגיליון',
      icon: BookOpen,
      badge: 'חוקים',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white border-l border-slate-200 z-50 shadow-2xl dir-rtl flex flex-col transition-transform duration-300 transform translate-x-0 animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h2 className="font-extrabold text-sm tracking-wide">תפריט Magic Portal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="סגור תפריט"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Profile & Logo Uploader Component */}
        <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-800 text-white space-y-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            
            {/* Logo Avatar Container */}
            <div className="relative group shrink-0">
              {customer.avatarUrl ? (
                <img
                  src={customer.avatarUrl}
                  alt={customer.company}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md bg-white"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-blue-600 border-2 border-blue-400 flex items-center justify-center font-black text-white text-xl shadow-md">
                  {customer.company.charAt(0)}
                </div>
              )}

              {/* Edit Logo Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -left-1 bg-blue-600 text-white p-1 rounded-full border-2 border-slate-900 shadow-xs hover:bg-blue-500 cursor-pointer"
                title="ערוך/העלה לוגו חברה בזמן אמת"
              >
                <Camera className="w-3 h-3" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Customer Details */}
            <div className="space-y-0.5 min-w-0">
              <h3 className="font-black text-sm text-white truncate">{customer.company}</h3>
              <p className="text-xs text-slate-300 font-medium truncate">איש קשר: {customer.name}</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <Sparkles className="w-3 h-3" />
                <span>טוקן: {customer.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600/80 rounded-xl py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>עדכן לוגו חברה / פרופיל בגיליון</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 px-3 uppercase tracking-wider block">
            ניווט במתחם
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setTimeout(onClose, 200);
                }}
                className={`w-full text-right p-3 rounded-2xl transition flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-xs block truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Customer Info Footer Card */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>פרטי פרויקט וכתובת אספקה:</span>
          </div>

          <div className="space-y-1 text-[11px] font-medium text-slate-600 pr-2 border-r-2 border-blue-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{customer.deliveryAddress}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{customer.phone}</span>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 font-mono text-center border-t border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline ml-1" />
            <span>חיבור מאובטח מבודד ל-Magic Portal</span>
          </div>
        </div>

      </div>
    </>
  );
};
