/**
 * ==============================================================================
 * Google Apps Script Backend Server (Code.gs)
 * DeliveryMaster & Noa AI - Building Materials Logistics System
 * ==============================================================================
 * 
 * תסריט Google Apps Script מתקדם לניהול מערך לוגיסטיקת חומרי בניין:
 * 1. יצירה, עיצוב והגדרה אוטומטית של כותרות עמודות, כרטיסים וטאבים ב-Google Sheets (setupSheetsAndHeaders)
 * 2. הקמת ספר החוקים הלוגיסטי המלא ("חוקי_לוגיסטיקה") לעריכה מודרנית בזמן אמת מתוך Sheets
 * 3. פונקציה חכמה ליצירת טאב לקוח מבודד + תיקיית Google Drive יעודית (createSmartCustomerSheetFolder)
 *    במבנה מובנה בעל זיהוי מהיר לשליפת מידע עבור נועה AI
 * 4. יצירת טאב דשבורד מעוצב ומקצועי למנהלים ("דשבורד_מנהלים_נועה") עם כרטיסי KPI
 * 5. תיעוד שיחות לקוח, קבצי קול וסריקות דרייב ("תיעוד_שיחות")
 * 6. מנוע CRUD מלא ב-JSON לכל הגיליונות לחיבור ישיר בזמן אמת עם נועה AI
 */

// ==============================================================================
// 1. CONFIGURATION & STRUCTURE DEFINITIONS
// ==============================================================================

const REQUIRED_SHEETS = [
  {
    name: 'דשבורד_מנהלים_נועה',
    isDashboard: true
  },
  {
    name: 'לוג_הזמנות_מערכת',
    headers: ['תאריך', 'מזהה_לקוח', 'שם_לקוח', 'חברה', 'מוצרים', 'כתובת_אספקה', 'סטטוס']
  },
  {
    name: 'הזמנות_מלקוחות',
    headers: ['מזהה_הזמנה', 'תאריך', 'מזהה_לקוח', 'שם_לקוח', 'כתובת_אספקה', 'פריטים', 'סטטוס', 'הערות']
  },
  {
    name: 'תיעוד_שיחות',
    headers: ['תאריך_וזמן', 'מזהה_לקוח', 'שם_לקוח', 'סוג_הודעה', 'תוכן_שיחה_ותמצית', 'קישור_קובץ_דרייב', 'מזהה_קובץ_דרייב', 'סכום_הזמנה_מזוהה']
  },
  {
    name: 'מילון_לוגיסטי',
    headers: ['מזהה_מוצר', 'קוד', 'שם_מוצר', 'קטגוריה', 'יחידה', 'תמונת_מוצר', 'הנחיות_יישום_ומפרט']
  },
  {
    name: 'חוקי_לוגיסטיקה',
    headers: ['מזהה_חוק', 'כותרת', 'קטגוריה', 'תיאור_מלא_של_החוק', 'ערך_נומרי_ואכיפה', 'יחידת_מידה', 'סטטוס_פעיל']
  }
];

// ספר החוקים הלוגיסטי המלא של נועה AI & DeliveryMaster
const LOGISTICS_RULES_BOOK = [
  {
    id: 'rule-1',
    title: 'אספקת מנוף וגישת משאית לאתר',
    category: 'שינוע ופריקה',
    description: 'פריקת ציוד כבד ומרוכז במשאית מנוף דורשת גישה פתוחה ורוחב מעבר מינימלי של 3.5 מטרים, ללא הפרעת קווי מתח או עצים נמוכים.',
    numericValue: 3.5,
    unit: 'מטר מעבר',
    active: 'פעיל'
  },
  {
    id: 'rule-2',
    title: 'מינימום כמויות למשלוח בלות',
    category: 'כמויות מינימום',
    description: 'הזמנת בלות חומרי מליאה (חול, סומסום, מחלוטה) מחייבת מינימום 2 בלות במשלוח יחיד לצורך ניצול תא המטען של המשאית.',
    numericValue: 2,
    unit: 'בלות',
    active: 'פעיל'
  },
  {
    id: 'rule-3',
    title: 'איסוף אריזות ומשטחים תקינים',
    category: 'החזרות ואריזות',
    description: 'נהג החלוקה אוסף משטחים ובלות ריקות ושלמות ללא עלות נוספת במעמד האספקה הבאה באתר הבנייה.',
    numericValue: 24,
    unit: 'שעות תיאום',
    active: 'פעיל'
  },
  {
    id: 'rule-4',
    title: 'בטיחות ופריקה לגובה/מרפסות',
    category: 'בטיחות באתר',
    description: 'פריקת משטחים או בלות למרפסות/קומות גובה תבוצע בהתאם לתקן בטיחות ובאישור חתום של מנהל עבודה מוסמך באתר.',
    numericValue: 15,
    unit: 'מטר זרוע מנוף',
    active: 'פעיל'
  },
  {
    id: 'rule-5',
    title: 'חלון זמן תיאום פריקה מראש',
    category: 'זמני אספקה',
    description: 'כל אספקה מתוזמנת בחלון זמן של שעתיים. הודעת SMS או הודעה קולית מנועה AI תישלח חצי שעה לפני הגעת המשאית.',
    numericValue: 30,
    unit: 'דקות התראה',
    active: 'פעיל'
  },
  {
    id: 'rule-6',
    title: 'בדיקת תקינות קבלת ציוד באתר',
    category: 'אישור קבלה',
    description: 'קבלת המשלוח באתר דורשת חתימת מנהל העבודה או הנציג המורשה על גבי תעודת המשלוח הדיגיטלית שנועה AI מפיקה.',
    numericValue: 1,
    unit: 'חתימה מורשית',
    active: 'פעיל'
  },
  {
    id: 'rule-7',
    title: 'שליפת תמונת מוצר והסבר מתוך גיליון מילון_לוגיסטי בלבד',
    category: 'מידע מוצרים ו-AI',
    description: 'נועה AI מחויבת לשלוף את תמונת המוצר (עמודה F: תמונת_מוצר) וההסבר/מפרט הטכני של המוצר (עמודה G: הנחיות_יישום_ומפרט) אך ורק מתוך גיליון מילון_לוגיסטי. חל איסור מוחלט על המצאת תמונות או הסברים מחוץ לגיליון.',
    numericValue: 100,
    unit: 'אמינות %',
    active: 'פעיל'
  }
];

// ==============================================================================
// 2. HTTP ENDPOINTS (doGet & doPost with Full CORS Support)
// ==============================================================================

/**
 * מטפל בבקשות HTTP GET (קריאה, אתחול ושליפת נתונים)
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'readAll';
    const sheetName = params.sheetName || 'חוקי_לוגיסטיקה';

    if (action === 'init' || action === 'setupSheets') {
      return responseJSON(setupSheetsAndHeaders());
    } else if (action === 'read') {
      return responseJSON(readSheet(sheetName));
    } else if (action === 'readSmartCustomer') {
      return responseJSON(readSmartCustomerTab(sheetName));
    } else if (action === 'readAll') {
      return responseJSON(readAllSheets());
    }

    return responseJSON({ success: false, error: 'פעולה לא מוכרת ב-GET: ' + action });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString(), stack: err.stack });
  }
}

/**
 * מטפל בבקשות HTTP POST (יצירה, עדכון, מחיקה, יצירת טאב לקוח חכם והעלאה לדרייב)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, error: 'לא התקבלו נתונים בגוף הבקשה (postData)' });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'init':
      case 'setupSheets':
        return responseJSON(setupSheetsAndHeaders());

      case 'createCustomerTab':
        return responseJSON(createSmartCustomerSheetFolder(data));

      case 'appendOrderToCustomerTab':
        return responseJSON(appendOrderToCustomerTabAndFolder(data.orderData || data));

      case 'uploadFile':
        return responseJSON(uploadFileToDrive(data));

      case 'createRow':
        return responseJSON(createRow(data.sheetName, data.rowData));

      case 'updateRow':
        return responseJSON(updateRow(data.sheetName, data.rowId, data.rowData));

      case 'deleteRow':
        return responseJSON(deleteRow(data.sheetName, data.rowId));

      case 'readSheet':
        return responseJSON(readSheet(data.sheetName));

      case 'syncRules':
        return responseJSON(seedLogisticsRulesBook());

      default:
        return responseJSON({ success: false, error: 'פעולה לא מוכרת ב-POST: ' + action });
    }
  } catch (err) {
    return responseJSON({ success: false, error: err.toString(), stack: err.stack });
  }
}

// ==============================================================================
// 3. PROFESSIONAL SHEET SETUP & DESIGN (setupSheetsAndHeaders)
// ==============================================================================

/**
 * פונקציה ראשית להקמת ועיצוב כל הגיליונות, הכותרות, הטאבים ודשבורד המנהלים
 */
function setupSheetsAndHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const createdSheets = [];
  const updatedSheets = [];

  REQUIRED_SHEETS.forEach(sheetDef => {
    let sheet = ss.getSheetByName(sheetDef.name);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetDef.name);
      createdSheets.push(sheetDef.name);
    } else {
      updatedSheets.push(sheetDef.name);
    }

    if (sheetDef.isDashboard) {
      createDesignedDashboardTab(sheet);
    } else {
      formatStandardSheetHeader(sheet, sheetDef.headers);
    }
  });

  // העתקת ספר החוקים המלא
  seedLogisticsRulesBook();

  return {
    success: true,
    message: 'כל הגיליונות, הכותרות והדשבורד הוקמו ועוצבו בהצלחה ב-Google Sheets!',
    createdSheets: createdSheets,
    updatedSheets: updatedSheets,
    timestamp: new Date().toISOString()
  };
}

/**
 * מעצב שורת כותרת מקצועית לגיליון תקני
 */
function formatStandardSheetHeader(sheet, headers) {
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName('לוג_הזמנות_מערכת') || ss.insertSheet('לוג_הזמנות_מערכת');
  } else if (typeof sheet === 'string') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName(sheet);
  }
  if (!sheet) return;
  headers = headers || ['תאריך', 'מזהה_לקוח', 'שם_לקוח', 'חברה', 'מוצרים', 'כתובת_אספקה', 'סטטוס'];

  // בודק אם כבר יש כותרות
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = firstRow.every(cell => cell === '');

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // עיצוב שורת הכותרת בצבע כהה יוקרתי (Slate Dark) עם טקסט לבן מודגש
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0f172a');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Assistant');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true); // כיוון ימין-לשמאל לעברית

  // התאמת רוחב עמודות אוטומטי
  for (let c = 1; c <= headers.length; c++) {
    sheet.setColumnWidth(c, Math.max(160, sheet.getColumnWidth(c)));
  }
}

// ==============================================================================
// 4. LOGISTICS RULES BOOK SEEDING & REAL-TIME SYNC
// ==============================================================================

/**
 * מעתק ומעדכן את ספר החוקים הלוגיסטי המלא לגיליון "חוקי_לוגיסטיקה" בעריכה מעוצבת
 */
function seedLogisticsRulesBook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('חוקי_לוגיסטיקה');

  if (!sheet) {
    sheet = ss.insertSheet('חוקי_לוגיסטיקה');
  }

  const headers = ['מזהה_חוק', 'כותרת', 'קטגוריה', 'תיאור_מלא_של_החוק', 'ערך_נומרי_ואכיפה', 'יחידת_מידה', 'סטטוס_פעיל'];
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // עיצוב כותרת
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1e293b');
  headerRange.setFontColor('#38bdf8');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);

  // כתיבת שורות החוקים
  const rows = LOGISTICS_RULES_BOOK.map(r => [
    r.id,
    r.title,
    r.category,
    r.description,
    r.numericValue,
    r.unit,
    r.active
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    
    // עיצוב שורות
    const dataRange = sheet.getRange(2, 1, rows.length, headers.length);
    dataRange.setFontFamily('Assistant');
    dataRange.setFontSize(10);
    dataRange.setVerticalAlignment('middle');
    
    for (let r = 2; r <= rows.length + 1; r++) {
      sheet.setRowHeight(r, 32);
      if (r % 2 === 0) {
        sheet.getRange(r, 1, 1, headers.length).setBackground('#f8fafc');
      }
    }
  }

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 380);
  sheet.setColumnWidth(5, 130);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 90);

  return {
    success: true,
    message: 'ספר החוקים הלוגיסטי המלא הועתק בהצלחה ל-Google Sheets ומסונכרן עם נועה AI!',
    totalRules: LOGISTICS_RULES_BOOK.length
  };
}

// ==============================================================================
// 5. SMART CUSTOMER SHEET & DRIVE FOLDER CREATION
// ==============================================================================

/**
 * יוצר טאב לקוח חכם במבנה מובנה בעל זיהוי מהיר לשליפת מידע עבור נועה AI
 * בתוספת יצירת תיקיית Google Drive יעודית
 */
function createSmartCustomerSheetFolder(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customerId = payload.customerId || 'cust-' + new Date().getTime();
  const customerName = payload.customerName || payload.name || 'לקוח חדש';
  const cleanName = customerName.replace(/[/\\?%*:|"<>]/g, '').trim();
  const tabName = customerId + '_' + cleanName;

  // 1. יצירת/איתור התיקייה ב-Google Drive
  let folder;
  const folderName = customerId + '_' + cleanName.replace(/\s+/g, '_');
  const existingFolders = DriveApp.getFoldersByName(folderName);
  if (existingFolders.hasNext()) {
    folder = existingFolders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  const driveFolderUrl = folder.getUrl();

  // 2. יצירת/איתור טאב הלקוח החכם ב-Sheets
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  } else {
    sheet.clear();
  }

  sheet.setRightToLeft(true);

  // --- כרטיס פרופיל לקוח חכם עבור AI (שורות 1-6) ---
  sheet.getRange('A1:F1').merge().setValue('📌 כרטיס לקוח חכם - פרופיל נועה AI & DeliveryMaster')
    .setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');

  sheet.getRange('A2:B2').setValues([['מזהה לקוח:', customerId]]).setFontWeight('bold');
  sheet.getRange('C2:D2').setValues([['שם לקוח / חברה:', customerName + ' (' + (payload.companyName || payload.company || 'פרטי') + ')']]);
  sheet.getRange('E2:F2').setValues([['סטטוס פעילות:', payload.status || 'מאושר לפעילות (חומרי בניין)']]).setFontColor('#047857').setFontWeight('bold');

  sheet.getRange('A3:B3').setValues([['טלפון ליצירת קשר:', payload.phone || '050-0000000']]);
  sheet.getRange('C3:D3').setValues([['אימייל:', payload.email || 'customer@example.com']]);
  sheet.getRange('E3:F3').setValues([['קישור תיקיית דרייב:', driveFolderUrl]]);

  sheet.getRange('A4:F4').merge().setValue('כתובת אספקה הראשית באתר: ' + (payload.deliveryAddress || 'טרם עודכנה כתובת'))
    .setBackground('#f1f5f9').setFontWeight('bold');

  sheet.getRange('A5:F5').merge().setValue('הנחיות לוגיסטיקה ושטח ל-AI: ' + (payload.notes || 'גישה פתוחה למשאית מנוף, תיאום חצי שעה מראש.'))
    .setBackground('#fef3c7').setFontColor('#92400e');

  // --- טבלת היסטוריית הזמנות של הלקוח (שורה 7 ואילך) ---
  sheet.getRange('A7:F7').merge().setValue('📦 היסטוריית הזמנות של הלקוח')
    .setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');

  const orderHeaders = ['מזהה_הזמנה', 'תאריך', 'פריטים_שסופקו', 'כתובת_יעד', 'סטטוס_אספקה', 'הערות_מנהל_עבודה'];
  sheet.getRange('A8:F8').setValues([orderHeaders])
    .setBackground('#334155').setFontColor('#f8fafc').setFontWeight('bold').setHorizontalAlignment('center');

  sheet.setRowHeight(1, 32);
  sheet.setRowHeight(7, 28);
  sheet.setRowHeight(8, 26);

  // התאמת רוחבים
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 260);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 200);

  return {
    success: true,
    message: 'טאב לקוח חכם ותיקיית Google Drive הוקמו בהצלחה!',
    customerId: customerId,
    customerName: customerName,
    tabName: tabName,
    driveFolderUrl: driveFolderUrl
  };
}

/**
 * כלי עזר לכתיבת הזמנה בתיקיית הלקוח ובטאב הזמנות בצורה מקצועית ובזמן אמת
 */
function appendOrderToCustomerTabAndFolder(orderData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const customerId = orderData.customerId || orderData.mzehLqoh || 'cst_rami';
  const customerName = orderData.customerName || orderData.shmLqoh || 'לקוח';
  const cleanName = customerName.replace(/[/\\?%*:|"<>]/g, '').trim();
  const tabName = customerId + '_' + cleanName;

  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    createSmartCustomerSheetFolder({
      customerId: customerId,
      customerName: customerName,
      companyName: orderData.companyName || customerName,
      deliveryAddress: orderData.deliveryAddress || ''
    });
    sheet = ss.getSheetByName(tabName);
  }

  const itemsText = Array.isArray(orderData.items)
    ? orderData.items.map(i => (i.quantity || 1) + 'x ' + (i.productName || i.name || 'מוצר')).join('; ')
    : (orderData.items || '');

  const orderId = orderData.id || ('ORD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
  const orderDate = orderData.date || new Date().toISOString().split('T')[0];
  const address = orderData.deliveryAddress || '';
  const status = orderData.status || 'התקבלה';
  const notes = orderData.notes || 'כלי עזר נועה AI - בזמן אמת';

  if (sheet) {
    sheet.appendRow([orderId, orderDate, itemsText, address, status, notes]);
  }

  // כתיבה לגיליון הזמנות מלקוחות הכללי
  let globalSheet = ss.getSheetByName('הזמנות_מלקוחות') || ss.getSheetByName('הזמנות מלקוחות');
  if (globalSheet) {
    globalSheet.appendRow([orderId, orderDate, customerId, customerName, address, itemsText, status, notes]);
  }

  // כתיבה לטאב תיעוד שיחות
  let logSheet = ss.getSheetByName('תיעוד_שיחות');
  if (logSheet) {
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    logSheet.appendRow([
      timeStr,
      customerId,
      customerName,
      'קליטת הזמנה בכלי עזר',
      'הזמנה ' + orderId + ' נקלטה. פריטים: ' + itemsText + ' | יעד: ' + address,
      'GoogleDrive/' + customerId + '_' + cleanName.replace(/\s+/g, '_') + '/',
      'ord-' + orderId
    ]);
  }

  return {
    success: true,
    message: 'ההזמנה נרשמה בהצלחה בטאב הלקוח ובגיליון ההזמנות בזמן אמת!',
    orderId: orderId,
    customerId: customerId,
    customerName: customerName
  };
}

/**
 * קורא ומפענח טאב לקוח חכם ומחזיר אובייקט JSON מובנה עבור נועה AI
 */
function readSmartCustomerTab(tabName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tabName);

  if (!sheet) {
    return { success: false, error: 'טאב הלקוח לא נמצא: ' + tabName };
  }

  const values = sheet.getDataRange().getValues();
  
  const customerProfile = {
    customerId: values[1] ? values[1][1] : '',
    customerName: values[1] ? values[1][3] : '',
    status: values[1] ? values[1][5] : '',
    phone: values[2] ? values[2][1] : '',
    email: values[2] ? values[2][3] : '',
    driveFolderUrl: values[2] ? values[2][5] : '',
    deliveryAddress: values[3] ? values[3][0] : '',
    aiLogisticsNotes: values[4] ? values[4][0] : ''
  };

  const orders = [];
  if (values.length >= 9) {
    for (let i = 8; i < values.length; i++) {
      if (values[i][0]) {
        orders.push({
          orderId: values[i][0],
          date: values[i][1],
          items: values[i][2],
          deliveryAddress: values[i][3],
          status: values[i][4],
          notes: values[i][5]
        });
      }
    }
  }

  return {
    success: true,
    tabName: tabName,
    customerProfile: customerProfile,
    orders: orders
  };
}

// ==============================================================================
// 6. DESIGNED DASHBOARD TAB CREATION (createDesignedDashboardTab)
// ==============================================================================

/**
 * מייצר טאב דשבורד מנהלים מעוצב עם כרטיסי KPI, סטטיסטוקות ומקש ניווט
 */
function createDesignedDashboardTab(sheet) {
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName('דשבורד_מנהלים_נועה') || ss.insertSheet('דשבורד_מנהלים_נועה');
  } else if (typeof sheet === 'string') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName(sheet);
  }
  if (!sheet) return;

  sheet.clear();
  sheet.setRightToLeft(true);

  // כותרת הראשית
  sheet.getRange('A1:F1').merge()
    .setValue('📊 דשבורד מנהלים - נועה AI & DeliveryMaster לוגיסטיקה')
    .setBackground('#0f172a')
    .setFontColor('#38bdf8')
    .setFontWeight('bold')
    .setFontSize(16)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 46);

  // כרטיסי KPI מדדי מפתח (שורות 3-5)
  // כרטיס 1: סה"כ הזמנות
  sheet.getRange('A3:B3').merge().setValue('סה"כ הזמנות במערכת').setBackground('#1e293b').setFontColor('#94a3b8').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('A4:B5').merge().setFormula("=COUNTA('הזמנות_מלקוחות'!A2:A)").setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold').setFontSize(22).setHorizontalAlignment('center').setVerticalAlignment('middle');

  // כרטיס 2: סופקו בהצלחה
  sheet.getRange('C3:D3').merge().setValue('הזמנות שסופקו').setBackground('#064e3b').setFontColor('#a7f3d0').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('C4:D5').merge().setFormula('=COUNTIF(\'הזמנות_מלקוחות\'!G2:G, "סופקה")').setBackground('#022c22').setFontColor('#34d399').setFontWeight('bold').setFontSize(22).setHorizontalAlignment('center').setVerticalAlignment('middle');

  // כרטיס 3: בטיפול / על המשאית
  sheet.getRange('E3:F3').merge().setValue('בטיפול לוגיסטי / בדרך').setBackground('#1e3a8a').setFontColor('#bfdbfe').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('E4:F5').merge().setFormula('=COUNTIF(\'הזמנות_מלקוחות\'!G2:G, "בטיפול לוגיסטי") + COUNTIF(\'הזמנות_מלקוחות\'!G2:G, "על המשאית")').setBackground('#172554').setFontColor('#60a5fa').setFontWeight('bold').setFontSize(22).setHorizontalAlignment('center').setVerticalAlignment('middle');

  // טבלת קישורים מהירים לטאבים במערכת (שורה 7 ואילך)
  sheet.getRange('A7:F7').merge().setValue('📋 גישה מהירה לטאבים המרכזיים בגיליון')
    .setBackground('#334155').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');

  const navRows = [
    ['שם הטאב', 'תפקיד במערכת', 'סטטוס סנכרון בזמן אמת עם נועה AI'],
    ['לוג_הזמנות_מערכת', 'תיעוד כלל ההזמנות שנקלטו במערכת', 'מסונכרן 100%'],
    ['הזמנות_מלקוחות', 'ניהול ועדכון סטטוס אספקה ללקוח', 'מסונכרן 100%'],
    ['תיעוד_שיחות', 'שמירת הקלטות קול, תמונות דרייב ותמציות שיחה', 'מסונכרן 100%'],
    ['מילון_לוגיסטי', 'קטלוג מוצרים והוראות יישום בשטח', 'מסונכרן 100%'],
    ['חוקי_לוגיסטיקה', 'ספר החוקים המלא לעריכה בזמן אמת', 'מסונכרן 100%']
  ];

  for (let r = 0; r < navRows.length; r++) {
    const rowNum = 8 + r;
    sheet.getRange(rowNum, 1, 1, 2).merge().setValue(navRows[r][0]);
    sheet.getRange(rowNum, 3, 1, 2).merge().setValue(navRows[r][1]);
    sheet.getRange(rowNum, 5, 1, 2).merge().setValue(navRows[r][2]);

    if (r === 0) {
      sheet.getRange(rowNum, 1, 1, 6).setBackground('#0f172a').setFontColor('#38bdf8').setFontWeight('bold').setHorizontalAlignment('center');
    } else {
      sheet.getRange(rowNum, 1, 1, 6).setBackground(r % 2 === 0 ? '#f8fafc' : '#ffffff').setFontSize(10);
    }
  }

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 160);
  sheet.setColumnWidth(6, 160);
}

// ==============================================================================
// 7. SMART CRUD ENGINE (מנוע קריאה, כתיבה, עריכה ומחיקה)
// ==============================================================================

function readSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return { success: false, error: 'הגיליון לא נמצא: ' + sheetName };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, sheetName: sheetName, headers: data[0] || [], rows: [] };
  }

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const rowValues = data[i];
    const rowObj = {};
    let hasData = false;

    headers.forEach((header, colIndex) => {
      const val = rowValues[colIndex];
      rowObj[header] = val;
      if (val !== '' && val !== null && val !== undefined) {
        hasData = true;
      }
    });

    if (hasData) {
      rowObj['_rowIndex'] = i + 1;
      rows.push(rowObj);
    }
  }

  return {
    success: true,
    sheetName: sheetName,
    headers: headers,
    totalRows: rows.length,
    rows: rows
  };
}

function readAllSheets() {
  const result = {};
  REQUIRED_SHEETS.forEach(s => {
    result[s.name] = readSheet(s.name);
  });
  return { success: true, database: result };
}

function createRow(sheetName, rowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return { success: false, error: 'הגיליון לא נמצא: ' + sheetName };
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = [];

  headers.forEach(header => {
    newRow.push(rowData[header] !== undefined ? rowData[header] : '');
  });

  sheet.appendRow(newRow);

  return {
    success: true,
    sheetName: sheetName,
    message: 'שורה חדשה נוספה בהצלחה!',
    addedData: rowData
  };
}

function updateRow(sheetName, rowId, rowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return { success: false, error: 'הגיליון לא נמצא: ' + sheetName };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: false, error: 'הגיליון ריק' };
  }

  const headers = data[0];
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    for (let col = 0; col < headers.length; col++) {
      const header = headers[col];
      if (header.includes('מזהה') || header === 'id' || header === 'קוד') {
        if (String(row[col]) === String(rowId)) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }
    if (targetRowIndex !== -1) break;
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'לא נמצאה שורה עם מזהה: ' + rowId };
  }

  headers.forEach((header, colIndex) => {
    if (rowData[header] !== undefined) {
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(rowData[header]);
    }
  });

  return {
    success: true,
    sheetName: sheetName,
    updatedRowId: rowId,
    rowIndex: targetRowIndex,
    message: 'השורה עודכנה בהצלחה!'
  };
}

function deleteRow(sheetName, rowId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return { success: false, error: 'הגיליון לא נמצא: ' + sheetName };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: false, error: 'הגיליון ריק' };
  }

  const headers = data[0];
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    for (let col = 0; col < headers.length; col++) {
      const header = headers[col];
      if (header.includes('מזהה') || header === 'id' || header === 'קוד') {
        if (String(row[col]) === String(rowId)) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }
    if (targetRowIndex !== -1) break;
  }

  if (targetRowIndex === -1) {
    return { success: false, error: 'לא נמצאה שורה למחיקה עם מזהה: ' + rowId };
  }

  sheet.deleteRow(targetRowIndex);

  return {
    success: true,
    sheetName: sheetName,
    deletedRowId: rowId,
    message: 'השורה נמחקה בהצלחה!'
  };
}

// ==============================================================================
// 8. GOOGLE DRIVE FILE UPLOAD ENGINE
// ==============================================================================

function uploadFileToDrive(payload) {
  const customerId = payload.customerId || 'cust-001';
  const customerName = (payload.customerName || 'לקוח_כללי').replace(/\s+/g, '_');
  const folderName = customerId + '_' + customerName;

  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  const rawBase64 = payload.base64Data || '';
  const cleanBase64 = rawBase64.indexOf(',') !== -1 ? rawBase64.split(',')[1] : rawBase64;
  
  const fileName = payload.fileName || ('upload_' + new Date().getTime());
  const mimeType = payload.mimeType || payload.fileType || 'application/octet-stream';

  const decodedBytes = Utilities.base64Decode(cleanBase64);
  const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const fileUrl = file.getUrl();
  const fileId = file.getId();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const chatSheet = ss.getSheetByName('תיעוד_שיחות');

  if (chatSheet) {
    const fileCategory = mimeType.includes('image')
      ? 'תמונה/תוכנית'
      : (mimeType.includes('audio') ? 'הקלטת קול/שמע' : 'מסמך/PDF');

    chatSheet.appendRow([
      new Date().toISOString().replace('T', ' ').substring(0, 19),
      customerId,
      payload.customerName || 'לקוח',
      fileCategory,
      payload.messageText || ('הועלה קובץ: ' + fileName),
      fileUrl,
      fileId,
      payload.orderAmount || ''
    ]);
  }

  return {
    success: true,
    message: 'הקובץ נשמר בהצלחה ב-Google Drive ותועד בגיליון תיעוד_שיחות!',
    folderName: folderName,
    fileName: fileName,
    fileUrl: fileUrl,
    fileId: fileId
  };
}

// ==============================================================================
// 9. HELPER FUNCTIONS
// ==============================================================================

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
