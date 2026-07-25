import React, { useState, useRef, useEffect } from 'react';
import { Customer, ChatMessage, OrderItem, Order, ChatAttachment } from '../types';
import { globalCacheEngine } from '../lib/cacheEngine';
import { playNotificationSound } from '../lib/audioSound';
import { Send, Bot, Sparkles, Zap, CheckCircle2, ShoppingBag, Paperclip, FileText, Image as ImageIcon, X, RefreshCw, Check, CheckCheck, Mic, MicOff, Phone, Video, Smile, ShieldCheck, Volume2, VolumeX, Wrench, BookOpen } from 'lucide-react';

interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  depositPerUnit: number;
  imageUrl: string;
  technicalSpecs: string;
  applicationMethod: string;
}

const MOCK_CATALOG: ProductCatalogItem[] = [
  {
    id: 'prod-101',
    name: 'בלה חול שומשום מנופה (תקן 0.6 מ"ק)',
    category: 'חול וחצץ',
    unitPrice: 180,
    depositPerUnit: 25,
    imageUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=300',
    technicalSpecs: 'תקן ישראלי 0.6 מ"ק, מתאים לריצוף, טיט ויציקות עדינות.',
    applicationMethod: 'יש לפרוס בשכבה אחידה ולדחוס בהתאם לגובה המפלס הנדרש.',
  },
  {
    id: 'prod-202',
    name: 'דבק קרמיקה 114 שק 25 ק"ג',
    category: 'דבקים וחומרי איטום',
    unitPrice: 45,
    depositPerUnit: 0,
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=300',
    technicalSpecs: 'דבק צמנטי משופר פולימרית, תקן C2TE.',
    applicationMethod: 'ערבוב עם 5-6 ליטר מים נקיים עד לקבלת תערובת אחידה. יש למרוח בשיטת "מריחה כפולה" לאריחים גדולים.',
  },
];

interface NoaChatbotProps {
  customer: Customer & { currentProject?: string; projectNotes?: string };
  onOrderCreated?: (newOrder: Order) => void;
  initialPrompt?: string;
}

export const NoaChatbot: React.FC<NoaChatbotProps> = ({
  customer,
  onOrderCreated,
  initialPrompt,
}) => {
  const localStorageKey = `magic_portal_chat_${customer.id}`;

  const getWelcomeMessage = (): ChatMessage => ({
    id: 'welcome-msg',
    sender: 'noa',
    htmlContent: `
      <div class="dir-rtl text-right font-sans">
        <p class="font-bold text-slate-900 text-base mb-1 flex items-center gap-1.5">
          <span>שלום ${customer.name}!</span> <span class="text-xl">👋</span>
        </p>
        <p class="text-slate-800 text-sm leading-relaxed mb-2">
          אני נועה, העוזרת האישית והלוגיסטית של <strong>"מחסן החרש"</strong>. זיהיתי את הפרויקט הפעיל שלך: <span class="text-teal-800 font-bold">${customer.currentProject || 'כללי'}</span>.
        </p>
        <div class="bg-teal-50/90 border border-teal-200/90 rounded-xl p-3 text-xs text-teal-950 space-y-1 shadow-2xs">
          <p><strong>📍 כתובת אספקה מאומתת:</strong> ${customer.deliveryAddress}</p>
          <p class="text-slate-600">שולפת נתונים מגיליון הלקוח, מציגה מפרטים טכניים, תקנים, הנחיות יישום ותמונות מוצר.</p>
        </div>
        <div class="flex flex-wrap gap-2 mt-3 dir-rtl">
          <button class="bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-teal-800 transition shadow-xs cursor-pointer">🖼️ הצג תמונת מוצר ומפרט טכני</button>
          <button class="bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-300 transition cursor-pointer">📦 הרכבת טיוטת הזמנה לפרויקט</button>
        </div>
      </div>
    `,
    timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [getWelcomeMessage()];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previewImageModal, setPreviewImageModal] = useState<{ title: string; url: string; specs: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeDraft, setActiveDraft] = useState<{
    items: OrderItem[];
    subtotal: number;
    totalDeposit: number;
    deliveryFee: number;
    grandTotal: number;
    deliveryAddress: string;
    notes?: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, customer.id]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) handleSendMessage(initialPrompt);
  }, [initialPrompt]);

  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput('קולית: "נועה, תרכיבי לי הזמנה ל-6 בלות חול שומשום ו-20 שקי דבק לפרויקט"');
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInput('קולית: "מה מחיר בלה חול ומה דמי הפקדונות?"');
      }, 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const cleanFolder = `${customer.id}_${customer.fullName.replace(/\s+/g, '_')}`;
      setSelectedAttachment({
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        type: file.type.includes('image') ? 'image' : 'document',
        drivePath: `GoogleDrive/${cleanFolder}/${file.name}`,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if ((!messageText.trim() && !selectedAttachment) || loading) return;

    const currentAtt = selectedAttachment;
    setSelectedAttachment(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      attachment: currentAtt || undefined,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const fullPromptText = currentAtt
      ? `${messageText}\n[קובץ מצורף: ${currentAtt.drivePath}]`
      : messageText;

    const cachedMatch = globalCacheEngine.findInCache(messageText);

    if (cachedMatch && !currentAtt) {
      setTimeout(() => {
        const cachedBotMsg: ChatMessage = {
          id: `noa-${Date.now()}`,
          sender: 'noa',
          htmlContent: cachedMatch.responseHtml,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          isCached: true,
        };
        if (soundEnabled) playNotificationSound();
        setMessages((prev) => [...prev, cachedBotMsg]);
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullPromptText,
          customerId: customer.id,
          customerData: {
            name: customer.fullName,
            address: customer.deliveryAddress,
            project: customer.currentProject,
          },
          history: messages.map((m) => ({ sender: m.sender, text: m.text || m.htmlContent })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `noa-${Date.now()}`,
          sender: 'noa',
          htmlContent: data.reply,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        };

        if (data.orderDraft && data.orderDraft.items) {
          const items: OrderItem[] = data.orderDraft.items.map((it: any) => ({
            productId: it.productId || 'prod-101',
            productName: it.productName || 'בלה חול שומשום מנופה',
            quantity: it.quantity || 5,
            unit: it.unit || 'בלה',
            unitPrice: it.unitPrice || 180,
            depositPricePerUnit: it.depositPricePerUnit || 25,
            depositTotal: (it.depositPricePerUnit || 25) * (it.quantity || 5),
            totalPrice: (it.unitPrice || 180) * (it.quantity || 5) + (it.depositPricePerUnit || 25) * (it.quantity || 5),
          }));

          const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
          const totalDeposit = items.reduce((sum, item) => sum + item.depositTotal, 0);
          const deliveryFee = subtotal >= 3000 ? 0 : 250;
          const grandTotal = subtotal + totalDeposit + deliveryFee;

          setActiveDraft({
            items,
            subtotal,
            totalDeposit,
            deliveryFee,
            grandTotal,
            deliveryAddress: customer.deliveryAddress,
            notes: data.orderDraft.notes || `הוזמן עבור פרויקט: ${customer.currentProject || 'ראשי'}`,
          });
        }

        if (soundEnabled) playNotificationSound();
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch {
      // Fallback response with product display and technical info simulation
      let replyHtml = `
        <div class="dir-rtl text-right font-sans space-y-2">
          <p class="font-bold text-slate-900 text-sm">נתונים מגיליון הלקוח עבור ${customer.name}:</p>
          <p class="text-xs text-slate-700">📍 <strong>כתובת מדויקת:</strong> ${customer.deliveryAddress}</p>
          <p class="text-xs text-slate-700">🏗️ <strong>פרויקט פעיל:</strong> ${customer.currentProject || 'בנייה כללית'}</p>
          
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs my-2">
            <div class="flex items-center gap-3">
              <img src="${MOCK_CATALOG[0].imageUrl}" alt="מוצר" class="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0" />
              <div>
                <p class="font-bold text-xs text-slate-900">${MOCK_CATALOG[0].name}</p>
                <p class="text-[11px] text-teal-800 font-semibold">מפרט טכני: ${MOCK_CATALOG[0].technicalSpecs}</p>
              </div>
            </div>
            <div class="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-700">
              <p><strong>שיטת יישום:</strong> ${MOCK_CATALOG[0].applicationMethod}</p>
            </div>
            <button class="bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-teal-800 transition shadow-xs cursor-pointer inline-flex items-center gap-1 mt-2">🖼️ הצג תמונת מוצר ומפרט טכני</button>
          </div>

          <p class="text-xs text-slate-700">האם תרצה להוסיף מוצר זה לטיוטת ההזמנה לפרויקט שלך או לשמור טיוטה להמשך?</p>
        </div>
      `;

      const fallbackMsg: ChatMessage = {
        id: `noa-${Date.now()}`,
        sender: 'noa',
        htmlContent: replyHtml,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };

      // Set a sample draft automatically for demonstration
      setActiveDraft({
        items: [
          {
            productId: MOCK_CATALOG[0].id,
            productName: MOCK_CATALOG[0].name,
            quantity: 5,
            unit: 'בלה',
            unitPrice: 0,
            depositPricePerUnit: 0,
            depositTotal: 0,
            totalPrice: 0,
          },
        ],
        subtotal: 0,
        totalDeposit: 0,
        deliveryFee: 0,
        grandTotal: 0,
        deliveryAddress: customer.deliveryAddress,
        notes: `טיוטה עבור ${customer.currentProject || 'פרויקט ראשי'}`,
      });

      if (soundEnabled) playNotificationSound();
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!activeDraft) return;

    const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.fullName,
      companyName: customer.company,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: activeDraft.items,
      subtotal: activeDraft.subtotal,
      totalDeposit: activeDraft.totalDeposit,
      deliveryFee: activeDraft.deliveryFee,
      grandTotal: activeDraft.grandTotal,
      status: 'הזמנה ממתינה לשיוך',
      deliveryAddress: activeDraft.deliveryAddress,
      notes: activeDraft.notes || 'אושר בצ\'אט עם נועה AI',
      createdAt: new Date().toISOString(),
      sourceSheet: 'הזמנות מלקוחות',
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      const data = await res.json();
      const savedOrder = data.order || newOrder;
      setActiveDraft(null);

      if (onOrderCreated) onOrderCreated(savedOrder);

      const confirmMsg: ChatMessage = {
        id: `noa-confirmed-${Date.now()}`,
        sender: 'noa',
        htmlContent: `
          <div class="bg-emerald-50 border border-emerald-300 rounded-xl p-4 dir-rtl text-right text-emerald-950 shadow-xs font-sans">
            <div class="flex items-center gap-2 mb-2 font-bold text-emerald-900 text-base">
              <span class="text-xl">✅</span> <span>${customer.name}, ההזמנה ננעלה ושוגרה לסידור!</span>
            </div>
            <p class="text-xs font-semibold text-emerald-900 mb-1">
              מזהה הזמנה: <span class="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md font-mono">${savedOrder.id}</span>
            </p>
            <div class="bg-white/90 rounded-lg p-3 text-xs text-slate-800 space-y-1 border border-emerald-200 my-2">
              <p class="font-bold">📍 כתובת אספקה מדויקת: ${savedOrder.deliveryAddress}</p>
              <p class="text-slate-700">🏗️ פרויקט: ${customer.currentProject || 'ראשי'}</p>
              <p class="text-[11px] text-teal-800 font-semibold pt-1 border-t border-slate-200">⚡ הנתונים הוזרקו בהצלחה לגיליון 'הזמנות מלקוחות'</p>
            </div>
          </div>
        `,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, confirmMsg]);
    } catch {
      alert('ארעה שגיאה בשידור ההזמנה לגיליון.');
    }
  };

  const handleClearHistory = () => {
    if (confirm('האם לאפס את היסטוריית הצ\'אט?')) {
      const fresh = [getWelcomeMessage()];
      setMessages(fresh);
      try {
        localStorage.removeItem(localStorageKey);
      } catch {}
    }
  };

  const suggestedPrompts = [
    '📦 הרכב הזמנה עם תמונות ומחירים',
    '🛠️ מפרט טכני והנחיות יישום לדבק קרמיקה',
    '📍 הצג כתובת אספקה ופרטי פרויקט',
    '💾 שמור טיוטה להמשך טיפול',
  ];

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] bg-[#EFEAE2] rounded-2xl border border-slate-300 shadow-md overflow-hidden dir-rtl font-sans">
      
      {/* Header */}
      <div className="bg-[#075E54] text-white p-3.5 px-5 flex items-center justify-between border-b border-teal-800 shadow-xs select-none">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"
              alt="נועה AI"
              className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight">נועה AI - לוגיסטיקה ומחירים</h3>
              <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-200" /> Sheets Connected
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">
              לקוח: {customer.fullName} | פרויקט: {customer.currentProject || 'ראשי'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'צלילים פעילים' : 'צלילים מופסקים'}
            className="p-2 text-teal-100 hover:text-white hover:bg-teal-700/60 rounded-xl transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-amber-300" />}
          </button>
          <button
            onClick={() => alert(`חיוג למוקד: ${customer.phone}`)}
            title="חיוג"
            className="p-2 text-teal-100 hover:text-white hover:bg-teal-700/60 rounded-xl transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearHistory}
            title="איפוס היסטוריה"
            className="p-2 text-teal-100 hover:text-white hover:bg-teal-700/60 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        onClick={(e) => {
          const btn = (e.target as HTMLElement).closest('button');
          if (btn) {
            const text = btn.textContent?.trim();
            if (text) {
              if (text.includes('תמונת מוצר') || text.includes('הצג תמונת מוצר')) {
                setPreviewImageModal({
                  title: MOCK_CATALOG[0].name,
                  url: MOCK_CATALOG[0].imageUrl,
                  specs: MOCK_CATALOG[0].technicalSpecs,
                });
              } else {
                handleSendMessage(text);
              }
            }
          }
        }}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#efeae2] bg-opacity-90 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <div className="flex justify-center my-1">
          <span className="bg-white/90 text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> נתונים מסונכרנים עם גיליון נתוני הלקוח והפרויקטים
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.sender === 'noa' && (
              <div className="w-8 h-8 rounded-full bg-teal-700 flex-shrink-0 flex items-center justify-center border border-teal-800 shadow-2xs">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" alt="נועה" className="w-7 h-7 rounded-full object-cover" />
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3.5 px-4 rounded-2xl text-sm leading-relaxed shadow-xs relative ${
                msg.sender === 'user'
                  ? 'bg-[#DCF8C6] text-slate-900 rounded-tl-none border border-emerald-200'
                  : 'bg-white text-slate-900 rounded-tr-none border border-slate-200'
              }`}>
                {msg.text && <p className="whitespace-pre-wrap font-sans text-slate-900">{msg.text}</p>}
                {msg.htmlContent && <div className="prose prose-sm max-w-none text-slate-900 font-sans" dangerouslySetInnerHTML={{ __html: msg.htmlContent }} />}
                <div className="flex items-center gap-1 justify-end text-[10px] mt-1 text-slate-500">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150" alt="נועה" className="w-7 h-7 rounded-full object-cover" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tr-none flex gap-1.5 items-center shadow-2xs border border-slate-200">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-300"></span>
              <span className="text-xs text-slate-600 font-medium mr-2">נועה שולפת נתונים מגיליון הלקוח ומעבדת מפרטים...</span>
            </div>
          </div>
        )}

        {activeDraft && (
          <div className="bg-white border-2 border-teal-600 rounded-2xl p-5 shadow-lg my-4 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-700" />
                <h4 className="font-bold text-base text-slate-900">טיוטת הזמנה לסידור הובלות</h4>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                הזמנה ממתינה לשיוך
              </span>
            </div>

            <div className="space-y-2 text-xs mb-3">
              {activeDraft.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">{it.quantity}x {it.productName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">כמות להספקה: {it.quantity} {it.unit || 'יחידות'}</span>
                  </div>
                  <span className="bg-teal-50 text-teal-800 border border-teal-200 font-bold px-2 py-1 rounded-lg text-xs">מאושר לסידור</span>
                </div>
              ))}
            </div>

            <div className="bg-teal-50/80 rounded-xl p-3 space-y-1.5 text-xs text-teal-950 mb-4 border border-teal-200">
              <p className="font-bold text-slate-900">📍 כתובת אספקה: {activeDraft.deliveryAddress}</p>
              <p className="text-slate-800">🏗️ פרויקט: {customer.currentProject || 'ראשי'}</p>
              <p className="text-slate-700 text-[11px] pt-1.5 border-t border-teal-200/60">
                🚚 <strong>מדיניות הובלה ואספקה:</strong> מועד האספקה המדויק וסוג ההובלה (מנוף/רמפה) ייקבעו על ידי צוות סידור ההובלות. <strong>רותם על זה</strong> ועדכון יישלח אליך!
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmOrder}
                className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Check className="w-4 h-4" />
                <span>אשר הזמנה ושגר לגיליון</span>
              </button>
              <button
                onClick={() => setActiveDraft(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl cursor-pointer text-xs"
              >
                שמור טיוטה להמשך
              </button>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="bg-[#F0F2F5] border-t border-slate-300 p-2 px-3 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
        {suggestedPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-xs font-semibold bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-700 border border-slate-300 hover:border-teal-300 px-3 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <div className="p-3 bg-[#F0F2F5] border-t border-slate-300">
        {selectedAttachment && (
          <div className="mb-2 bg-teal-50 border border-teal-200 text-teal-900 text-xs p-2 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-bold truncate">{selectedAttachment.name}</span>
            </div>
            <button onClick={() => setSelectedAttachment(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" className="hidden" />

        <div className="relative max-w-4xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="צרף קובץ"
            className="p-2.5 text-slate-600 hover:text-teal-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleToggleVoiceRecord}
            title="הקלטה קולית"
            className={`p-2.5 rounded-full transition-colors cursor-pointer shrink-0 ${isRecording ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-teal-700 hover:bg-slate-200'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="שאל על מפרטים טכניים, הנחיות יישום או הקם טיוטה..."
            disabled={loading}
            className="w-full py-3 px-4 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!input.trim() && !selectedAttachment) || loading}
            className="p-3 bg-[#075E54] hover:bg-[#128C7E] disabled:bg-slate-300 text-white rounded-full transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="שלח"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Image Modal */}
      {previewImageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl dir-rtl text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">{previewImageModal.title}</h3>
              <button onClick={() => setPreviewImageModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={previewImageModal.url} alt={previewImageModal.title} className="w-full h-48 object-cover rounded-xl border border-slate-200 mb-3" />
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">📋 מפרט טכני ותקן:</p>
              <p>{previewImageModal.specs}</p>
            </div>
            <button
              onClick={() => setPreviewImageModal(null)}
              className="w-full mt-4 bg-teal-700 text-white font-bold py-2 rounded-xl text-xs hover:bg-teal-800 transition cursor-pointer"
            >
              סגור תצוגת תמונה
            </button>
          </div>
        </div>
      )}
    </div>
  );
};