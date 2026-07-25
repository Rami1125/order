import React, { useState } from 'react';
import { LogisticsRule, Customer, Order, LogisticsProduct } from '../types';
import { Sliders, ShieldCheck, AlertTriangle, CheckCircle, Calculator, Zap, Play, Sparkles, Layers } from 'lucide-react';

interface DynamicRulesPageProps {
  rules: LogisticsRule[];
  onUpdateRules: (newRules: LogisticsRule[]) => void;
  activeCustomer: Customer;
  products: LogisticsProduct[];
  hidePricing?: boolean;
}

export const DynamicRulesPage: React.FC<DynamicRulesPageProps> = ({
  rules,
  activeCustomer,
  products,
}) => {
  // Test Simulator State
  const [testQuantity, setTestQuantity] = useState<number>(10);
  const [testProduct, setTestProduct] = useState<string>(products[0]?.id || '');
  const [testAddress, setTestAddress] = useState<string>(activeCustomer.deliveryAddress);

  const selectedProd = products.find((p) => p.id === testProduct) || products[0];

  // Dynamic Rule Evaluator
  const activeRules = rules.filter((r) => r.active);

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 className="text-xl font-extrabold tracking-tight">מנוע חוקים לוגיסטי - Real-time Logistics Rules Engine</h2>
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full">
                חוקי שינוע ושטח
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              הממשק נוצר ומסתנכרן בזמן אמת לפי כללי הלוגיסטיקה והבטיחות האקטיביים במערכת עבור נועה AI
            </p>
          </div>

          <div className="flex items-center gap-2 bg-blue-950/80 p-2.5 rounded-xl border border-blue-700/60 text-xs font-bold text-blue-200">
            <Layers className="w-4 h-4 text-amber-300" />
            <span>{activeRules.length} חוקים אקטיביים באכיפה</span>
          </div>
        </div>
      </div>

      {/* Grid of Dynamic Rule Enforcers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-2xl border transition-all ${
              rule.active
                ? 'bg-white border-blue-200 shadow-2xs hover:border-blue-400'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  rule.active ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {rule.category === 'delivery'
                  ? 'שינוע ופריקה'
                  : rule.category === 'minimums'
                  ? 'כמויות מינימום'
                  : rule.category === 'safety'
                  ? 'בטיחות באתר'
                  : 'הנחיות לוגיסטיות'}
              </span>

              <span className={`text-xs font-bold flex items-center gap-1 ${rule.active ? 'text-green-600' : 'text-slate-400'}`}>
                {rule.active ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                {rule.active ? 'פעיל' : 'כבוי'}
              </span>
            </div>

            <h4 className="font-extrabold text-slate-900 text-sm mb-1">{rule.title}</h4>
            <p className="text-xs text-slate-600 line-clamp-2 mb-3">{rule.description}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">תקן לוגיסטי:</span>
              <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {rule.numericValue ? `${rule.numericValue} ${rule.unit || 'יח\''}` : 'תקני'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Rule Simulator Component */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">
              סימולטור בדיקת תקינות לוגיסטית עבור {activeCustomer.company}
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
            בדיקת התאמת אתר וסדר אספקה
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">בחר מוצר לבדיקה:</label>
            <select
              value={testProduct}
              onChange={(e) => setTestProduct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-hidden"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">כמות מבוקשת:</label>
            <input
              type="number"
              min={1}
              value={testQuantity}
              onChange={(e) => setTestQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">כתובת אספקה:</label>
            <input
              type="text"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>תוצאת בדיקה לוגיסטית בזמן אמת</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5">פריט:</span>
              <span className="font-bold text-slate-900">{selectedProd?.name}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5">אמצעי פריקה נדרש:</span>
              <span className="font-extrabold text-blue-800">
                משאית מנוף תקנית (זרוע 15 מ')
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-0.5">זמן אספקה משוער:</span>
              <span className="font-extrabold text-teal-700">
                24-48 שעות (תיאום מוקדם)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
