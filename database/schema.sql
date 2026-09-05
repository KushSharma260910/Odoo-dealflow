-- ============================================================
-- DEALFLOW360
-- Intelligent, Self-Governing Sales Operations Platform
-- MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS dealflow360;

USE dealflow360;

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    company_name VARCHAR(150),

    tier ENUM(
        'BRONZE',
        'SILVER',
        'GOLD'
    ) NOT NULL DEFAULT 'BRONZE',

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_customer_tier (tier),
    INDEX idx_customer_status (status)
);


-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id INT NULL,

    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM(
        'SALES_REP',
        'SALES_MANAGER',
        'FINANCE',
        'OPERATIONS',
        'ADMIN',
        'CUSTOMER'
    ) NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL,

    INDEX idx_user_role (role),
    INDEX idx_user_customer (customer_id)
);


-- ============================================================
-- 3. TEAMS
-- ============================================================

CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    manager_id INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (manager_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 4. TEAM MEMBERS
-- ============================================================

CREATE TABLE team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,

    team_id INT NOT NULL,
    user_id INT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE (team_id, user_id)
);


-- ============================================================
-- 5. PRODUCT CATEGORIES
-- ============================================================

CREATE TABLE product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(500),

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 6. PRODUCTS
-- ============================================================

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,

    category_id INT NOT NULL,

    name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    unit VARCHAR(30) NOT NULL DEFAULT 'UNIT',

    base_price DECIMAL(12,2) NOT NULL,

    cost_price DECIMAL(12,2) NOT NULL,

    tax_percent DECIMAL(5,2) DEFAULT 0,

    billing_type ENUM(
        'ONE_TIME',
        'RECURRING'
    ) NOT NULL DEFAULT 'ONE_TIME',

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES product_categories(id),

    INDEX idx_product_category (category_id),
    INDEX idx_product_billing_type (billing_type)
);


-- ============================================================
-- 7. PRODUCT VARIANTS
-- ============================================================

CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,

    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,

    extra_price DECIMAL(12,2) DEFAULT 0,

    sku_suffix VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    INDEX idx_variant_product (product_id)
);


-- ============================================================
-- 8. PRICE LISTS
-- ============================================================

CREATE TABLE price_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    customer_tier ENUM(
        'BRONZE',
        'SILVER',
        'GOLD'
    ),

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 9. PRICE LIST ITEMS
-- ============================================================

CREATE TABLE price_list_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    price_list_id INT NOT NULL,
    product_id INT NOT NULL,

    price DECIMAL(12,2) NOT NULL,

    valid_from DATE,
    valid_until DATE,

    FOREIGN KEY (price_list_id)
        REFERENCES price_lists(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE (price_list_id, product_id),

    INDEX idx_price_product (product_id)
);


-- ============================================================
-- 10. DISCOUNT RULES
-- ============================================================

CREATE TABLE discount_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_tier ENUM(
        'BRONZE',
        'SILVER',
        'GOLD'
    ) NOT NULL,

    category_id INT NULL,

    max_discount_percent DECIMAL(5,2) NOT NULL,

    approval_required_above DECIMAL(5,2) NOT NULL,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES product_categories(id)
        ON DELETE CASCADE,

    INDEX idx_discount_tier (customer_tier),
    INDEX idx_discount_category (category_id)
);


-- ============================================================
-- 11. APPROVAL CHAINS
-- ============================================================

CREATE TABLE approval_chains (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    min_risk_score DECIMAL(5,2) DEFAULT 0,
    max_risk_score DECIMAL(5,2) DEFAULT 100,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 12. APPROVAL RULES
-- ============================================================

CREATE TABLE approval_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    chain_id INT NOT NULL,

    approval_level INT NOT NULL,

    role ENUM(
        'SALES_MANAGER',
        'FINANCE',
        'ADMIN'
    ) NOT NULL,

    min_discount_percent DECIMAL(5,2) DEFAULT 0,
    max_discount_percent DECIMAL(5,2) DEFAULT 100,

    min_risk_score DECIMAL(5,2) DEFAULT 0,
    max_risk_score DECIMAL(5,2) DEFAULT 100,

    FOREIGN KEY (chain_id)
        REFERENCES approval_chains(id)
        ON DELETE CASCADE,

    UNIQUE (chain_id, approval_level)
);


-- ============================================================
-- 13. WAREHOUSES
-- ============================================================

CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),

    shipping_priority INT DEFAULT 1,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 14. WAREHOUSE STOCK
-- ============================================================

CREATE TABLE warehouse_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,

    warehouse_id INT NOT NULL,
    product_id INT NOT NULL,

    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,

    reorder_level INT DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE (warehouse_id, product_id),

    INDEX idx_stock_product (product_id),
    INDEX idx_stock_warehouse (warehouse_id)
);


-- ============================================================
-- 15. REPLENISHMENT RULES
-- ============================================================

CREATE TABLE replenishment_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    warehouse_id INT NOT NULL,
    product_id INT NOT NULL,

    minimum_stock INT NOT NULL DEFAULT 0,
    reorder_quantity INT NOT NULL DEFAULT 0,

    active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE (warehouse_id, product_id)
);


-- ============================================================
-- 16. SHIPPING RULES
-- ============================================================

CREATE TABLE shipping_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    warehouse_id INT NOT NULL,

    cost_per_shipment DECIMAL(12,2) DEFAULT 0,
    cost_per_unit DECIMAL(12,2) DEFAULT 0,

    priority_weight DECIMAL(5,2) DEFAULT 1,

    active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 17. QUOTATIONS
-- ============================================================

CREATE TABLE quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id INT NOT NULL,
    sales_rep_id INT NOT NULL,

    price_list_id INT NULL,

    status ENUM(
        'DRAFT',
        'SENT',
        'UNDER_NEGOTIATION',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'CONFIRMED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'DRAFT',

    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,

    risk_score DECIMAL(5,2) DEFAULT 0,

    risk_level ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) DEFAULT 'LOW',

    margin_amount DECIMAL(12,2) DEFAULT 0,
    margin_percent DECIMAL(5,2) DEFAULT 0,

    approval_required BOOLEAN DEFAULT FALSE,

    valid_until DATE NULL,

    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    FOREIGN KEY (sales_rep_id)
        REFERENCES users(id),

    FOREIGN KEY (price_list_id)
        REFERENCES price_lists(id)
        ON DELETE SET NULL,

    INDEX idx_quote_customer (customer_id),
    INDEX idx_quote_sales_rep (sales_rep_id),
    INDEX idx_quote_status (status),
    INDEX idx_quote_risk (risk_level),
    INDEX idx_quote_activity (last_activity_at)
);


-- ============================================================
-- 18. QUOTATION ITEMS
-- ============================================================

CREATE TABLE quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,

    quantity INT NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,

    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,

    line_total DECIMAL(12,2) NOT NULL,

    cost_amount DECIMAL(12,2) DEFAULT 0,
    margin_amount DECIMAL(12,2) DEFAULT 0,
    margin_percent DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id),

    FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL,

    INDEX idx_quote_item_quote (quotation_id),
    INDEX idx_quote_item_product (product_id)
);


-- ============================================================
-- 19. QUOTATION STATUS HISTORY
-- ============================================================

CREATE TABLE quotation_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,

    changed_by INT,

    reason VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 20. APPROVALS
-- ============================================================

CREATE TABLE approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    approval_chain_id INT NULL,

    approval_level INT NOT NULL,

    required_role ENUM(
        'SALES_MANAGER',
        'FINANCE',
        'ADMIN'
    ) NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'RETURNED'
    ) DEFAULT 'PENDING',

    approver_id INT NULL,

    reason VARCHAR(500),

    decided_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (approval_chain_id)
        REFERENCES approval_chains(id)
        ON DELETE SET NULL,

    FOREIGN KEY (approver_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_approval_quote (quotation_id),
    INDEX idx_approval_status (status)
);


-- ============================================================
-- 21. PRODUCT RECOMMENDATION RULES
-- ============================================================

CREATE TABLE product_recommendation_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    source_product_id INT NOT NULL,
    recommended_product_id INT NOT NULL,

    recommendation_type ENUM(
        'UPSELL',
        'CROSS_SELL'
    ) NOT NULL,

    priority INT DEFAULT 1,

    min_margin_percent DECIMAL(5,2) DEFAULT 0,

    promotion_tag VARCHAR(100),

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (source_product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    FOREIGN KEY (recommended_product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    UNIQUE (
        source_product_id,
        recommended_product_id,
        recommendation_type
    )
);


-- ============================================================
-- 22. DEAL HEALTH RULES
-- ============================================================

CREATE TABLE deal_health_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    rule_type ENUM(
        'STALLED_DEAL',
        'DISCOUNT_ANOMALY',
        'DELIVERY_SLIPPAGE',
        'HIGH_RISK'
    ) NOT NULL,

    threshold_value DECIMAL(12,2),

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) DEFAULT 'MEDIUM',

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 23. DEAL HEALTH EVENTS
-- ============================================================

CREATE TABLE deal_health_events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    rule_id INT NULL,

    event_type ENUM(
        'STALLED_DEAL',
        'DISCOUNT_ANOMALY',
        'DELIVERY_SLIPPAGE',
        'HIGH_RISK'
    ) NOT NULL,

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    score DECIMAL(5,2) DEFAULT 0,

    message VARCHAR(500),

    resolved BOOLEAN DEFAULT FALSE,

    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (rule_id)
        REFERENCES deal_health_rules(id)
        ON DELETE SET NULL,

    FOREIGN KEY (resolved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_health_quote (quotation_id),
    INDEX idx_health_resolved (resolved)
);


-- ============================================================
-- 24. ANOMALY ALERTS
-- ============================================================

CREATE TABLE anomaly_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,
    sales_rep_id INT NOT NULL,

    anomaly_type ENUM(
        'HIGH_DISCOUNT',
        'UNUSUAL_MARGIN',
        'UNUSUAL_QUANTITY',
        'UNUSUAL_DEAL_VALUE',
        'DELIVERY_RISK'
    ) NOT NULL,

    historical_average DECIMAL(12,2),
    current_value DECIMAL(12,2),

    deviation_percent DECIMAL(8,2),

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) DEFAULT 'MEDIUM',

    message VARCHAR(500),

    status ENUM(
        'OPEN',
        'ACKNOWLEDGED',
        'RESOLVED'
    ) DEFAULT 'OPEN',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sales_rep_id)
        REFERENCES users(id),

    INDEX idx_anomaly_status (status),
    INDEX idx_anomaly_rep (sales_rep_id)
);


-- ============================================================
-- 25. WAREHOUSE FULFILLMENT
-- ============================================================

CREATE TABLE order_fulfillments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,
    quotation_item_id INT NOT NULL,

    warehouse_id INT NULL,

    requested_quantity INT NOT NULL,
    allocated_quantity INT NOT NULL DEFAULT 0,

    shipment_cost DECIMAL(12,2) DEFAULT 0,

    status ENUM(
        'ALLOCATED',
        'PARTIAL',
        'BACKORDERED',
        'SHIPPED',
        'DELIVERED'
    ) DEFAULT 'ALLOCATED',

    estimated_delivery_date DATE NULL,
    actual_delivery_date DATE NULL,

    manual_override BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_item_id)
        REFERENCES quotation_items(id),

    FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(id),

    INDEX idx_fulfillment_order (order_id),
    INDEX idx_fulfillment_warehouse (warehouse_id)
);


-- ============================================================
-- 26. SUBSCRIPTION PLANS
-- ============================================================

CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    billing_interval ENUM(
        'MONTHLY',
        'QUARTERLY',
        'YEARLY'
    ) NOT NULL,

    price DECIMAL(12,2) NOT NULL,

    trial_days INT DEFAULT 0,

    proration_enabled BOOLEAN DEFAULT TRUE,

    cancellation_refund_enabled BOOLEAN DEFAULT TRUE,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 27. PRODUCT SUBSCRIPTION PLANS
-- ============================================================

CREATE TABLE product_subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,
    plan_id INT NOT NULL,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    FOREIGN KEY (plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE CASCADE,

    UNIQUE (product_id, plan_id)
);


-- ============================================================
-- 28. ORDERS
-- ============================================================

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL UNIQUE,

    status ENUM(
        'CONFIRMED',
        'PROCESSING',
        'PARTIALLY_FULFILLED',
        'FULFILLED',
        'BACKORDERED',
        'CANCELLED'
    ) DEFAULT 'CONFIRMED',

    total_amount DECIMAL(12,2) DEFAULT 0,

    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id),

    INDEX idx_order_status (status)
);


-- ============================================================
-- 29. ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,
    quotation_item_id INT NOT NULL,

    product_id INT NOT NULL,

    quantity INT NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    discount_percent DECIMAL(5,2) DEFAULT 0,

    line_total DECIMAL(12,2) NOT NULL,

    billing_type ENUM(
        'ONE_TIME',
        'RECURRING'
    ) NOT NULL,

    subscription_plan_id INT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (quotation_item_id)
        REFERENCES quotation_items(id),

    FOREIGN KEY (product_id)
        REFERENCES products(id),

    FOREIGN KEY (subscription_plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE SET NULL,

    INDEX idx_order_item_order (order_id)
);


-- ============================================================
-- 30. BILLING SCHEDULES
-- ============================================================

CREATE TABLE billing_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_item_id INT NOT NULL,

    billing_date DATE NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    status ENUM(
        'SCHEDULED',
        'BILLED',
        'PAID',
        'CANCELLED'
    ) DEFAULT 'SCHEDULED',

    period_start DATE,
    period_end DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_item_id)
        REFERENCES order_items(id)
        ON DELETE CASCADE,

    INDEX idx_billing_date (billing_date),
    INDEX idx_billing_status (status)
);


-- ============================================================
-- 31. INVOICES
-- ============================================================

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,

    invoice_number VARCHAR(50) NOT NULL UNIQUE,

    invoice_type ENUM(
        'ONE_TIME',
        'RECURRING',
        'MIXED'
    ) NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    status ENUM(
        'UNPAID',
        'PARTIALLY_PAID',
        'PAID',
        'CANCELLED'
    ) DEFAULT 'UNPAID',

    due_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id),

    INDEX idx_invoice_order (order_id),
    INDEX idx_invoice_status (status)
);


-- ============================================================
-- 32. INVOICE ITEMS
-- ============================================================

CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    invoice_id INT NOT NULL,

    order_item_id INT NOT NULL,

    billing_schedule_id INT NULL,

    description VARCHAR(255),

    quantity INT DEFAULT 1,

    amount DECIMAL(12,2) NOT NULL,

    FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE,

    FOREIGN KEY (order_item_id)
        REFERENCES order_items(id),

    FOREIGN KEY (billing_schedule_id)
        REFERENCES billing_schedules(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 33. PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    invoice_id INT NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    payment_method ENUM(
        'CASH',
        'CARD',
        'BANK_TRANSFER',
        'UPI',
        'OTHER'
    ) DEFAULT 'OTHER',

    transaction_reference VARCHAR(100),

    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id)
        REFERENCES invoices(id),

    INDEX idx_payment_invoice (invoice_id)
);


-- ============================================================
-- 34. CREDIT NOTES
-- ============================================================

CREATE TABLE credit_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    invoice_id INT NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    reason VARCHAR(500),

    status ENUM(
        'PENDING',
        'ISSUED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
);


-- ============================================================
-- 35. NEGOTIATIONS
-- ============================================================

CREATE TABLE negotiations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    customer_id INT NOT NULL,

    status ENUM(
        'OPEN',
        'IN_REVIEW',
        'ACCEPTED',
        'REJECTED',
        'CLOSED'
    ) DEFAULT 'OPEN',

    proposed_discount_percent DECIMAL(5,2),

    proposed_total DECIMAL(12,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    INDEX idx_negotiation_quote (quotation_id),
    INDEX idx_negotiation_status (status)
);


-- ============================================================
-- 36. NEGOTIATION MESSAGES
-- ============================================================

CREATE TABLE negotiation_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    negotiation_id INT NOT NULL,

    sender_user_id INT NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (negotiation_id)
        REFERENCES negotiations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_user_id)
        REFERENCES users(id),

    INDEX idx_negotiation_message (negotiation_id)
);


-- ============================================================
-- 37. NEGOTIATION LINE REQUESTS
-- ============================================================

CREATE TABLE negotiation_line_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    negotiation_id INT NOT NULL,

    quotation_item_id INT NOT NULL,

    requested_quantity INT NULL,

    requested_discount_percent DECIMAL(5,2) NULL,

    request_type ENUM(
        'DISCOUNT_CHANGE',
        'QUANTITY_CHANGE',
        'REMOVE_ITEM',
        'ADD_ITEM',
        'COMMENT'
    ) NOT NULL,

    customer_comment VARCHAR(500),

    status ENUM(
        'PENDING',
        'ACCEPTED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (negotiation_id)
        REFERENCES negotiations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (quotation_item_id)
        REFERENCES quotation_items(id),

    INDEX idx_negotiation_line (negotiation_id)
);


-- ============================================================
-- 38. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,

    action VARCHAR(100) NOT NULL,

    old_value JSON NULL,
    new_value JSON NULL,

    reason VARCHAR(500),

    ip_address VARCHAR(45),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_audit_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at)
);


-- ============================================================
-- 39. REPORT CONFIGURATIONS
-- ============================================================

CREATE TABLE report_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    report_type ENUM(
        'SALES_PERFORMANCE',
        'QUOTATIONS',
        'ORDERS',
        'APPROVALS',
        'PRODUCT_SALES',
        'DISCOUNT_ANALYSIS',
        'DEAL_HEALTH'
    ) NOT NULL,

    created_by INT NOT NULL,

    filters JSON NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
);