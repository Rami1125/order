import React, { useState, useEffect } from 'react';
import { Customer, LogisticsProduct, LogisticsRule, Order } from './types';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_RULES, MOCK_ORDER_LOG, INITIAL_CUSTOMER_ORDERS } from './data/mockData';
import { Header } from './components/Header';
import { MagicLinkBanner } from './components/MagicLinkBanner';
import { CustomerWorkspace } from './components/CustomerWorkspace';
import { AdminStudio } from './components/AdminStudio';

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [activeCustomer, setActiveCustomer] = useState<Customer>(MOCK_CUSTOMERS[0]);
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [hidePricing, setHidePricing] = useState<boolean>(false);

  const [products, setProducts] = useState<LogisticsProduct[]>(MOCK_PRODUCTS);
  const [rules, setRules] = useState<LogisticsRule[]>(MOCK_RULES);
  const [allOrders, setAllOrders] = useState<Order[]>([
    ...INITIAL_CUSTOMER_ORDERS,
    ...MOCK_ORDER_LOG,
  ]);

  // Magic Link Auto Detection from URL Query Params (e.g. ?client=cst_rami or ?token=token_rami_123)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const clientIdParam =
        urlParams.get('client') ||
        urlParams.get('client_id') ||
        urlParams.get('id') ||
        urlParams.get('cst') ||
        urlParams.get('token') ||
        urlParams.get('user');

      if (clientIdParam) {
        const cleanParam = clientIdParam.trim().toLowerCase();
        const found = customers.find(
          (c) =>
            c.id.toLowerCase() === cleanParam ||
            c.token.toLowerCase() === cleanParam ||
            c.company.toLowerCase().includes(cleanParam) ||
            c.name.toLowerCase().includes(cleanParam) ||
            c.phone.includes(cleanParam)
        );
        if (found) {
          setActiveCustomer(found);
          setViewMode('customer');
        }
      }
    } catch {
      // URL Parse fallback
    }
  }, [customers]);

  // Fetch live server state on boot
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, rulesRes, ordersRes, custRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/rules').catch(() => null),
          fetch('/api/orders').catch(() => null),
          fetch('/api/customers').catch(() => null),
        ]);

        if (custRes && custRes.ok) {
          const custData = await custRes.json();
          if (Array.isArray(custData) && custData.length > 0) {
            setCustomers(custData);
          }
        }

        if (prodRes && prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) setProducts(prodData);
        }

        if (rulesRes && rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (Array.isArray(rulesData) && rulesData.length > 0) setRules(rulesData);
        }

        if (ordersRes && ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.customerOrders || ordersData.orderLog) {
            setAllOrders([
              ...(ordersData.customerOrders || []),
              ...(ordersData.orderLog || []),
            ]);
          }
        }
      } catch {
        // Fallback to local mock data
      }
    };

    fetchData();
  }, []);

  const handleOrderCreated = (newOrder: Order) => {
    setAllOrders((prev) => [newOrder, ...prev]);
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setAllOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    if (activeCustomer.id === updatedCustomer.id) {
      setActiveCustomer(updatedCustomer);
    }
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers((prev) => [...prev, newCustomer]);
  };

  const handleUpdateRules = (newRules: LogisticsRule[]) => {
    setRules(newRules);
  };

  const handleUpdateProducts = (newProducts: LogisticsProduct[]) => {
    setProducts(newProducts);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* App Header */}
      <Header
        activeCustomer={activeCustomer}
        viewMode={viewMode}
        setViewMode={setViewMode}
        customers={customers}
        onSelectCustomer={(c) => setActiveCustomer(c)}
        hidePricing={hidePricing}
        onToggleHidePricing={() => setHidePricing((prev) => !prev)}
      />

      {/* Magic Link Banner Demonstrator */}
      <MagicLinkBanner
        customer={activeCustomer}
        customers={customers}
        onSelectCustomer={(c) => setActiveCustomer(c)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'customer' ? (
          <CustomerWorkspace
            customer={activeCustomer}
            orders={allOrders}
            products={products}
            onOrderCreated={handleOrderCreated}
            hidePricing={hidePricing}
          />
        ) : (
          <AdminStudio
            rules={rules}
            onUpdateRules={handleUpdateRules}
            customerOrders={allOrders.filter((o) => o.sourceSheet === 'הזמנות מלקוחות')}
            orderLog={allOrders.filter((o) => o.sourceSheet === 'לוג_הזמנות_מערכת')}
            products={products}
            onUpdateProducts={handleUpdateProducts}
            activeCustomer={activeCustomer}
            customers={customers}
            onOrderUpdated={handleOrderUpdated}
            onCustomerUpdated={handleCustomerUpdated}
            onCustomerCreated={handleCustomerCreated}
            hidePricing={hidePricing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-4 px-6 text-center dir-rtl">
        <p className="font-medium">
          מערכת לוגיסטיקה ואספקת חומרי בניין © 2026 | מופעלת על ידי נועה AI ומונעת בחיסכון באנרגיה דרך Caching Engine
        </p>
      </footer>

    </div>
  );
}
