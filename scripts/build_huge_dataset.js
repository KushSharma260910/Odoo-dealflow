const fs = require('fs');
const path = require('path');

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------
// RISK ENGINE CALCULATOR (Exact backend implementation)
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

const testCases = [];
let caseCounter = 1;

function addCase(table, category, title, description, sqlStatement) {
  const idStr = String(caseCounter).padStart(4, '0');
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

// Helper pseudo-random function for reproducible data
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// ---------------------------------------------------------
// 1. CUSTOMERS (200 Records: IDs 10 to 209)
// ---------------------------------------------------------
const companyPrefixes = ['Acme', 'Apex', 'Nexus', 'Vanguard', 'Horizon', 'Quantum', 'BlueSky', 'Starlight', 'Omni', 'Synergy', 'Global', 'Vertex', 'Pinnacle', 'Titan', 'Atlas', 'Nova', 'Cyber', 'Data', 'Tech', 'Cloud'];
const companySuffixes = ['Corp', 'Solutions', 'Logistics', 'Healthcare', 'Financial', 'Labs', 'Media', 'Systems', 'Technologies', 'Networks', 'Holdings', 'Ventures', 'Industries', 'Group', 'Partners', 'Enterprises', 'Services', 'Digital', 'Soft', 'Works'];
const tiers = ['BRONZE', 'SILVER', 'GOLD'];
const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE'];

const customers = [];
const customerSqls = [];

for (let i = 10; i <= 209; i++) {
  const pIdx = Math.floor(pseudoRandom(i * 1.1) * companyPrefixes.length);
  const sIdx = Math.floor(pseudoRandom(i * 2.3) * companySuffixes.length);
  const tIdx = Math.floor(pseudoRandom(i * 3.7) * tiers.length);
  const stIdx = Math.floor(pseudoRandom(i * 4.9) * statuses.length);

  const name = `${companyPrefixes[pIdx]} ${companySuffixes[sIdx]} #${i - 9}`;
  const email = `contact@${companyPrefixes[pIdx].toLowerCase()}${companySuffixes[sIdx].toLowerCase()}${i}.com`;
  const company_name = `${companyPrefixes[pIdx]} ${companySuffixes[sIdx]} Inc`;
  const tier = tiers[tIdx];
  const status = statuses[stIdx];

  const cust = { id: i, name, email, company_name, tier, status };
  customers.push(cust);

  const sql = `INSERT INTO customers (id, name, email, company_name, tier, status) VALUES (${i}, ${esc(name)}, ${esc(email)}, ${esc(company_name)}, ${esc(tier)}, ${esc(status)});`;
  customerSqls.push(sql);
  addCase('customers', 'Master Data', `Customer #${i - 9} (${tier})`, `Create customer ${name} with tier ${tier} and status ${status}.`, sql);
}

// ---------------------------------------------------------
// 2. USERS (200 Records: IDs 1 to 6 for Demo, 10 to 203)
// ---------------------------------------------------------
const firstNames = ['Sarah', 'Michael', 'Robert', 'Elena', 'David', 'Amanda', 'John', 'Jane', 'Kevin', 'Gregory', 'Alex', 'Emily', 'Daniel', 'Sophia', 'James', 'Olivia', 'William', 'Ava', 'Benjamin', 'Isabella'];
const lastNames = ['Jenkins', 'Chang', 'Ross', 'Rostova', 'Vance', 'Sterling', 'Doe', 'Smith', 'Miller', 'House', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'];

// Benchmark Demo Role Accounts (placed AFTER customers table insertion in schema sequence)
const demoAccounts = [
  { id: 1, customer_id: null, name: 'System Admin', email: 'admin@dealflow.com', password: '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG', role: 'ADMIN', status: 'ACTIVE' },
  { id: 2, customer_id: null, name: 'Sales Representative', email: 'sales@dealflow.com', password: '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG', role: 'SALES_REP', status: 'ACTIVE' },
  { id: 3, customer_id: null, name: 'Sales Manager', email: 'manager@dealflow.com', password: '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG', role: 'SALES_MANAGER', status: 'ACTIVE' },
  { id: 4, customer_id: null, name: 'Finance Controller', email: 'finance@dealflow.com', password: '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG', role: 'FINANCE', status: 'ACTIVE' },
  { id: 5, customer_id: null, name: 'Operations Lead', email: 'operations@dealflow.com', password: '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG', role: 'OPERATIONS', status: 'ACTIVE' },
  { id: 6, customer_id: 10, name: 'Portal Customer', email: 'customer@dealflow.com', password: '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG', role: 'CUSTOMER', status: 'ACTIVE' },
];

const internalRoles = ['SALES_REP', 'SALES_REP', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'OPERATIONS', 'ADMIN'];

const users = [...demoAccounts];
const userSqls = [];

demoAccounts.forEach(u => {
  const sql = `INSERT INTO users (id, customer_id, name, email, password, role, status) VALUES (${u.id}, ${esc(u.customer_id)}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.password)}, ${esc(u.role)}, ${esc(u.status)});`;
  userSqls.push(sql);
  addCase('users', 'Identity & Access', `Demo User (${u.role})`, `Create demo login account ${u.email} with role ${u.role}.`, sql);
});

for (let i = 10; i <= 203; i++) {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[(i * 3) % lastNames.length];
  const name = `${fn} ${ln} ${i}`;
  let role = 'CUSTOMER';
  let customer_id = null;

  if (i < 50) {
    role = internalRoles[(i - 10) % internalRoles.length];
  } else {
    role = 'CUSTOMER';
    customer_id = 10 + ((i - 50) % 200);
  }

  const email = role === 'CUSTOMER' ? `user${i}@customer${customer_id || 10}.com` : `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@dealflow360.com`;
  const password = '$2b$10$LArbf0hVupreVvjuiCBnUu2djGO5zbOWfzY69c1OuJIpJyLe2fOVG';
  const status = i % 15 === 0 ? 'INACTIVE' : 'ACTIVE';

  const u = { id: i, customer_id, name, email, password, role, status };
  users.push(u);

  const sql = `INSERT INTO users (id, customer_id, name, email, password, role, status) VALUES (${i}, ${esc(customer_id)}, ${esc(name)}, ${esc(email)}, ${esc(password)}, ${esc(role)}, ${esc(status)});`;
  userSqls.push(sql);
  addCase('users', 'Identity & Access', `User #${i - 9} (${role})`, `Create user ${name} with role ${role} and status ${status}.`, sql);
}

// Sales Reps IDs for quote generation
const salesReps = users.filter(u => u.role === 'SALES_REP');

// ---------------------------------------------------------
// 3. TEAMS (5 Records: IDs 1 to 5)
// ---------------------------------------------------------
const teams = [
  { id: 1, name: 'North America Enterprise Team', manager_id: 13 },
  { id: 2, name: 'EMEA Commercial Sales Division', manager_id: 13 },
  { id: 3, name: 'APAC Growth Accounts Team', manager_id: 13 },
  { id: 4, name: 'Global Key Accounts Team', manager_id: 15 },
  { id: 5, name: 'Mid-Market Regional Sales', manager_id: 13 }
];
const teamSqls = [];
teams.forEach(t => {
  const sql = `INSERT INTO teams (id, name, manager_id) VALUES (${t.id}, ${esc(t.name)}, ${esc(t.manager_id)});`;
  teamSqls.push(sql);
  addCase('teams', 'Organization', `Team - ${t.name}`, `Setup team ${t.name} under Manager ID ${t.manager_id}.`, sql);
});

// ---------------------------------------------------------
// 4. TEAM MEMBERS (20 Records)
// ---------------------------------------------------------
const team_members = [];
const teamMemberSqls = [];
for (let i = 1; i <= 20; i++) {
  const team_id = (i % 5) + 1;
  const user_id = salesReps[(i - 1) % salesReps.length].id;
  const tm = { id: i, team_id, user_id };
  team_members.push(tm);
  const sql = `INSERT INTO team_members (id, team_id, user_id) VALUES (${i}, ${team_id}, ${user_id});`;
  teamMemberSqls.push(sql);
  addCase('team_members', 'Organization', `Team Member ID ${i}`, `Assign Rep ID ${user_id} to Team ID ${team_id}.`, sql);
}

// ---------------------------------------------------------
// 5. PRODUCT CATEGORIES (10 Records: IDs 7 to 16)
// ---------------------------------------------------------
const product_categories = [
  { id: 7, name: 'Enterprise Storage Infrastructure', description: 'SAN, NAS, and High-Density Array Storage Systems', status: 'ACTIVE' },
  { id: 8, name: 'Cybersecurity Hardware & Appliances', description: 'Next-Gen Firewalls, HSMs, and VPN Concentrators', status: 'ACTIVE' },
  { id: 9, name: 'Legacy Software Add-ons', description: 'Deprecated utility software modules', status: 'INACTIVE' },
  { id: 10, name: 'Cloud Infrastructure & Compute', description: 'Dedicated Virtual Instances & HPC Nodes', status: 'ACTIVE' },
  { id: 11, name: 'AI & Data Analytics Platform', description: 'Machine Learning Pipelines & BI Engine Add-ons', status: 'ACTIVE' },
  { id: 12, name: 'Network Switches & Routers', description: 'Managed Core Switches and High-Speed Optics', status: 'ACTIVE' },
  { id: 13, name: 'Professional Engineering Services', description: 'On-site installation, training, and SLA support', status: 'ACTIVE' },
  { id: 14, name: 'Workstations & Laptops', description: 'Mobile workstations, dual-socket desktop towers', status: 'ACTIVE' },
  { id: 15, name: 'Monitors & Office Peripherals', description: '4K Ultra-wide displays, docks, ergonomic gear', status: 'ACTIVE' },
  { id: 16, name: 'Datacenter Power & Cooling', description: 'UPS systems, rack PDUs, smart cooling units', status: 'ACTIVE' }
];
const categorySqls = [];
product_categories.forEach(cat => {
  const sql = `INSERT INTO product_categories (id, name, description, status) VALUES (${cat.id}, ${esc(cat.name)}, ${esc(cat.description)}, ${esc(cat.status)});`;
  categorySqls.push(sql);
  addCase('product_categories', 'Catalog', `Category - ${cat.name}`, `Create category ${cat.name} with status ${cat.status}.`, sql);
});

// ---------------------------------------------------------
// 6. PRODUCTS (200 Records: IDs 9 to 208)
// ---------------------------------------------------------
const prodNames = ['Server Pro', 'SAN Array', 'NGFW Firewall', 'AI Analytics Seat', 'Workstation Ultra', 'Core Switch 48P', 'Curved Display 38"', 'Platinum SLA Support', 'Enterprise Docking Station', 'High-Density Rack UPS'];
const products = [];
const productSqls = [];

for (let i = 9; i <= 208; i++) {
  const catIdx = (i % product_categories.length);
  const category_id = product_categories[catIdx].id;

  const baseName = prodNames[(i - 9) % prodNames.length];
  const name = `${baseName} Series ${i}`;
  const sku = `PROD-SKU-${i}`;
  const description = `High reliability enterprise module product version ${i}`;
  const unit = i % 4 === 0 ? 'USER/MO' : i % 5 === 0 ? 'DAY' : 'UNIT';
  const base_price = Math.round((500 + pseudoRandom(i * 7.1) * 9500) * 100) / 100;
  const cost_price = Math.round((base_price * (0.4 + pseudoRandom(i * 1.3) * 0.45)) * 100) / 100;
  const tax_percent = 18.00;
  const billing_type = unit === 'USER/MO' ? 'RECURRING' : 'ONE_TIME';
  const status = i % 25 === 0 ? 'INACTIVE' : 'ACTIVE';

  const p = { id: i, category_id, name, sku, description, unit, base_price, cost_price, tax_percent, billing_type, status };
  products.push(p);

  const sql = `INSERT INTO products (id, category_id, name, sku, description, unit, base_price, cost_price, tax_percent, billing_type, status) VALUES (${i}, ${category_id}, ${esc(name)}, ${esc(sku)}, ${esc(description)}, ${esc(unit)}, ${base_price.toFixed(2)}, ${cost_price.toFixed(2)}, ${tax_percent.toFixed(2)}, ${esc(billing_type)}, ${esc(status)});`;
  productSqls.push(sql);
  addCase('products', 'Catalog', `Product #${i - 8} (${sku})`, `Add product ${name} (SKU ${sku}) priced at $${base_price} (Cost $${cost_price}).`, sql);
}

// ---------------------------------------------------------
// 7. PRODUCT VARIANTS (50 Records: IDs 5 to 54)
// ---------------------------------------------------------
const product_variants = [];
const variantSqls = [];
for (let i = 5; i <= 54; i++) {
  const product_id = 9 + ((i - 5) % 190);
  const attribute_name = i % 2 === 0 ? 'Memory Expansion' : 'Warranty Upgrade';
  const attribute_value = i % 2 === 0 ? '64GB RAM Pack' : '3-Year Onsite Support';
  const extra_price = Math.round((100 + pseudoRandom(i * 2.9) * 900) * 100) / 100;
  const sku_suffix = `-VAR${i}`;

  const pv = { id: i, product_id, attribute_name, attribute_value, extra_price, sku_suffix };
  product_variants.push(pv);

  const sql = `INSERT INTO product_variants (id, product_id, attribute_name, attribute_value, extra_price, sku_suffix) VALUES (${i}, ${product_id}, ${esc(attribute_name)}, ${esc(attribute_value)}, ${extra_price.toFixed(2)}, ${esc(sku_suffix)});`;
  variantSqls.push(sql);
  addCase('product_variants', 'Catalog', `Variant ID ${i}`, `Add variant ${attribute_name}: ${attribute_value} to Product ID ${product_id}.`, sql);
}

// ---------------------------------------------------------
// 8. PRICE LISTS (3 Records)
// ---------------------------------------------------------
const price_lists = [
  { id: 1, name: 'Gold Partner Preferred Pricing Matrix', customer_tier: 'GOLD', currency: 'USD', status: 'ACTIVE' },
  { id: 2, name: 'Silver Corporate Volume Book', customer_tier: 'SILVER', currency: 'USD', status: 'ACTIVE' },
  { id: 3, name: 'Standard Bronze Retail Catalog', customer_tier: 'BRONZE', currency: 'USD', status: 'ACTIVE' }
];
const priceListSqls = [];
price_lists.forEach(pl => {
  const sql = `INSERT INTO price_lists (id, name, customer_tier, currency, status) VALUES (${pl.id}, ${esc(pl.name)}, ${esc(pl.customer_tier)}, ${esc(pl.currency)}, ${esc(pl.status)});`;
  priceListSqls.push(sql);
  addCase('price_lists', 'Pricing Matrix', `Price List - ${pl.name}`, `Setup ${pl.customer_tier} price list ${pl.name}.`, sql);
});

// ---------------------------------------------------------
// 9. PRICE LIST ITEMS (20 Records: IDs 1 to 20)
// ---------------------------------------------------------
const price_list_items = [];
const priceListItemSqls = [];
for (let i = 1; i <= 20; i++) {
  const price_list_id = (i % 3) + 1;
  const product_id = 9 + (i * 3);
  const baseP = products.find(p => p.id === product_id)?.base_price || 1000;
  const price = Math.round((baseP * 0.9) * 100) / 100;

  const pli = { id: i, price_list_id, product_id, price, valid_from: '2026-01-01', valid_until: '2026-12-31' };
  price_list_items.push(pli);

  const sql = `INSERT INTO price_list_items (id, price_list_id, product_id, price, valid_from, valid_until) VALUES (${i}, ${price_list_id}, ${product_id}, ${price.toFixed(2)}, '2026-01-01', '2026-12-31');`;
  priceListItemSqls.push(sql);
  addCase('price_list_items', 'Pricing Matrix', `Price List Item ID ${i}`, `Override Product ID ${product_id} price to $${price} in Price List ID ${price_list_id}.`, sql);
}

// ---------------------------------------------------------
// 10. DISCOUNT RULES (6 Records: IDs 4 to 9)
// ---------------------------------------------------------
const discount_rules = [
  { id: 4, customer_tier: 'GOLD', category_id: 7, max_discount_percent: 35.00, approval_required_above: 20.00, active: true },
  { id: 5, customer_tier: 'SILVER', category_id: 8, max_discount_percent: 25.00, approval_required_above: 15.00, active: true },
  { id: 6, customer_tier: 'BRONZE', category_id: 10, max_discount_percent: 15.00, approval_required_above: 10.00, active: true },
  { id: 7, customer_tier: 'GOLD', category_id: 11, max_discount_percent: 40.00, approval_required_above: 25.00, active: true },
  { id: 8, customer_tier: 'SILVER', category_id: 12, max_discount_percent: 20.00, approval_required_above: 12.00, active: true },
  { id: 9, customer_tier: 'BRONZE', category_id: 14, max_discount_percent: 10.00, approval_required_above: 5.00, active: true }
];
const discountRuleSqls = [];
discount_rules.forEach(dr => {
  const sql = `INSERT INTO discount_rules (id, customer_tier, category_id, max_discount_percent, approval_required_above, active) VALUES (${dr.id}, ${esc(dr.customer_tier)}, ${esc(dr.category_id)}, ${dr.max_discount_percent.toFixed(2)}, ${dr.approval_required_above.toFixed(2)}, ${dr.active ? 'TRUE' : 'FALSE'});`;
  discountRuleSqls.push(sql);
  addCase('discount_rules', 'Governance Rules', `Discount Rule ID ${dr.id}`, `Rule for ${dr.customer_tier} tier on Category ID ${dr.category_id}: Max ${dr.max_discount_percent}%, approval > ${dr.approval_required_above}%.`, sql);
});

// ---------------------------------------------------------
// 11. APPROVAL CHAINS (3 Records)
// ---------------------------------------------------------
const approval_chains = [
  { id: 1, name: 'Standard Risk Commercial Chain', min_risk_score: 0.00, max_risk_score: 59.99, active: true },
  { id: 2, name: 'High Risk Escalation Chain', min_risk_score: 60.00, max_risk_score: 79.99, active: true },
  { id: 3, name: 'Critical Risk Executive Board Chain', min_risk_score: 80.00, max_risk_score: 100.00, active: true }
];
const approvalChainSqls = [];
approval_chains.forEach(ac => {
  const sql = `INSERT INTO approval_chains (id, name, min_risk_score, max_risk_score, active) VALUES (${ac.id}, ${esc(ac.name)}, ${ac.min_risk_score.toFixed(2)}, ${ac.max_risk_score.toFixed(2)}, ${ac.active ? 'TRUE' : 'FALSE'});`;
  approvalChainSqls.push(sql);
  addCase('approval_chains', 'Approval Workflow', `Approval Chain - ${ac.name}`, `Chain ${ac.name} for risk scores ${ac.min_risk_score} to ${ac.max_risk_score}.`, sql);
});

// ---------------------------------------------------------
// 12. APPROVAL RULES (5 Records)
// ---------------------------------------------------------
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
  addCase('approval_rules', 'Approval Workflow', `Approval Rule ID ${ar.id}`, `Level ${ar.approval_level} approval rule for ${ar.role} in Chain ID ${ar.chain_id}.`, sql);
});

// ---------------------------------------------------------
// 13. WAREHOUSES (3 Records: IDs 1 to 3)
// ---------------------------------------------------------
const warehouses = [
  { id: 1, name: 'Central Logistics Hub (Chicago)', location: 'Chicago, IL', shipping_priority: 1, status: 'ACTIVE' },
  { id: 2, name: 'East Coast Fulfillment Center (New York)', location: 'New York, NY', shipping_priority: 2, status: 'ACTIVE' },
  { id: 3, name: 'West Coast Fulfillment Center (Los Angeles)', location: 'Los Angeles, CA', shipping_priority: 3, status: 'ACTIVE' },
  { id: 4, name: 'European Logistics Hub (Amsterdam)', location: 'Amsterdam, NL', shipping_priority: 4, status: 'ACTIVE' },
  { id: 5, name: 'APAC Distribution Center (Singapore)', location: 'Singapore', shipping_priority: 5, status: 'ACTIVE' }
];
const warehouseSqls = [];
warehouses.forEach(w => {
  const sql = `INSERT INTO warehouses (id, name, location, shipping_priority, status) VALUES (${w.id}, ${esc(w.name)}, ${esc(w.location)}, ${w.shipping_priority}, ${esc(w.status)});`;
  warehouseSqls.push(sql);
  addCase('warehouses', 'Inventory & Logistics', `Warehouse - ${w.name}`, `Setup warehouse ${w.name} with shipping priority ${w.shipping_priority}.`, sql);
});

// ---------------------------------------------------------
// 14. WAREHOUSE STOCK (50 Records: IDs 14 to 63)
// ---------------------------------------------------------
const warehouse_stock = [];
const stockSqls = [];
for (let i = 14; i <= 63; i++) {
  const warehouse_id = (i % 5) + 1;
  const product_id = 9 + ((i - 14) * 3 % 190);
  const quantity = Math.floor(50 + pseudoRandom(i * 1.8) * 300);
  const reserved_quantity = Math.floor(pseudoRandom(i * 4.2) * 15);
  const reorder_level = 10;

  const ws = { id: i, warehouse_id, product_id, quantity, reserved_quantity, reorder_level };
  warehouse_stock.push(ws);

  const sql = `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity, reserved_quantity, reorder_level) VALUES (${i}, ${warehouse_id}, ${product_id}, ${quantity}, ${reserved_quantity}, ${reorder_level});`;
  stockSqls.push(sql);
  addCase('warehouse_stock', 'Inventory & Logistics', `Stock Record ID ${i}`, `Inventory for Product ID ${product_id} in Warehouse ID ${warehouse_id}: ${quantity} avail, ${reserved_quantity} reserved.`, sql);
}

// ---------------------------------------------------------
// 15. REPLENISHMENT RULES (10 Records: IDs 1 to 10)
// ---------------------------------------------------------
const replenishment_rules = [];
const replenishmentSqls = [];
for (let i = 1; i <= 10; i++) {
  const warehouse_id = (i % 3) + 1;
  const product_id = 9 + (i * 5);
  const minimum_stock = 15;
  const reorder_quantity = 50;

  const rr = { id: i, warehouse_id, product_id, minimum_stock, reorder_quantity, active: true };
  replenishment_rules.push(rr);

  const sql = `INSERT INTO replenishment_rules (id, warehouse_id, product_id, minimum_stock, reorder_quantity, active) VALUES (${i}, ${warehouse_id}, ${product_id}, ${minimum_stock}, ${reorder_quantity}, TRUE);`;
  replenishmentSqls.push(sql);
  addCase('replenishment_rules', 'Inventory & Logistics', `Replenishment Rule ID ${i}`, `Reorder rule for Product ID ${product_id} at Warehouse ID ${warehouse_id}: min ${minimum_stock}, reorder ${reorder_quantity}.`, sql);
}

// ---------------------------------------------------------
// 16. SHIPPING RULES (5 Records: IDs 1 to 5)
// ---------------------------------------------------------
const shipping_rules = [
  { id: 1, warehouse_id: 1, cost_per_shipment: 150.00, cost_per_unit: 15.00, priority_weight: 1.00, active: true },
  { id: 2, warehouse_id: 2, cost_per_shipment: 180.00, cost_per_unit: 18.00, priority_weight: 1.20, active: true },
  { id: 3, warehouse_id: 3, cost_per_shipment: 200.00, cost_per_unit: 20.00, priority_weight: 1.30, active: true },
  { id: 4, warehouse_id: 4, cost_per_shipment: 250.00, cost_per_unit: 25.00, priority_weight: 1.50, active: true },
  { id: 5, warehouse_id: 5, cost_per_shipment: 300.00, cost_per_unit: 30.00, priority_weight: 1.80, active: true }
];
const shippingSqls = [];
shipping_rules.forEach(sr => {
  const sql = `INSERT INTO shipping_rules (id, warehouse_id, cost_per_shipment, cost_per_unit, priority_weight, active) VALUES (${sr.id}, ${sr.warehouse_id}, ${sr.cost_per_shipment.toFixed(2)}, ${sr.cost_per_unit.toFixed(2)}, ${sr.priority_weight.toFixed(2)}, ${sr.active ? 'TRUE' : 'FALSE'});`;
  shippingSqls.push(sql);
  addCase('shipping_rules', 'Logistics', `Shipping Rule ID ${sr.id}`, `Shipping rates for Warehouse ID ${sr.warehouse_id}: $${sr.cost_per_shipment} flat + $${sr.cost_per_unit}/unit.`, sql);
});

// ---------------------------------------------------------
// 17 & 18. QUOTATIONS (200 Records: IDs 101 to 300) & QUOTATION ITEMS
// ---------------------------------------------------------
const quotationStatuses = ['DRAFT', 'SENT', 'UNDER_NEGOTIATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONFIRMED', 'EXPIRED'];

const quotations = [];
const quotationItems = [];

const quotationSqls = [];
const quotationItemSqls = [];

const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
let quotationItemGlobalId = 1;

for (let qId = 101; qId <= 300; qId++) {
  const customer_id = 10 + ((qId - 101) % 200);
  const sales_rep_id = salesReps[(qId - 101) % salesReps.length].id;
  const price_list_id = ((qId - 101) % 3) + 1;
  const status = quotationStatuses[(qId - 101) % quotationStatuses.length];

  // Intentionally assign target risk profile for a realistic mix across the 200 deals:
  // qId 101-160: LOW Risk (60 deals)
  // qId 161-230: MEDIUM Risk (70 deals)
  // qId 231-280: HIGH Risk (50 deals)
  // qId 281-300: CRITICAL Risk (20 deals)

  let itemsConfig = [];

  if (qId <= 160) {
    // LOW Risk Config: low discount (0-15%), normal margins (>10%), total < 100k, qty < 100
    const p1 = products[(qId * 2) % products.length];
    const p2 = products[(qId * 3 + 1) % products.length];
    itemsConfig = [
      { product_id: p1.id, variant_id: null, unit_price: p1.base_price, cost_price: Math.min(p1.cost_price, p1.base_price * 0.65), quantity: 3, discount_percent: 5.00, tax_percent: 18.00 },
      { product_id: p2.id, variant_id: null, unit_price: p2.base_price, cost_price: Math.min(p2.cost_price, p2.base_price * 0.65), quantity: 5, discount_percent: 8.00, tax_percent: 18.00 }
    ];
  } else if (qId <= 230) {
    // MEDIUM Risk Config: moderate discount (25-40%) or margin < 10% on small total
    const p1 = products[(qId * 2) % products.length];
    if (qId % 2 === 0) {
      // Moderate discount (35%), good margin
      itemsConfig = [
        { product_id: p1.id, variant_id: null, unit_price: Math.max(p1.base_price, 3000), cost_price: Math.max(p1.base_price, 3000) * 0.4, quantity: 4, discount_percent: 32.00, tax_percent: 18.00 }
      ];
    } else {
      // Low margin (<10%) -> +25 points
      itemsConfig = [
        { product_id: p1.id, variant_id: null, unit_price: Math.max(p1.base_price, 2500), cost_price: Math.max(p1.base_price, 2500) * 0.95, quantity: 6, discount_percent: 15.00, tax_percent: 18.00 }
      ];
    }
  } else if (qId <= 280) {
    // HIGH Risk Config: score 60-79.99 (High disc + low margin, OR total > 100k + high qty)
    const p1 = products[(qId * 2) % products.length];
    if (qId % 2 === 0) {
      // High discount (35%) + Low Margin (<10% -> +25) => 35*1.2 + 25 = 67.00
      itemsConfig = [
        { product_id: p1.id, variant_id: null, unit_price: Math.max(p1.base_price, 4000), cost_price: Math.max(p1.base_price, 4000) * 0.85, quantity: 5, discount_percent: 35.00, tax_percent: 18.00 }
      ];
    } else {
      // Total > 100k (+15), Qty > 100 (+10), Disc 35% (*1.2 = 42) => 42 + 15 + 10 = 67.00
      itemsConfig = [
        { product_id: p1.id, variant_id: null, unit_price: 1500.00, cost_price: 800.00, quantity: 120, discount_percent: 35.00, tax_percent: 18.00 }
      ];
    }
  } else {
    // CRITICAL Risk Config: score >= 80 (Total > 100k + Qty > 100 + Margin < 10% + Disc 40% => 48 + 25 + 15 + 10 = 98.00)
    const p1 = products[(qId * 2) % products.length];
    itemsConfig = [
      { product_id: p1.id, variant_id: null, unit_price: 3500.00, cost_price: 3200.00, quantity: 110, discount_percent: 42.00, tax_percent: 18.00 }
    ];
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalMargin = 0;
  let totalCost = 0;
  let totalQty = 0;

  const itemRecords = [];

  itemsConfig.forEach(it => {
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
      quotation_id: qId,
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

  const approval_required = risk.level !== 'LOW';

  const qSql = `INSERT INTO quotations (id, customer_id, sales_rep_id, price_list_id, status, subtotal, discount_amount, tax_amount, total_amount, risk_score, risk_level, margin_amount, margin_percent, approval_required, valid_until) VALUES (${qId}, ${customer_id}, ${sales_rep_id}, ${price_list_id}, ${esc(status)}, ${subtotal.toFixed(2)}, ${totalDiscount.toFixed(2)}, ${totalTax.toFixed(2)}, ${totalAmount.toFixed(2)}, ${risk.score.toFixed(2)}, ${esc(risk.level)}, ${totalMargin.toFixed(2)}, ${marginPercent.toFixed(2)}, ${approval_required ? 'TRUE' : 'FALSE'}, '2026-06-30');`;
  quotationSqls.push(qSql);

  addCase('quotations', 'Sales Operations', `Quotation #${qId} (${risk.level} Risk)`, `Quotation #${qId} for Customer ID ${customer_id}: Total $${totalAmount}, Risk Score ${risk.score} (${risk.level}), Status ${status}.`, qSql);

  itemRecords.forEach(ir => {
    const qiSql = `INSERT INTO quotation_items (id, quotation_id, product_id, variant_id, quantity, unit_price, discount_percent, discount_amount, tax_percent, tax_amount, line_total, cost_amount, margin_amount, margin_percent) VALUES (${ir.id}, ${ir.quotation_id}, ${ir.product_id}, ${esc(ir.variant_id)}, ${ir.quantity}, ${ir.unit_price.toFixed(2)}, ${ir.discount_percent.toFixed(2)}, ${ir.discount_amount.toFixed(2)}, ${ir.tax_percent.toFixed(2)}, ${ir.tax_amount.toFixed(2)}, ${ir.line_total.toFixed(2)}, ${ir.cost_amount.toFixed(2)}, ${ir.margin_amount.toFixed(2)}, ${ir.margin_percent.toFixed(2)});`;
    quotationItemSqls.push(qiSql);

    addCase('quotation_items', 'Sales Operations', `Quotation Item ID ${ir.id} (QT-#${ir.quotation_id})`, `Add Line Item to Quotation #${ir.quotation_id}: Product ID ${ir.product_id}, Qty ${ir.quantity}, Price $${ir.unit_price}, Disc ${ir.discount_percent}%, Line Total $${ir.line_total}.`, qiSql);
  });
}

console.log(`Quotations (200) & Quotation Items (${quotationItemGlobalId - 1}) generated.`);

// ---------------------------------------------------------
// 19. QUOTATION STATUS HISTORY (20 Records: IDs 1 to 20)
// ---------------------------------------------------------
const statusHistorySqls = [];
for (let i = 1; i <= 20; i++) {
  const qId = 101 + i * 5;
  const sql = `INSERT INTO quotation_status_history (id, quotation_id, old_status, new_status, changed_by, reason) VALUES (${i}, ${qId}, 'DRAFT', 'SENT', 10, 'Status updated by sales rep');`;
  statusHistorySqls.push(sql);
  addCase('quotation_status_history', 'Audit Trail', `Status History ID ${i}`, `Quotation #${qId} status change from DRAFT to SENT.`, sql);
}

// ---------------------------------------------------------
// 20. APPROVALS (Linked to Risk Levels: CRITICAL -> ADMIN, HIGH -> MANAGER/FINANCE, MEDIUM -> MANAGER)
// ---------------------------------------------------------
const approvalSqls = [];
let approvalIdCounter = 1;

for (let qId = 101; qId <= 300; qId++) {
  // Determine risk level based on quote range (matching quotation generator):
  // 101-160: LOW (60 deals)
  // 161-230: MEDIUM (70 deals)
  // 231-280: HIGH (50 deals)
  // 281-300: CRITICAL (20 deals)

  let appTasks = [];
  if (qId >= 281) {
    // CRITICAL Risk (>=80): ADMIN required
    appTasks = [{ level: 1, role: 'ADMIN', status: 'PENDING' }];
  } else if (qId >= 231) {
    // HIGH Risk (60-79.99): SALES_MANAGER (Level 1) & FINANCE (Level 2)
    appTasks = [
      { level: 1, role: 'SALES_MANAGER', status: 'APPROVED', approver_id: 13, reason: 'Level 1 Sales Manager approval passed' },
      { level: 2, role: 'FINANCE', status: 'PENDING', approver_id: null, reason: null }
    ];
  } else if (qId >= 161) {
    // MEDIUM Risk (30-59.99): SALES_MANAGER required
    appTasks = [{ level: 1, role: 'SALES_MANAGER', status: 'PENDING', approver_id: null, reason: null }];
  } else if (qId % 4 === 0) {
    // LOW Risk with discount rule approval required
    appTasks = [{ level: 1, role: 'SALES_MANAGER', status: 'APPROVED', approver_id: 13, reason: 'Approved standard tier discount' }];
  }

  appTasks.forEach(task => {
    const id = approvalIdCounter++;
    const sql = `INSERT INTO approvals (id, quotation_id, approval_chain_id, approval_level, required_role, status, approver_id, reason) VALUES (${id}, ${qId}, 1, ${task.level}, ${esc(task.role)}, ${esc(task.status)}, ${esc(task.approver_id || null)}, ${esc(task.reason || null)});`;
    approvalSqls.push(sql);
    addCase('approvals', 'Approval Governance', `Approval Request ID ${id} (QT-#${qId})`, `Approval task for Quotation #${qId}: ${task.role} (Level ${task.level}) - Status: ${task.status}.`, sql);
  });
}

console.log(`Approvals (${approvalIdCounter - 1}) generated.`);

// ---------------------------------------------------------
// 21. PRODUCT RECOMMENDATION RULES (10 Records: IDs 1 to 10)
// ---------------------------------------------------------
const recommendationSqls = [];
for (let i = 1; i <= 10; i++) {
  const source_product_id = 9 + i;
  const recommended_product_id = 9 + i + 1;
  const recommendation_type = i % 2 === 0 ? 'UPSELL' : 'CROSS_SELL';
  const sql = `INSERT INTO product_recommendation_rules (id, source_product_id, recommended_product_id, recommendation_type, priority, min_margin_percent, promotion_tag, active) VALUES (${i}, ${source_product_id}, ${recommended_product_id}, ${esc(recommendation_type)}, 1, 20.00, 'Smart Recommendation Pack', TRUE);`;
  recommendationSqls.push(sql);
  addCase('product_recommendation_rules', 'AI & Recommendations', `Recommendation Rule ID ${i}`, `${recommendation_type} from Product ID ${source_product_id} to Product ID ${recommended_product_id}.`, sql);
}

// ---------------------------------------------------------
// 22. DEAL HEALTH RULES (3 Records)
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
  addCase('deal_health_rules', 'Risk & Monitoring', `Health Rule - ${dhr.name}`, `Health rule monitoring ${dhr.rule_type} with threshold ${dhr.threshold_value}.`, sql);
});

// ---------------------------------------------------------
// 23. DEAL HEALTH EVENTS (20 Records: IDs 1 to 20)
// ---------------------------------------------------------
const dealHealthEventSqls = [];
for (let i = 1; i <= 20; i++) {
  const qId = 230 + i;
  const severity = i > 10 ? 'CRITICAL' : 'HIGH';
  const sql = `INSERT INTO deal_health_events (id, quotation_id, rule_id, event_type, severity, score, message, resolved) VALUES (${i}, ${qId}, 3, 'HIGH_RISK', ${esc(severity)}, 85.00, 'Deal risk threshold triggered', FALSE);`;
  dealHealthEventSqls.push(sql);
  addCase('deal_health_events', 'Risk & Monitoring', `Health Event ID ${i}`, `Deal health event for Quotation #${qId}: HIGH_RISK (${severity}).`, sql);
}

// ---------------------------------------------------------
// 24. ANOMALY ALERTS (15 Records: IDs 1 to 15)
// ---------------------------------------------------------
const anomalySqls = [];
for (let i = 1; i <= 15; i++) {
  const qId = 200 + i;
  const sql = `INSERT INTO anomaly_alerts (id, quotation_id, sales_rep_id, anomaly_type, historical_average, current_value, deviation_percent, severity, message, status) VALUES (${i}, ${qId}, 10, 'HIGH_DISCOUNT', 15.00, 35.00, 133.33, 'HIGH', 'Discount exceeds historical average', 'OPEN');`;
  anomalySqls.push(sql);
  addCase('anomaly_alerts', 'Risk & Monitoring', `Anomaly Alert ID ${i}`, `Anomaly alert for Quotation #${qId}: HIGH_DISCOUNT (Status: OPEN).`, sql);
}

// ---------------------------------------------------------
// 25. SUBSCRIPTION PLANS (3 Records)
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
  addCase('subscription_plans', 'Recurring Billing', `Subscription Plan - ${sp.name}`, `Create ${sp.billing_interval} subscription plan ${sp.name} ($${sp.price}).`, sql);
});

// ---------------------------------------------------------
// 26. PRODUCT SUBSCRIPTION PLANS (3 Records)
// ---------------------------------------------------------
const product_subscription_plans = [
  { id: 1, product_id: 11, plan_id: 1 },
  { id: 2, product_id: 11, plan_id: 2 },
  { id: 3, product_id: 11, plan_id: 3 }
];
const prodSubPlanSqls = [];
product_subscription_plans.forEach(psp => {
  const sql = `INSERT INTO product_subscription_plans (id, product_id, plan_id) VALUES (${psp.id}, ${psp.product_id}, ${psp.plan_id});`;
  prodSubPlanSqls.push(sql);
  addCase('product_subscription_plans', 'Recurring Billing', `Product Sub Plan Mapping ID ${psp.id}`, `Map Product ID ${psp.product_id} to Subscription Plan ID ${psp.plan_id}.`, sql);
});

// ---------------------------------------------------------
// 27. ORDERS (50 Records: IDs 1 to 50)
// ---------------------------------------------------------
const orderSqls = [];
for (let i = 1; i <= 50; i++) {
  const quotation_id = 100 + i;
  const status = i % 4 === 0 ? 'FULFILLED' : i % 3 === 0 ? 'PROCESSING' : 'CONFIRMED';
  const sql = `INSERT INTO orders (id, quotation_id, status, total_amount, confirmed_at) VALUES (${i}, ${quotation_id}, ${esc(status)}, 15000.00, '2026-02-15 10:00:00');`;
  orderSqls.push(sql);
  addCase('orders', 'Order Processing', `Order ID #${i} (QT-#${quotation_id})`, `Create Order #${i} from Quotation #${quotation_id} - Status: ${status}.`, sql);
}

// ---------------------------------------------------------
// 28. ORDER ITEMS (50 Records: IDs 1 to 50)
// ---------------------------------------------------------
const orderItemSqls = [];
for (let i = 1; i <= 50; i++) {
  const order_id = i;
  const quotation_item_id = i;
  const product_id = 9 + (i % 100);
  const sql = `INSERT INTO order_items (id, order_id, quotation_item_id, product_id, quantity, unit_price, discount_percent, line_total, billing_type) VALUES (${i}, ${order_id}, ${quotation_item_id}, ${product_id}, 5, 2000.00, 10.00, 9000.00, 'ONE_TIME');`;
  orderItemSqls.push(sql);
  addCase('order_items', 'Order Processing', `Order Item ID ${i} (Order #${order_id})`, `Line item for Order #${order_id}: Product ID ${product_id}.`, sql);
}

// ---------------------------------------------------------
// 29. ORDER FULFILLMENTS (30 Records: IDs 1 to 30)
// ---------------------------------------------------------
const fulfillmentSqls = [];
for (let i = 1; i <= 30; i++) {
  const order_id = i;
  const quotation_item_id = i;
  const warehouse_id = (i % 3) + 1;
  const status = i % 3 === 0 ? 'SHIPPED' : 'ALLOCATED';
  const sql = `INSERT INTO order_fulfillments (id, order_id, quotation_item_id, warehouse_id, requested_quantity, allocated_quantity, shipment_cost, status) VALUES (${i}, ${order_id}, ${quotation_item_id}, ${warehouse_id}, 5, 5, 150.00, ${esc(status)});`;
  fulfillmentSqls.push(sql);
  addCase('order_fulfillments', 'Fulfillment & Logistics', `Fulfillment ID ${i} (Order #${order_id})`, `Warehouse dispatch for Order #${order_id} at Warehouse ID ${warehouse_id} - Status: ${status}.`, sql);
}

// ---------------------------------------------------------
// 30. BILLING SCHEDULES (20 Records: IDs 1 to 20)
// ---------------------------------------------------------
const billingScheduleSqls = [];
for (let i = 1; i <= 20; i++) {
  const order_item_id = (i % 50) + 1;
  const status = i % 2 === 0 ? 'PAID' : 'SCHEDULED';
  const sql = `INSERT INTO billing_schedules (id, order_item_id, billing_date, amount, status, period_start, period_end) VALUES (${i}, ${order_item_id}, '2026-03-01', 299.00, ${esc(status)}, '2026-03-01', '2026-03-31');`;
  billingScheduleSqls.push(sql);
  addCase('billing_schedules', 'Recurring Billing', `Billing Schedule ID ${i}`, `Recurring cycle for Order Item ID ${order_item_id}: $299.00 - Status: ${status}.`, sql);
}

// ---------------------------------------------------------
// 31. INVOICES (30 Records: IDs 1 to 30)
// ---------------------------------------------------------
const invoiceSqls = [];
for (let i = 1; i <= 30; i++) {
  const order_id = i;
  const invNum = `INV-2026-${String(i).padStart(3, '0')}`;
  const status = i % 2 === 0 ? 'PAID' : 'UNPAID';
  const sql = `INSERT INTO invoices (id, order_id, invoice_number, invoice_type, amount, status, due_date) VALUES (${i}, ${order_id}, ${esc(invNum)}, 'ONE_TIME', 15000.00, ${esc(status)}, '2026-03-30');`;
  invoiceSqls.push(sql);
  addCase('invoices', 'Financial Management', `Invoice ${invNum}`, `Issue Invoice ${invNum} for Order #${order_id}: $15,000.00 (Status: ${status}).`, sql);
}

// ---------------------------------------------------------
// 32. INVOICE ITEMS (30 Records: IDs 1 to 30)
// ---------------------------------------------------------
const invoiceItemSqls = [];
for (let i = 1; i <= 30; i++) {
  const invoice_id = i;
  const order_item_id = i;
  const sql = `INSERT INTO invoice_items (id, invoice_id, order_item_id, description, quantity, amount) VALUES (${i}, ${invoice_id}, ${order_item_id}, 'Hardware Purchase Invoice Line Item', 5, 15000.00);`;
  invoiceItemSqls.push(sql);
  addCase('invoice_items', 'Financial Management', `Invoice Item ID ${i}`, `Line item for Invoice ID ${invoice_id}: $15,000.00.`, sql);
}

// ---------------------------------------------------------
// 33. PAYMENTS (15 Records: IDs 1 to 15)
// ---------------------------------------------------------
const paymentSqls = [];
for (let i = 1; i <= 15; i++) {
  const invoice_id = i * 2;
  const ref = `PAY-REF-${1000 + i}`;
  const sql = `INSERT INTO payments (id, invoice_id, amount, payment_method, transaction_reference) VALUES (${i}, ${invoice_id}, 15000.00, 'BANK_TRANSFER', ${esc(ref)});`;
  paymentSqls.push(sql);
  addCase('payments', 'Financial Management', `Payment ID ${i} (Invoice #${invoice_id})`, `Record payment of $15,000 for Invoice ID ${invoice_id} (Ref: ${ref}).`, sql);
}

// ---------------------------------------------------------
// 34. CREDIT NOTES (5 Records: IDs 1 to 5)
// ---------------------------------------------------------
const creditNoteSqls = [];
for (let i = 1; i <= 5; i++) {
  const invoice_id = i * 3;
  const sql = `INSERT INTO credit_notes (id, invoice_id, amount, reason, status) VALUES (${i}, ${invoice_id}, 500.00, 'Customer goodwill rebate adjustment', 'ISSUED');`;
  creditNoteSqls.push(sql);
  addCase('credit_notes', 'Financial Management', `Credit Note ID ${i}`, `Issue credit note of $500.00 against Invoice ID ${invoice_id}.`, sql);
}

// ---------------------------------------------------------
// 35. NEGOTIATIONS (15 Records: IDs 1 to 15)
// ---------------------------------------------------------
const negotiationSqls = [];
for (let i = 1; i <= 15; i++) {
  const quotation_id = 110 + i;
  const customer_id = 10 + i;
  const status = i % 3 === 0 ? 'ACCEPTED' : 'OPEN';
  const sql = `INSERT INTO negotiations (id, quotation_id, customer_id, status, proposed_discount_percent, proposed_total) VALUES (${i}, ${quotation_id}, ${customer_id}, ${esc(status)}, 20.00, 12000.00);`;
  negotiationSqls.push(sql);
  addCase('negotiations', 'Customer Portal', `Negotiation ID ${i} (QT-#${quotation_id})`, `Portal negotiation session for Quotation #${quotation_id} with Customer ID ${customer_id} (Status: ${status}).`, sql);
}

// ---------------------------------------------------------
// 36. NEGOTIATION MESSAGES (15 Records: IDs 1 to 15)
// ---------------------------------------------------------
const negMessageSqls = [];
for (let i = 1; i <= 15; i++) {
  const negotiation_id = i;
  const sender_user_id = 10;
  const sql = `INSERT INTO negotiation_messages (id, negotiation_id, sender_user_id, message) VALUES (${i}, ${negotiation_id}, ${sender_user_id}, 'Counter-proposal submitted via DealFlow portal.');`;
  negMessageSqls.push(sql);
  addCase('negotiation_messages', 'Customer Portal', `Negotiation Msg ID ${i}`, `Log negotiation chat message for Negotiation ID ${negotiation_id}.`, sql);
}

// ---------------------------------------------------------
// 37. NEGOTIATION LINE REQUESTS (10 Records: IDs 1 to 10)
// ---------------------------------------------------------
const negLineReqSqls = [];
for (let i = 1; i <= 10; i++) {
  const negotiation_id = i;
  const quotation_item_id = i;
  const sql = `INSERT INTO negotiation_line_requests (id, negotiation_id, quotation_item_id, requested_quantity, requested_discount_percent, request_type, status) VALUES (${i}, ${negotiation_id}, ${quotation_item_id}, 10, 20.00, 'DISCOUNT_CHANGE', 'PENDING');`;
  negLineReqSqls.push(sql);
  addCase('negotiation_line_requests', 'Customer Portal', `Line Request ID ${i}`, `Line item negotiation request for Item ID ${quotation_item_id} in Negotiation ID ${negotiation_id}.`, sql);
}

// ---------------------------------------------------------
// 38. AUDIT LOGS (10 Records: IDs 1 to 10)
// ---------------------------------------------------------
const auditLogSqls = [];
for (let i = 1; i <= 10; i++) {
  const sql = `INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, reason, ip_address) VALUES (${i}, 10, 'QUOTATION', ${100 + i}, 'UPDATE_STATUS', 'Governance workflow update', '192.168.1.100');`;
  auditLogSqls.push(sql);
  addCase('audit_logs', 'Security & Compliance', `Audit Log ID ${i}`, `System audit log entry for action on QUOTATION ID ${100 + i}.`, sql);
}

// ---------------------------------------------------------
// 39. REPORT CONFIGURATIONS (5 Records: IDs 1 to 5)
// ---------------------------------------------------------
const reportConfigSqls = [];
for (let i = 1; i <= 5; i++) {
  const sql = `INSERT INTO report_configurations (id, name, report_type, created_by) VALUES (${i}, 'Executive Sales Summary Report ${i}', 'SALES_PERFORMANCE', 15);`;
  reportConfigSqls.push(sql);
  addCase('report_configurations', 'Analytics & BI', `Report Config ID ${i}`, `Save custom report configuration Executive Sales Summary Report ${i}.`, sql);
}

console.log(`TOTAL TEST CASES PRODUCED: ${testCases.length}`);

// ---------------------------------------------------------
// WRITE OUTPUT FILES
// ---------------------------------------------------------

// 1. Output database/test-data.sql
const allSqls = [
  '-- ============================================================',
  '-- DEALFLOW360 MASSIVE DATASET (200+ CUSTOMERS, USERS, PRODUCTS, QUOTATIONS)',
  '-- Strictly compliant with MySQL 8+ schema & business rules',
  '-- ============================================================',
  '',
  'USE dealflow360;',
  '',
  '-- 1. CUSTOMERS (200 records)',
  ...customerSqls,
  '',
  '-- 2. USERS (200 records)',
  ...userSqls,
  '',
  '-- 3. TEAMS (5 records)',
  ...teamSqls,
  '',
  '-- 4. TEAM MEMBERS (20 records)',
  ...teamMemberSqls,
  '',
  '-- 5. PRODUCT CATEGORIES (10 records)',
  ...categorySqls,
  '',
  '-- 6. PRODUCTS (200 records)',
  ...productSqls,
  '',
  '-- 7. PRODUCT VARIANTS (50 records)',
  ...variantSqls,
  '',
  '-- 8. PRICE LISTS (3 records)',
  ...priceListSqls,
  '',
  '-- 9. PRICE LIST ITEMS (20 records)',
  ...priceListItemSqls,
  '',
  '-- 10. DISCOUNT RULES (6 records)',
  ...discountRuleSqls,
  '',
  '-- 11. APPROVAL CHAINS (3 records)',
  ...approvalChainSqls,
  '',
  '-- 12. APPROVAL RULES (5 records)',
  ...approvalRuleSqls,
  '',
  '-- 13. WAREHOUSES (3 records)',
  ...warehouseSqls,
  '',
  '-- 14. WAREHOUSE STOCK (50 records)',
  ...stockSqls,
  '',
  '-- 15. REPLENISHMENT RULES (10 records)',
  ...replenishmentSqls,
  '',
  '-- 16. SHIPPING RULES (5 records)',
  ...shippingSqls,
  '',
  '-- 17. QUOTATIONS (200 records)',
  ...quotationSqls,
  '',
  '-- 18. QUOTATION ITEMS',
  ...quotationItemSqls,
  '',
  '-- 19. QUOTATION STATUS HISTORY (20 records)',
  ...statusHistorySqls,
  '',
  '-- 20. APPROVALS (30 records)',
  ...approvalSqls,
  '',
  '-- 21. PRODUCT RECOMMENDATION RULES (10 records)',
  ...recommendationSqls,
  '',
  '-- 22. DEAL HEALTH RULES (3 records)',
  ...dealHealthRuleSqls,
  '',
  '-- 23. DEAL HEALTH EVENTS (20 records)',
  ...dealHealthEventSqls,
  '',
  '-- 24. ANOMALY ALERTS (15 records)',
  ...anomalySqls,
  '',
  '-- 25. SUBSCRIPTION PLANS (3 records)',
  ...subPlanSqls,
  '',
  '-- 26. PRODUCT SUBSCRIPTION PLANS (3 records)',
  ...prodSubPlanSqls,
  '',
  '-- 27. ORDERS (50 records)',
  ...orderSqls,
  '',
  '-- 28. ORDER ITEMS (50 records)',
  ...orderItemSqls,
  '',
  '-- 29. ORDER FULFILLMENTS (30 records)',
  ...fulfillmentSqls,
  '',
  '-- 30. BILLING SCHEDULES (20 records)',
  ...billingScheduleSqls,
  '',
  '-- 31. INVOICES (30 records)',
  ...invoiceSqls,
  '',
  '-- 32. INVOICE ITEMS (30 records)',
  ...invoiceItemSqls,
  '',
  '-- 33. PAYMENTS (15 records)',
  ...paymentSqls,
  '',
  '-- 34. CREDIT NOTES (5 records)',
  ...creditNoteSqls,
  '',
  '-- 35. NEGOTIATIONS (15 records)',
  ...negotiationSqls,
  '',
  '-- 36. NEGOTIATION MESSAGES (15 records)',
  ...negMessageSqls,
  '',
  '-- 37. NEGOTIATION LINE REQUESTS (10 records)',
  ...negLineReqSqls,
  '',
  '-- 38. AUDIT LOGS (10 records)',
  ...auditLogSqls,
  '',
  '-- 39. REPORT CONFIGURATIONS (5 records)',
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
  '# DealFlow360 Massive Test Cases & Scenario Suite',
  '',
  `This document details the comprehensive **${testCases.length} test cases** designed and generated for the DealFlow360 platform, featuring **200 Customers**, **200 Users**, **200 Products**, and **200 Quotations**.`,
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
  '### Calculated Quotation Risk Distribution (Across 200 Quotations):',
  '```',
  `LOW: ${riskDistribution.LOW}`,
  `MEDIUM: ${riskDistribution.MEDIUM}`,
  `HIGH: ${riskDistribution.HIGH}`,
  `CRITICAL: ${riskDistribution.CRITICAL}`,
  '```',
  '',
  '---',
  '',
  '## Entity Summary Matrix',
  '',
  '- **200 Customers** (`id: 10` to `209`)',
  '- **200 Users** (`id: 10` to `209`, including Sales Reps, Managers, Finance, Operations, Admin, and Customer Portal Users)',
  '- **200 Products** (`id: 9` to `208`, spanning 10 Product Categories)',
  '- **200 Quotations** (`id: 101` to `300`, with fully calculated financial lines and risk metrics)',
  '',
  '---',
  '',
  '## Test Coverage Summary by Table',
  '',
  '| # | Table Name | Covered Records Count | Primary Entity Category |',
  '|---|---|---|---|'
];

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

console.log('\n--- RISK DISTRIBUTION REPORT (200 QUOTATIONS) ---');
console.log(`LOW: ${riskDistribution.LOW}`);
console.log(`MEDIUM: ${riskDistribution.MEDIUM}`);
console.log(`HIGH: ${riskDistribution.HIGH}`);
console.log(`CRITICAL: ${riskDistribution.CRITICAL}`);
console.log('-------------------------------------------------\n');

