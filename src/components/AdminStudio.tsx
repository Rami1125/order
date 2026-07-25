import React, { useState, useEffect } from 'react';
import { LogisticsRule, CacheEntry, Order, LogisticsProduct, Customer } from '../types';
import { globalCacheEngine } from '../lib/cacheEngine';
import { getNoaSystemPrompt } from '../lib/systemPrompt';
import { DynamicRulesPage } from './DynamicRulesPage';
import { OrderCustomerEditor } from './OrderCustomerEditor';
import { CatalogManager } from './CatalogManager';
import { SystemPromptEditor } from './SystemPromptEditor';
import { WhistleblowerDashboard } from './WhistleblowerDashboard';
import { Sliders, Zap, FileSpreadsheet, Package, Code, Plus, Trash2, Save, CheckCircle, Download, Search, Globe, Link, ExternalLink, RefreshCw, Copy, Folder, Edit3, Sparkles, Activity, Eye, Radio } from 'lucide-react';

interface AdminStudioProps {
  rules: LogisticsRule[];
  onUpdateRules: (newRules: LogisticsRule[]) => void;
  customerOrders: Order[];
  orderLog: Order[];
  products: LogisticsProduct[];
  onUpdateProducts: (products: LogisticsProduct[]) => void;
  activeCustomer: Customer;
  customers: Customer[];
  onOrderUpdated: (updatedOrder: Order) => void;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
  onCustomerCreated: (newCustomer: Customer) => void;
  hidePricing?: boolean;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  rules,
  onUpdateRules,
  customerOrders,
  orderLog = [],
  products,
  onUpdateProducts,
  activeCustomer,
  customers,
  onOrderUpdated,
  onCustomerUpdated,
  onCustomerCreated,
  hidePricing = false,
}) => {
  const [adminTab, setAdminTab] = useState<'whistleblower' | 'rules' | 'dynamic-rules' | 'editor' | 'cache' | 'orders' | 'products' | 'prompt' | 'gas'>('whistleblower');

  // Google Apps Script Web App URL state
  const [gasUrl, setGasUrl] = useState<string>('https://script.google.com/macros/s/AKfycbxmdosQACLby0LqvS4qIpruE2975rjo6B-7ZXDP2iYfXzMUmklhFf_cAUsTJgzLTBbk/exec');
  const [gasPingStatus, setGasPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [gasPingResponse, setGasPingResponse] = useState<string>('');
  const [codeGsText, setCodeGsText] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  useEffect(() => {
    // Fetch current server Apps Script URL
    fetch('/api/apps-script/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.appsScriptUrl) setGasUrl(data.appsScriptUrl);
      })
      .catch(() => {});

    // Fetch Code.gs contents
    fetch('/api/apps-script/code')
      .then((res) => res.text())
      .then((text) => setCodeGsText(text))
      .catch(() => {});
  }, []);

  const handleSaveGasUrl = async () => {
    try {
      const res = await fetch('/api/apps-script/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gasUrl }),
      });
      const data = await res.json();
      if (data.success) {
        alert('כתובת Google Apps Script עודכנה בהצלחה בשרת!');
      }
    } catch {
      alert('שגיאה בשמירת כתובת ה-Apps Script');
    }
  };

  const handleTestGasConnection = async () => {
    setGasPingStatus('testing');
    setGasPingResponse('');
    try {
      const res = await fetch('/api/apps-script/proxy?action=init');
      const data = await res.json();
      setGasPingStatus('success');
      setGasPingResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setGasPingStatus('error');
      setGasPingResponse(`Error connecting: ${err?.message || String(err)}`);
    }
  };

  const handleCopyCodeGs = () => {
    navigator.clipboard.writeText(codeGsText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyGasUrl = () => {
    navigator.clipboard.writeText(gasUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Rules state
  const [ruleList, setRuleList] = useState<LogisticsRule[]>(rules);
  const [ruleSaveMessage, setRuleSaveMessage] = useState(false);

  // New Rule Modal
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<LogisticsRule['category']>('deposits');
  const [newRuleVal, setNewRuleVal] = useState<number>(25);

  // Cache state
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>(globalCacheEngine.getCacheList());
  const [cacheSearch, setCacheSearch] = useState('');
  const [cacheStats, setCacheStats] = useState(globalCacheEngine.getStats());

  // Handle Rule Toggle & Edit
  const handleToggleRule = (id: string) => {
    const updated = ruleList.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    setRuleList(updated);
    onUpdateRules(updated);
  };

  const handleUpdateRuleValue = (id: string, newVal: number) => {
    const updated = ruleList.map((r) => (r.id === id ? { ...r, numericValue: newVal } : r));
    setRuleList(updated);
    onUpdateRules(updated);
  };

  const handleSaveRulesToServer = async () => {
    try {
      await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleList),
      });
      setRuleSaveMessage(true);
      setTimeout(() => setRuleSaveMessage(false), 2500);
    } catch {
      alert('שגיאה בשמירת החוקים בשרת');
    }
  };

  const handleAddRule = () => {
    if (!newRuleTitle.trim()) return;
    const newRule: LogisticsRule = {
      id: `rule-${Date.now()}`,
      category: newRuleCategory,
      title: newRuleTitle,
      description: newRuleDesc,
      active: true,
      numericValue: newRuleVal,
      unit: '₪',
      updatedAt: new Date().toISOString().substring(0, 10),
    };
    const updated = [newRule, ...ruleList];
    setRuleList(updated);
    onUpdateRules(updated);
    setShowNewRuleModal(false);
    setNewRuleTitle('');
    setNewRuleDesc('');
  };

  // Cache actions
  const handleDeleteCache = (id: string) => {
    globalCacheEngine.deleteCacheEntry(id);
    setCacheEntries([...globalCacheEngine.getCacheList()]);
    setCacheStats({ ...globalCacheEngine.getStats() });
  };

  const handleClearAllCache = () => {
    if (confirm('האם לנכות את כל פריטי ה-Cache במערכת?')) {
      globalCacheEngine.clearAllCache();
      setCacheEntries([]);
      setCacheStats({ ...globalCacheEngine.getStats() });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = 'תאריך,מזהה_לקוח,שם_לקוח,חברה,כתובת_אספקה,מוצרים,סטטוס,הערות\n';
    const rows = customerOrders
      .map(
        (o) =>
          `"${o.date}","${o.customerId}","${o.customerName}","${o.companyName}","${o.deliveryAddress}","${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ')}","${o.status}","${o.notes || ''}"`
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `הזמנות_מלקוחות_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  const filteredCache = cacheEntries.filter((c) =>
    c.queryKey.toLowerCase().includes(cacheSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(cacheSearch.toLowerCase())
  );

  const samplePrompt = getNoaSystemPrompt(activeCustomer, products, ruleList);

  return (
    <div className="space-y-6 dir-rtl">
      
      {/* Admin Header Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Admin Studio & Rules Engine</h2>
            <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
              דף ניהול מרכזי
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            ניהול ספר חוקי הפקדונות, מעקב הזמנות מלקוחות, מחירון מוצרים, ומנוע Caching לחסכון בטוקנים של Gemini
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ruleSaveMessage && (
            <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> החוקים עודכנו בהצלחה!
            </span>
          )}
          <button
            onClick={handleSaveRulesToServer}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>שמור חוקים בשרת</span>
          </button>
        </div>
      </div>

      {/* Admin Subtabs Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setAdminTab('whistleblower')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'whistleblower' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-300 animate-pulse" />
          <span>"מלשינון" ומעקב נוכחות חי</span>
        </button>

        <button
          onClick={() => setAdminTab('dynamic-rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'dynamic-rules' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>מנוע חוקים וסימולטור דינאמי</span>
        </button>

        <button
          onClick={() => setAdminTab('editor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'editor' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Edit3 className="w-4 h-4 text-amber-300" />
          <span>עריכת הזמנות ולקוחות</span>
        </button>

        <button
          onClick={() => setAdminTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'rules' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ספר חוקים לוגיסטי ({ruleList.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('cache')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'cache' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Cache & Token Saver</span>
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'orders' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>גיליון "הזמנות מלקוחות" ({customerOrders.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'products' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>"מילון לוגיסטי" ({products.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('prompt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'prompt' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>System Prompt Viewer</span>
        </button>

        <button
          onClick={() => setAdminTab('gas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 ${
            adminTab === 'gas' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-300" />
          <span>Google Apps Script & Drive LIVE</span>
        </button>
      </div>

      {/* SUBTAB: Whistleblower Stream & Live Presence */}
      {adminTab === 'whistleblower' && (
        <WhistleblowerDashboard
          customers={customers}
          orders={customerOrders}
          onCustomerUpdated={onCustomerUpdated}
        />
      )}

      {/* SUBTAB: Dynamic Rules Page */}
      {adminTab === 'dynamic-rules' && (
        <DynamicRulesPage
          rules={ruleList}
          onUpdateRules={onUpdateRules}
          activeCustomer={activeCustomer}
          products={products}
          hidePricing={hidePricing}
        />
      )}

      {/* SUBTAB: Order and Customer Editor */}
      {adminTab === 'editor' && (
        <OrderCustomerEditor
          orders={customerOrders}
          customers={customers}
          products={products}
          onOrderUpdated={onOrderUpdated}
          onCustomerUpdated={onCustomerUpdated}
          onCustomerCreated={onCustomerCreated}
          hidePricing={hidePricing}
        />
      )}

      {/* SUBTAB 1: Rules Engine */}
      {adminTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>מערכת אכיפת חוקי פקדונות ומשלוחים</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                נועה קוראת את החוקים האלה ואוכפת אותם בשיחה בזמן אמת מול הלקוח!
              </p>
            </div>

            <button
              onClick={() => setShowNewRuleModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף חוק לוגיסטי</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ruleList.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  r.active ? 'border-slate-200 shadow-2xs' : 'border-slate-200/60 bg-slate-50/70 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRule(r.id)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        r.active ? 'bg-green-500 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-md"></span>
                    </button>
                    <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
                  </div>

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {r.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{r.description}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-slate-500 font-medium">ערך נומרי לאכיפה:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={r.numericValue || 0}
                      onChange={(e) => handleUpdateRuleValue(r.id, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-slate-900 text-xs focus:outline-hidden"
                    />
                    <span className="font-bold text-slate-700">{r.unit || '₪'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Cache & Token Saver */}
      {adminTab === 'cache' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 text-slate-900 p-4 rounded-2xl shadow-2xs dir-rtl">
              <span className="text-xs text-slate-500 font-bold block mb-1">טוקנים שנחסכו (Gemini)</span>
              <span className="text-2xl font-black text-amber-600">{cacheStats.totalTokensSaved.toLocaleString()}</span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">חיסכון ישיר בעלויות API</p>
            </div>

            <div className="bg-white border border-slate-200 text-slate-900 p-4 rounded-2xl shadow-2xs dir-rtl">
              <span className="text-xs text-slate-500 font-bold block mb-1">קריאות API שנחסכו</span>
              <span className="text-2xl font-black text-blue-600">{cacheStats.totalApiCallsSaved}</span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">מענה מיידי מ-Cache</p>
            </div>

            <div className="bg-white border border-slate-200 text-slate-900 p-4 rounded-2xl shadow-2xs dir-rtl">
              <span className="text-xs text-slate-500 font-bold block mb-1">יחס פגיעה במטמון (Hit Ratio)</span>
              <span className="text-2xl font-black text-green-600">{cacheStats.cacheHitRatioPercent}%</span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">אופטימיזציית שאילתות</p>
            </div>

            <div className="bg-white border border-slate-200 text-slate-900 p-4 rounded-2xl shadow-2xs dir-rtl">
              <span className="text-xs text-slate-500 font-bold block mb-1">אנרגיה שנחסכה (Wh)</span>
              <span className="text-2xl font-black text-slate-900">{cacheStats.estimatedEnergySavedWh} Wh</span>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">פליטת פחמן מופחתת</p>
            </div>
          </div>

          {/* Cache Management Header & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 absolute top-3 right-3 text-slate-400" />
              <input
                type="text"
                value={cacheSearch}
                onChange={(e) => setCacheSearch(e.target.value)}
                placeholder="חפש תשובות במאגר ה-Cache..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-4 py-2 text-xs font-medium focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleClearAllCache}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>נקה מטמון הכל</span>
            </button>
          </div>

          {/* Cache List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3">שאילתה / כוונת הלקוח</th>
                  <th className="p-3">קטגוריה</th>
                  <th className="p-3">פגיעות (Hits)</th>
                  <th className="p-3">טוקנים שנחסכו</th>
                  <th className="p-3">שימוש אחרון</th>
                  <th className="p-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredCache.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{item.queryKey}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-600">{item.hitCount}</td>
                    <td className="p-3 font-bold text-green-700">{item.tokensSavedCount.toLocaleString()}</td>
                    <td className="p-3 text-slate-500">{item.lastUsed}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteCache(item.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                        title="מחק מ-Cache"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Customer Orders Sheet */}
      {adminTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span>גיליון יעד: "הזמנות מלקוחות"</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                הזמנות שנוצרו ואושרו בלייב על ידי הלקוחות דרך נועה AI
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>ייצא ל-Google Sheets / CSV</span>
            </button>
          </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {customerOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-600">{o.date}</td>
                    <td className="p-3 font-mono text-slate-500">{o.customerId}</td>
                    <td className="p-3 font-bold">{o.customerName}</td>
                    <td className="p-3 font-bold text-blue-900">{o.companyName}</td>
                    <td className="p-3">{o.deliveryAddress}</td>
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
                      <span className="bg-green-50 text-green-700 border border-green-200 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic">{o.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Logistics Products Dictionary */}
      {adminTab === 'products' && (
        <CatalogManager
          products={products}
          onUpdateProducts={onUpdateProducts}
          hidePricing={hidePricing}
        />
      )}

      {/* SUBTAB 5: Gemini System Prompt Editor */}
      {adminTab === 'prompt' && (
        <SystemPromptEditor
          activeCustomer={activeCustomer}
          products={products}
          rules={ruleList}
        />
      )}

      {/* SUBTAB 6: Google Apps Script & Drive Live Connection */}
      {adminTab === 'gas' && (
        <div className="space-y-6">
          {/* Active Status Card */}
          <div className="bg-emerald-950 text-emerald-100 p-6 rounded-2xl border border-emerald-800 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-600 flex items-center justify-center text-emerald-300 font-black">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span>חיבור מחובר בלייב: Google Apps Script Web App</span>
                    <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      ACTIVE WEB APP
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    קישור ה-Web App של שרת ה-Google Sheets ו-Google Drive המבצעי שלך
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestGasConnection}
                  disabled={gasPingStatus === 'testing'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <RefreshCw className={`w-4 h-4 ${gasPingStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>{gasPingStatus === 'testing' ? 'בודק חיבור...' : 'בדוק חיבור וסנכרון (Ping)'}</span>
                </button>

                <a
                  href={gasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>פתח בדפדפן</span>
                </a>
              </div>
            </div>

            {/* URL Input & Save */}
            <div className="space-y-2 dir-rtl">
              <label className="text-xs font-bold text-emerald-200 block">כתובת Web App ב-Google Apps Script (Web App Deployment URL):</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="w-4 h-4 absolute top-3 right-3 text-emerald-400" />
                  <input
                    type="text"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    className="w-full bg-emerald-900/40 border border-emerald-700/80 rounded-xl pr-9 pl-3 py-2 text-xs font-mono text-emerald-200 focus:outline-hidden focus:border-emerald-400"
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                </div>

                <button
                  onClick={handleCopyGasUrl}
                  className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'הועתק!' : 'העתק'}</span>
                </button>

                <button
                  onClick={handleSaveGasUrl}
                  className="bg-white hover:bg-emerald-100 text-emerald-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  עדכן URL
                </button>
              </div>
            </div>

            {/* Action Triggers for Apps Script */}
            <div className="bg-emerald-900/60 border border-emerald-700/80 p-4 rounded-xl space-y-3 dir-rtl">
              <span className="text-xs font-bold text-emerald-200 block">הפעלת פונקציות אוטומטיות ב-Google Sheets:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={async () => {
                    setGasPingStatus('testing');
                    try {
                      const res = await fetch('/api/apps-script/setup-sheets', { method: 'POST' });
                      const data = await res.json();
                      setGasPingStatus('success');
                      setGasPingResponse(JSON.stringify(data, null, 2));
                    } catch (e: any) {
                      setGasPingStatus('error');
                      setGasPingResponse(`Error: ${e?.message}`);
                    }
                  }}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>1. הקמת הגיליונות והדשבורד</span>
                </button>

                <button
                  onClick={async () => {
                    setGasPingStatus('testing');
                    try {
                      const res = await fetch('/api/apps-script/sync-rules', { method: 'POST' });
                      const data = await res.json();
                      setGasPingStatus('success');
                      setGasPingResponse(JSON.stringify(data, null, 2));
                    } catch (e: any) {
                      setGasPingStatus('error');
                      setGasPingResponse(`Error: ${e?.message}`);
                    }
                  }}
                  className="bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  <span>2. העתקת ספר החוקים</span>
                </button>

                <button
                  onClick={async () => {
                    setGasPingStatus('testing');
                    try {
                      const res = await fetch('/api/apps-script/create-customer-tab', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customerId: activeCustomer.id,
                          customerName: activeCustomer.name,
                          companyName: activeCustomer.company,
                          phone: activeCustomer.phone,
                          deliveryAddress: activeCustomer.deliveryAddress,
                          notes: 'גישת מנוף 3.5 מטר, תיאום חצי שעה מראש עם מנהל העבודה',
                        }),
                      });
                      const data = await res.json();
                      setGasPingStatus('success');
                      setGasPingResponse(JSON.stringify(data, null, 2));
                    } catch (e: any) {
                      setGasPingStatus('error');
                      setGasPingResponse(`Error: ${e?.message}`);
                    }
                  }}
                  className="bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Folder className="w-4 h-4 text-amber-300" />
                  <span>3. יצירת טאב ותיקיית לקוח חכמה</span>
                </button>
              </div>
            </div>

            {/* Test Ping Response Box */}
            {gasPingResponse && (
              <div className="bg-emerald-950/90 border border-emerald-800 p-4 rounded-xl text-xs font-mono space-y-1">
                <div className="flex justify-between text-emerald-400 font-bold mb-1">
                  <span>תגובת שרת Google Apps Script (JSON):</span>
                  <span className={gasPingStatus === 'success' ? 'text-green-400 font-bold' : 'text-rose-400 font-bold'}>
                    {gasPingStatus === 'success' ? '✓ STATUS 200 OK' : '✗ ERROR'}
                  </span>
                </div>
                <pre className="text-emerald-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-tight dir-ltr">
                  {gasPingResponse}
                </pre>
              </div>
            )}
          </div>

          {/* Drive & Sheets Architecture Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>6 הגיליונות המסונכרנים ב-Google Sheets</span>
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">לוג_הזמנות_מערכת:</strong> רישום היסטוריית כל ההזמנות במערכת</li>
                <li><strong className="text-slate-800">הזמנות מלקוחות:</strong> הזמנות חדשות בזמן אמת מנועה AI</li>
                <li><strong className="text-slate-800">תיעוד_שיחות:</strong> לוג שיחות, הודעות קוליות וקישורי Drive</li>
                <li><strong className="text-slate-800">מילון_לוגיסטי:</strong> קטלוג מוצרים (עמודה F: תמונת_מוצר, עמודה G: הנחיות_יישום_ומפרט לשליפה בלעדית של נועה AI)</li>
                <li><strong className="text-slate-800">חוקי_פקדונות:</strong> ספר החוקים, מחיר פקדון משטחים/דליים/בלה</li>
                <li><strong className="text-slate-800">דשבורד_הזמנות:</strong> מעקב אספקה ונתיבי דרייב של תיקיות לקוח</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-600" />
                <span>מבנה Google Drive ללקוחות</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                כל העלאת קובץ (תמונה, תכנית בנייה, מסמך PDF, או הקלטת קול) דרך נועה AI נשמרת אוטומטית בתיקיית Google Drive ייעודית בפורמט:
              </p>
              <div className="bg-slate-900 text-amber-300 font-mono text-xs p-3 rounded-xl border border-slate-800 dir-ltr text-center font-bold">
                GoogleDrive/[מזהה_לקוח]_[שם_לקוח]/
              </div>
              <p className="text-[11px] text-slate-500">
                המערכת מייצרת לינק שיתוף ציבורי מתועד ישירות בגיליון "תיעוד_שיחות"!
              </p>
            </div>
          </div>

          {/* Full Code.gs Source Code Viewer & Copy */}
          <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-3 shadow-2xs font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 dir-rtl">
              <div>
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span>קוד ה-Code.gs המלא להעתקה ל-Google Apps Script Editor</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  כלול את מנוע ה-Init, ה-CRUD המלא ב-JSON וה-Drive Upload Base64
                </p>
              </div>

              <button
                onClick={handleCopyCodeGs}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCode ? 'הקוד הועתק ללוח!' : 'העתק את הקוד המלא'}</span>
              </button>
            </div>

            <pre className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 max-h-[400px] overflow-y-auto leading-relaxed dir-ltr">
              {codeGsText || '// הטוען קוד Code.gs...'}
            </pre>
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      {showNewRuleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl dir-rtl">
            <h3 className="font-bold text-slate-900 text-lg mb-4">הוספת חוק לוגיסטי חדש</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">כותרת החוק:</label>
                <input
                  type="text"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="לדוגמה: פקדון דליים / תוספת מנוף"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">תיאור והסבר אכיפה:</label>
                <textarea
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  placeholder="הסבר שיוצג ללקוח במידת הצורך..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">קטגוריה:</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="deposits">פקדונות</option>
                    <option value="delivery">משלוחים</option>
                    <option value="minimums">מינימום הזמנה</option>
                    <option value="discounts">הנחות</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ערך בש"ח:</label>
                  <input
                    type="number"
                    value={newRuleVal}
                    onChange={(e) => setNewRuleVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddRule}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                שמור חוק חדש
              </button>
              <button
                onClick={() => setShowNewRuleModal(false)}
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
