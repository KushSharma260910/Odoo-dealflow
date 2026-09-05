-- ============================================================
-- DEALFLOW360 SEED DATA
-- Sample Catalog, Stock, Warehouses, and Rules
-- ============================================================

USE dealflow360;

-- 1. PRODUCT CATEGORIES
INSERT INTO product_categories (id, name, description, status) VALUES
(1, 'Laptops & Workstations', 'High-performance laptops and mobile workstations', 'ACTIVE'),
(2, 'Enterprise Servers', 'Rackmount servers and datacenter infrastructure', 'ACTIVE'),
(3, 'Cloud & SaaS Subscriptions', 'Recurring software licenses and cloud services', 'ACTIVE'),
(4, 'Networking Equipment', 'Enterprise switches, routers, and firewalls', 'ACTIVE'),
(5, 'Monitors & Peripherals', 'Displays, docks, and input accessories', 'ACTIVE'),
(6, 'Support & Services', 'Professional implementation and 24/7 maintenance', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. PRODUCTS
INSERT INTO products (id, category_id, name, sku, description, unit, base_price, cost_price, tax_percent, billing_type, status) VALUES
(1, 1, 'Dell XPS 15 Workstation', 'DELL-XPS-15', 'Intel i9, 32GB RAM, 1TB SSD, RTX 4060 GPU', 'UNIT', 1899.00, 1350.00, 18.00, 'ONE_TIME', 'ACTIVE'),
(2, 1, 'MacBook Pro 16" M3 Max', 'MBP-16-M3', 'Apple M3 Max 16-core CPU, 36GB Memory, 1TB SSD', 'UNIT', 2499.00, 1900.00, 18.00, 'ONE_TIME', 'ACTIVE'),
(3, 2, 'Dell PowerEdge R750 Server', 'PE-R750-SRV', 'Dual Intel Xeon Gold 6330, 128GB ECC RAM, 8x 1.92TB SSD', 'UNIT', 4850.00, 3400.00, 18.00, 'ONE_TIME', 'ACTIVE'),
(4, 3, 'DealFlow Enterprise Cloud Suite', 'SAAS-ENT-SUB', 'Enterprise Sales Operations SaaS Platform License per user', 'USER/MO', 299.00, 45.00, 18.00, 'RECURRING', 'ACTIVE'),
(5, 4, 'Cisco Catalyst 9300 Switch', 'CISCO-CAT-9300', '48-port PoE+ Gigabit managed switch with 10G uplinks', 'UNIT', 3200.00, 2100.00, 18.00, 'ONE_TIME', 'ACTIVE'),
(6, 5, 'Dell UltraSharp 34" Curved Monitor', 'MON-UW-34', 'USB-C Hub Display 3440x1440 60Hz Curved IPS', 'UNIT', 649.00, 420.00, 18.00, 'ONE_TIME', 'ACTIVE'),
(7, 6, '24/7 Platinum Priority Support', 'SUP-247-PLAT', 'Round-the-clock Dedicated Engineer SLA Support', 'MONTH', 499.00, 80.00, 18.00, 'RECURRING', 'ACTIVE'),
(8, 5, 'Thunderbolt 4 Docking Station', 'ACC-TB4-DOCK', '180W Power Delivery Dual 4K Display Dock', 'UNIT', 220.00, 110.00, 18.00, 'ONE_TIME', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), base_price=VALUES(base_price), cost_price=VALUES(cost_price);

-- 3. PRODUCT VARIANTS
INSERT INTO product_variants (id, product_id, attribute_name, attribute_value, extra_price, sku_suffix) VALUES
(1, 1, 'RAM Upgrade', '64GB DDR5', 250.00, '-64GB'),
(2, 1, 'Storage Upgrade', '2TB NVMe SSD', 180.00, '-2TB'),
(3, 2, 'Memory Upgrade', '96GB Unified Memory', 400.00, '-96GB'),
(4, 3, 'Memory Expansion', '256GB ECC RAM', 800.00, '-256RAM')
ON DUPLICATE KEY UPDATE attribute_value=VALUES(attribute_value);

-- 4. WAREHOUSES
INSERT INTO warehouses (id, name, location, shipping_priority, status) VALUES
(1, 'Central Logistics Hub', 'Chicago, IL - Hub 1', 1, 'ACTIVE'),
(2, 'East Coast Fulfillment Center', 'New York, NY - Hub 2', 2, 'ACTIVE'),
(3, 'West Coast Fulfillment Center', 'Los Angeles, CA - Hub 3', 3, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. WAREHOUSE STOCK
INSERT INTO warehouse_stock (warehouse_id, product_id, quantity, reserved_quantity, reorder_level) VALUES
(1, 1, 150, 0, 20),
(1, 2, 80, 0, 15),
(1, 3, 40, 0, 5),
(1, 5, 60, 0, 10),
(1, 6, 200, 0, 25),
(1, 8, 300, 0, 30),
(2, 1, 100, 0, 15),
(2, 2, 50, 0, 10),
(2, 5, 45, 0, 5),
(2, 6, 120, 0, 15),
(3, 1, 90, 0, 10),
(3, 3, 30, 0, 5),
(3, 6, 150, 0, 20)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- 6. DISCOUNT RULES
INSERT INTO discount_rules (id, customer_tier, category_id, max_discount_percent, approval_required_above, active) VALUES
(1, 'BRONZE', NULL, 15.00, 10.00, TRUE),
(2, 'SILVER', NULL, 25.00, 15.00, TRUE),
(3, 'GOLD', NULL, 35.00, 20.00, TRUE)
ON DUPLICATE KEY UPDATE max_discount_percent=VALUES(max_discount_percent);
