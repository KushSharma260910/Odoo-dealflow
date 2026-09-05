const fs = require('fs');
const path = require('path');

// Helper to escape SQL values
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Risk Calculator according to backend/src/engines/risk/risk.calculator.js
function calculateRisk(quote, items) {
  const subtotal = Number(quote.subtotal || 0);
  const discountAmount = Number(quote.discount_amount || 0);
  const marginAmount = Number(quote.margin_amount || 0);
  const totalAmount = Number(quote.total_amount || 0);

  const discountRate = subtotal ? (discountAmount * 100) / subtotal : 0;
  const marginRate = subtotal ? (marginAmount * 100) / subtotal : 0;
  const quantity = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  let score = discountRate * 1.2 +
    (marginRate < 10 ? 25 : 0) +
    (totalAmount > 100000 ? 15 : 0) +
    (quantity > 100 ? 10 : 0);

  score = Math.min(100, Math.round(score * 100) / 100);

  let level = 'LOW';
  if (score >= 80) level = 'CRITICAL';
  else if (score >= 60) level = 'HIGH';
  else if (score >= 30) level = 'MEDIUM';

  return { score, level, discountRate, marginRate, quantity };
}

// =========================================================
// DATA STRUCTURE DEFINITIONS
// =========================================================

// 1. CUSTOMERS (8 records)
const customers = [
  { id: 10, name: 'Acme Global Corp', email: 'procurement@acmeglobal.com', company_name: 'Acme Global Corporation', tier: 'GOLD', status: 'ACTIVE', created_at: '2026-01-10 09:00:00', updated_at: '2026-01-10 09:00:00' },
  { id: 11, name: 'Apex Tech Solutions', email: 'buying@apextech.io', company_name: 'Apex Technologies LLC', tier: 'SILVER', status: 'ACTIVE', created_at: '2026-01-12 10:30:00', updated_at: '2026-01-12 10:30:00' },
  { id: 12, name: 'Nexus Logistics Inc', email: 'ops@nexuslogistics.com', company_name: 'Nexus Logistics Ltd', tier: 'BRONZE', status: 'ACTIVE', created_at: '2026-01-15 14:15:00', updated_at: '2026-01-15 14:15:00' },
  { id: 13, name: 'Starlight Retailers', email: 'info@starlight.com', company_name: 'Starlight Retail Group', tier: 'BRONZE', status: 'INACTIVE', created_at: '2026-01-20 11:00:00', updated_at: '2026-02-01 09:00:00' },
  { id: 14, name: 'Vanguard Health Systems', email: 'it-procure@vanguardhealth.org', company_name: 'Vanguard Healthcare', tier: 'GOLD', status: 'ACTIVE', created_at: '2026-01-22 16:45:00', updated_at: '2026-01-22 16:45:00' },
  { id: 15, name: 'Horizon Financial Group', email: 'admin@horizonfin.com', company_name: 'Horizon Financial Ltd', tier: 'SILVER', status: 'ACTIVE', created_at: '2026-01-25 08:30:00', updated_at: '2026-01-25 08:30:00' },
  { id: 16, name: 'Quantum AI Research Labs', email: 'lab-ops@quantumai.edu', company_name: 'Quantum AI Foundation', tier: 'GOLD', status: 'ACTIVE', created_at: '2026-02-01 13:20:00', updated_at: '2026-02-01 13:20:00' },
  { id: 17, name: 'BlueSky Media Networks', email: 'contact@blueskymedia.net', company_name: 'BlueSky Communications', tier: 'BRONZE', status: 'ACTIVE', created_at: '2026-02-05 10:00:00', updated_at: '2026-02-05 10:00:00' }
];

// 2. USERS (10 records)
const users = [
  { id: 10, customer_id: null, name: 'Sarah Jenkins', email: 'sarah.jenkins@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_REP', status: 'ACTIVE', created_at: '2026-01-01 09:00:00', updated_at: '2026-01-01 09:00:00' },
  { id: 11, customer_id: null, name: 'Michael Chang', email: 'michael.chang@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_REP', status: 'ACTIVE', created_at: '2026-01-01 09:15:00', updated_at: '2026-01-01 09:15:00' },
  { id: 12, customer_id: null, name: 'Robert Ross', email: 'robert.ross@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_MANAGER', status: 'ACTIVE', created_at: '2026-01-01 09:30:00', updated_at: '2026-01-01 09:30:00' },
  { id: 13, customer_id: null, name: 'Elena Rostova', email: 'elena.rostova@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'FINANCE', status: 'ACTIVE', created_at: '2026-01-01 09:45:00', updated_at: '2026-01-01 09:45:00' },
  { id: 14, customer_id: null, name: 'David Vance', email: 'david.vance@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'OPERATIONS', status: 'ACTIVE', created_at: '2026-01-01 10:00:00', updated_at: '2026-01-01 10:00:00' },
  { id: 15, customer_id: null, name: 'Amanda Sterling', email: 'amanda.sterling@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'ADMIN', status: 'ACTIVE', created_at: '2026-01-01 10:15:00', updated_at: '2026-01-01 10:15:00' },
  { id: 16, customer_id: 10, name: 'John Doe', email: 'johndoe@acmeglobal.com', password: '$2b$10$hashedpassword123', role: 'CUSTOMER', status: 'ACTIVE', created_at: '2026-01-10 09:30:00', updated_at: '2026-01-10 09:30:00' },
  { id: 17, customer_id: 11, name: 'Jane Smith', email: 'janesmith@apextech.io', password: '$2b$10$hashedpassword123', role: 'CUSTOMER', status: 'ACTIVE', created_at: '2026-01-12 11:00:00', updated_at: '2026-01-12 11:00:00' },
  { id: 18, customer_id: null, name: 'Kevin Miller', email: 'kevin.miller@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_REP', status: 'INACTIVE', created_at: '2026-01-05 10:00:00', updated_at: '2026-02-01 10:00:00' },
  { id: 19, customer_id: 14, name: 'Dr. Gregory House', email: 'ghouse@vanguardhealth.org', password: '$2b$10$hashedpassword123', role: 'CUSTOMER', status: 'ACTIVE', created_at: '2026-01-22 17:00:00', updated_at: '2026-01-22 17:00:00' }
];

// 3. TEAMS (3 records)
const teams = [
  { id: 1, name: 'Enterprise Sales Team A', manager_id: 12, created_at: '2026-01-02 09:00:00' },
  { id: 2, name: 'Commercial Sales Team B', manager_id: 12, created_at: '2026-01-02 09:30:00' },
  { id: 3, name: 'Global Accounts Division', manager_id: 15, created_at: '2026-01-02 10:00:00' }
];

// 4. TEAM MEMBERS (4 records)
const team_members = [
  { id: 1, team_id: 1, user_id: 10, joined_at: '2026-01-02 09:05:00' },
  { id: 2, team_id: 1, user_id: 11, joined_at: '2026-01-02 09:10:00' },
  { id: 3, team_id: 2, user_id: 18, joined_at: '2026-01-05 10:05:00' },
  { id: 4, team_id: 3, user_id: 10, joined_at: '2026-01-10 11:00:00' }
];

// 5. PRODUCT CATEGORIES (3 records)
const product_categories = [
  { id: 7, name: 'Enterprise Storage Infrastructure', description: 'SAN, NAS, and High-Density Array Storage Systems', status: 'ACTIVE', created_at: '2026-01-03 09:00:00' },
  { id: 8, name: 'Cybersecurity Hardware & Appliances', description: 'Next-Gen Firewalls, HSMs, and VPN Concentrators', status: 'ACTIVE', created_at: '2026-01-03 09:30:00' },
  { id: 9, name: 'Legacy Software Add-ons', description: 'Deprecated utility software modules', status: 'INACTIVE', created_at: '2026-01-03 10:00:00' }
];

// 6. PRODUCTS (5 records)
const products = [
  { id: 9, category_id: 7, name: 'NetApp All Flash SAN Storage 50TB', sku: 'NETAPP-AF-50TB', description: 'High IOPS NVMe Enterprise Storage Appliance', unit: 'UNIT', base_price: 12500.00, cost_price: 8800.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'ACTIVE', created_at: '2026-01-04 09:00:00', updated_at: '2026-01-04 09:00:00' },
  { id: 10, category_id: 8, name: 'Palo Alto PA-3200 NGFW', sku: 'PA-3200-FW', description: 'Enterprise Threat Prevention Appliance with 10G SFP+', unit: 'UNIT', base_price: 6400.00, cost_price: 4100.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'ACTIVE', created_at: '2026-01-04 09:30:00', updated_at: '2026-01-04 09:30:00' },
  { id: 11, category_id: 3, name: 'DealFlow AI Predictive Analytics Module', sku: 'SAAS-AI-PRED', description: 'AI-driven Deal Risk and Forecasting Add-on per Seat', unit: 'USER/MO', 149.00, 20.00, 18.00, 'RECURRING', status: 'ACTIVE', created_at: '2026-01-04 10:00:00', updated_at: '2026-01-04 10:00:00' },
  { id: 12, category_id: 1, name: 'HP Z8 G4 Workstation (Discontinued)', sku: 'HP-Z8-G4-DISC', description: 'Dual Intel Xeon Gold workstation', unit: 'UNIT', base_price: 3200.00, cost_price: 2400.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'INACTIVE', created_at: '2026-01-04 10:30:00', updated_at: '2026-02-01 09:00:00' },
  { id: 13, category_id: 6, name: 'On-Site Migration & Architecture Service', sku: 'SVC-ON-SITE', description: 'Dedicated Solution Architect Field Deployment Pack', unit: 'DAY', 1500.00, 750.00, 18.00, 'ONE_TIME', status: 'ACTIVE', created_at: '2026-01-04 11:00:00', updated_at: '2026-01-04 11:00:00' }
];

// 7. PRODUCT VARIANTS (4 records)
const product_variants = [
  { id: 5, product_id: 9, attribute_name: 'Storage Expansion', attribute_value: '100TB NVMe Array', extra_price: 8500.00, sku_suffix: '-100TB', created_at: '2026-01-04 12:00:00' },
  { id: 6, product_id: 10, attribute_name: 'Redundant Power Supply', attribute_value: 'Dual AC Power Module', extra_price: 650.00, sku_suffix: '-DUALPWR', created_at: '2026-01-04 12:15:00' },
  { id: 7, product_id: 5, attribute_name: 'Uplink Module', attribute_value: '4x 10GbE SFP+ Network Module', extra_price: 450.00, sku_suffix: '-10GE', created_at: '2026-01-04 12:30:00' },
  { id: 8, product_id: 1, attribute_name: 'Warranty Extension', attribute_value: '3-Year On-Site Accidental Damage', extra_price: 320.00, sku_suffix: '-3YRWARR', created_at: '2026-01-04 12:45:00' }
];

// 8. PRICE LISTS (3 records)
const price_lists = [
  { id: 1, name: 'Gold Partner Preferred Pricing', customer_tier: 'GOLD', currency: 'USD', status: 'ACTIVE', created_at: '2026-01-05 09:00:00' },
  { id: 2, name: 'Silver Corporate Volume Matrix', customer_tier: 'SILVER', currency: 'USD', status: 'ACTIVE', created_at: '2026-01-05 09:30:00' },
  { id: 3, name: 'Standard Bronze Price Book', customer_tier: 'BRONZE', currency: 'USD', status: 'ACTIVE', created_at: '2026-01-05 10:00:00' }
];

// 9. PRICE LIST ITEMS (5 records)
const price_list_items = [
  { id: 1, price_list_id: 1, product_id: 1, price: 1650.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 2, price_list_id: 1, product_id: 3, price: 4200.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 3, price_list_id: 2, product_id: 2, price: 2299.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 4, price_list_id: 2, product_id: 5, price: 2950.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 5, price_list_id: 3, product_id: 9, price: 11900.00, valid_from: '2026-01-01', valid_until: '2026-12-31' }
];

// 10. DISCOUNT RULES (4 records)
const discount_rules = [
  { id: 4, customer_tier: 'GOLD', category_id: 1, max_discount_percent: 30.00, approval_required_above: 18.00, active: true, created_at: '2026-01-05 11:00:00' },
  { id: 5, customer_tier: 'SILVER', category_id: 3, max_discount_percent: 20.00, approval_required_above: 12.00, active: true, created_at: '2026-01-05 11:30:00' },
  { id: 6, customer_tier: 'BRONZE', category_id: 7, max_discount_percent: 10.00, approval_required_above: 5.00, active: true, created_at: '2026-01-05 12:00:00' },
  { id: 7, customer_tier: 'GOLD', category_id: 8, max_discount_percent: 25.00, approval_required_above: 15.00, active: true, created_at: '2026-01-05 12:30:00' }
];

// 11. APPROVAL CHAINS (3 records)
const approval_chains = [
  { id: 1, name: 'Standard Risk & Commercial Approval Chain', min_risk_score: 0.00, max_risk_score: 59.99, active: true, created_at: '2026-01-06 09:00:00' },
  { id: 2, name: 'High Risk Escalation & Legal Approval Chain', min_risk_score: 60.00, max_risk_score: 79.99, active: true, created_at: '2026-01-06 09:30:00' },
  { id: 3, name: 'Critical Risk Executive Board Approval Chain', min_risk_score: 80.00, max_risk_score: 100.00, active: true, created_at: '2026-01-06 10:00:00' }
];

// 12. APPROVAL RULES (5 records)
const approval_rules = [
  { id: 1, chain_id: 1, approval_level: 1, role: 'SALES_MANAGER', min_discount_percent: 10.00, max_discount_percent: 25.00, min_risk_score: 0.00, max_risk_score: 59.99 },
  { id: 2, chain_id: 1, approval_level: 2, role: 'FINANCE', min_discount_percent: 20.00, max_discount_percent: 35.00, min_risk_score: 30.00, max_risk_score: 59.99 },
  { id: 3, chain_id: 2, approval_level: 1, role: 'FINANCE', min_discount_percent: 25.00, max_discount_percent: 45.00, min_risk_score: 60.00, max_risk_score: 79.99 },
  { id: 4, chain_id: 2, approval_level: 2, role: 'ADMIN', min_discount_percent: 35.00, max_discount_percent: 50.00, min_risk_score: 60.00, max_risk_score: 79.99 },
  { id: 5, chain_id: 3, approval_level: 1, role: 'ADMIN', min_discount_percent: 40.00, max_discount_percent: 100.00, min_risk_score: 80.00, max_risk_score: 100.00 }
];

// 13. WAREHOUSES (2 records)
const warehouses = [
  { id: 4, name: 'European Distribution Hub (Amsterdam)', location: 'Amsterdam, NL - Hub 4', shipping_priority: 4, status: 'ACTIVE', created_at: '2026-01-07 09:00:00' },
  { id: 5, name: 'APAC Regional Logistics Depot (Singapore)', location: 'Singapore - Hub 5', shipping_priority: 5, status: 'ACTIVE', created_at: '2026-01-07 09:30:00' }
];

// 14. WAREHOUSE STOCK (6 records)
const warehouse_stock = [
  { id: 14, warehouse_id: 1, product_id: 9, quantity: 25, reserved_quantity: 5, reorder_level: 5, updated_at: '2026-01-07 10:00:00' },
  { id: 15, warehouse_id: 1, product_id: 10, quantity: 40, reserved_quantity: 10, reorder_level: 8, updated_at: '2026-01-07 10:00:00' },
  { id: 16, warehouse_id: 2, product_id: 9, quantity: 15, reserved_quantity: 0, reorder_level: 3, updated_at: '2026-01-07 10:30:00' },
  { id: 17, warehouse_id: 4, product_id: 1, quantity: 60, reserved_quantity: 0, reorder_level: 10, updated_at: '2026-01-07 11:00:00' },
  { id: 18, warehouse_id: 5, product_id: 3, quantity: 12, reserved_quantity: 2, reorder_level: 4, updated_at: '2026-01-07 11:30:00' },
  { id: 19, warehouse_id: 3, product_id: 10, quantity: 5, reserved_quantity: 5, reorder_level: 10, updated_at: '2026-01-07 12:00:00' }
];

// 15. REPLENISHMENT RULES (3 records)
const replenishment_rules = [
  { id: 1, warehouse_id: 1, product_id: 9, minimum_stock: 10, reorder_quantity: 20, active: true },
  { id: 2, warehouse_id: 2, product_id: 1, minimum_stock: 15, reorder_quantity: 30, active: true },
  { id: 3, warehouse_id: 3, product_id: 10, minimum_stock: 8, reorder_quantity: 15, active: true }
];

// 16. SHIPPING RULES (3 records)
const shipping_rules = [
  { id: 1, warehouse_id: 1, cost_per_shipment: 150.00, cost_per_unit: 15.00, priority_weight: 1.00, active: true },
  { id: 2, warehouse_id: 2, cost_per_shipment: 180.00, cost_per_unit: 18.00, priority_weight: 1.20, active: true },
  { id: 3, warehouse_id: 4, cost_per_shipment: 250.00, cost_per_unit: 25.00, priority_weight: 1.50, active: true }
];

console.log('Generating script initialized...');

