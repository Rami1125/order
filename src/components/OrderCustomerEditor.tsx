import React, { useState } from 'react';
import { Order, Customer, OrderStatus, LogisticsProduct } from '../types';
import { Edit3, Check, X, Save, Plus, UserPlus, FileText, MapPin, Phone, Building2, CreditCard, RefreshCw, Trash2 } from 'lucide-react';

interface OrderCustomerEditorProps {
  orders: Order[];
  customers: Customer[];
  products: LogisticsProduct[];
  onOrderUpdated: (updatedOrder: Order) => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
  onCustomerCreated: (newCustomer: Customer) => void;
  hidePricing?: boolean;
}

export const OrderCustomerEditor: React.FC<OrderCustomerEditorProps> = ({
  orders,
  customers,
  products,
  onOrderUpdated,
  onCustomerUpdated,
  onCustomerCreated,
  hidePricing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');

  // Editing Order State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>('התקבלה');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Editing Customer State
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editCreditLimit, setEditCreditLimit] = useState<number>(0);
  const [editDeliveryAddress, setEditDeliveryAddress] = useState<string>('');

  // New Customer Modal
  const [showNewCustModal, setShowNewCustModal] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState<string>('');
  const [newCompany, setNewCompany] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newCreditLimit, setNewCreditLimit] = useState<number>(100000);
  const [newAddress, setNewAddress] = useState<string>('');

  const [savingMsg, setSavingMsg] = useState<string>('');

  // Start Order Editing
  const handleStartEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setEditStatus(order.status);
    setEditAddress(order.deliveryAddress);
    setEditNotes(order.notes || '');
  };

  // Save Order Edits
  const handleSaveOrder = async (order: Order) => {
    const updatedOrder: Order = {
      ...order,
      status: editStatus,
      deliveryAddress: editAddress,
      notes: editNotes,
    };

    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      onOrderUpdated(updatedOrder);
      setEditingOrderId(null);
      setSavingMsg('ההזמנה עודכנה בהצלחה במערכת!');
      setTimeout(() => setSavingMsg(''), 2500);
    } catch {
      alert('שגיאה בעדכון ההזמנה');
    }
  };

  // Start Customer Editing
  const handleStartEditCustomer = (cust: Customer) => {
    setEditingCustomerId(cust.id);
    setEditFullName(cust.fullName);
    setEditCompany(cust.company);
    setEditPhone(cust.phone);
    setEditCreditLimit(cust.creditLimit);
    setEditDeliveryAddress(cust.deliveryAddress);
  };

  // Save Customer Edits
  const handleSaveCustomer = async (cust: Customer) => {
    const updatedCustomer: Customer = {
      ...cust,
      fullName: editFullName,
      company: editCompany,
      phone: editPhone,
      creditLimit: editCreditLimit,
      deliveryAddress: editDeliveryAddress,
    };

    try {
      await fetch(`/api/customers/${cust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      onCustomerUpdated(updatedCustomer);
      setEditingCustomerId(null);
      setSavingMsg('פרטי הלקוח עודכנו בהצלחה!');
      setTimeout(() => setSavingMsg(''), 2500);
    } catch {
      alert('שגיאה בעדכון פרטי הלקוח');
    }
  };

  // Create New Customer
  const handleCreateCustomer = async () => {
    if (!newCompany.trim() || !newFullName.trim()) return;

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      name: newFullName,
      fullName: newFullName,
      company: newCompany,
      phone: newPhone,
      email: `office@${newCompany.toLowerCase().replace(/\s+/g, '')}.co.il`,
      creditLimit: newCreditLimit,
      currentBalance: 0,
      deliveryAddress: newAddress,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
      token: `token_${newCompany.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`,
    };

    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });

      onCustomerCreated(newCustomer);
      setShowNewCustModal(false);
      setNewFullName('');
      setNewCompany('');
      setNewPhone('');
      setNewAddress('');
      setSavingMsg('לקוח חדש נוצר בהצלחה במערכת!');
      setTimeout(() => setSavingMsg(''), 2500);
    } catch {
      alert('שגיאה ביצירת לקוח חדש');
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <span>ממשק עריכת הזמנות ולקוחות</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            עריכת סטטוסים, כתובות אספקה, מסגרות אשראי ויצירת לקוחות חדשים בזמן אמת
          </p>
        </div>

        {savingMsg && (
          <span className="bg-green-100 text-green-800 border border-green-300 text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4" />
            {savingMsg}
          </span>
        )}

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
              activeTab === 'orders' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            עריכת הזמנות ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
              activeTab === 'customers' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            ניהול לקוחות ({customers.length})
          </button>
        </div>
      </div>

      {/* ORDERS EDITING TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-3">תאריך</th>
                <th className="p-3">מזהה_לקוח</th>
                <th className="p-3">שם_לקוח</th>
                <th className="p-3">חברה</th>
                <th className="p-3">כתובת_אספקה</th>
                <th className="p-3">מוצרים</th>
                <th className="p-3">סטטוס</th>
                <th className="p-3">הערות</th>
                <th className="p-3 text-center">עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {orders.map((o) => {
                const isEditing = editingOrderId === o.id;

                return (
                  <tr key={o.id} className={isEditing ? 'bg-blue-50/70' : 'hover:bg-slate-50'}>
                    <td className="p-3 font-mono font-bold text-slate-600">{o.date}</td>
                    <td className="p-3 font-mono text-slate-500">{o.customerId}</td>
                    <td className="p-3 font-bold">{o.customerName}</td>
                    <td className="p-3 font-bold text-blue-900">{o.companyName}</td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 w-full"
                        />
                      ) : (
                        <span>{o.deliveryAddress}</span>
                      )}
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="space-y-0.5 text-[11px]">
                        {o.items.map((i, idx) => (
                          <div key={idx}>
                            • {i.quantity} {i.unit} {i.productName}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                        >
                          <option value="ממתינה לאישור">ממתינה לאישור</option>
                          <option value="התקבלה">התקבלה</option>
                          <option value="בטיפול לוגיסטי">בטיפול לוגיסטי</option>
                          <option value="על המשאית">על המשאית</option>
                          <option value="סופקה">סופקה</option>
                        </select>
                      ) : (
                        <span className="bg-blue-100 text-blue-900 border border-blue-200 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          {o.status}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs text-slate-900 w-full"
                          placeholder="הערות..."
                        />
                      ) : (
                        <span className="text-slate-500 italic">{o.notes || '—'}</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveOrder(o)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded-lg text-xs cursor-pointer shadow-2xs"
                            title="שמור שינויים"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingOrderId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold p-1.5 rounded-lg text-xs cursor-pointer"
                            title="ביטול"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditOrder(o)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold p-1.5 rounded-lg text-xs cursor-pointer"
                          title="ערוך הזמנה"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOMERS MANAGEMENT TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">ספר לקוחות מורשים וחברה</h4>
            <button
              onClick={() => setShowNewCustModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>הוסף לקוח מורשה חדש</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customers.map((cust) => {
              const isEditing = editingCustomerId === cust.id;

              return (
                <div key={cust.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img
                        src={cust.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150'}
                        alt={cust.fullName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editCompany}
                              onChange={(e) => setEditCompany(e.target.value)}
                              className="bg-white border border-blue-400 rounded-lg px-2 py-0.5 text-xs font-extrabold text-slate-900"
                              placeholder="שם חברה"
                            />
                            <input
                              type="text"
                              value={editFullName}
                              onChange={(e) => setEditFullName(e.target.value)}
                              className="bg-white border border-blue-400 rounded-lg px-2 py-0.5 text-xs text-slate-700"
                              placeholder="שם מלא"
                            />
                          </div>
                        ) : (
                          <>
                            <h4 className="font-extrabold text-slate-900 text-base">{cust.company}</h4>
                            <p className="text-xs text-slate-600">איש קשר: {cust.fullName}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveCustomer(cust)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> שמור
                        </button>
                        <button
                          onClick={() => setEditingCustomerId(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEditCustomer(cust)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> ערוך
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">טלפון:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-0.5 text-xs text-slate-900 w-full"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{cust.phone}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">סטטוס אישור:</span>
                      <span className="font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        מאושר לפעילות
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-500 block mb-0.5">כתובת אספקה מרכזית:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDeliveryAddress}
                          onChange={(e) => setEditDeliveryAddress(e.target.value)}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-0.5 text-xs text-slate-900 w-full"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">{cust.deliveryAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showNewCustModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl dir-rtl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">יצירת לקוח מורשה חדש</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">שם החברה:</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="לדוגמה: בניה מתקדמת בעמ"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">שם מלא איש קשר:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="לדוגמה: ישראל ישראלי"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">טלפון:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">כתובת אספקה מרכזית:</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="רחוב, עיר, אתר בנייה"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateCustomer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                צור לקוח חדש
              </button>
              <button
                onClick={() => setShowNewCustModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
