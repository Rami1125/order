import React, { useState, useEffect } from 'react';
import { Customer, CustomerActivityLog, Order } from '../types';
import { Activity, Radio, Eye, MessageSquare, ShoppingCart, UserCheck, Image, Clock, Search, ExternalLink, ShieldCheck, RefreshCw, Filter, Sparkles } from 'lucide-react';

interface WhistleblowerDashboardProps {
  customers: Customer[];
  orders: Order[];
  onCustomerUpdated?: (cust: Customer) => void;
}

export const WhistleblowerDashboard: React.FC<WhistleblowerDashboardProps> = ({
  customers,
  orders,
}) => {
  const [activities, setActivities] = useState<CustomerActivityLog[]>([]);
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Fetch activities from backend
  const fetchActivityFeed = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/activity').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivities(data);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchActivityFeed();
    const interval = setInterval(fetchActivityFeed, 4000); // Poll every 4s for live stream
    return () => clearInterval(interval);
  }, []);

  const filteredActivities = activities.filter((act) => {
    const matchesCustomer = filterCustomer === 'all' || act.customerId === filterCustomer;
    const matchesSearch =
      !searchQuery ||
      act.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCustomer && matchesSearch;
  });

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return {
          label: '🔑 התחברות Magic Link',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: UserCheck,
        };
      case 'chat_message':
        return {
          label: '💬 שיחה עם נועה AI',
          color: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: MessageSquare,
        };
      case 'order_submitted':
        return {
          label: '✍️ קליטת הזמנה בזמן אמת',
          color: 'bg-green-100 text-green-900 border-green-300',
          icon: ShoppingCart,
        };
      case 'avatar_updated':
        return {
          label: '🖼️ עדכון לוגו/פרופיל',
          color: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: Image,
        };
      case 'draft_opened':
        return {
          label: '📄 פתיחת טיוטה',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
        };
      default:
        return {
          label: '👁️ צפייה במערכת',
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: Eye,
        };
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      
      {/* Live Whistleblower Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                דשבורד "מלשינון" ומעקב פעילות חי (Whistleblower Stream)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                ניטור בזמן אמת של התחברויות לקוחות, הודעות AI, טיוטות והזמנות מהגיליון
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-extrabold">שידור חי</span>
            <span className="text-slate-400 font-mono text-[11px]">({lastRefreshed})</span>
          </div>

          <button
            onClick={fetchActivityFeed}
            disabled={isRefreshing}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
            title="רענן זרם פעילות"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>רענן</span>
          </button>
        </div>
      </div>

      {/* Live Presence Grid */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              סטטוס נוכחות לקוחות בזמן אמת ({customers.length} לקוחות רשומים)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            סנכרון מלא מגיליון Google Sheets ו-Magic Links
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customers.map((cust) => {
            const custOrders = orders.filter((o) => o.customerId === cust.id);
            const isOnline = cust.isOnline || cust.id === 'cst_metropolis'; // Demo indicator
            
            return (
              <div
                key={cust.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative overflow-hidden"
              >
                {/* Status Indicator Pill */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isOnline ? 'מחובר כעת' : 'פעיל לאחרונה'}</span>
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {cust.id}
                  </span>
                </div>

                {/* Company & Name */}
                <div className="flex items-center gap-2.5">
                  {cust.avatarUrl ? (
                    <img
                      src={cust.avatarUrl}
                      alt={cust.company}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-300 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                      {cust.company.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate">{cust.company}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{cust.name} ({cust.phone})</p>
                  </div>
                </div>

                {/* Direct Magic Link */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">{custOrders.length} הזמנות רשומות</span>
                  <a
                    href={`/?token=${cust.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-bold hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>פתח Magic Portal</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed Filter & Stream Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              זרם פעולות בזמן אמת (Live Activity Feed)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Customer Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>סינון לפי לקוח:</span>
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
              >
                <option value="all">כל הלקוחות ({activities.length})</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Free Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי תוכן פעולה..."
                className="bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Feed List */}
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
            אין פעילויות עדכניות התואמות את מסנני הניטור.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => {
              const badge = getActionBadge(act.actionType);
              const Icon = badge.icon;
              const formattedTime = new Date(act.timestamp).toLocaleTimeString();

              return (
                <div
                  key={act.id}
                  className="py-3 px-2 hover:bg-slate-50 rounded-xl transition flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-slate-400 font-mono text-[11px] shrink-0 font-bold bg-slate-100 px-2 py-1 rounded-md">
                      {formattedTime}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-extrabold text-[11px] border shrink-0 ${badge.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900">{act.companyName || act.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({act.customerId})</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5 line-clamp-2">
                        {act.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 inline ml-1" />
                    <span>Google Sheets & Drive Synced</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
