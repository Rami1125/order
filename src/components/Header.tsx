import React from 'react';
import { Customer } from '../types';
import { ShieldCheck, UserCheck, Settings, Sparkles, Building2 } from 'lucide-react';

interface HeaderProps {
  activeCustomer: Customer;
  viewMode: 'customer' | 'admin';
  setViewMode: (mode: 'customer' | 'admin') => void;
  customers: Customer[];
  onSelectCustomer: (cust: Customer) => void;
  hidePricing: boolean;
  onToggleHidePricing: () => void;
  isMagicLinkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeCustomer,
  viewMode,
  setViewMode,
  customers,
  onSelectCustomer,
  hidePricing,
  onToggleHidePricing,
  isMagicLinkMode = false,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 dir-rtl">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xs text-white font-black text-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">אספקה ישירה</span>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" /> נועה AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">מערך לוגיסטיקת חומרי בניין ופרויקטים</p>
            </div>
          </div>

          {/* View Switcher Tabs - Strictly Hides Admin Controls if in Magic Link Mode */}
          {isMagicLinkMode ? (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 px-4 py-1.5 rounded-xl text-xs font-bold dir-rtl">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>אפליקציית לקוח מאובטחת (מתוך גיליון)</span>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                {activeCustomer.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('customer')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'customer'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>מתחם לקוח (Magic Link)</span>
              </button>
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>דף ניהול ו-Caching</span>
              </button>
            </div>
          )}

          {/* Customer Profile Switcher & Status */}
          <div className="flex items-center gap-3">
            {/* Operational Mode Toggle Button */}
            <button
              onClick={onToggleHidePricing}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                hidePricing
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="תמחק סכומים ועליות מהממשק"
            >
              <span>{hidePricing ? 'מצב תפעולי נקי (סכומים מוסתרים)' : 'הסתר סכומים ומחירים'}</span>
            </button>

            {!isMagicLinkMode && (
              <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs dir-rtl">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-slate-500 font-medium">לקוח פעיל:</span>
                <select
                  value={activeCustomer.id}
                  onChange={(e) => {
                    const found = customers.find((c) => c.id === e.target.value);
                    if (found) onSelectCustomer(found);
                  }}
                  className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-hidden"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-900">
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span className="hidden sm:inline">Firebase & Apps Script מחוברים</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
