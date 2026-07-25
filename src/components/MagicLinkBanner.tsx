import React, { useState } from 'react';
import { Customer } from '../types';
import { KeyRound, Copy, Check, Sparkles, ArrowLeftRight } from 'lucide-react';

interface MagicLinkBannerProps {
  customer: Customer;
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
}

export const MagicLinkBanner: React.FC<MagicLinkBannerProps> = ({
  customer,
  customers,
  onSelectCustomer,
}) => {
  const [copied, setCopied] = useState(false);

  const magicUrl = `${window.location.origin}${window.location.pathname}?token=${customer.token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(magicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 py-2.5 px-4 dir-rtl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Token Info */}
        <div className="flex items-center gap-3 text-slate-200">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <KeyRound className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-amber-300 flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" /> Magic Link מאובטח (ללא סיסמה):
              </span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 text-blue-300 text-[11px]">
                {customer.token}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              צפייה מבודדת עבור <strong>{customer.fullName}</strong> - מציג אך ורק היסטוריית הזמנות מגיליון 'לוג_הזמנות_מערכת'.
            </p>
          </div>
        </div>

        {/* Copy Link & Customer Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold border border-blue-400/40 transition-all cursor-pointer text-xs"
            title="העתק קישור קסם אישי"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'הועתק!' : 'העתק Magic Link'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300">
            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400 hidden sm:inline">החלף לקוח:</span>
            <div className="flex gap-1">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    c.id === customer.id
                      ? 'bg-blue-500 text-white shadow-2xs'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
