import React from 'react';
import { ShieldAlert, KeyRound, Lock, PhoneCall, RefreshCw } from 'lucide-react';

interface InvalidTokenScreenProps {
  tokenProvided?: string | null;
  onRetry?: () => void;
}

export const InvalidTokenScreen: React.FC<InvalidTokenScreenProps> = ({
  tokenProvided,
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 text-center">
        
        {/* Shield Icon */}
        <div className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-xs">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full border border-rose-200">
            <Lock className="w-3.5 h-3.5" />
            <span>אבטחת Magic Portal</span>
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            קישור הגישה אינו תקין או פג תוקף
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            הגישה למתחם הלקוחות הדיגיטלי (Magic Portal) מורשית דרך קישור אישי מאובטח בלבד.
            הטוקן שהוזן אינו תואם אף לקוח מורשה במערכת הלוגיסטיקה.
          </p>
        </div>

        {/* Token Card if provided */}
        {tokenProvided && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-right space-y-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 block">הטוקן שנבדק במערכת:</span>
            <code className="font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 block truncate text-center dir-ltr font-bold">
              {tokenProvided}
            </code>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-right text-xs space-y-2 text-blue-900">
          <div className="font-bold flex items-center gap-1.5 text-blue-800">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>כיצד ניתן לקבל גישה?</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-slate-700">
            <li>וודא שפתחת את הקישור המלא שהתקבל בהודעת WhatsApp או בגיליון Google Sheets.</li>
            <li>אם הקישור פג תוקף, פנה למנהל העבודה או לשירות הלקוחות להנפקת קישור חדש.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>נסה לרענן את הקישור</span>
            </button>
          )}

          <a
            href="tel:0500000000"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer block"
          >
            <PhoneCall className="w-4 h-4 text-slate-600" />
            <span>צור קשר עם משרד הלוגיסטיקה</span>
          </a>
        </div>

        {/* Security Footer */}
        <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 font-mono">
          <span>Google Sheets & Drive Encrypted Token Guard | Noa AI Logistics</span>
        </div>

      </div>
    </div>
  );
};
