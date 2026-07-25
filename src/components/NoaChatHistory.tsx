import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../types';
import {
  MessageSquare,
  Search,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Building2,
  MapPin,
  Send,
  Download,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Folder,
  Layers,
  ArrowRight,
  User,
  Bot
} from 'lucide-react';

interface NoaChatHistoryProps {
  customer: Customer;
  orders: Order[];
  onContinueChat?: (promptText: string) => void;
}

interface ChatLogItem {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  messageType: 'שיחה עם נועה AI' | 'קליטת הזמנה מנועה AI' | 'העלאת קובץ לדרייב' | string;
  content: string;
  drivePath?: string;
  fileId?: string;
}

export const NoaChatHistory: React.FC<NoaChatHistoryProps> = ({
  customer,
  orders,
  onContinueChat,
}) => {
  const [logs, setLogs] = useState<ChatLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const customerFolder = `${customer.id}_${(customer.fullName || customer.name).replace(/\s+/g, '_')}`;

  // Fetch live chat history logs from server /api/sheets/data ('תיעוד_שיחות')
  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/sheets/data');
      const data = await res.json();

      if (data.success && data.database && data.database['תיעוד_שיחות']) {
        const rows = data.database['תיעוד_שיחות'].rows || [];
        // Filter rows for this customer
        const customerRows = rows.filter(
          (r: any) =>
            r['מזהה_לקוח'] === customer.id ||
            r['שם_לקוח'] === customer.fullName ||
            r['שם_לקוח'] === customer.name ||
            (r['תוכן'] && r['תוכן'].includes(customer.company))
        );

        const mapped: ChatLogItem[] = customerRows.map((r: any, idx: number) => ({
          id: r.id || `log-${idx}`,
          timestamp: r['תאריך_וזמן'] || new Date().toISOString().replace('T', ' ').substring(0, 16),
          customerId: r['מזהה_לקוח'] || customer.id,
          customerName: r['שם_לקוח'] || customer.fullName,
          messageType: r['סוג_הודעה'] || 'שיחה עם נועה AI',
          content: r['תוכן'] || '',
          drivePath: r['קישור_קובץ_דרייב'] || `GoogleDrive/${customerFolder}/`,
          fileId: r['מזהה_קובץ'],
        }));

        setLogs(mapped);
      }
    } catch (e) {
      console.error('Error fetching chat history logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [customer.id]);

  // Handle Copy text
  const handleCopyContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.messageType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.timestamp.includes(searchTerm);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'chat') return matchesSearch && log.messageType.includes('שיחה');
    if (filterType === 'order') return matchesSearch && log.messageType.includes('הזמנה');
    if (filterType === 'files') return matchesSearch && (log.messageType.includes('קובץ') || log.drivePath?.includes('GoogleDrive'));

    return matchesSearch;
  });

  // Extract key order requirements from recent history & customer profile for transparency box
  const customerOrders = orders.filter((o) => o.customerId === customer.id || o.companyName === customer.company);
  const latestOrder = customerOrders[0];

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Top Header Card */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 text-white p-6 rounded-2xl shadow-md border border-slate-700/80 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-extrabold text-white">
                יומן שיחות ודרישות נועה AI - {customer.company}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              שקיפות מלאה ותיעוד היסטורי בזמן אמת של כל האינטראקציות, הדרישות הלוגיסטיות, שידורי ההזמנות והקבצים בשיחה
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              disabled={refreshing}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>רענן נתוני גיליון</span>
            </button>

            {onContinueChat && (
              <button
                onClick={() => onContinueChat(`המשך שיחה לגבי דרישות פרויקט ${customer.company}`)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>פתח צ'אט אינטראקטיבי</span>
              </button>
            )}
          </div>
        </div>

        {/* Live System Integration Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-700/70 text-xs font-medium">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
            <span className="text-slate-400">סנכרון גיליון:</span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              תיעוד_שיחות (פעיל)
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
            <span className="text-slate-400">תיקיית Google Drive:</span>
            <span className="font-mono font-bold text-slate-200 text-[11px] truncate max-w-[180px]">
              GoogleDrive/{customerFolder}/
            </span>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
            <span className="text-slate-400">סה"כ רשומות מתועדות:</span>
            <span className="font-extrabold text-white bg-blue-600/60 px-2 py-0.5 rounded-md text-xs">
              {logs.length} שיחות
            </span>
          </div>
        </div>
      </div>

      {/* Transparency Order Requirements Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>ריכוז דרישות לוגיסטיות שחולצו מהשיחות (Order Requirements Transparency)</span>
          </h3>

          <button
            onClick={() => setShowExportModal(true)}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ייצא דוח דרישות מלא</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-bold block mb-1">📍 כתובת אספקה לפריקת מנוף:</span>
            <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{latestOrder?.deliveryAddress || customer.deliveryAddress}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">מאומת מול צ'אט נועה AI וכרטיס לקוח</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-bold block mb-1">💳 מסגרת אשראי ויתרת ניצול:</span>
            <p className="font-extrabold text-emerald-700 text-sm">
              {(customer.creditLimit - customer.currentBalance).toLocaleString()} ₪ פנויים
            </p>
            <p className="text-[11px] text-slate-500 mt-1">מתוך מסגרת כוללת של {customer.creditLimit.toLocaleString()} ₪</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-bold block mb-1">📦 סטטוס הזמנה אחרונה בשיחה:</span>
            {latestOrder ? (
              <p className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span className="font-mono text-blue-700">#{latestOrder.id}</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[11px]">
                  {latestOrder.status}
                </span>
              </p>
            ) : (
              <p className="text-slate-500 font-semibold">טרם נרשמו הזמנות</p>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {latestOrder ? `סה"כ ${latestOrder.grandTotal.toLocaleString()} ₪ כולל פקדונות` : 'ניתן ליצור הזמנה בצ\'אט'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 right-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש בשיחות לפי תוכן, מוצר, כתובת, תאריך..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 font-medium focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            הכל ({logs.length})
          </button>

          <button
            onClick={() => setFilterType('chat')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'chat'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            שיחות נועה AI
          </button>

          <button
            onClick={() => setFilterType('order')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'order'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            קליטת הזמנות
          </button>

          <button
            onClick={() => setFilterType('files')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterType === 'files'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            קבצים ותוכניות
          </button>
        </div>
      </div>

      {/* Main Conversation History Feed Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="text-sm font-bold text-slate-700">טוען תיעוד שיחות מגיליון הנתונים...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-400" />
            <h4 className="font-extrabold text-slate-800 text-base">לא נמצאו רשומות שיחה להתאמה זו</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              כל שיחה או פנייה שתבצע עם נועה AI בצ'אט תתועד כאן באופן אוטומטי לשמירה על שקיפות מלאה.
            </p>
            {onContinueChat && (
              <button
                onClick={() => onContinueChat('שלום נועה, אשמח להתחיל שיחה חדשה')}
                className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>התחל שיחה ראשונה בצ'אט</span>
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isOrderMessage = log.messageType.includes('הזמנה');
            const isFileMessage = log.messageType.includes('קובץ') || log.content.includes('GoogleDrive');

            // Parse text content to separate User & Noa if structured
            let userPrompt = '';
            let noaReply = log.content;

            if (log.content.includes('לקוח:') && log.content.includes('נועה:')) {
              const parts = log.content.split('| נועה:');
              userPrompt = parts[0].replace('לקוח:', '').replace(/"/g, '').trim();
              noaReply = parts[1] ? parts[1].replace(/"/g, '').trim() : '';
            }

            return (
              <div
                key={log.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs ${
                  isOrderMessage
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isFileMessage
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Log Header Bar */}
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 ${
                        isOrderMessage
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isFileMessage
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {isOrderMessage ? (
                        <CheckCircle className="w-3 h-3 text-emerald-700" />
                      ) : isFileMessage ? (
                        <Folder className="w-3 h-3 text-amber-700" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-blue-700" />
                      )}
                      {log.messageType}
                    </span>

                    <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyContent(log.id, log.content)}
                      className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1"
                      title="העתק תוכן שיחה"
                    >
                      {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{copiedId === log.id ? 'הועתק!' : 'העתק'}</span>
                    </button>

                    {onContinueChat && (
                      <button
                        onClick={() =>
                          onContinueChat(
                            userPrompt
                              ? `לגבי פנייתי הקודמת: "${userPrompt}"`
                              : `המשך שיחה מתיעוד בתאריך ${log.timestamp}`
                          )
                        }
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                      >
                        <span>המשך מנקודה זו</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Log Content Body */}
                <div className="p-4 space-y-3 text-xs leading-relaxed">
                  {userPrompt ? (
                    <div className="space-y-2">
                      {/* Customer Question / Prompt */}
                      <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl flex items-start gap-2.5 text-slate-800">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-blue-900 text-[11px] block">
                            פניית הלקוח ({customer.fullName}):
                          </span>
                          <p className="font-medium text-slate-900">{userPrompt}</p>
                        </div>
                      </div>

                      {/* Noa AI Response */}
                      <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-start gap-2.5 text-slate-800">
                        <div className="bg-amber-500 text-slate-950 p-1.5 rounded-lg shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-900 text-[11px] block">
                            מענה נועה AI (מעובד מהמערכת):
                          </span>
                          <p className="text-slate-800">{noaReply}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Plain Raw Log Entry */
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 font-medium">
                      {log.content}
                    </div>
                  )}

                  {/* Drive Folder Attachment Notice if relevant */}
                  {log.drivePath && (
                    <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl text-[11px] text-amber-950">
                      <span className="font-bold flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-amber-700" />
                        תיקיית תיעוד מסמכים בדרייב:
                      </span>
                      <span className="font-mono font-extrabold text-amber-900">{log.drivePath}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EXPORT SUMMARY MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 dir-rtl text-right">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>סיכום דרישות לוגיסטיות ליצוא</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
              {`=========================================
דוח שקיפות דרישות נועה AI
=========================================
שם הלקוח: ${customer.fullName} (${customer.company})
טלפון: ${customer.phone}
כתובת אספקה: ${customer.deliveryAddress}
מסגרת אשראי פנויה: ${(customer.creditLimit - customer.currentBalance).toLocaleString()} ₪
תאריך הפקה: ${new Date().toLocaleString('he-IL')}
-----------------------------------------
רשומות שיחה מתועדות: ${logs.length}
הזמנות קשורות בחשבון: ${orders.filter((o) => o.customerId === customer.id).length}
תיקיית Google Drive: GoogleDrive/${customerFolder}/
=========================================
`}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `דוח דרישות ${customer.company}\nכתובת: ${customer.deliveryAddress}\nאיש קשר: ${customer.fullName} (${customer.phone})\nמסגרת פנויה: ${(customer.creditLimit - customer.currentBalance).toLocaleString()} ₪`
                  );
                  alert('דוח הדרישות הועתק לקליפבורד בהצלחה!');
                  setShowExportModal(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
              >
                העתק סיכום לקליפבורד
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
