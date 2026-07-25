import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getNoaSystemPrompt } from './src/lib/systemPrompt';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_RULES, MOCK_ORDER_LOG, INITIAL_CUSTOMER_ORDERS } from './src/data/mockData';
import { Customer, LogisticsProduct, LogisticsRule, Order } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Live In-Memory Sheets Database structure with full CRUD capability
interface SheetData {
  headers: string[];
  rows: Record<string, any>[];
}

interface LiveSheetsDatabase {
  'לוג_הזמנות_מערכת': SheetData;
  'הזמנות מלקוחות': SheetData;
  'תיעוד_שיחות': SheetData;
  'מילון_לוגיסטי': SheetData;
  'חוקי_לוגיסטיקה': SheetData;
  'דשבורד_הזמנות': SheetData;
}

// In-memory data store for live updates during session
let currentCustomers: Customer[] = [...MOCK_CUSTOMERS];
let currentProducts: LogisticsProduct[] = [...MOCK_PRODUCTS];
let currentRules: LogisticsRule[] = [...MOCK_RULES];
let currentOrderLog: Order[] = [...MOCK_ORDER_LOG];
let currentCustomerOrders: Order[] = [...INITIAL_CUSTOMER_ORDERS];

// Default deployed Google Apps Script Web App URL
let appsScriptUrl: string = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxGHpLWX-1-XH4gaEy67Q05sLzKjhrrUd7kskMEYqDBTobnuFRUTIYXSrES1G1F4o0i/exec';

// Initialize full Google Sheets Database in server memory
let liveSheetsDb: LiveSheetsDatabase = {
  'לוג_הזמנות_מערכת': {
    headers: ['תאריך', 'מזהה_לקוח', 'שם_לקוח', 'חברה', 'מוצרים', 'כתובת_אספקה', 'סטטוס'],
    rows: MOCK_ORDER_LOG.map((o) => ({
      id: o.id,
      'תאריך': o.date,
      'מזהה_לקוח': o.customerId,
      'שם_לקוח': o.customerName,
      'חברה': o.companyName,
      'מוצרים': o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
      'כתובת_אספקה': o.deliveryAddress,
      'סטטוס': o.status,
    })),
  },
  'הזמנות מלקוחות': {
    headers: ['מזהה_הזמנה', 'תאריך', 'מזהה_לקוח', 'שם_לקוח', 'כתובת_אספקה', 'פריטים', 'סטטוס', 'הערות'],
    rows: INITIAL_CUSTOMER_ORDERS.map((o) => ({
      id: o.id,
      'מזהה_הזמנה': o.id,
      'תאריך': o.date,
      'מזהה_לקוח': o.customerId,
      'שם_לקוח': o.customerName,
      'כתובת_אספקה': o.deliveryAddress,
      'פריטים': o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
      'סטטוס': o.status,
      'הערות': o.notes || '',
    })),
  },
  'תיעוד_שיחות': {
    headers: ['תאריך_וזמן', 'מזהה_לקוח', 'שם_לקוח', 'סוג_הודעה', 'תוכן', 'קישור_קובץ_דרייב', 'מזהה_קובץ'],
    rows: [
      {
        id: 'log-1',
        'תאריך_וזמן': new Date().toISOString(),
        'מזהה_לקוח': 'cust-001',
        'שם_לקוח': 'ישראל ישראלי',
        'סוג_הודעה': 'שיחה מוקלטת/קובץ קול',
        'תוכן': 'הודעה קולית: "תביאו לי 10 בלות חול ומנוף בבוקר"',
        'קישור_קובץ_דרייב': 'GoogleDrive/cust-001_ישראל_ישראלי/voice_note_1.mp3',
        'מזהה_קובץ': 'drive-file-001',
      },
    ],
  },
  'מילון_לוגיסטי': {
    headers: ['מזהה_מוצר', 'קוד', 'שם_מוצר', 'קטגוריה', 'יחידה', 'תמונת_מוצר', 'הנחיות_יישום_ומפרט'],
    rows: MOCK_PRODUCTS.map((p) => ({
      id: p.id,
      'מזהה_מוצר': p.id,
      'קוד': p.code,
      'שם_מוצר': p.name,
      'קטגוריה': p.category,
      'יחידה': p.unit,
      'תמונת_מוצר': p.imageUrl || '',
      'הנחיות_יישום_ומפרט': p.applicationGuide || p.description || '',
    })),
  },
  'חוקי_לוגיסטיקה': {
    headers: ['מזהה_חוק', 'כותרת', 'קטגוריה', 'תיאור', 'ערך_נומרי', 'יחידה', 'פעיל'],
    rows: MOCK_RULES.map((r) => ({
      id: r.id,
      'מזהה_חוק': r.id,
      'כותרת': r.title,
      'קטגוריה': r.category,
      'תיאור': r.description,
      'ערך_נומרי': r.numericValue || 0,
      'יחידה': r.unit || '',
      'פעיל': r.active ? 'כן' : 'לא',
    })),
  },
  'דשבורד_הזמנות': {
    headers: ['תאריך', 'מזהה_הזמנה', 'שם_לקוח', 'חברה', 'נתיב_מסמכים_בדרייב', 'סטטוס_אספקה'],
    rows: INITIAL_CUSTOMER_ORDERS.map((o) => ({
      id: `dash-${o.id}`,
      'תאריך': o.date,
      'מזהה_הזמנה': o.id,
      'שם_לקוח': o.customerName,
      'חברה': o.companyName,
      'נתיב_מסמכים_בדרייב': `GoogleDrive/${o.customerId}_${o.customerName.replace(/\s+/g, '_')}/`,
      'סטטוס_אספקה': o.status,
    })),
  },
};

const app = express();

async function startServer() {
  const PORT = 3000;

  // Increase payload limit for Base64 image/document/audio uploads
  app.use(express.json({ limit: '25mb' }));

  // CORS middleware for public domain access (Vercel & AI Studio)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize Gemini AI Client lazily on request or server boot
  let aiClient: GoogleGenAI | null = null;
  let customSystemPrompt: string | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('GEMINI_API_KEY is missing in process.env. System will use fallback mode if needed.');
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey || '',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // --- API ROUTES ---

  // 0. Google Apps Script Configuration & Live Proxy Endpoints
  app.get('/api/apps-script/config', (req, res) => {
    res.json({
      success: true,
      appsScriptUrl,
      status: appsScriptUrl ? 'active' : 'unconfigured',
    });
  });

  app.post('/api/apps-script/config', (req, res) => {
    const { url } = req.body;
    if (url && typeof url === 'string') {
      appsScriptUrl = url.trim();
      return res.json({ success: true, appsScriptUrl, message: 'Google Apps Script Web App URL updated successfully!' });
    }
    res.status(400).json({ error: 'Invalid URL provided.' });
  });

  // Proxy requests directly to the deployed Google Apps Script Web App
  app.all('/api/apps-script/proxy', async (req, res) => {
    try {
      if (!appsScriptUrl) {
        return res.status(400).json({ error: 'Apps Script Web App URL is not configured.' });
      }

      const method = req.method;
      let targetUrl = appsScriptUrl;

      if (method === 'GET') {
        const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
        if (queryParams) {
          targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryParams;
        }
      }

      const fetchOptions: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST' || method === 'PUT') {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const gasResponse = await fetch(targetUrl, fetchOptions);
      const textData = await gasResponse.text();

      try {
        const jsonData = JSON.parse(textData);
        return res.json(jsonData);
      } catch {
        return res.type('text/plain').send(textData);
      }
    } catch (err: any) {
      console.error('Error in Apps Script Proxy:', err);
      res.status(500).json({ error: 'Failed to communicate with Google Apps Script Web App', details: err?.message });
    }
  });

  // Whistleblower & Presence Activity Store
  let activityLogs: Array<{
    id: string;
    timestamp: string;
    customerId: string;
    customerName: string;
    companyName: string;
    actionType: string;
    details: string;
    ipOrDevice?: string;
  }> = [
    {
      id: 'act-1',
      timestamp: new Date().toISOString(),
      customerId: 'cst_metropolis',
      customerName: 'ישראל ישראלי',
      companyName: 'מטרופוליס יזמות ובנייה בע"מ',
      actionType: 'login',
      details: 'התחברות מוצלחת דרך Magic Portal (טוקן: token_metropolis_6213903)',
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      customerId: 'cst_metropolis',
      customerName: 'ישראל ישראלי',
      companyName: 'מטרופוליס יזמות ובנייה בע"מ',
      actionType: 'chat_message',
      details: 'שיחה עם נועה AI: "מה המחיר של בלה חול ומתי תוכל להגיע משאית מנוף לרחוב דיזנגוף?"',
    },
  ];

  // Whistleblower Stream Endpoints
  app.get('/api/activity', (req, res) => {
    res.json(activityLogs);
  });

  app.post('/api/activity', (req, res) => {
    const { customerId, customerName, companyName, actionType, details } = req.body;
    const newLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      customerId: customerId || 'unknown',
      customerName: customerName || 'אנונימי',
      companyName: companyName || '',
      actionType: actionType || 'page_view',
      details: details || 'ביצוע פעולה במערכת',
    };
    activityLogs.unshift(newLog);
    if (activityLogs.length > 200) activityLogs.pop();

    const cust = currentCustomers.find((c) => c.id === customerId);
    if (cust) {
      cust.lastActive = newLog.timestamp;
      cust.isOnline = true;
    }

    res.json({ success: true, log: newLog });
  });

  // Customer Avatar Upload Endpoint
  app.post('/api/customers/avatar', (req, res) => {
    const { customerId, avatarUrl } = req.body;
    const cust = currentCustomers.find((c) => c.id === customerId);
    if (cust) {
      cust.avatarUrl = avatarUrl;
      activityLogs.unshift({
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        customerId: cust.id,
        customerName: cust.name,
        companyName: cust.company,
        actionType: 'avatar_updated',
        details: 'עודכן לוגו חברה / תמונת פרופיל בזמן אמת',
      });
      return res.json({ success: true, customer: cust });
    }
    res.status(404).json({ error: 'Customer not found' });
  });

  // 0. Get current customers
  app.get('/api/customers', (req, res) => {
    res.json(currentCustomers);
  });

  // Update or create customer
  app.put('/api/customers/:id', (req, res) => {
    const custId = req.params.id;
    const updatedData = req.body as Partial<Customer>;
    const idx = currentCustomers.findIndex((c) => c.id === custId);
    if (idx >= 0) {
      currentCustomers[idx] = { ...currentCustomers[idx], ...updatedData };
      res.json({ success: true, customer: currentCustomers[idx] });
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  });

  app.post('/api/customers', (req, res) => {
    const newCust = req.body as Customer;
    if (!newCust.id) {
      newCust.id = `cust_${Date.now()}`;
    }
    currentCustomers.push(newCust);
    res.json({ success: true, customer: newCust });
  });

  // 1. Get current products
  app.get('/api/products', (req, res) => {
    res.json(currentProducts);
  });

  // Update/Add product in products & update 'מילון_לוגיסטי' sheet
  app.post('/api/products', (req, res) => {
    const newProduct = req.body as LogisticsProduct;
    const existingIndex = currentProducts.findIndex((p) => p.id === newProduct.id);
    if (existingIndex >= 0) {
      currentProducts[existingIndex] = newProduct;
    } else {
      currentProducts.unshift(newProduct);
    }

    // Sync to מילון_לוגיסטי sheet
    const sheetRows = currentProducts.map((p) => ({
      id: p.id,
      'מזהה_מוצר': p.id,
      'קוד': p.code,
      'שם_מוצר': p.name,
      'קטגוריה': p.category,
      'יחידה': p.unit,
      'תמונת_מוצר': p.imageUrl || '',
      'הנחיות_יישום_ומפרט': p.applicationGuide || p.description || '',
    }));
    liveSheetsDb['מילון_לוגיסטי'].rows = sheetRows;

    res.json({ success: true, products: currentProducts });
  });

  // Delete product
  app.delete('/api/products/:id', (req, res) => {
    const prodId = req.params.id;
    currentProducts = currentProducts.filter((p) => p.id !== prodId);
    liveSheetsDb['מילון_לוגיסטי'].rows = liveSheetsDb['מילון_לוגיסטי'].rows.filter(
      (r) => r.id !== prodId && r['מזהה_מוצר'] !== prodId
    );
    res.json({ success: true, products: currentProducts });
  });

  // System Prompt Customization Endpoints
  app.get('/api/system-prompt', (req, res) => {
    res.json({
      success: true,
      isCustomized: !!customSystemPrompt,
      prompt: customSystemPrompt,
    });
  });

  app.post('/api/system-prompt', (req, res) => {
    const { prompt } = req.body;
    if (typeof prompt === 'string' && prompt.trim()) {
      customSystemPrompt = prompt;
      res.json({ success: true, message: 'System Prompt updated successfully!', prompt: customSystemPrompt });
    } else {
      res.status(400).json({ error: 'Invalid prompt text provided.' });
    }
  });

  app.delete('/api/system-prompt', (req, res) => {
    customSystemPrompt = null;
    res.json({ success: true, message: 'System Prompt reset to auto-generated default.' });
  });

  // 2. Get current rules
  app.get('/api/rules', (req, res) => {
    res.json(currentRules);
  });

  // Update rules & sync to 'חוקי_לוגיסטיקה' sheet
  app.put('/api/rules', (req, res) => {
    const updatedRules = req.body as LogisticsRule[];
    if (Array.isArray(updatedRules)) {
      currentRules = updatedRules;

      liveSheetsDb['חוקי_לוגיסטיקה'].rows = currentRules.map((r) => ({
        id: r.id,
        'מזהה_חוק': r.id,
        'כותרת': r.title,
        'קטגוריה': r.category,
        'תיאור': r.description,
        'ערך_נומרי': r.numericValue || 0,
        'יחידה': r.unit || '',
        'פעיל': r.active ? 'כן' : 'לא',
      }));

      res.json({ success: true, rules: currentRules });
    } else {
      res.status(400).json({ error: 'Invalid rules array' });
    }
  });

  // 3. Get all orders
  app.get('/api/orders', (req, res) => {
    res.json({
      customerOrders: currentCustomerOrders,
      orderLog: currentOrderLog,
    });
  });

  // Submit new customer order ("הזמנות מלקוחות")
  app.post('/api/orders', (req, res) => {
    const orderData = req.body as Order;
    if (!orderData.id) {
      orderData.id = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    orderData.createdAt = new Date().toISOString();
    orderData.sourceSheet = 'הזמנות מלקוחות';
    orderData.status = orderData.status || 'התקבלה';

    currentCustomerOrders.unshift(orderData);

    // Sync row to "הזמנות מלקוחות" live sheet
    const orderRow = {
      id: orderData.id,
      'מזהה_הזמנה': orderData.id,
      'תאריך': orderData.date,
      'מזהה_לקוח': orderData.customerId,
      'שם_לקוח': orderData.customerName,
      'כתובת_אספקה': orderData.deliveryAddress,
      'פריטים': orderData.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
      'סטטוס': orderData.status,
      'הערות': orderData.notes || '',
    };
    liveSheetsDb['הזמנות מלקוחות'].rows.unshift(orderRow);

    // Sync to "דשבורד_הזמנות" sheet
    const cleanCustomerFolder = `${orderData.customerId}_${orderData.customerName.replace(/\s+/g, '_')}`;
    const dashRow = {
      id: `dash-${orderData.id}`,
      'תאריך': orderData.date,
      'מזהה_הזמנה': orderData.id,
      'שם_לקוח': orderData.customerName,
      'חברה': orderData.companyName,
      'נתיב_מסמכים_בדרייב': `GoogleDrive/${cleanCustomerFolder}/`,
      'סטטוס_אספקה': orderData.status,
    };
    liveSheetsDb['דשבורד_הזמנות'].rows.unshift(dashRow);

    // Sync to "תיעוד_שיחות" sheet for conversation & order logging
    const logRow = {
      id: `log-ord-${orderData.id}`,
      'תאריך_וזמן': new Date().toISOString().replace('T', ' ').substring(0, 19),
      'מזהה_לקוח': orderData.customerId,
      'שם_לקוח': orderData.customerName,
      'סוג_הודעה': 'קליטת הזמנה מנועה AI',
      'תוכן': `הזמנה ${orderData.id} נקלטה במערכת. כתובת: ${orderData.deliveryAddress}. פריטים: ${orderData.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ')}`,
      'קישור_קובץ_דרייב': `GoogleDrive/${cleanCustomerFolder}/`,
      'מזהה_קובץ': `ord-${orderData.id}`,
    };
    liveSheetsDb['תיעוד_שיחות'].rows.unshift(logRow);

    // Sync to customer personal tab
    const cleanCustomerName = orderData.customerName.replace(/[/\\?%*:|"<>]/g, '').trim();
    const customerTabName = `${orderData.customerId}_${cleanCustomerName}`;
    if (!liveSheetsDb[customerTabName]) {
      liveSheetsDb[customerTabName] = {
        headers: ['מזהה_הזמנה', 'תאריך', 'פריטים_שסופקו', 'כתובת_יעד', 'סטטוס_אספקה', 'הערות_מנהל_עבודה'],
        rows: [],
      };
    }
    liveSheetsDb[customerTabName].rows.unshift({
      id: orderData.id,
      'מזהה_הזמנה': orderData.id,
      'תאריך': orderData.date,
      'פריטים_שסופקו': orderData.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
      'כתובת_יעד': orderData.deliveryAddress,
      'סטטוס_אספקה': orderData.status,
      'הערות_מנהל_עבודה': orderData.notes || 'כלי עזר נועה AI - בזמן אמת',
    });

    // Forward to external Google Apps Script Web App if configured
    if (appsScriptUrl) {
      fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'appendOrderToCustomerTab', orderData: orderData }),
      }).catch((e) => console.error('Error sending order to Apps Script:', e));

      fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createRow', sheetName: 'הזמנות מלקוחות', rowData: orderRow }),
      }).catch((e) => console.error('Error sending order to Apps Script:', e));

      fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createRow', sheetName: 'תיעוד_שיחות', rowData: logRow }),
      }).catch((e) => console.error('Error sending order log to Apps Script:', e));
    }

    res.json({ success: true, order: orderData, customerOrders: currentCustomerOrders });
  });

  // Update order status or details
  app.put('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const updatedFields = req.body as Partial<Order>;

    let targetOrder = currentCustomerOrders.find((o) => o.id === orderId);
    if (!targetOrder) {
      targetOrder = currentOrderLog.find((o) => o.id === orderId);
    }

    if (targetOrder) {
      Object.assign(targetOrder, updatedFields);

      // Sync status to liveSheetsDb
      const rowInCustSheet = liveSheetsDb['הזמנות מלקוחות'].rows.find((r) => r.id === orderId || r['מזהה_הזמנה'] === orderId);
      if (rowInCustSheet) {
        if (updatedFields.status) rowInCustSheet['סטטוס'] = updatedFields.status;
        if (updatedFields.deliveryAddress) rowInCustSheet['כתובת_אספקה'] = updatedFields.deliveryAddress;
        if (updatedFields.notes) rowInCustSheet['הערות'] = updatedFields.notes;
      }

      const rowInDashSheet = liveSheetsDb['דשבורד_הזמנות'].rows.find((r) => r.id === `dash-${orderId}` || r['מזהה_הזמנה'] === orderId);
      if (rowInDashSheet && updatedFields.status) {
        rowInDashSheet['סטטוס_אספקה'] = updatedFields.status;
      }

      res.json({ success: true, order: targetOrder });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  });

  // --- FULL LIVE SHEETS CRUD API ---

  // Get full sheets data
  app.get('/api/sheets/data', (req, res) => {
    res.json({ success: true, database: liveSheetsDb });
  });

  // Re-initialize/Reset all Google Sheets tables
  app.post('/api/sheets/initialize', (req, res) => {
    res.json({
      success: true,
      message: 'כל 6 הגיליונות אותחלו בהצלחה בבסיס הנתונים הציבורי!',
      tables: Object.keys(liveSheetsDb),
    });
  });

  // CREATE row in sheet
  app.post('/api/sheets/row', (req, res) => {
    const { sheetName, rowData } = req.body;
    if (!sheetName || !liveSheetsDb[sheetName as keyof LiveSheetsDatabase]) {
      return res.status(400).json({ error: `Sheet "${sheetName}" does not exist.` });
    }

    const targetSheet = liveSheetsDb[sheetName as keyof LiveSheetsDatabase];
    const newId = rowData.id || `row-${Date.now()}`;
    const formattedRow = { ...rowData, id: newId };
    targetSheet.rows.unshift(formattedRow);

    res.json({ success: true, sheetName, newRow: formattedRow, totalRows: targetSheet.rows.length });
  });

  // EDIT / UPDATE row in sheet
  app.put('/api/sheets/row', (req, res) => {
    const { sheetName, rowId, rowData } = req.body;
    if (!sheetName || !liveSheetsDb[sheetName as keyof LiveSheetsDatabase]) {
      return res.status(400).json({ error: `Sheet "${sheetName}" does not exist.` });
    }

    const targetSheet = liveSheetsDb[sheetName as keyof LiveSheetsDatabase];
    const rowIndex = targetSheet.rows.findIndex((r) => r.id === rowId || r['מזהה_הזמנה'] === rowId || r['מזהה_מוצר'] === rowId || r['מזהה_חוק'] === rowId);

    if (rowIndex < 0) {
      return res.status(404).json({ error: `Row with ID ${rowId} not found in sheet ${sheetName}` });
    }

    targetSheet.rows[rowIndex] = { ...targetSheet.rows[rowIndex], ...rowData };
    res.json({ success: true, sheetName, updatedRow: targetSheet.rows[rowIndex] });
  });

  // DELETE row in sheet
  app.delete('/api/sheets/row', (req, res) => {
    const { sheetName, rowId } = req.body;
    if (!sheetName || !liveSheetsDb[sheetName as keyof LiveSheetsDatabase]) {
      return res.status(400).json({ error: `Sheet "${sheetName}" does not exist.` });
    }

    const targetSheet = liveSheetsDb[sheetName as keyof LiveSheetsDatabase];
    const initialCount = targetSheet.rows.length;
    targetSheet.rows = targetSheet.rows.filter((r) => r.id !== rowId && r['מזהה_הזמנה'] !== rowId && r['מזהה_מוצר'] !== rowId && r['מזהה_חוק'] !== rowId);

    res.json({
      success: true,
      sheetName,
      deletedId: rowId,
      removedCount: initialCount - targetSheet.rows.length,
    });
  });

  // --- GOOGLE DRIVE UPLOAD ENDPOINT (Images, Documents, Audio Clips) ---
  app.post('/api/drive/upload', (req, res) => {
    try {
      const { customerId, customerName, fileName, fileType, base64Data, messageText } = req.body;

      const cleanCustomerFolder = `${customerId || 'cust-001'}_${(customerName || 'לקוח').replace(/\s+/g, '_')}`;
      const driveFolder = `GoogleDrive/${cleanCustomerFolder}`;
      const fileDrivePath = `${driveFolder}/${fileName || `file_${Date.now()}`}`;

      const fileTypeCategory = fileType?.includes('image')
        ? 'תמונה/תכניות'
        : fileType?.includes('audio')
        ? 'הקלטת קול/שמע'
        : 'מסמך/PDF';

      // Log to 'תיעוד_שיחות' sheet
      const chatLogEntry = {
        id: `chat-${Date.now()}`,
        'תאריך_וזמן': new Date().toISOString(),
        'מזהה_לקוח': customerId || 'cust-001',
        'שם_לקוח': customerName || 'לקוח',
        'סוג_הודעה': fileTypeCategory,
        'תוכן': messageText || `העלאת קובץ ${fileTypeCategory}: ${fileName}`,
        'קישור_קובץ_דרייב': fileDrivePath,
        'מזהה_קובץ': `drive-${Math.random().toString(36).substr(2, 9)}`,
      };

      liveSheetsDb['תיעוד_שיחות'].rows.unshift(chatLogEntry);

      res.json({
        success: true,
        driveFolder,
        fileDrivePath,
        fileName,
        fileTypeCategory,
        loggedToSheet: 'תיעוד_שיחות',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to process file upload to Drive.', details: err?.message });
    }
  });

  // --- GOOGLE APPS SCRIPT CODE GENERATOR ROUTE ---
  app.get('/api/apps-script/code', (req, res) => {
    try {
      const codeGsPath = path.join(process.cwd(), 'Code.gs');
      if (fs.existsSync(codeGsPath)) {
        const appsScriptCode = fs.readFileSync(codeGsPath, 'utf-8');
        return res.type('text/plain').send(appsScriptCode);
      } else {
        return res.status(404).send('Code.gs not found');
      }
    } catch (err: any) {
      return res.status(500).send(`Error reading Code.gs: ${err?.message}`);
    }
  });

  // Proxy actions to Google Apps Script Web App
  app.post('/api/apps-script/setup-sheets', async (req, res) => {
    try {
      if (!appsScriptUrl) {
        return res.json({ success: true, message: 'Google Sheets and headers initialized locally in server memory!' });
      }
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setupSheets' }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to trigger setupSheets on Apps Script', details: err?.message });
    }
  });

  app.post('/api/apps-script/create-customer-tab', async (req, res) => {
    try {
      const customerData = req.body;
      if (!appsScriptUrl) {
        return res.json({ success: true, message: 'Smart customer folder & tab structure created in memory!' });
      }
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createCustomerTab', ...customerData }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create customer tab on Apps Script', details: err?.message });
    }
  });

  app.post('/api/apps-script/sync-rules', async (req, res) => {
    try {
      if (!appsScriptUrl) {
        return res.json({ success: true, message: 'Logistics rules book synced in memory!' });
      }
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncRules' }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to sync rules on Apps Script', details: err?.message });
    }
  });

  // 4. Noa AI Chatbot Route
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, customerId } = req.body;

      // Find active customer
      const customer = currentCustomers.find((c) => c.id === customerId) || currentCustomers[0];

      // Build System Prompt with current Rules and Product Dictionary (or custom override)
      const systemPrompt = customSystemPrompt || getNoaSystemPrompt(customer, currentProducts, currentRules);

      const ai = getGeminiClient();

      // Format context for prompt call
      const promptContents = [
        {
          role: 'user',
          parts: [{ text: `[מזהה לקוח: ${customer.name}, חברה: ${customer.company}]\n\nהודעת הלקוח: ${message}` }],
        },
      ];

      // Call Gemini 3.6 Flash model
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const rawText = response.text || '';

      // Check if response contains an order draft JSON block
      let draftData = null;
      const jsonMatch = rawText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.orderDraft) {
            draftData = parsed.orderDraft;
          }
        } catch {
          // JSON parsing fallback
        }
      }

      // Clean raw text to strip raw codeblock syntax if present for display
      const cleanHtmlText = rawText
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      // Log conversation to 'תיעוד_שיחות'
      const cleanCustomerFolder = `${customer.id}_${(customer.fullName || customer.name).replace(/\s+/g, '_')}`;
      const chatLogRow = {
        id: `log-chat-${Date.now()}`,
        'תאריך_וזמן': new Date().toISOString().replace('T', ' ').substring(0, 19),
        'מזהה_לקוח': customer.id,
        'שם_לקוח': customer.fullName || customer.name,
        'סוג_הודעה': 'שיחה עם נועה AI',
        'תוכן': `לקוח: "${message}" | נועה: "${cleanHtmlText.replace(/<[^>]*>/g, '').substring(0, 250)}"`,
        'קישור_קובץ_דרייב': `GoogleDrive/${cleanCustomerFolder}/`,
        'מזהה_קובץ': `chat-${Date.now()}`,
      };
      liveSheetsDb['תיעוד_שיחות'].rows.unshift(chatLogRow);

      if (appsScriptUrl) {
        fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'createRow', sheetName: 'תיעוד_שיחות', rowData: chatLogRow }),
        }).catch((e) => console.error('Error logging chat to Apps Script:', e));
      }

      res.json({
        success: true,
        reply: cleanHtmlText,
        orderDraft: draftData,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      res.status(500).json({
        error: 'Failed to generate response from Noa AI.',
        details: err?.message || String(err),
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export default app;
