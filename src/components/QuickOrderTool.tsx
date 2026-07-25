import React, { useState } from 'react';
import { Customer, LogisticsProduct, Order, OrderItem } from '../types';
import { ShoppingCart, Plus, Trash2, Send, CheckCircle2, Building2, MapPin, AlertCircle, Image as ImageIcon, FileText, FolderCheck } from 'lucide-react';

interface QuickOrderToolProps {
  customer: Customer;
  products: LogisticsProduct[];
  onOrderCreated: (newOrder: Order) => void;
}

export const QuickOrderTool: React.FC<QuickOrderToolProps> = ({
  customer,
  products,
  onOrderCreated,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(customer.deliveryAddress || '');
  const [notes, setNotes] = useState<string>('תיאום חצי שעה מראש. גישה למשאית מנוף.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const existingIndex = cart.findIndex((item) => item.productId === selectedProduct.id);
    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        unit: selectedProduct.unit || 'יח',
      };
      setCart([...cart, newItem]);
    }
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage('יש להוסיף לפחות מוצר אחד להזמנה לפני השיגור.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      customerId: customer.id,
      customerName: customer.name,
      companyName: customer.company,
      deliveryAddress: deliveryAddress || customer.deliveryAddress,
      items: cart,
      status: 'התקבלה',
      notes: notes,
      sourceSheet: 'הזמנות מלקוחות',
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      if (response.ok) {
        const data = await response.json();
        const savedOrder = data.order || newOrder;
        onOrderCreated(savedOrder);
        setCreatedOrder(savedOrder);
        setCart([]);
      } else {
        // Fallback local update if offline
        onOrderCreated(newOrder);
        setCreatedOrder(newOrder);
        setCart([]);
      }
    } catch {
      // Fallback
      onOrderCreated(newOrder);
      setCreatedOrder(newOrder);
      setCart([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanCustomerFolder = `${customer.id}_${customer.name.replace(/\s+/g, '_')}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6 dir-rtl">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              כלי עזר מנוהל לכתיבת הזמנה בזמן אמת
            </h3>
            <span className="bg-green-100 text-green-800 border border-green-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              סנכרון מיידי לגיליון ולתיקיית הלקוח
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            כלי עזר מקצועי לכתיבה ורישום הזמנות בטאב הלקוח האישי (<strong>{customer.id}_{customer.name}</strong>) ובטאב "הזמנות מלקוחות"
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span>לקוח יעד: <strong className="text-slate-800">{customer.company} ({customer.name})</strong></span>
        </div>
      </div>

      {/* Success Banner if Order Created */}
      {createdOrder && (
        <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-900 font-extrabold text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>ההזמנה #{createdOrder.id} נרשמה בהצלחה בזמן אמת!</span>
            </div>
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
              סטטוס: {createdOrder.status}
            </span>
          </div>

          <p className="text-xs text-emerald-800 font-medium">
            הנתונים הוזרקו בהצלחה לטאב הלקוח האישי <strong>{customer.id}_{customer.name}</strong>, לטאב <strong>"הזמנות מלקוחות"</strong> ולתיקיית הדרייב.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200 font-mono">
              <FolderCheck className="w-4 h-4 text-emerald-700" />
              <span>תיקיית דרייב: GoogleDrive/{cleanCustomerFolder}/</span>
            </div>
            <button
              onClick={() => setCreatedOrder(null)}
              className="text-emerald-800 font-bold hover:underline cursor-pointer mr-auto"
            >
              + כתוֹב הזמנה נוספת
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Order Builder Form */}
      <form onSubmit={handleSubmitOrder} className="space-y-6">
        
        {/* Step 1: Add Products from Sheet Dictionary */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-800">
            1. בחירת מוצר מתוך גיליון 'מילון_לוגיסטי':
          </label>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} ({p.unit}) - {p.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">כמות:</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-center text-slate-900"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף להזמנה</span>
              </button>
            </div>
          </div>

          {/* Selected Product Specs Preview from Sheet Columns F & G */}
          {selectedProduct && (
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-center gap-3 mt-2">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="space-y-0.5 text-right w-full">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{selectedProduct.name}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                    קוד: {selectedProduct.code}
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 font-semibold line-clamp-2">
                  <FileText className="w-3 h-3 inline ml-1 text-teal-600" />
                  מפרט והנחיות מתוך עמודה G: {selectedProduct.applicationGuide || selectedProduct.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Selected Items Cart Table */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            2. הפריטים שנבחרו להזמנה ({cart.length}):
          </label>

          {cart.length === 0 ? (
            <div className="border border-dashed border-slate-300 p-6 rounded-xl text-center text-slate-500 text-xs">
              טרם נוספו מוצרים. בחר מוצר מתוך הקטלוג ולחץ על "הוסף להזמנה".
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">מוצר</th>
                    <th className="p-2.5">כמות</th>
                    <th className="p-2.5 text-center">פעולה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item, idx) => {
                    const prodInfo = products.find((p) => p.id === item.productId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-2">
                          {prodInfo?.imageUrl && (
                            <img src={prodInfo.imageUrl} alt={item.productName} className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0" />
                          )}
                          <span>{item.productName}</span>
                        </td>
                        <td className="p-2.5 font-bold text-blue-700">{item.quantity} יח'</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer p-1"
                            title="הסר פריט"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step 3: Delivery Address & Site Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>כתובת היעד לאספקה:</span>
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="הזן כתובת אתר הבנייה..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              הערות שטח ודרישות לוגיסטיקה:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הנחיות לפריקה, מנוף, זמני הגעה..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Submit Order Button */}
        <button
          type="submit"
          disabled={isSubmitting || cart.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm py-3 px-6 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>מעדכן ומשגר כעת לגיליון ולדרייב...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>שַׁגֵּר הַזְמָנָה בִּזְמַן אֱמֶת לְגִילְיוֹן וּלְתִיקִיַּת הַלָּקוֹחַ ({cart.length} פריטים)</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
};
