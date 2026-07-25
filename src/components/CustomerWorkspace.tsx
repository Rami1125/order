import React, { useState } from 'react';
import { Customer, Order, LogisticsProduct } from '../types';
import { NoaChatbot } from './NoaChatbot';
import { OrderProgressTracker } from './OrderProgressTracker';
import { NoaChatHistory } from './NoaChatHistory';
import { MessageSquare, History, Package, Truck, CheckCircle, Clock, RotateCcw, Building2, MapPin, Sparkles, AlertCircle, Activity, ChevronDown, ChevronUp, FileText, ShieldCheck } from 'lucide-react';

interface CustomerWorkspaceProps {
  customer: Customer;
  orders: Order[];
  products: LogisticsProduct[];
  onOrderCreated: (newOrder: Order) => void;
  hidePricing?: boolean;
}

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({
  customer,
  orders,
  products,
  onOrderCreated,
  hidePricing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'chatHistory' | 'history' | 'catalog'>('chat');
  const [repeatOrderPrompt, setRepeatOrderPrompt] = useState<string | undefined>(undefined);
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState<string | null>(null);
  const [showPastOrderTracker, setShowPastOrderTracker] = useState<boolean>(false);

  const customerOrders = orders.filter((o) => o.customerId === customer.id || o.companyName === customer.company);
  const activeOrders = customerOrders.filter((o) => o.status !== 'סופקה');

  const currentActiveOrder = activeOrders.find((o) => o.id === selectedActiveOrderId) || activeOrders[0] || customerOrders[0];

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'התקבלה':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> התקבלה</span>;
      case 'בטיפול לוגיסטי':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Package className="w-3.5 h-3.5" /> בטיפול לוגיסטי</span>;
      case 'על המשאית':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> על המשאית</span>;
      case 'סופקה':
        return <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> סופקה</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-bold">{status}</span>;
    }
  };

  const handleRepeatOrder = (order: Order) => {
    const promptText = `חזור על ההזמנה מתאריך ${order.date} (#${order.id}) עבור ${customer.name}`;
    setRepeatOrderPrompt(promptText);
    setActiveTab('chat');
  };

  const handleChatAboutOrder = (order: Order) => {
    const promptText = `מה הסטטוס העדכני של הזמנה #${order.id} והאם המשאית בדרך לכתובת ${order.deliveryAddress}?`;
    setRepeatOrderPrompt(promptText);
    setActiveTab('chat');
  };

  return (
    <div className="space-y-6 dir-rtl">
      
      {/* Customer Profile Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={customer.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150'}
              alt={customer.fullName}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{customer.company}</h2>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Magic Link מורשה
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                <Building2 className="w-4 h-4 text-slate-400" />
                איש קשר: <strong>{customer.fullName}</strong> | טלפון: {customer.phone}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                אתר אספקה מרכזי: {customer.deliveryAddress}
              </p>
            </div>
          </div>

          {/* Account Metrics */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">מסגרת אשראי:</span>
              <span className="font-extrabold text-slate-900 text-base">
                {hidePricing ? 'פעיל ומאושר' : `${customer.creditLimit.toLocaleString()} ₪`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5 font-medium">סטטוס ניצול:</span>
              <span className="font-extrabold text-green-700 text-base">
                {hidePricing ? 'תקין לפעילות' : `${(customer.creditLimit - customer.currentBalance).toLocaleString()} ₪ פנויים`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Active Order Visual Progress Tracker Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            <h3 className="font-extrabold text-slate-900 text-base">
              מעקב הזמנות בזמן אמת
            </h3>
            {activeOrders.length > 0 ? (
              <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs">
                {activeOrders.length} פעילות
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                אין הזמנות בדרך
              </span>
            )}
          </div>

          {/* Active Orders Switcher if multiple active */}
          {activeOrders.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-md text-xs">
              <span className="text-slate-500 font-medium text-[11px]">בחר הזמנה:</span>
              {activeOrders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => setSelectedActiveOrderId(ord.id)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    (selectedActiveOrderId === ord.id || (!selectedActiveOrderId && currentActiveOrder?.id === ord.id))
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  #{ord.id} ({ord.status})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display Active Order Tracker Card */}
        {activeOrders.length > 0 && currentActiveOrder ? (
          <OrderProgressTracker
            order={currentActiveOrder}
            onChatAboutOrder={handleChatAboutOrder}
          />
        ) : customerOrders.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>כל ההזמנות של {customer.company} סופקו בהצלחה!</span>
              </div>
              <button
                onClick={() => setShowPastOrderTracker(!showPastOrderTracker)}
                className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                <span>{showPastOrderTracker ? 'הסתר תרשים הזמנה אחרונה' : `צפה בתרשים הזמנה אחרונה (#${customerOrders[0].id})`}</span>
                {showPastOrderTracker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showPastOrderTracker && (
              <div className="pt-2">
                <OrderProgressTracker
                  order={customerOrders[0]}
                  onChatAboutOrder={handleChatAboutOrder}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-3xl text-xs font-bold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>צ'אט חי נועה AI</span>
          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            פעיל
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chatHistory')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'chatHistory'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>תיעוד שיחות ודרישות</span>
          <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            שקיפות
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>הזמנות ({customerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>מילון מוצרים ({products.length})</span>
        </button>
      </div>

      {/* TAB 1: Live Noa AI Chatbot */}
      {activeTab === 'chat' && (
        <NoaChatbot
          customer={customer}
          onOrderCreated={onOrderCreated}
          initialPrompt={repeatOrderPrompt}
        />
      )}

      {/* TAB 2: Dedicated Conversation & Requirements History Viewer */}
      {activeTab === 'chatHistory' && (
        <NoaChatHistory
          customer={customer}
          orders={orders}
          onContinueChat={(promptText) => {
            setRepeatOrderPrompt(promptText);
            setActiveTab('chat');
          }}
        />
      )}

      {/* TAB 2: Order History Cards */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>היסטוריית הזמנות וסטטוסים בזמן אמת</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              נשלף מגיליון "לוג_הזמנות_מערכת"
            </span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-700">טרם בוצעו הזמנות עבור חשבון זה</p>
              <p className="text-xs text-slate-500 mt-1">תוכל ליצור הזמנה ראשונה בקלות באמצעות נועה AI בצ'אט!</p>
            </div>
          ) : (
            customerOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2.5 py-1 rounded-lg text-xs">
                      #{order.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{order.date}</span>
                    {order.sourceSheet && (
                      <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {order.sourceSheet}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}

                    <button
                      onClick={() => handleRepeatOrder(order)}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>הזמן שוב</span>
                    </button>
                  </div>
                </div>

                {/* Visual Progress Bar (Compact) */}
                <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100">
                  <OrderProgressTracker order={order} compact={true} />
                </div>

                {/* Items Breakdown */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                          <p className="text-slate-500 mt-0.5">
                            כמות: <strong>{item.quantity} {item.unit}</strong>
                            {!hidePricing && ` | מחיר יחידה: ${item.unitPrice} ₪`}
                          </p>
                          {!hidePricing && item.depositPricePerUnit > 0 && (
                            <p className="text-amber-800 font-semibold mt-0.5">
                              פקדון: {item.depositPricePerUnit} ₪/יח' (סה"כ {item.depositTotal} ₪)
                            </p>
                          )}
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {hidePricing ? 'זמין לאספקה' : `${item.totalPrice.toLocaleString()} ₪`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                    <div>
                      <span>📍 כתובת אספקה: <strong>{order.deliveryAddress}</strong></span>
                      {order.notes && <span className="block text-slate-500 mt-0.5">הערות: {order.notes}</span>}
                    </div>

                    {!hidePricing && (
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-900 mt-2 sm:mt-0">
                        <span>חומרים: {order.subtotal.toLocaleString()} ₪</span>
                        <span>פקדונות: {order.totalDeposit.toLocaleString()} ₪</span>
                        <span className="text-blue-700 text-sm bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                          סה"כ: {order.grandTotal.toLocaleString()} ₪
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Logistics Product Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>מילון לוגיסטי - קטלוג ומחירון חומרי בניין</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                מחירון מעודכן כולל פירוט פקדונות והנחיות יישום טכניות בשטח
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 rounded-xl overflow-hidden mb-3 border border-slate-100">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {p.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">{p.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{p.description}</p>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1 mb-3">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>יחידת מידה:</span>
                      <span className="text-blue-700 font-extrabold">
                        {hidePricing ? `${p.unit}` : `${p.price} ₪ / ${p.unit}`}
                      </span>
                    </div>
                    {!hidePricing && (
                      <div className="flex justify-between text-slate-600">
                        <span>חיוב פקדון:</span>
                        <span>{p.depositPrice > 0 ? `${p.depositPrice} ₪ (${p.depositCategory})` : 'ללא פקדון'}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 p-2.5 rounded-xl text-[11px] text-green-950">
                    <span className="font-bold block mb-0.5 text-green-900">🛠️ הנחיות יישום:</span>
                    <p className="line-clamp-3">{p.applicationGuide}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRepeatOrderPrompt(`הוסף להזמנה: 5x ${p.name}`);
                    setActiveTab('chat');
                  }}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>בקש מנועה להזמין מוצר זה</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
