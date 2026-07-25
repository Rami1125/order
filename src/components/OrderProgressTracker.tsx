import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, Package, Truck, CheckCircle, ChevronRight, MapPin, AlertCircle, Sparkles, FileText } from 'lucide-react';

interface OrderProgressTrackerProps {
  order: Order;
  compact?: boolean;
  onChatAboutOrder?: (order: Order) => void;
}

export const STAGES: {
  id: string;
  statusMatch: OrderStatus[];
  label: string;
  subtext: string;
  icon: React.FC<{ className?: string }>;
  estimatedTime: string;
}[] = [
  {
    id: 'received',
    statusMatch: ['ממתינה לאישור', 'התקבלה'],
    label: 'התקבלה במערכת',
    subtext: 'נקלטה ברובוט נועה AI ועברה לאישור קומקס',
    icon: Clock,
    estimatedTime: 'נשלח לפני זמן קצר',
  },
  {
    id: 'prep',
    statusMatch: ['בטיפול לוגיסטי'],
    label: 'בטיפול לוגיסטי',
    subtext: 'ליקוט חומרים, אריזת בלות והכנת משטחים במחסן',
    icon: Package,
    estimatedTime: 'זמן ליקוט משוער: 15-30 דק\'',
  },
  {
    id: 'transit',
    statusMatch: ['על המשאית'],
    label: 'על המשאית',
    subtext: 'משאית מנוף יצאה מהמחסן בדרך לאתר האספקה',
    icon: Truck,
    estimatedTime: 'בדרך אליך למגרש האספקה',
  },
  {
    id: 'delivered',
    statusMatch: ['סופקה'],
    label: 'סופקה בהצלחה',
    subtext: 'נמסרה ונפרקה באתר הלקוח',
    icon: CheckCircle,
    estimatedTime: 'הושלם',
  },
];

export const getStageIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'ממתינה לאישור':
    case 'התקבלה':
      return 0;
    case 'בטיפול לוגיסטי':
      return 1;
    case 'על המשאית':
      return 2;
    case 'סופקה':
      return 3;
    default:
      return 0;
  }
};

export const OrderProgressTracker: React.FC<OrderProgressTrackerProps> = ({
  order,
  compact = false,
  onChatAboutOrder,
}) => {
  const currentStageIndex = getStageIndex(order.status);
  const progressPercent = (currentStageIndex / (STAGES.length - 1)) * 100;

  if (compact) {
    return (
      <div className="space-y-3 dir-rtl">
        {/* Compact Horizontal Progress Bar */}
        <div className="relative flex items-center justify-between px-2 py-1">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0" />
          
          {/* Active Progress Fill */}
          <div
            className="absolute top-1/2 right-4 h-1 bg-blue-600 -translate-y-1/2 rounded-full transition-all duration-500 z-0"
            style={{
              width: `calc(${progressPercent}% - 2rem)`,
              right: '1rem',
            }}
          />

          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-xs ${
                    isCompleted
                      ? 'bg-green-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-bold whitespace-nowrap ${
                    isCurrent
                      ? 'text-blue-700'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5 dir-rtl overflow-hidden relative">
      {/* Top Banner Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-xl text-xs">
              #{order.id}
            </span>
            <span className="text-xs text-slate-500 font-medium">{order.date}</span>
            {order.status !== 'סופקה' ? (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                בתהליך פעיל בזמן אמת
              </span>
            ) : (
              <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                סופקה בהצלחה
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            יעד אספקה: <span className="text-slate-900">{order.deliveryAddress}</span>
          </p>
        </div>

        {onChatAboutOrder && (
          <button
            onClick={() => onChatAboutOrder(order)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>שאל את נועה על הזמנה זו</span>
          </button>
        )}
      </div>

      {/* Visual Timeline Bar */}
      <div className="py-2">
        <div className="relative mb-6">
          {/* Track Line Background */}
          <div className="absolute top-5 left-8 right-8 h-1.5 bg-slate-100 rounded-full z-0" />

          {/* Track Line Active Fill */}
          <div
            className="absolute top-5 right-8 h-1.5 bg-linear-to-l from-blue-600 to-green-500 rounded-full transition-all duration-700 z-0"
            style={{
              width: `calc(${progressPercent}% - 3rem)`,
              right: '2rem',
            }}
          />

          {/* Timeline Nodes */}
          <div className="relative z-10 flex items-center justify-between">
            {STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.id} className="flex flex-col items-center text-center max-w-[100px] sm:max-w-[130px]">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 font-bold ${
                      isCompleted
                        ? 'bg-green-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <span
                    className={`text-xs mt-2.5 font-bold ${
                      isCurrent
                        ? 'text-blue-700 text-sm'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>

                  <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 hidden sm:block">
                    {stage.subtext}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Active Stage Highlight Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0 mt-0.5">
              {React.createElement(STAGES[currentStageIndex].icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">סטטוס מפורט נוכחי:</span>
              <p className="font-extrabold text-slate-900 text-sm">
                {STAGES[currentStageIndex].label} — {STAGES[currentStageIndex].subtext}
              </p>
              <p className="text-blue-700 font-semibold mt-1">
                ⏱️ הערכת זמן: {STAGES[currentStageIndex].estimatedTime}
              </p>
            </div>
          </div>

          <div className="sm:border-r sm:border-slate-200 sm:pr-4 pt-2 sm:pt-0 text-slate-600 space-y-1 shrink-0">
            <div>פריטים בהזמנה: <strong>{order.items.length} מוצרים</strong></div>
            <div>סה"כ לתשלום: <strong className="text-slate-900 font-extrabold">{order.grandTotal.toLocaleString()} ₪</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
