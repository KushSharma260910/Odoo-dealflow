const fs = require('fs');
const path = require('path');

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------
// RISK ENGINE FORMULA (Exact backend implementation)
// ---------------------------------------------------------
function calculateRisk(subtotal, discountAmount, marginAmount, totalAmount, quantity) {
  const discountRate = subtotal ? (discountAmount * 100) / subtotal : 0;
  const marginRate = subtotal ? (marginAmount * 100) / subtotal : 0;

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

// Data containers
const testCases = [];
let caseCounter = 1;

function addCase(table, category, title, description, sqlStatement) {
  const idStr = String(caseCounter).padStart(3, '0');
  const tcId = `TC-${idStr}`;
  testCases.push({
    id: tcId,
    numId: caseCounter,
    table,
    category,
    title,
    description,
    sql: sqlStatement
  });
  caseCounter++;
  return tcId;
}

// ---------------------------------------------------------
// 1. CUSTOMERS (8 test cases: TC-001 to TC-008)
// ---------------------------------------------------------
const customers = [
  { id: 10, name: 'Acme Global Corp', email: 'procurement@acmeglobal.com', company_name: 'Acme Global Corporation', tier: 'GOLD', status: 'ACTIVE' },
  { id: 11, name: 'Apex Tech Solutions', email: 'buying@apextech.io', company_name: 'Apex Technologies LLC', tier: 'SILVER', status: 'ACTIVE' },
  { id: 12, name: 'Nexus Logistics Inc', email: 'ops@nexuslogistics.com', company_name: 'Nexus Logistics Ltd', tier: 'BRONZE', status: 'ACTIVE' },
  { id: 13, name: 'Starlight Retailers', email: 'info@starlight.com', company_name: 'Starlight Retail Group', tier: 'BRONZE', status: 'INACTIVE' },
  { id: 14, name: 'Vanguard Health Systems', email: 'it-procure@vanguardhealth.org', company_name: 'Vanguard Healthcare', tier: 'GOLD', status: 'ACTIVE' },
  { id: 15, name: 'Horizon Financial Group', email: 'admin@horizonfin.com', company_name: 'Horizon Financial Ltd', tier: 'SILVER', status: 'ACTIVE' },
  { id: 16, name: 'Quantum AI Research Labs', email: 'lab-ops@quantumai.edu', company_name: 'Quantum AI Foundation', tier: 'GOLD', status: 'ACTIVE' },
  { id: 17, name: 'BlueSky Media Networks', email: 'contact@blueskymedia.net', company_name: 'BlueSky Communications', tier: 'BRONZE', status: 'ACTIVE' }
];

const customerSqls = [];
customers.forEach(c => {
  const sql = `INSERT INTO customers (id, name, email, company_name, tier, status) VALUES (${c.id}, ${esc(c.name)}, ${esc(c.email)}, ${esc(c.company_name)}, ${esc(c.tier)}, ${esc(c.status)});`;
  customerSqls.push(sql);
  addCase('customers', 'Master Data', `Customer Setup - ${c.name}`, `Create customer ${c.name} with ${c.tier} tier and status ${c.status}.`, sql);
});

// 2. USERS (10 test cases: TC-009 to TC-018)
const users = [
  { id: 10, customer_id: null, name: 'Sarah Jenkins', email: 'sarah.jenkins@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_REP', status: 'ACTIVE' },
  { id: 11, customer_id: null, name: 'Michael Chang', email: 'michael.chang@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_REP', status: 'ACTIVE' },
  { id: 12, customer_id: null, name: 'Robert Ross', email: 'robert.ross@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_MANAGER', status: 'ACTIVE' },
  { id: 13, customer_id: null, name: 'Elena Rostova', email: 'elena.rostova@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'FINANCE', status: 'ACTIVE' },
  { id: 14, customer_id: null, name: 'David Vance', email: 'david.vance@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'OPERATIONS', status: 'ACTIVE' },
  { id: 15, customer_id: null, name: 'Amanda Sterling', email: 'amanda.sterling@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'ADMIN', status: 'ACTIVE' },
  { id: 16, customer_id: 10, name: 'John Doe', email: 'johndoe@acmeglobal.com', password: '$2b$10$hashedpassword123', role: 'CUSTOMER', status: 'ACTIVE' },
  { id: 17, customer_id: 11, name: 'Jane Smith', email: 'janesmith@apextech.io', password: '$2b$10$hashedpassword123', role: 'CUSTOMER', status: 'ACTIVE' },
  { id: 18, customer_id: null, name: 'Kevin Miller', email: 'kevin.miller@dealflow360.com', password: '$2b$10$hashedpassword123', role: 'SALES_REP', status: 'INACTIVE' },
  { id: 19, customer_id: 14, name: 'Dr. Gregory House', email: 'ghouse@vanguardhealth.org', password: '$2b$10$hashedpassword123', role: 'CUSTOMER', status: 'ACTIVE' }
];

const userSqls = [];
users.forEach(u => {
  const sql = `INSERT INTO users (id, customer_id, name, email, password, role, status) VALUES (${u.id}, ${esc(u.customer_id)}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.password)}, ${esc(u.role)}, ${esc(u.status)});`;
  userSqls.push(sql);
  addCase('users', 'User Management', `User Account - ${u.name}`, `Create user ${u.name} with role ${u.role} and status ${u.status}.`, sql);
});

// 3. TEAMS (3 test cases: TC-019 to TC-021)
const teams = [
  { id: 1, name: 'Enterprise Sales Team A', manager_id: 12 },
  { id: 2, name: 'Commercial Sales Team B', manager_id: 12 },
  { id: 3, name: 'Global Accounts Division', manager_id: 15 }
];
const teamSqls = [];
teams.forEach(t => {
  const sql = `INSERT INTO teams (id, name, manager_id) VALUES (${t.id}, ${esc(t.name)}, ${esc(t.manager_id)});`;
  teamSqls.push(sql);
  addCase('teams', 'Organization', `Sales Team - ${t.name}`, `Configure sales team ${t.name} managed by User ID ${t.manager_id}.`, sql);
});

// 4. TEAM MEMBERS (4 test cases: TC-022 to TC-025)
const team_members = [
  { id: 1, team_id: 1, user_id: 10 },
  { id: 2, team_id: 1, user_id: 11 },
  { id: 3, team_id: 2, user_id: 18 },
  { id: 4, team_id: 3, user_id: 10 }
];
const teamMemberSqls = [];
team_members.forEach(tm => {
  const sql = `INSERT INTO team_members (id, team_id, user_id) VALUES (${tm.id}, ${tm.team_id}, ${tm.user_id});`;
  teamMemberSqls.push(sql);
  addCase('team_members', 'Organization', `Team Membership ID ${tm.id}`, `Assign User ID ${tm.user_id} to Team ID ${tm.team_id}.`, sql);
});

// 5. PRODUCT CATEGORIES (3 test cases: TC-026 to TC-028)
const product_categories = [
  { id: 7, name: 'Enterprise Storage Infrastructure', description: 'SAN, NAS, and High-Density Array Storage Systems', status: 'ACTIVE' },
  { id: 8, name: 'Cybersecurity Hardware & Appliances', description: 'Next-Gen Firewalls, HSMs, and VPN Concentrators', status: 'ACTIVE' },
  { id: 9, name: 'Legacy Software Add-ons', description: 'Deprecated utility software modules', status: 'INACTIVE' }
];
const categorySqls = [];
product_categories.forEach(cat => {
  const sql = `INSERT INTO product_categories (id, name, description, status) VALUES (${cat.id}, ${esc(cat.name)}, ${esc(cat.description)}, ${esc(cat.status)});`;
  categorySqls.push(sql);
  addCase('product_categories', 'Catalog', `Category - ${cat.name}`, `Create product category ${cat.name} with status ${cat.status}.`, sql);
});

// 6. PRODUCTS (5 test cases: TC-029 to TC-033)
const products = [
  { id: 9, category_id: 7, name: 'NetApp All Flash SAN Storage 50TB', sku: 'NETAPP-AF-50TB', description: 'High IOPS NVMe Enterprise Storage Appliance', unit: 'UNIT', base_price: 12500.00, cost_price: 8800.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'ACTIVE' },
  { id: 10, category_id: 8, name: 'Palo Alto PA-3200 NGFW', sku: 'PA-3200-FW', description: 'Enterprise Threat Prevention Appliance with 10G SFP+', unit: 'UNIT', base_price: 6400.00, cost_price: 4100.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'ACTIVE' },
  { id: 11, category_id: 3, name: 'DealFlow AI Predictive Analytics Module', sku: 'SAAS-AI-PRED', description: 'AI-driven Deal Risk and Forecasting Add-on per Seat', unit: 'USER/MO', base_price: 149.00, cost_price: 20.00, tax_percent: 18.00, billing_type: 'RECURRING', status: 'ACTIVE' },
  { id: 12, category_id: 1, name: 'HP Z8 G4 Workstation (Discontinued)', sku: 'HP-Z8-G4-DISC', description: 'Dual Intel Xeon Gold workstation', unit: 'UNIT', base_price: 3200.00, cost_price: 2400.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'INACTIVE' },
  { id: 13, category_id: 6, name: 'On-Site Migration & Architecture Service', sku: 'SVC-ON-SITE', description: 'Dedicated Solution Architect Field Deployment Pack', unit: 'DAY', base_price: 1500.00, cost_price: 750.00, tax_percent: 18.00, billing_type: 'ONE_TIME', status: 'ACTIVE' }
];
const productSqls = [];
products.forEach(p => {
  const sql = `INSERT INTO products (id, category_id, name, sku, description, unit, base_price, cost_price, tax_percent, billing_type, status) VALUES (${p.id}, ${p.category_id}, ${esc(p.name)}, ${esc(p.sku)}, ${esc(p.description)}, ${esc(p.unit)}, ${p.base_price.toFixed(2)}, ${p.cost_price.toFixed(2)}, ${p.tax_percent.toFixed(2)}, ${esc(p.billing_type)}, ${esc(p.status)});`;
  productSqls.push(sql);
  addCase('products', 'Catalog', `Product - ${p.name}`, `Add product ${p.name} (SKU: ${p.sku}) with base price $${p.base_price} and cost $${p.cost_price}.`, sql);
});

// 7. PRODUCT VARIANTS (4 test cases: TC-034 to TC-037)
const product_variants = [
  { id: 5, product_id: 9, attribute_name: 'Storage Expansion', attribute_value: '100TB NVMe Array', extra_price: 8500.00, sku_suffix: '-100TB' },
  { id: 6, product_id: 10, attribute_name: 'Redundant Power Supply', attribute_value: 'Dual AC Power Module', extra_price: 650.00, sku_suffix: '-DUALPWR' },
  { id: 7, product_id: 5, attribute_name: 'Uplink Module', attribute_value: '4x 10GbE SFP+ Network Module', extra_price: 450.00, sku_suffix: '-10GE' },
  { id: 8, product_id: 1, attribute_name: 'Warranty Extension', attribute_value: '3-Year On-Site Accidental Damage', extra_price: 320.00, sku_suffix: '-3YRWARR' }
];
const variantSqls = [];
product_variants.forEach(pv => {
  const sql = `INSERT INTO product_variants (id, product_id, attribute_name, attribute_value, extra_price, sku_suffix) VALUES (${pv.id}, ${pv.product_id}, ${esc(pv.attribute_name)}, ${esc(pv.attribute_value)}, ${pv.extra_price.toFixed(2)}, ${esc(pv.sku_suffix)});`;
  variantSqls.push(sql);
  addCase('product_variants', 'Catalog', `Variant - ${pv.attribute_value}`, `Add variant ${pv.attribute_name}: ${pv.attribute_value} to Product ID ${pv.product_id}.`, sql);
});

// 8. PRICE LISTS (3 test cases: TC-038 to TC-040)
const price_lists = [
  { id: 1, name: 'Gold Partner Preferred Pricing', customer_tier: 'GOLD', currency: 'USD', status: 'ACTIVE' },
  { id: 2, name: 'Silver Corporate Volume Matrix', customer_tier: 'SILVER', currency: 'USD', status: 'ACTIVE' },
  { id: 3, name: 'Standard Bronze Price Book', customer_tier: 'BRONZE', currency: 'USD', status: 'ACTIVE' }
];
const priceListSqls = [];
price_lists.forEach(pl => {
  const sql = `INSERT INTO price_lists (id, name, customer_tier, currency, status) VALUES (${pl.id}, ${esc(pl.name)}, ${esc(pl.customer_tier)}, ${esc(pl.currency)}, ${esc(pl.status)});`;
  priceListSqls.push(sql);
  addCase('price_lists', 'Pricing', `Price List - ${pl.name}`, `Create price list ${pl.name} for tier ${pl.customer_tier}.`, sql);
});

// 9. PRICE LIST ITEMS (5 test cases: TC-041 to TC-045)
const price_list_items = [
  { id: 1, price_list_id: 1, product_id: 1, price: 1650.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 2, price_list_id: 1, product_id: 3, price: 4200.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 3, price_list_id: 2, product_id: 2, price: 2299.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 4, price_list_id: 2, product_id: 5, price: 2950.00, valid_from: '2026-01-01', valid_until: '2026-12-31' },
  { id: 5, price_list_id: 3, product_id: 9, price: 11900.00, valid_from: '2026-01-01', valid_until: '2026-12-31' }
];
const priceListItemSqls = [];
price_list_items.forEach(pli => {
  const sql = `INSERT INTO price_list_items (id, price_list_id, product_id, price, valid_from, valid_until) VALUES (${pli.id}, ${pli.price_list_id}, ${pli.product_id}, ${pli.price.toFixed(2)}, ${esc(pli.valid_from)}, ${esc(pli.valid_until)});`;
  priceListItemSqls.push(sql);
  addCase('price_list_items', 'Pricing', `Price List Item ID ${pli.id}`, `Override price for product ID ${pli.product_id} to $${pli.price} in price list ID ${pli.price_list_id}.`, sql);
});

// 10. DISCOUNT RULES (4 test cases: TC-046 to TC-049)
const discount_rules = [
  { id: 4, customer_tier: 'GOLD', category_id: 1, max_discount_percent: 30.00, approval_required_above: 18.00, active: true },
  { id: 5, customer_tier: 'SILVER', category_id: 3, max_discount_percent: 20.00, approval_required_above: 12.00, active: true },
  { id: 6, customer_tier: 'BRONZE', category_id: 7, max_discount_percent: 10.00, approval_required_above: 5.00, active: true },
  { id: 7, customer_tier: 'GOLD', category_id: 8, max_discount_percent: 25.00, approval_required_above: 15.00, active: true }
];
const discountRuleSqls = [];
discount_rules.forEach(dr => {
  const sql = `INSERT INTO discount_rules (id, customer_tier, category_id, max_discount_percent, approval_required_above, active) VALUES (${dr.id}, ${esc(dr.customer_tier)}, ${esc(dr.category_id)}, ${dr.max_discount_percent.toFixed(2)}, ${dr.approval_required_above.toFixed(2)}, ${dr.active ? 'TRUE' : 'FALSE'});`;
  discountRuleSqls.push(sql);
  addCase('discount_rules', 'Discount Governance', `Discount Rule ID ${dr.id}`, `Discount rule for ${dr.customer_tier} tier on Category ID ${dr.category_id}: max ${dr.max_discount_percent}%, approval above ${dr.approval_required_above}%.`, sql);
});

// 11. APPROVAL CHAINS (3 test cases: TC-050 to TC-052)
const approval_chains = [
  { id: 1, name: 'Standard Risk & Commercial Approval Chain', min_risk_score: 0.00, max_risk_score: 59.99, active: true },
  { id: 2, name: 'High Risk Escalation & Legal Approval Chain', min_risk_score: 60.00, max_risk_score: 79.99, active: true },
  { id: 3, name: 'Critical Risk Executive Board Approval Chain', min_risk_score: 80.00, max_risk_score: 100.00, active: true }
];
const approvalChainSqls = [];
approval_chains.forEach(ac => {
  const sql = `INSERT INTO approval_chains (id, name, min_risk_score, max_risk_score, active) VALUES (${ac.id}, ${esc(ac.name)}, ${ac.min_risk_score.toFixed(2)}, ${ac.max_risk_score.toFixed(2)}, ${ac.active ? 'TRUE' : 'FALSE'});`;
  approvalChainSqls.push(sql);
  addCase('approval_chains', 'Approval Governance', `Approval Chain - ${ac.name}`, `Chain ${ac.name} handling risk scores ${ac.min_risk_score} to ${ac.max_risk_score}.`, sql);
});

// 12. APPROVAL RULES (5 test cases: TC-053 to TC-057)
const approval_rules = [
  { id: 1, chain_id: 1, approval_level: 1, role: 'SALES_MANAGER', min_discount_percent: 10.00, max_discount_percent: 25.00, min_risk_score: 0.00, max_risk_score: 59.99 },
  { id: 2, chain_id: 1, approval_level: 2, role: 'FINANCE', min_discount_percent: 20.00, max_discount_percent: 35.00, min_risk_score: 30.00, max_risk_score: 59.99 },
  { id: 3, chain_id: 2, approval_level: 1, role: 'FINANCE', min_discount_percent: 25.00, max_discount_percent: 45.00, min_risk_score: 60.00, max_risk_score: 79.99 },
  { id: 4, chain_id: 2, approval_level: 2, role: 'ADMIN', min_discount_percent: 35.00, max_discount_percent: 50.00, min_risk_score: 60.00, max_risk_score: 79.99 },
  { id: 5, chain_id: 3, approval_level: 1, role: 'ADMIN', min_discount_percent: 40.00, max_discount_percent: 100.00, min_risk_score: 80.00, max_risk_score: 100.00 }
];
const approvalRuleSqls = [];
approval_rules.forEach(ar => {
  const sql = `INSERT INTO approval_rules (id, chain_id, approval_level, role, min_discount_percent, max_discount_percent, min_risk_score, max_risk_score) VALUES (${ar.id}, ${ar.chain_id}, ${ar.approval_level}, ${esc(ar.role)}, ${ar.min_discount_percent.toFixed(2)}, ${ar.max_discount_percent.toFixed(2)}, ${ar.min_risk_score.toFixed(2)}, ${ar.max_risk_score.toFixed(2)});`;
  approvalRuleSqls.push(sql);
  addCase('approval_rules', 'Approval Governance', `Approval Rule ID ${ar.id}`, `Level ${ar.approval_level} approval rule for ${ar.role} in Chain ID ${ar.chain_id}.`, sql);
});

// 13. WAREHOUSES (2 test cases: TC-058 to TC-059)
const warehouses = [
  { id: 4, name: 'European Distribution Hub (Amsterdam)', location: 'Amsterdam, NL - Hub 4', shipping_priority: 4, status: 'ACTIVE' },
  { id: 5, name: 'APAC Regional Logistics Depot (Singapore)', location: 'Singapore - Hub 5', shipping_priority: 5, status: 'ACTIVE' }
];
const warehouseSqls = [];
warehouses.forEach(w => {
  const sql = `INSERT INTO warehouses (id, name, location, shipping_priority, status) VALUES (${w.id}, ${esc(w.name)}, ${esc(w.location)}, ${w.shipping_priority}, ${esc(w.status)});`;
  warehouseSqls.push(sql);
  addCase('warehouses', 'Inventory & Logistics', `Warehouse - ${w.name}`, `Add warehouse ${w.name} with priority ${w.shipping_priority}.`, sql);
});

// 14. WAREHOUSE STOCK (6 test cases: TC-060 to TC-065)
const warehouse_stock = [
  { id: 14, warehouse_id: 1, product_id: 9, quantity: 25, reserved_quantity: 5, reorder_level: 5 },
  { id: 15, warehouse_id: 1, product_id: 10, quantity: 40, reserved_quantity: 10, reorder_level: 8 },
  { id: 16, warehouse_id: 2, product_id: 9, quantity: 15, reserved_quantity: 0, reorder_level: 3 },
  { id: 17, warehouse_id: 4, product_id: 1, quantity: 60, reserved_quantity: 0, reorder_level: 10 },
  { id: 18, warehouse_id: 5, product_id: 3, quantity: 12, reserved_quantity: 2, reorder_level: 4 },
  { id: 19, warehouse_id: 3, product_id: 10, quantity: 5, reserved_quantity: 5, reorder_level: 10 }
];
const stockSqls = [];
warehouse_stock.forEach(ws => {
  const sql = `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity, reserved_quantity, reorder_level) VALUES (${ws.id}, ${ws.warehouse_id}, ${ws.product_id}, ${ws.quantity}, ${ws.reserved_quantity}, ${ws.reorder_level});`;
  stockSqls.push(sql);
  addCase('warehouse_stock', 'Inventory & Logistics', `Stock Record ID ${ws.id}`, `Stock of product ID ${ws.product_id} in warehouse ID ${ws.warehouse_id}: ${ws.quantity} available, ${ws.reserved_quantity} reserved.`, sql);
});

// 15. REPLENISHMENT RULES (3 test cases: TC-066 to TC-068)
const replenishment_rules = [
  { id: 1, warehouse_id: 1, product_id: 9, minimum_stock: 10, reorder_quantity: 20, active: true },
  { id: 2, warehouse_id: 2, product_id: 1, minimum_stock: 15, reorder_quantity: 30, active: true },
  { id: 3, warehouse_id: 3, product_id: 10, minimum_stock: 8, reorder_quantity: 15, active: true }
];
const replenishmentSqls = [];
replenishment_rules.forEach(rr => {
  const sql = `INSERT INTO replenishment_rules (id, warehouse_id, product_id, minimum_stock, reorder_quantity, active) VALUES (${rr.id}, ${rr.warehouse_id}, ${rr.product_id}, ${rr.minimum_stock}, ${rr.reorder_quantity}, ${rr.active ? 'TRUE' : 'FALSE'});`;
  replenishmentSqls.push(sql);
  addCase('replenishment_rules', 'Inventory & Logistics', `Replenishment Rule ID ${rr.id}`, `Auto-reorder rule for product ID ${rr.product_id} at warehouse ID ${rr.warehouse_id}: min stock ${rr.minimum_stock}, reorder qty ${rr.reorder_quantity}.`, sql);
});

// 16. SHIPPING RULES (3 test cases: TC-069 to TC-071)
const shipping_rules = [
  { id: 1, warehouse_id: 1, cost_per_shipment: 150.00, cost_per_unit: 15.00, priority_weight: 1.00, active: true },
  { id: 2, warehouse_id: 2, cost_per_shipment: 180.00, cost_per_unit: 18.00, priority_weight: 1.20, active: true },
  { id: 3, warehouse_id: 4, cost_per_shipment: 250.00, cost_per_unit: 25.00, priority_weight: 1.50, active: true }
];
const shippingSqls = [];
shipping_rules.forEach(sr => {
  const sql = `INSERT INTO shipping_rules (id, warehouse_id, cost_per_shipment, cost_per_unit, priority_weight, active) VALUES (${sr.id}, ${sr.warehouse_id}, ${sr.cost_per_shipment.toFixed(2)}, ${sr.cost_per_unit.toFixed(2)}, ${sr.priority_weight.toFixed(2)}, ${sr.active ? 'TRUE' : 'FALSE'});`;
  shippingSqls.push(sql);
  addCase('shipping_rules', 'Inventory & Logistics', `Shipping Rule ID ${sr.id}`, `Shipping rate for warehouse ID ${sr.warehouse_id}: $${sr.cost_per_shipment} flat + $${sr.cost_per_unit}/unit.`, sql);
});

console.log('Master data cases added (1 to 71).');

// ---------------------------------------------------------
// 17 & 18. QUOTATIONS & QUOTATION ITEMS (TC-072 to TC-133)
// ---------------------------------------------------------

const quoteConfigs = [
  // LOW Risk Deals (Scores < 30)
  {
    id: 101, customer_id: 10, sales_rep_id: 10, price_list_id: 1, status: 'DRAFT', valid_until: '2026-04-30', approval_required: false,
    items: [
      { product_id: 1, variant_id: 1, unit_price: 2149.00, cost_price: 1350.00, quantity: 2, discount_percent: 5.00, tax_percent: 18.00 },
      { product_id: 6, variant_id: null, unit_price: 649.00, cost_price: 420.00, quantity: 4, discount_percent: 0.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 102, customer_id: 11, sales_rep_id: 11, price_list_id: 2, status: 'SENT', valid_until: '2026-04-30', approval_required: false,
    items: [
      { product_id: 3, variant_id: null, unit_price: 4850.00, cost_price: 3400.00, quantity: 3, discount_percent: 8.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 103, customer_id: 14, sales_rep_id: 10, price_list_id: 1, status: 'APPROVED', valid_until: '2026-04-30', approval_required: false,
    items: [
      { product_id: 5, variant_id: null, unit_price: 3200.00, cost_price: 2100.00, quantity: 5, discount_percent: 10.00, tax_percent: 18.00 },
      { product_id: 7, variant_id: null, unit_price: 499.00, cost_price: 80.00, quantity: 12, discount_percent: 5.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 104, customer_id: 15, sales_rep_id: 11, price_list_id: 2, status: 'CONFIRMED', valid_until: '2026-04-30', approval_required: false,
    items: [
      { product_id: 2, variant_id: null, unit_price: 2499.00, cost_price: 1900.00, quantity: 4, discount_percent: 6.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 105, customer_id: 16, sales_rep_id: 10, price_list_id: 1, status: 'UNDER_NEGOTIATION', valid_until: '2026-05-15', approval_required: false,
    items: [
      { product_id: 9, variant_id: null, unit_price: 12500.00, cost_price: 8800.00, quantity: 2, discount_percent: 12.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 106, customer_id: 17, sales_rep_id: 11, price_list_id: 3, status: 'SENT', valid_until: '2026-04-30', approval_required: false,
    items: [
      { product_id: 4, variant_id: null, unit_price: 299.00, cost_price: 45.00, quantity: 25, discount_percent: 10.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 107, customer_id: 12, sales_rep_id: 10, price_list_id: 3, status: 'REJECTED', valid_until: '2026-03-31', approval_required: false,
    items: [
      { product_id: 8, variant_id: null, unit_price: 220.00, cost_price: 110.00, quantity: 10, discount_percent: 15.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 108, customer_id: 10, sales_rep_id: 11, price_list_id: 1, status: 'EXPIRED', valid_until: '2026-02-15', approval_required: false,
    items: [
      { product_id: 10, variant_id: null, unit_price: 6400.00, cost_price: 4100.00, quantity: 1, discount_percent: 15.00, tax_percent: 18.00 }
    ]
  },

  // MEDIUM Risk Deals (Scores 30 to 59.99)
  {
    id: 109, customer_id: 11, sales_rep_id: 10, price_list_id: 2, status: 'PENDING_APPROVAL', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 3, variant_id: null, unit_price: 4850.00, cost_price: 4500.00, quantity: 12, discount_percent: 25.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 110, customer_id: 14, sales_rep_id: 11, price_list_id: 1, status: 'UNDER_NEGOTIATION', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 1, variant_id: null, unit_price: 1899.00, cost_price: 1000.00, quantity: 10, discount_percent: 30.00, tax_percent: 18.00 },
      { product_id: 6, variant_id: null, unit_price: 649.00, cost_price: 350.00, quantity: 15, discount_percent: 30.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 111, customer_id: 15, sales_rep_id: 10, price_list_id: 2, status: 'APPROVED', valid_until: '2026-05-15', approval_required: true,
    items: [
      { product_id: 2, variant_id: null, unit_price: 2499.00, cost_price: 2200.00, quantity: 10, discount_percent: 15.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 112, customer_id: 16, sales_rep_id: 11, price_list_id: 1, status: 'SENT', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 9, variant_id: null, unit_price: 12500.00, cost_price: 6000.00, quantity: 4, discount_percent: 35.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 113, customer_id: 10, sales_rep_id: 10, price_list_id: 1, status: 'PENDING_APPROVAL', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 5, variant_id: null, unit_price: 3200.00, cost_price: 1500.00, quantity: 15, discount_percent: 40.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 114, customer_id: 12, sales_rep_id: 11, price_list_id: 3, status: 'DRAFT', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 10, variant_id: null, unit_price: 6400.00, cost_price: 5500.00, quantity: 5, discount_percent: 20.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 115, customer_id: 17, sales_rep_id: 10, price_list_id: 3, status: 'APPROVED', valid_until: '2026-05-15', approval_required: true,
    items: [
      { product_id: 1, variant_id: null, unit_price: 1899.00, cost_price: 900.00, quantity: 20, discount_percent: 40.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 116, customer_id: 11, sales_rep_id: 11, price_list_id: 2, status: 'CONFIRMED', valid_until: '2026-05-15', approval_required: true,
    items: [
      { product_id: 3, variant_id: null, unit_price: 4850.00, cost_price: 4000.00, quantity: 8, discount_percent: 25.00, tax_percent: 18.00 }
    ]
  },

  // HIGH Risk Deals (Scores 60 to 79.99)
  {
    id: 117, customer_id: 10, sales_rep_id: 10, price_list_id: 1, status: 'PENDING_APPROVAL', valid_until: '2026-06-15', approval_required: true,
    items: [
      { product_id: 9, variant_id: null, unit_price: 12500.00, cost_price: 10000.00, quantity: 4, discount_percent: 30.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 118, customer_id: 14, sales_rep_id: 11, price_list_id: 1, status: 'UNDER_NEGOTIATION', valid_until: '2026-06-15', approval_required: true,
    items: [
      { product_id: 3, variant_id: null, unit_price: 4850.00, cost_price: 3800.00, quantity: 10, discount_percent: 35.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 119, customer_id: 16, sales_rep_id: 10, price_list_id: 1, status: 'APPROVED', valid_until: '2026-06-15', approval_required: true,
    items: [
      { product_id: 11, variant_id: null, unit_price: 149.00, cost_price: 20.00, quantity: 800, discount_percent: 35.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 120, customer_id: 15, sales_rep_id: 11, price_list_id: 2, status: 'PENDING_APPROVAL', valid_until: '2026-06-15', approval_required: true,
    items: [
      { product_id: 5, variant_id: null, unit_price: 3200.00, cost_price: 1800.00, quantity: 40, discount_percent: 38.00, tax_percent: 18.00 },
      { product_id: 8, variant_id: null, unit_price: 220.00, cost_price: 110.00, quantity: 10, discount_percent: 20.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 121, customer_id: 11, sales_rep_id: 10, price_list_id: 2, status: 'REJECTED', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 10, variant_id: null, unit_price: 6400.00, cost_price: 4500.00, quantity: 8, discount_percent: 40.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 122, customer_id: 12, sales_rep_id: 11, price_list_id: 3, status: 'CONFIRMED', valid_until: '2026-05-30', approval_required: true,
    items: [
      { product_id: 1, variant_id: null, unit_price: 1899.00, cost_price: 1100.00, quantity: 110, discount_percent: 35.00, tax_percent: 18.00 }
    ]
  },

  // CRITICAL Risk Deals (Scores >= 80)
  {
    id: 123, customer_id: 10, sales_rep_id: 10, price_list_id: 1, status: 'PENDING_APPROVAL', valid_until: '2026-06-30', approval_required: true,
    items: [
      { product_id: 3, variant_id: null, unit_price: 4850.00, cost_price: 3500.00, quantity: 120, discount_percent: 40.00, tax_percent: 18.00 }
    ]
  },
  {
    id: 124, customer_id: 14, sales_rep_id: 11, price_list_id: 1, status: 'UNDER_NEGOTIATION', valid_until: '2026-06-30', approval_required: true,
    items: [
      { product_id: 9, variant_id: null, unit_price: 12500.00, cost_price: 9000.00, quantity: 15, discount_percent: 45.00, tax_percent: 18.00 }
    ]
  }
];

const quotationSqls = [];
const quotationItemSqls = [];
const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

let quotationItemGlobalId = 1;

quoteConfigs.forEach(qc => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalMargin = 0;
  let totalCost = 0;
  let totalQty = 0;

  const itemRecords = [];

  qc.items.forEach(it => {
    const qty = it.quantity;
    const unitPrice = it.unit_price;
    const costPrice = it.cost_price;
    const discPct = it.discount_percent;
    const taxPct = it.tax_percent;

    const lineSubtotal = unitPrice * qty;
    const discAmt = Math.round((lineSubtotal * discPct / 100) * 100) / 100;
    const netLine = lineSubtotal - discAmt;
    const taxAmt = Math.round((netLine * taxPct / 100) * 100) / 100;
    const lineTotal = Math.round((netLine + taxAmt) * 100) / 100;

    const costAmt = Math.round((costPrice * qty) * 100) / 100;
    const marginAmt = Math.round((netLine - costAmt) * 100) / 100;
    const marginPct = netLine === 0 ? 0 : Math.round((marginAmt * 100 / netLine) * 100) / 100;

    subtotal += lineSubtotal;
    totalDiscount += discAmt;
    totalTax += taxAmt;
    totalMargin += marginAmt;
    totalCost += costAmt;
    totalQty += qty;

    itemRecords.push({
      id: quotationItemGlobalId++,
      quotation_id: qc.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      quantity: qty,
      unit_price: unitPrice,
      discount_percent: discPct,
      discount_amount: discAmt,
      tax_percent: taxPct,
      tax_amount: taxAmt,
      line_total: lineTotal,
      cost_amount: costAmt,
      margin_amount: marginAmt,
      margin_percent: marginPct
    });
  });

  subtotal = Math.round(subtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;
  totalTax = Math.round(totalTax * 100) / 100;
  totalMargin = Math.round(totalMargin * 100) / 100;
  const netSub = subtotal - totalDiscount;
  const totalAmount = Math.round((netSub + totalTax) * 100) / 100;
  const marginPercent = netSub === 0 ? 0 : Math.round((totalMargin * 100 / netSub) * 100) / 100;

  const risk = calculateRisk(subtotal, totalDiscount, totalMargin, totalAmount, totalQty);
  riskDistribution[risk.level]++;

  const qSql = `INSERT INTO quotations (id, customer_id, sales_rep_id, price_list_id, status, subtotal, discount_amount, tax_amount, total_amount, risk_score, risk_level, margin_amount, margin_percent, approval_required, valid_until) VALUES (${qc.id}, ${qc.customer_id}, ${qc.sales_rep_id}, ${esc(qc.price_list_id)}, ${esc(qc.status)}, ${subtotal.toFixed(2)}, ${totalDiscount.toFixed(2)}, ${totalTax.toFixed(2)}, ${totalAmount.toFixed(2)}, ${risk.score.toFixed(2)}, ${esc(risk.level)}, ${totalMargin.toFixed(2)}, ${marginPercent.toFixed(2)}, ${qc.approval_required ? 'TRUE' : 'FALSE'}, ${esc(qc.valid_until)});`;
  quotationSqls.push(qSql);

  addCase('quotations', 'Quotation Operations', `Quotation #QT-${qc.id} (${risk.level} Risk)`, `Create Quotation #${qc.id} for Customer ID ${qc.customer_id} with Total $${totalAmount}, Risk Score ${risk.score} (${risk.level}), Status ${qc.status}.`, qSql);

  itemRecords.forEach(ir => {
    const qiSql = `INSERT INTO quotation_items (id, quotation_id, product_id, variant_id, quantity, unit_price, discount_percent, discount_amount, tax_percent, tax_amount, line_total, cost_amount, margin_amount, margin_percent) VALUES (${ir.id}, ${ir.quotation_id}, ${ir.product_id}, ${esc(ir.variant_id)}, ${ir.quantity}, ${ir.unit_price.toFixed(2)}, ${ir.discount_percent.toFixed(2)}, ${ir.discount_amount.toFixed(2)}, ${ir.tax_percent.toFixed(2)}, ${ir.tax_amount.toFixed(2)}, ${ir.line_total.toFixed(2)}, ${ir.cost_amount.toFixed(2)}, ${ir.margin_amount.toFixed(2)}, ${ir.margin_percent.toFixed(2)});`;
    quotationItemSqls.push(qiSql);

    addCase('quotation_items', 'Quotation Line Items', `Quotation Item ID ${ir.id} (QT-#${ir.quotation_id})`, `Add Line Item to Quotation #${ir.quotation_id}: Product ID ${ir.product_id}, Qty ${ir.quantity}, Price $${ir.unit_price}, Disc ${ir.discount_percent}%, Line Total $${ir.line_total}.`, qiSql);
  });
});

console.log('Quotations (24) & Quotation Items (28) added.');

// ---------------------------------------------------------
// 19. QUOTATION STATUS HISTORY (5 records)
// ---------------------------------------------------------
const quotation_status_history = [
  { id: 1, quotation_id: 102, old_status: 'DRAFT', new_status: 'SENT', changed_by: 11, reason: 'Quotation sent to client via email' },
  { id: 2, quotation_id: 103, old_status: 'PENDING_APPROVAL', new_status: 'APPROVED', changed_by: 12, reason: 'Approved by Sales Manager' },
  { id: 3, quotation_id: 104, old_status: 'APPROVED', new_status: 'CONFIRMED', changed_by: 11, reason: 'Customer signed purchase contract' },
  { id: 4, quotation_id: 107, old_status: 'PENDING_APPROVAL', new_status: 'REJECTED', changed_by: 13, reason: 'Margin below minimum required threshold' },
  { id: 5, quotation_id: 108, old_status: 'SENT', new_status: 'EXPIRED', changed_by: null, reason: 'Validity period exceeded 30 days' }
];
const statusHistorySqls = [];
quotation_status_history.forEach(h => {
  const sql = `INSERT INTO quotation_status_history (id, quotation_id, old_status, new_status, changed_by, reason) VALUES (${h.id}, ${h.quotation_id}, ${esc(h.old_status)}, ${esc(h.new_status)}, ${esc(h.changed_by)}, ${esc(h.reason)});`;
  statusHistorySqls.push(sql);
  addCase('quotation_status_history', 'Audit & History', `Status History ID ${h.id}`, `Quotation #${h.quotation_id} status change from ${h.old_status} to ${h.new_status}.`, sql);
});

// ---------------------------------------------------------
// 20. APPROVALS (6 records)
// ---------------------------------------------------------
const approvals = [
  { id: 1, quotation_id: 103, approval_chain_id: 1, approval_level: 1, required_role: 'SALES_MANAGER', status: 'APPROVED', approver_id: 12, reason: 'Approved standard tier discount', decided_at: '2026-02-10 11:00:00' },
  { id: 2, quotation_id: 109, approval_chain_id: 1, approval_level: 1, required_role: 'SALES_MANAGER', status: 'PENDING', approver_id: null, reason: null, decided_at: null },
  { id: 3, quotation_id: 113, approval_chain_id: 1, approval_level: 2, required_role: 'FINANCE', status: 'PENDING', approver_id: null, reason: null, decided_at: null },
  { id: 4, quotation_id: 117, approval_chain_id: 2, approval_level: 1, required_role: 'FINANCE', status: 'PENDING', approver_id: null, reason: null, decided_at: null },
  { id: 5, quotation_id: 121, approval_chain_id: 2, approval_level: 2, required_role: 'ADMIN', status: 'REJECTED', approver_id: 15, reason: 'Excessive discount requested', decided_at: '2026-02-14 15:30:00' },
  { id: 6, quotation_id: 123, approval_chain_id: 3, approval_level: 1, required_role: 'ADMIN', status: 'PENDING', approver_id: null, reason: null, decided_at: null }
];
const approvalSqls = [];
approvals.forEach(a => {
  const sql = `INSERT INTO approvals (id, quotation_id, approval_chain_id, approval_level, required_role, status, approver_id, reason, decided_at) VALUES (${a.id}, ${a.quotation_id}, ${a.approval_chain_id}, ${a.approval_level}, ${esc(a.required_role)}, ${esc(a.status)}, ${esc(a.approver_id)}, ${esc(a.reason)}, ${esc(a.decided_at)});`;
  approvalSqls.push(sql);
  addCase('approvals', 'Approval Governance', `Approval Request ID ${a.id}`, `Approval request for Quotation #${a.quotation_id} by ${a.required_role} (Level ${a.approval_level}) - Status: ${a.status}.`, sql);
});

// ---------------------------------------------------------
// 21. PRODUCT RECOMMENDATION RULES (4 records)
// ---------------------------------------------------------
const product_recommendation_rules = [
  { id: 1, source_product_id: 1, recommended_product_id: 6, recommendation_type: 'CROSS_SELL', priority: 1, min_margin_percent: 20.00, promotion_tag: 'Desk Bundle Offer', active: true },
  { id: 2, source_product_id: 1, recommended_product_id: 8, recommendation_type: 'CROSS_SELL', priority: 2, min_margin_percent: 15.00, promotion_tag: 'Docking Bundle', active: true },
  { id: 3, source_product_id: 1, recommended_product_id: 2, recommendation_type: 'UPSELL', priority: 1, min_margin_percent: 25.00, promotion_tag: 'Premium M3 Upgrade', active: true },
  { id: 4, source_product_id: 3, recommended_product_id: 5, recommendation_type: 'CROSS_SELL', priority: 1, min_margin_percent: 20.00, promotion_tag: 'Datacenter Switch Bundle', active: true }
];
const recommendationSqls = [];
product_recommendation_rules.forEach(r => {
  const sql = `INSERT INTO product_recommendation_rules (id, source_product_id, recommended_product_id, recommendation_type, priority, min_margin_percent, promotion_tag, active) VALUES (${r.id}, ${r.source_product_id}, ${r.recommended_product_id}, ${esc(r.recommendation_type)}, ${r.priority}, ${r.min_margin_percent.toFixed(2)}, ${esc(r.promotion_tag)}, ${r.active ? 'TRUE' : 'FALSE'});`;
  recommendationSqls.push(sql);
  addCase('product_recommendation_rules', 'Recommendation Engine', `Recommendation Rule ID ${r.id}`, `${r.recommendation_type} recommendation from Product ID ${r.source_product_id} to Product ID ${r.recommended_product_id}.`, sql);
});

// ---------------------------------------------------------
// 22. DEAL HEALTH RULES (3 records)
// ---------------------------------------------------------
const deal_health_rules = [
  { id: 1, name: 'Stalled Deal Rule (14 Days Inactivity)', rule_type: 'STALLED_DEAL', threshold_value: 14.00, severity: 'MEDIUM', active: true },
  { id: 2, name: 'Extreme Discount Anomaly Rule (>35%)', rule_type: 'DISCOUNT_ANOMALY', threshold_value: 35.00, severity: 'HIGH', active: true },
  { id: 3, name: 'Critical Risk Score Alert Rule (>=80)', rule_type: 'HIGH_RISK', threshold_value: 80.00, severity: 'CRITICAL', active: true }
];
const dealHealthRuleSqls = [];
deal_health_rules.forEach(dhr => {
  const sql = `INSERT INTO deal_health_rules (id, name, rule_type, threshold_value, severity, active) VALUES (${dhr.id}, ${esc(dhr.name)}, ${esc(dhr.rule_type)}, ${dhr.threshold_value.toFixed(2)}, ${esc(dhr.severity)}, ${dhr.active ? 'TRUE' : 'FALSE'});`;
  dealHealthRuleSqls.push(sql);
  addCase('deal_health_rules', 'Deal Health', `Health Rule - ${dhr.name}`, `Deal health rule monitoring ${dhr.rule_type} with threshold ${dhr.threshold_value} (Severity ${dhr.severity}).`, sql);
});

// ---------------------------------------------------------
// 23. DEAL HEALTH EVENTS (5 records)
// ---------------------------------------------------------
const deal_health_events = [
  { id: 1, quotation_id: 117, rule_id: 2, event_type: 'DISCOUNT_ANOMALY', severity: 'HIGH', score: 61.00, message: 'Discount exceeded historical average for silver customer tier', resolved: false, resolved_by: null, resolved_at: null },
  { id: 2, quotation_id: 118, rule_id: 2, event_type: 'DISCOUNT_ANOMALY', severity: 'HIGH', score: 67.00, message: 'Discount anomaly detected: 35% discount offered', resolved: false, resolved_by: null, resolved_at: null },
  { id: 3, quotation_id: 123, rule_id: 3, event_type: 'HIGH_RISK', severity: 'CRITICAL', score: 98.00, message: 'Risk score is 98.00 (Critical threshold exceeded)', resolved: false, resolved_by: null, resolved_at: null },
  { id: 4, quotation_id: 124, rule_id: 3, event_type: 'HIGH_RISK', severity: 'CRITICAL', score: 94.00, message: 'Risk score is 94.00 (Critical threshold exceeded)', resolved: false, resolved_by: null, resolved_at: null },
  { id: 5, quotation_id: 105, rule_id: 1, event_type: 'STALLED_DEAL', severity: 'MEDIUM', score: 14.40, message: 'Quotation has had no activity for over 14 days', resolved: true, resolved_by: 10, resolved_at: '2026-02-20 14:00:00' }
];
const dealHealthEventSqls = [];
deal_health_events.forEach(dhe => {
  const sql = `INSERT INTO deal_health_events (id, quotation_id, rule_id, event_type, severity, score, message, resolved, resolved_by, resolved_at) VALUES (${dhe.id}, ${dhe.quotation_id}, ${esc(dhe.rule_id)}, ${esc(dhe.event_type)}, ${esc(dhe.severity)}, ${dhe.score.toFixed(2)}, ${esc(dhe.message)}, ${dhe.resolved ? 'TRUE' : 'FALSE'}, ${esc(dhe.resolved_by)}, ${esc(dhe.resolved_at)});`;
  dealHealthEventSqls.push(sql);
  addCase('deal_health_events', 'Deal Health', `Health Event ID ${dhe.id}`, `Deal health event for Quotation #${dhe.quotation_id}: ${dhe.event_type} (${dhe.severity}) - ${dhe.message}.`, sql);
});

// ---------------------------------------------------------
// 24. ANOMALY ALERTS (4 records)
// ---------------------------------------------------------
const anomaly_alerts = [
  { id: 1, quotation_id: 118, sales_rep_id: 11, anomaly_type: 'HIGH_DISCOUNT', historical_average: 15.00, current_value: 35.00, deviation_percent: 133.33, severity: 'HIGH', message: 'Discount rate 35% is 133% above rep historical average of 15%', status: 'OPEN', resolved_at: null },
  { id: 2, quotation_id: 120, sales_rep_id: 11, anomaly_type: 'UNUSUAL_DEAL_VALUE', historical_average: 25000.00, current_value: 105024.00, deviation_percent: 320.10, severity: 'HIGH', message: 'Deal value $105,024 is 320% higher than rep average deal size', status: 'OPEN', resolved_at: null },
  { id: 3, quotation_id: 123, sales_rep_id: 10, anomaly_type: 'UNUSUAL_QUANTITY', historical_average: 10.00, current_value: 120.00, deviation_percent: 1100.00, severity: 'CRITICAL', message: 'Requested quantity 120 is 1100% above rep average order quantity', status: 'ACKNOWLEDGED', resolved_at: null },
  { id: 4, quotation_id: 109, sales_rep_id: 10, anomaly_type: 'UNUSUAL_MARGIN', historical_average: 25.00, current_value: -19.77, deviation_percent: -179.08, severity: 'MEDIUM', message: 'Margin percent -19.77% deviates significantly from tier average', status: 'RESOLVED', resolved_at: '2026-02-18 10:00:00' }
];
const anomalySqls = [];
anomaly_alerts.forEach(aa => {
  const sql = `INSERT INTO anomaly_alerts (id, quotation_id, sales_rep_id, anomaly_type, historical_average, current_value, deviation_percent, severity, message, status, resolved_at) VALUES (${aa.id}, ${aa.quotation_id}, ${aa.sales_rep_id}, ${esc(aa.anomaly_type)}, ${aa.historical_average.toFixed(2)}, ${aa.current_value.toFixed(2)}, ${aa.deviation_percent.toFixed(2)}, ${esc(aa.severity)}, ${esc(aa.message)}, ${esc(aa.status)}, ${esc(aa.resolved_at)});`;
  anomalySqls.push(sql);
  addCase('anomaly_alerts', 'Anomaly Detection', `Anomaly Alert ID ${aa.id}`, `Anomaly alert for Quotation #${aa.quotation_id}: ${aa.anomaly_type} (${aa.severity}) - Status: ${aa.status}.`, sql);
});

// ---------------------------------------------------------
// 25. SUBSCRIPTION PLANS (3 records)
// ---------------------------------------------------------
const subscription_plans = [
  { id: 1, name: 'SaaS Monthly Professional Plan', billing_interval: 'MONTHLY', price: 299.00, trial_days: 14, proration_enabled: true, cancellation_refund_enabled: true, active: true },
  { id: 2, name: 'SaaS Annual Enterprise Bundle', billing_interval: 'YEARLY', price: 2990.00, trial_days: 30, proration_enabled: true, cancellation_refund_enabled: true, active: true },
  { id: 3, name: 'Predictive Analytics Monthly Add-on', billing_interval: 'MONTHLY', price: 149.00, trial_days: 7, proration_enabled: true, cancellation_refund_enabled: false, active: true }
];
const subPlanSqls = [];
subscription_plans.forEach(sp => {
  const sql = `INSERT INTO subscription_plans (id, name, billing_interval, price, trial_days, proration_enabled, cancellation_refund_enabled, active) VALUES (${sp.id}, ${esc(sp.name)}, ${esc(sp.billing_interval)}, ${sp.price.toFixed(2)}, ${sp.trial_days}, ${sp.proration_enabled ? 'TRUE' : 'FALSE'}, ${sp.cancellation_refund_enabled ? 'TRUE' : 'FALSE'}, ${sp.active ? 'TRUE' : 'FALSE'});`;
  subPlanSqls.push(sql);
  addCase('subscription_plans', 'Billing & Subscriptions', `Subscription Plan - ${sp.name}`, `Create ${sp.billing_interval} subscription plan ${sp.name} priced at $${sp.price}.`, sql);
});

// ---------------------------------------------------------
// 26. PRODUCT SUBSCRIPTION PLANS (3 records)
// ---------------------------------------------------------
const product_subscription_plans = [
  { id: 1, product_id: 4, plan_id: 1 },
  { id: 2, product_id: 4, plan_id: 2 },
  { id: 3, product_id: 11, plan_id: 3 }
];
const prodSubPlanSqls = [];
product_subscription_plans.forEach(psp => {
  const sql = `INSERT INTO product_subscription_plans (id, product_id, plan_id) VALUES (${psp.id}, ${psp.product_id}, ${psp.plan_id});`;
  prodSubPlanSqls.push(sql);
  addCase('product_subscription_plans', 'Billing & Subscriptions', `Product Sub Plan Mapping ID ${psp.id}`, `Link Product ID ${psp.product_id} to Subscription Plan ID ${psp.plan_id}.`, sql);
});

// ---------------------------------------------------------
// 27. ORDERS (5 records)
// ---------------------------------------------------------
const orders = [
  { id: 1, quotation_id: 104, status: 'CONFIRMED', total_amount: 11087.56, confirmed_at: '2026-02-12 10:00:00' },
  { id: 2, quotation_id: 116, status: 'PROCESSING', total_amount: 34338.00, confirmed_at: '2026-02-15 14:30:00' },
  { id: 3, quotation_id: 122, status: 'PARTIALLY_FULFILLED', total_amount: 145888.65, confirmed_at: '2026-02-18 09:15:00' },
  { id: 4, quotation_id: 103, status: 'FULFILLED', total_amount: 25604.55, confirmed_at: '2026-02-11 16:00:00' },
  { id: 5, quotation_id: 115, status: 'BACKORDERED', total_amount: 26897.44, confirmed_at: '2026-02-16 11:20:00' }
];
const orderSqls = [];
orders.forEach(o => {
  const sql = `INSERT INTO orders (id, quotation_id, status, total_amount, confirmed_at) VALUES (${o.id}, ${o.quotation_id}, ${esc(o.status)}, ${o.total_amount.toFixed(2)}, ${esc(o.confirmed_at)});`;
  orderSqls.push(sql);
  addCase('orders', 'Order Fulfillment', `Order ID #${o.id} (QT-#${o.quotation_id})`, `Create Order #${o.id} from Quotation #${o.quotation_id} with Total $${o.total_amount} and Status ${o.status}.`, sql);
});

// ---------------------------------------------------------
// 28. ORDER ITEMS (6 records)
// ---------------------------------------------------------
const order_items = [
  { id: 1, order_id: 1, quotation_item_id: 4, product_id: 2, quantity: 4, unit_price: 2499.00, discount_percent: 6.00, line_total: 11087.56, billing_type: 'ONE_TIME', subscription_plan_id: null },
  { id: 2, order_id: 2, quotation_item_id: 16, product_id: 3, quantity: 8, unit_price: 4850.00, discount_percent: 25.00, line_total: 34338.00, billing_type: 'ONE_TIME', subscription_plan_id: null },
  { id: 3, order_id: 3, quotation_item_id: 22, product_id: 1, quantity: 110, unit_price: 1899.00, discount_percent: 35.00, line_total: 145888.65, billing_type: 'ONE_TIME', subscription_plan_id: null },
  { id: 4, order_id: 4, quotation_item_id: 3, product_id: 5, quantity: 5, unit_price: 3200.00, discount_percent: 10.00, line_total: 16992.00, billing_type: 'ONE_TIME', subscription_plan_id: null },
  { id: 5, order_id: 4, quotation_item_id: 4, product_id: 7, quantity: 12, unit_price: 499.00, discount_percent: 5.00, line_total: 6712.55, billing_type: 'RECURRING', subscription_plan_id: 1 },
  { id: 6, order_id: 5, quotation_item_id: 15, product_id: 1, quantity: 20, unit_price: 1899.00, discount_percent: 40.00, line_total: 26897.44, billing_type: 'ONE_TIME', subscription_plan_id: null }
];
const orderItemSqls = [];
order_items.forEach(oi => {
  const sql = `INSERT INTO order_items (id, order_id, quotation_item_id, product_id, quantity, unit_price, discount_percent, line_total, billing_type, subscription_plan_id) VALUES (${oi.id}, ${oi.order_id}, ${oi.quotation_item_id}, ${oi.product_id}, ${oi.quantity}, ${oi.unit_price.toFixed(2)}, ${oi.discount_percent.toFixed(2)}, ${oi.line_total.toFixed(2)}, ${esc(oi.billing_type)}, ${esc(oi.subscription_plan_id)});`;
  orderItemSqls.push(sql);
  addCase('order_items', 'Order Fulfillment', `Order Item ID ${oi.id} (Order #${oi.order_id})`, `Add Line Item to Order #${oi.order_id}: Product ID ${oi.product_id}, Qty ${oi.quantity}, Line Total $${oi.line_total}.`, sql);
});

// ---------------------------------------------------------
// 29. ORDER FULFILLMENTS (5 records)
// ---------------------------------------------------------
const order_fulfillments = [
  { id: 1, order_id: 1, quotation_item_id: 4, warehouse_id: 1, requested_quantity: 4, allocated_quantity: 4, shipment_cost: 210.00, status: 'SHIPPED', estimated_delivery_date: '2026-02-20', actual_delivery_date: '2026-02-19', manual_override: false },
  { id: 2, order_id: 2, quotation_item_id: 16, warehouse_id: 1, requested_quantity: 8, allocated_quantity: 8, shipment_cost: 270.00, status: 'ALLOCATED', estimated_delivery_date: '2026-02-25', actual_delivery_date: null, manual_override: false },
  { id: 3, order_id: 3, quotation_item_id: 22, warehouse_id: 1, requested_quantity: 110, allocated_quantity: 60, shipment_cost: 1050.00, status: 'PARTIAL', estimated_delivery_date: '2026-03-01', actual_delivery_date: null, manual_override: false },
  { id: 4, order_id: 4, quotation_item_id: 3, warehouse_id: 2, requested_quantity: 5, allocated_quantity: 5, shipment_cost: 240.00, status: 'DELIVERED', estimated_delivery_date: '2026-02-15', actual_delivery_date: '2026-02-15', manual_override: false },
  { id: 5, order_id: 5, quotation_item_id: 15, warehouse_id: null, requested_quantity: 20, allocated_quantity: 0, shipment_cost: 0.00, status: 'BACKORDERED', estimated_delivery_date: '2026-03-15', actual_delivery_date: null, manual_override: false }
];
const fulfillmentSqls = [];
order_fulfillments.forEach(of => {
  const sql = `INSERT INTO order_fulfillments (id, order_id, quotation_item_id, warehouse_id, requested_quantity, allocated_quantity, shipment_cost, status, estimated_delivery_date, actual_delivery_date, manual_override) VALUES (${of.id}, ${of.order_id}, ${of.quotation_item_id}, ${esc(of.warehouse_id)}, ${of.requested_quantity}, ${of.allocated_quantity}, ${of.shipment_cost.toFixed(2)}, ${esc(of.status)}, ${esc(of.estimated_delivery_date)}, ${esc(of.actual_delivery_date)}, ${of.manual_override ? 'TRUE' : 'FALSE'});`;
  fulfillmentSqls.push(sql);
  addCase('order_fulfillments', 'Order Fulfillment', `Fulfillment ID ${of.id} (Order #${of.order_id})`, `Fulfillment dispatch for Order #${of.order_id} from Warehouse ${of.warehouse_id}: Allocated ${of.allocated_quantity}/${of.requested_quantity} - Status: ${of.status}.`, sql);
});

// ---------------------------------------------------------
// 30. BILLING SCHEDULES (4 records)
// ---------------------------------------------------------
const billing_schedules = [
  { id: 1, order_item_id: 5, billing_date: '2026-03-01', amount: 568.86, status: 'SCHEDULED', period_start: '2026-03-01', period_end: '2026-03-31' },
  { id: 2, order_item_id: 5, billing_date: '2026-04-01', amount: 568.86, status: 'SCHEDULED', period_start: '2026-04-01', period_end: '2026-04-30' },
  { id: 3, order_item_id: 5, billing_date: '2026-02-01', amount: 568.86, status: 'BILLED', period_start: '2026-02-01', period_end: '2026-02-28' },
  { id: 4, order_item_id: 5, billing_date: '2026-01-01', amount: 568.86, status: 'PAID', period_start: '2026-01-01', period_end: '2026-01-31' }
];
const billingScheduleSqls = [];
billing_schedules.forEach(bs => {
  const sql = `INSERT INTO billing_schedules (id, order_item_id, billing_date, amount, status, period_start, period_end) VALUES (${bs.id}, ${bs.order_item_id}, ${esc(bs.billing_date)}, ${bs.amount.toFixed(2)}, ${esc(bs.status)}, ${esc(bs.period_start)}, ${esc(bs.period_end)});`;
  billingScheduleSqls.push(sql);
  addCase('billing_schedules', 'Billing & Subscriptions', `Billing Schedule ID ${bs.id}`, `Recurring billing cycle for Order Item ID ${bs.order_item_id} on ${bs.billing_date}: $${bs.amount} - Status: ${bs.status}.`, sql);
});

// ---------------------------------------------------------
// 31. INVOICES (4 records)
// ---------------------------------------------------------
const invoices = [
  { id: 1, order_id: 1, invoice_number: 'INV-2026-001', invoice_type: 'ONE_TIME', amount: 11087.56, status: 'PAID', due_date: '2026-03-14' },
  { id: 2, order_id: 2, invoice_number: 'INV-2026-002', invoice_type: 'ONE_TIME', amount: 34338.00, status: 'UNPAID', due_date: '2026-03-17' },
  { id: 3, order_id: 4, invoice_number: 'INV-2026-003', invoice_type: 'MIXED', amount: 25604.55, status: 'PAID', due_date: '2026-03-13' },
  { id: 4, order_id: 3, invoice_number: 'INV-2026-004', invoice_type: 'ONE_TIME', amount: 75000.00, status: 'PARTIALLY_PAID', due_date: '2026-03-20' }
];
const invoiceSqls = [];
invoices.forEach(inv => {
  const sql = `INSERT INTO invoices (id, order_id, invoice_number, invoice_type, amount, status, due_date) VALUES (${inv.id}, ${inv.order_id}, ${esc(inv.invoice_number)}, ${esc(inv.invoice_type)}, ${inv.amount.toFixed(2)}, ${esc(inv.status)}, ${esc(inv.due_date)});`;
  invoiceSqls.push(sql);
  addCase('invoices', 'Billing & Invoicing', `Invoice ${inv.invoice_number}`, `Issue Invoice ${inv.invoice_number} for Order #${inv.order_id}: $${inv.amount} (${inv.invoice_type}) - Status: ${inv.status}.`, sql);
});

// ---------------------------------------------------------
// 32. INVOICE ITEMS (4 records)
// ---------------------------------------------------------
const invoice_items = [
  { id: 1, invoice_id: 1, order_item_id: 1, billing_schedule_id: null, description: 'MacBook Pro 16" M3 Max (Qty 4)', quantity: 4, amount: 11087.56 },
  { id: 2, invoice_id: 2, order_item_id: 2, billing_schedule_id: null, description: 'Dell PowerEdge R750 Server (Qty 8)', quantity: 8, amount: 34338.00 },
  { id: 3, invoice_id: 3, order_item_id: 4, billing_schedule_id: null, description: 'Cisco Catalyst 9300 Switch (Qty 5)', quantity: 5, amount: 16992.00 },
  { id: 4, invoice_id: 3, order_item_id: 5, billing_schedule_id: 4, description: '24/7 Platinum Support Recurring Monthly Fee', quantity: 1, amount: 568.86 }
];
const invoiceItemSqls = [];
invoice_items.forEach(ii => {
  const sql = `INSERT INTO invoice_items (id, invoice_id, order_item_id, billing_schedule_id, description, quantity, amount) VALUES (${ii.id}, ${ii.invoice_id}, ${ii.order_item_id}, ${esc(ii.billing_schedule_id)}, ${esc(ii.description)}, ${ii.quantity}, ${ii.amount.toFixed(2)});`;
  invoiceItemSqls.push(sql);
  addCase('invoice_items', 'Billing & Invoicing', `Invoice Item ID ${ii.id} (${ii.description})`, `Add Line Item to Invoice ID ${ii.invoice_id}: ${ii.description} - Amount: $${ii.amount}.`, sql);
});

// ---------------------------------------------------------
// 33. PAYMENTS (3 records)
// ---------------------------------------------------------
const payments = [
  { id: 1, invoice_id: 1, amount: 11087.56, payment_method: 'BANK_TRANSFER', transaction_reference: 'WIRE-2026-88901', paid_at: '2026-02-14 14:20:00' },
  { id: 2, invoice_id: 3, amount: 25604.55, payment_method: 'CARD', transaction_reference: 'CC-AUTH-773412', paid_at: '2026-02-12 10:15:00' },
  { id: 3, invoice_id: 4, amount: 40000.00, payment_method: 'UPI', transaction_reference: 'UPI-REF-992104', paid_at: '2026-02-19 16:45:00' }
];
const paymentSqls = [];
payments.forEach(p => {
  const sql = `INSERT INTO payments (id, invoice_id, amount, payment_method, transaction_reference, paid_at) VALUES (${p.id}, ${p.invoice_id}, ${p.amount.toFixed(2)}, ${esc(p.payment_method)}, ${esc(p.transaction_reference)}, ${esc(p.paid_at)});`;
  paymentSqls.push(sql);
  addCase('payments', 'Billing & Invoicing', `Payment ID ${p.id} (Invoice #${p.invoice_id})`, `Record payment of $${p.amount} for Invoice ID ${p.invoice_id} via ${p.payment_method} (Ref: ${p.transaction_reference}).`, sql);
});

// ---------------------------------------------------------
// 34. CREDIT NOTES (2 records)
// ---------------------------------------------------------
const credit_notes = [
  { id: 1, invoice_id: 3, amount: 500.00, reason: 'Goodwill rebate for delivery delay', status: 'ISSUED' },
  { id: 2, invoice_id: 2, amount: 1200.00, reason: 'Price match adjustment request pending approval', status: 'PENDING' }
];
const creditNoteSqls = [];
credit_notes.forEach(cn => {
  const sql = `INSERT INTO credit_notes (id, invoice_id, amount, reason, status) VALUES (${cn.id}, ${cn.invoice_id}, ${cn.amount.toFixed(2)}, ${esc(cn.reason)}, ${esc(cn.status)});`;
  creditNoteSqls.push(sql);
  addCase('credit_notes', 'Billing & Invoicing', `Credit Note ID ${cn.id} (Invoice #${cn.invoice_id})`, `Issue credit note of $${cn.amount} against Invoice ID ${cn.invoice_id}: ${cn.reason} (Status: ${cn.status}).`, sql);
});

// ---------------------------------------------------------
// 35. NEGOTIATIONS (3 records)
// ---------------------------------------------------------
const negotiations = [
  { id: 1, quotation_id: 105, customer_id: 16, status: 'OPEN', proposed_discount_percent: 18.00, proposed_total: 24190.00 },
  { id: 2, quotation_id: 110, customer_id: 14, status: 'IN_REVIEW', proposed_discount_percent: 35.00, proposed_total: 35000.00 },
  { id: 3, quotation_id: 118, customer_id: 14, status: 'ACCEPTED', proposed_discount_percent: 35.00, proposed_total: 53690.00 }
];
const negotiationSqls = [];
negotiations.forEach(n => {
  const sql = `INSERT INTO negotiations (id, quotation_id, customer_id, status, proposed_discount_percent, proposed_total) VALUES (${n.id}, ${n.quotation_id}, ${n.customer_id}, ${esc(n.status)}, ${n.proposed_discount_percent.toFixed(2)}, ${n.proposed_total.toFixed(2)});`;
  negotiationSqls.push(sql);
  addCase('negotiations', 'Customer Negotiations', `Negotiation ID ${n.id} (QT-#${n.quotation_id})`, `Open negotiation portal session for Quotation #${n.quotation_id} with customer ID ${n.customer_id}: Proposed discount ${n.proposed_discount_percent}% (Status: ${n.status}).`, sql);
});

// ---------------------------------------------------------
// 36. NEGOTIATION MESSAGES (3 records)
// ---------------------------------------------------------
const negotiation_messages = [
  { id: 1, negotiation_id: 1, sender_user_id: 17, message: 'We are requesting an additional 6% discount given our multi-year cloud commitment.' },
  { id: 2, negotiation_id: 1, sender_user_id: 10, message: 'Thank you for reaching out. I have submitted the 18% overall discount proposal to management.' },
  { id: 3, negotiation_id: 2, sender_user_id: 19, message: 'Can you bundle on-site migration support with this workstation batch?' }
];
const negMessageSqls = [];
negotiation_messages.forEach(nm => {
  const sql = `INSERT INTO negotiation_messages (id, negotiation_id, sender_user_id, message) VALUES (${nm.id}, ${nm.negotiation_id}, ${nm.sender_user_id}, ${esc(nm.message)});`;
  negMessageSqls.push(sql);
  addCase('negotiation_messages', 'Customer Negotiations', `Negotiation Msg ID ${nm.id}`, `Log negotiation chat message for Negotiation ID ${nm.negotiation_id} sent by User ID ${nm.sender_user_id}.`, sql);
});

// ---------------------------------------------------------
// 37. NEGOTIATION LINE REQUESTS (2 records)
// ---------------------------------------------------------
const negotiation_line_requests = [
  { id: 1, negotiation_id: 1, quotation_item_id: 6, requested_quantity: 3, requested_discount_percent: 18.00, request_type: 'DISCOUNT_CHANGE', customer_comment: 'Increase discount to 18% for 3 units', status: 'PENDING' },
  { id: 2, negotiation_id: 2, quotation_item_id: 13, requested_quantity: 15, requested_discount_percent: 30.00, request_type: 'QUANTITY_CHANGE', customer_comment: 'Increase volume from 10 to 15 workstations', status: 'ACCEPTED' }
];
const negLineReqSqls = [];
negotiation_line_requests.forEach(nlr => {
  const sql = `INSERT INTO negotiation_line_requests (id, negotiation_id, quotation_item_id, requested_quantity, requested_discount_percent, request_type, customer_comment, status) VALUES (${nlr.id}, ${nlr.negotiation_id}, ${nlr.quotation_item_id}, ${esc(nlr.requested_quantity)}, ${esc(nlr.requested_discount_percent)}, ${esc(nlr.request_type)}, ${esc(nlr.customer_comment)}, ${esc(nlr.status)});`;
  negLineReqSqls.push(sql);
  addCase('negotiation_line_requests', 'Customer Negotiations', `Line Request ID ${nlr.id}`, `Line item negotiation request for Item ID ${nlr.quotation_item_id} in Negotiation ID ${nlr.negotiation_id}: ${nlr.request_type} - Status: ${nlr.status}.`, sql);
});

// ---------------------------------------------------------
// 38. AUDIT LOGS (2 records)
// ---------------------------------------------------------
const audit_logs = [
  { id: 1, user_id: 10, entity_type: 'QUOTATION', entity_id: 103, action: 'UPDATE_STATUS', old_value: JSON.stringify({ status: 'PENDING_APPROVAL' }), new_value: JSON.stringify({ status: 'APPROVED' }), reason: 'Approval granted by Sales Manager', ip_address: '192.168.1.45' },
  { id: 2, user_id: 15, entity_type: 'DISCOUNT_RULE', entity_id: 4, action: 'CREATE', old_value: null, new_value: JSON.stringify({ customer_tier: 'GOLD', max_discount_percent: 30 }), reason: 'Updated Q1 governance policy', ip_address: '10.0.0.12' }
];
const auditLogSqls = [];
audit_logs.forEach(al => {
  const sql = `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, old_value, new_value, reason, ip_address) VALUES (${al.id}, ${al.user_id}, ${esc(al.entity_type)}, ${al.entity_id}, ${esc(al.action)}, ${esc(al.old_value)}, ${esc(al.new_value)}, ${esc(al.reason)}, ${esc(al.ip_address)});`;
  auditLogSqls.push(sql);
  addCase('audit_logs', 'System Audit', `Audit Log ID ${al.id}`, `System audit log entry: User ID ${al.user_id} performed ${al.action} on ${al.entity_type} ID ${al.entity_id}.`, sql);
});

// ---------------------------------------------------------
// 39. REPORT CONFIGURATIONS (1 record) -> Total EXACTLY 200 Test Cases!
// ---------------------------------------------------------
const report_configurations = [
  { id: 1, name: 'Executive High-Risk Deal Digest', report_type: 'DEAL_HEALTH', created_by: 15, filters: JSON.stringify({ min_risk_level: 'HIGH', statuses: ['PENDING_APPROVAL', 'UNDER_NEGOTIATION'] }) }
];
const reportConfigSqls = [];
report_configurations.forEach(rc => {
  const sql = `INSERT INTO report_configurations (id, name, report_type, created_by, filters) VALUES (${rc.id}, ${esc(rc.name)}, ${esc(rc.report_type)}, ${rc.created_by}, ${esc(rc.filters)});`;
  reportConfigSqls.push(sql);
  addCase('report_configurations', 'Analytics & Reporting', `Report Config - ${rc.name}`, `Save custom report configuration ${rc.name} (${rc.report_type}) created by User ID ${rc.created_by}.`, sql);
});

console.log(`Total Test Cases Created: ${testCases.length}`);

// ---------------------------------------------------------
// WRITE OUTPUT FILES
// ---------------------------------------------------------

// 1. Output database/test-data.sql
const allSqls = [
  '-- ============================================================',
  '-- DEALFLOW360 COMPREHENSIVE TEST DATASET (200 TEST CASES)',
  '-- Strictly compliant with MySQL 8+ schema & business rules',
  '-- ============================================================',
  '',
  'USE dealflow360;',
  '',
  '-- 1. CUSTOMERS',
  ...customerSqls,
  '',
  '-- 2. USERS',
  ...userSqls,
  '',
  '-- 3. TEAMS',
  ...teamSqls,
  '',
  '-- 4. TEAM MEMBERS',
  ...teamMemberSqls,
  '',
  '-- 5. PRODUCT CATEGORIES',
  ...categorySqls,
  '',
  '-- 6. PRODUCTS',
  ...productSqls,
  '',
  '-- 7. PRODUCT VARIANTS',
  ...variantSqls,
  '',
  '-- 8. PRICE LISTS',
  ...priceListSqls,
  '',
  '-- 9. PRICE LIST ITEMS',
  ...priceListItemSqls,
  '',
  '-- 10. DISCOUNT RULES',
  ...discountRuleSqls,
  '',
  '-- 11. APPROVAL CHAINS',
  ...approvalChainSqls,
  '',
  '-- 12. APPROVAL RULES',
  ...approvalRuleSqls,
  '',
  '-- 13. WAREHOUSES',
  ...warehouseSqls,
  '',
  '-- 14. WAREHOUSE STOCK',
  ...stockSqls,
  '',
  '-- 15. REPLENISHMENT RULES',
  ...replenishmentSqls,
  '',
  '-- 16. SHIPPING RULES',
  ...shippingSqls,
  '',
  '-- 17. QUOTATIONS',
  ...quotationSqls,
  '',
  '-- 18. QUOTATION ITEMS',
  ...quotationItemSqls,
  '',
  '-- 19. QUOTATION STATUS HISTORY',
  ...statusHistorySqls,
  '',
  '-- 20. APPROVALS',
  ...approvalSqls,
  '',
  '-- 21. PRODUCT RECOMMENDATION RULES',
  ...recommendationSqls,
  '',
  '-- 22. DEAL HEALTH RULES',
  ...dealHealthRuleSqls,
  '',
  '-- 23. DEAL HEALTH EVENTS',
  ...dealHealthEventSqls,
  '',
  '-- 24. ANOMALY ALERTS',
  ...anomalySqls,
  '',
  '-- 25. ORDER FULFILLMENTS',
  ...fulfillmentSqls,
  '',
  '-- 26. SUBSCRIPTION PLANS',
  ...subPlanSqls,
  '',
  '-- 27. PRODUCT SUBSCRIPTION PLANS',
  ...prodSubPlanSqls,
  '',
  '-- 28. ORDERS',
  ...orderSqls,
  '',
  '-- 29. ORDER ITEMS',
  ...orderItemSqls,
  '',
  '-- 30. BILLING SCHEDULES',
  ...billingScheduleSqls,
  '',
  '-- 31. INVOICES',
  ...invoiceSqls,
  '',
  '-- 32. INVOICE ITEMS',
  ...invoiceItemSqls,
  '',
  '-- 33. PAYMENTS',
  ...paymentSqls,
  '',
  '-- 34. CREDIT NOTES',
  ...creditNoteSqls,
  '',
  '-- 35. NEGOTIATIONS',
  ...negotiationSqls,
  '',
  '-- 36. NEGOTIATION MESSAGES',
  ...negMessageSqls,
  '',
  '-- 37. NEGOTIATION LINE REQUESTS',
  ...negLineReqSqls,
  '',
  '-- 38. AUDIT LOGS',
  ...auditLogSqls,
  '',
  '-- 39. REPORT CONFIGURATIONS',
  ...reportConfigSqls,
  ''
];

const testDataPath = path.join(__dirname, '../database/test-data.sql');
fs.writeFileSync(testDataPath, allSqls.join('\n'), 'utf8');
console.log(`Saved ${testDataPath}`);

// 2. Output docs/test-cases.md
const tableCounts = {};
testCases.forEach(tc => {
  tableCounts[tc.table] = (tableCounts[tc.table] || 0) + 1;
});

const mdLines = [
  '# DealFlow360 Comprehensive Test Cases & Scenario Suite',
  '',
  'This document details the **exactly 200 realistic test cases** designed and generated for the DealFlow360 platform.',
  'Every test case corresponds strictly to the database schema defined in `database/schema.sql`, respects all primary keys, foreign keys, constraints, enums, defaults, and implements the backend risk engine business rules.',
  '',
  '---',
  '',
  '## Risk Engine Distribution Verification',
  '',
  'The risk level for quotations is calculated dynamically using the backend engine formula:',
  '```javascript',
  'let score = discountRate * 1.2 + (marginRate < 10 ? 25 : 0) + (total_amount > 100000 ? 15 : 0) + (quantity > 100 ? 10 : 0);',
  '```',
  'Thresholds:',
  '- **LOW**: Score < 30',
  '- **MEDIUM**: 30 <= Score < 60',
  '- **HIGH**: 60 <= Score < 80',
  '- **CRITICAL**: Score >= 80',
  '',
  '### Calculated Quotation Risk Distribution:',
  '```',
  `LOW: ${riskDistribution.LOW}`,
  `MEDIUM: ${riskDistribution.MEDIUM}`,
  `HIGH: ${riskDistribution.HIGH}`,
  `CRITICAL: ${riskDistribution.CRITICAL}`,
  '```',
  '',
  '---',
  '',
  '## Test Case Catalogue (TC-001 to TC-200)',
  '',
  '| Test Case ID | Target Table | Scenario Category | Title | Summary / Expected Behavior |',
  '|---|---|---|---|---|'
];

testCases.forEach(tc => {
  mdLines.push(`| **${tc.id}** | \`${tc.table}\` | ${tc.category} | ${tc.title} | ${tc.description} |`);
});

mdLines.push('');
mdLines.push('---');
mdLines.push('');
mdLines.push('## Test Coverage Summary by Table');
mdLines.push('');
mdLines.push('| # | Table Name | Covered Cases Count | Primary Entity Category |');
mdLines.push('|---|---|---|---|');

let tableIdx = 1;
const tableCategories = {
  customers: 'Master Data',
  users: 'Identity & Access',
  teams: 'Organization',
  team_members: 'Organization',
  product_categories: 'Catalog',
  products: 'Catalog',
  product_variants: 'Catalog',
  price_lists: 'Pricing Matrix',
  price_list_items: 'Pricing Matrix',
  discount_rules: 'Governance Rules',
  approval_chains: 'Approval Workflow',
  approval_rules: 'Approval Workflow',
  warehouses: 'Inventory & Fulfillment',
  warehouse_stock: 'Inventory & Fulfillment',
  replenishment_rules: 'Inventory & Fulfillment',
  shipping_rules: 'Logistics',
  quotations: 'Sales Operations',
  quotation_items: 'Sales Operations',
  quotation_status_history: 'Audit Trail',
  approvals: 'Approval Governance',
  product_recommendation_rules: 'AI & Recommendations',
  deal_health_rules: 'Risk & Monitoring',
  deal_health_events: 'Risk & Monitoring',
  anomaly_alerts: 'Risk & Monitoring',
  order_fulfillments: 'Fulfillment & Logistics',
  subscription_plans: 'Recurring Billing',
  product_subscription_plans: 'Recurring Billing',
  orders: 'Order Processing',
  order_items: 'Order Processing',
  billing_schedules: 'Recurring Billing',
  invoices: 'Financial Management',
  invoice_items: 'Financial Management',
  payments: 'Financial Management',
  credit_notes: 'Financial Management',
  negotiations: 'Customer Portal',
  negotiation_messages: 'Customer Portal',
  negotiation_line_requests: 'Customer Portal',
  audit_logs: 'Security & Compliance',
  report_configurations: 'Analytics & BI'
};

Object.keys(tableCounts).forEach(tbl => {
  mdLines.push(`| ${tableIdx++} | \`${tbl}\` | **${tableCounts[tbl]}** | ${tableCategories[tbl] || 'General'} |`);
});

mdLines.push('');
mdLines.push(`**Total Test Cases Count: Exactly ${testCases.length}**`);
mdLines.push('');

const docsPath = path.join(__dirname, '../docs/test-cases.md');
fs.writeFileSync(docsPath, mdLines.join('\n'), 'utf8');
console.log(`Saved ${docsPath}`);

console.log('\n--- RISK DISTRIBUTION REPORT ---');
console.log(`LOW: ${riskDistribution.LOW}`);
console.log(`MEDIUM: ${riskDistribution.MEDIUM}`);
console.log(`HIGH: ${riskDistribution.HIGH}`);
console.log(`CRITICAL: ${riskDistribution.CRITICAL}`);
console.log('--------------------------------\n');


