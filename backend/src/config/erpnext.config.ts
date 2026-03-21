/**
 * ERPNext Configuration
 * Handles ERPNext API connection settings and credentials
 * Credentials are stored in environment variables for security
 */

export interface ERPNextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  timeout: number;
  maxRetries: number;
  cacheTTL: number;
}

export interface ERPNextQueryOptions {
  filters?: Record<string, any> | Array<any>;
  fields?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
}

/**
 * Get ERPNext configuration from environment variables
 */
export function getERPNextConfig(): ERPNextConfig {
  const url = process.env.ERPNEXT_URL || 'https://your-erpnext-instance.com';
  const apiKey = process.env.ERPNEXT_API_KEY || 'your-api-key-here';
  const apiSecret = process.env.ERPNEXT_API_SECRET || 'your-api-secret-here';

  // Validate configuration
  if (!url || url === 'https://your-erpnext-instance.com') {
    console.warn('[WARN] ERPNext URL not configured. Set ERPNEXT_URL environment variable.');
  }

  if (!apiKey || apiKey === 'your-api-key-here') {
    console.warn('[WARN] ERPNext API Key not configured. Set ERPNEXT_API_KEY environment variable.');
  }

  if (!apiSecret || apiSecret === 'your-api-secret-here') {
    console.warn('[WARN] ERPNext API Secret not configured. Set ERPNEXT_API_SECRET environment variable.');
  }

  return {
    url: url.replace(/\/$/, ''), // Remove trailing slash
    apiKey,
    apiSecret,
    timeout: parseInt(process.env.ERPNEXT_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.ERPNEXT_MAX_RETRIES || '3', 10),
    cacheTTL: parseInt(process.env.ERPNEXT_CACHE_TTL || '600', 10), // 10 minutes
  };
}

/**
 * Common ERPNext DocTypes (Document Types)
 */
export const ERPNEXT_DOCTYPES = {
  // Sales
  CUSTOMER: 'Customer',
  QUOTATION: 'Quotation',
  SALES_ORDER: 'Sales Order',
  SALES_INVOICE: 'Sales Invoice',
  DELIVERY_NOTE: 'Delivery Note',

  // Purchase
  SUPPLIER: 'Supplier',
  PURCHASE_ORDER: 'Purchase Order',
  PURCHASE_INVOICE: 'Purchase Invoice',

  // Inventory
  ITEM: 'Item',
  STOCK_ENTRY: 'Stock Entry',
  WAREHOUSE: 'Warehouse',

  // Accounting
  PAYMENT_ENTRY: 'Payment Entry',
  JOURNAL_ENTRY: 'Journal Entry',

  // HR
  EMPLOYEE: 'Employee',
  TIMESHEET: 'Timesheet',
  LEAVE_APPLICATION: 'Leave Application',

  // Projects
  PROJECT: 'Project',
  TASK: 'Task',

  // CRM
  LEAD: 'Lead',
  OPPORTUNITY: 'Opportunity',
};

/**
 * Read-only operations - safe for chat assistant
 */
export const ERPNEXT_READ_OPERATIONS = [
  ERPNEXT_DOCTYPES.CUSTOMER,
  ERPNEXT_DOCTYPES.SUPPLIER,
  ERPNEXT_DOCTYPES.ITEM,
  ERPNEXT_DOCTYPES.QUOTATION,
  ERPNEXT_DOCTYPES.SALES_ORDER,
  ERPNEXT_DOCTYPES.SALES_INVOICE,
  ERPNEXT_DOCTYPES.PURCHASE_ORDER,
  ERPNEXT_DOCTYPES.PAYMENT_ENTRY,
  ERPNEXT_DOCTYPES.PROJECT,
  ERPNEXT_DOCTYPES.TASK,
  ERPNEXT_DOCTYPES.EMPLOYEE,
];

/**
 * Field mappings for common queries
 */
export const ERPNEXT_FIELD_MAPPINGS = {
  [ERPNEXT_DOCTYPES.CUSTOMER]: [
    'name',
    'customer_name',
    'customer_type',
    'territory',
    'email',
    'phone',
    'status',
    'credit_limits',
  ],
  [ERPNEXT_DOCTYPES.SALES_ORDER]: [
    'name',
    'customer',
    'customer_name',
    'order_date',
    'delivery_date',
    'total_qty',
    'total',
    'status',
    'docstatus',
  ],
  [ERPNEXT_DOCTYPES.ITEM]: [
    'name',
    'item_name',
    'item_group',
    'uom',
    'standard_rate',
    'description',
    'stock_uom',
    'is_stock_item',
  ],
  [ERPNEXT_DOCTYPES.PAYMENT_ENTRY]: [
    'name',
    'party_type',
    'party',
    'posting_date',
    'payment_type',
    'paid_amount',
    'received_amount',
    'reference_no',
    'status',
  ],
  [ERPNEXT_DOCTYPES.SUPPLIER]: [
    'name',
    'supplier_name',
    'supplier_type',
    'email',
    'phone',
    'country',
    'status',
  ],
  [ERPNEXT_DOCTYPES.PROJECT]: [
    'name',
    'project_name',
    'status',
    'start_date',
    'end_date',
    'project_manager',
    'company',
  ],
};

/**
 * Example query patterns for natural language understanding
 */
export const ERPNEXT_QUERY_PATTERNS = {
  listCustomers: {
    doctype: ERPNEXT_DOCTYPES.CUSTOMER,
    description: 'Get list of customers',
    keywords: ['customers', 'customer list', 'all customers', 'show customers'],
  },
  pendingOrders: {
    doctype: ERPNEXT_DOCTYPES.SALES_ORDER,
    description: 'Get pending sales orders',
    keywords: ['pending orders', 'open orders', 'draft orders', 'pending sales orders'],
    filters: [['status', '!=', 'Closed']],
  },
  recentInvoices: {
    doctype: ERPNEXT_DOCTYPES.SALES_INVOICE,
    description: 'Get recent invoices',
    keywords: ['recent invoices', 'last invoices', 'recent bills', 'invoices'],
  },
  stockLevels: {
    doctype: ERPNEXT_DOCTYPES.ITEM,
    description: 'Check stock levels',
    keywords: ['stock', 'inventory', 'stock levels', 'available quantity'],
  },
  pendingPayments: {
    doctype: ERPNEXT_DOCTYPES.PAYMENT_ENTRY,
    description: 'Get pending payments',
    keywords: ['pending payments', 'unpaid', 'outstanding', 'due payments'],
  },
};
