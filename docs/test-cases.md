# DealFlow360 Massive Test Cases & Scenario Suite

This document details the comprehensive **1641 test cases** designed and generated for the DealFlow360 platform, featuring **200 Customers**, **200 Users**, **200 Products**, and **200 Quotations**.
Every test case corresponds strictly to the database schema defined in `database/schema.sql`, respects all primary keys, foreign keys, constraints, enums, defaults, and implements the backend risk engine business rules.

---

## Risk Engine Distribution Verification

The risk level for quotations is calculated dynamically using the backend engine formula:
```javascript
let score = discountRate * 1.2 + (marginRate < 10 ? 25 : 0) + (total_amount > 100000 ? 15 : 0) + (quantity > 100 ? 10 : 0);
```
Thresholds:
- **LOW**: Score < 30
- **MEDIUM**: 30 <= Score < 60
- **HIGH**: 60 <= Score < 80
- **CRITICAL**: Score >= 80

### Calculated Quotation Risk Distribution (Across 200 Quotations):
```
LOW: 60
MEDIUM: 70
HIGH: 50
CRITICAL: 20
```

---

## Entity Summary Matrix

- **200 Customers** (`id: 10` to `209`)
- **200 Users** (`id: 10` to `209`, including Sales Reps, Managers, Finance, Operations, Admin, and Customer Portal Users)
- **200 Products** (`id: 9` to `208`, spanning 10 Product Categories)
- **200 Quotations** (`id: 101` to `300`, with fully calculated financial lines and risk metrics)

---

## Test Coverage Summary by Table

| # | Table Name | Covered Records Count | Primary Entity Category |
|---|---|---|---|
| 1 | `customers` | **200** | Master Data |
| 2 | `users` | **200** | Identity & Access |
| 3 | `teams` | **5** | Organization |
| 4 | `team_members` | **20** | Organization |
| 5 | `product_categories` | **10** | Catalog |
| 6 | `products` | **200** | Catalog |
| 7 | `product_variants` | **50** | Catalog |
| 8 | `price_lists` | **3** | Pricing Matrix |
| 9 | `price_list_items` | **20** | Pricing Matrix |
| 10 | `discount_rules` | **6** | Governance Rules |
| 11 | `approval_chains` | **3** | Approval Workflow |
| 12 | `approval_rules` | **5** | Approval Workflow |
| 13 | `warehouses` | **5** | Inventory & Fulfillment |
| 14 | `warehouse_stock` | **50** | Inventory & Fulfillment |
| 15 | `replenishment_rules` | **10** | Inventory & Fulfillment |
| 16 | `shipping_rules` | **5** | Logistics |
| 17 | `quotations` | **200** | Sales Operations |
| 18 | `quotation_items` | **260** | Sales Operations |
| 19 | `quotation_status_history` | **20** | Audit Trail |
| 20 | `approvals` | **30** | Approval Governance |
| 21 | `product_recommendation_rules` | **10** | AI & Recommendations |
| 22 | `deal_health_rules` | **3** | Risk & Monitoring |
| 23 | `deal_health_events` | **20** | Risk & Monitoring |
| 24 | `anomaly_alerts` | **15** | Risk & Monitoring |
| 25 | `subscription_plans` | **3** | Recurring Billing |
| 26 | `product_subscription_plans` | **3** | Recurring Billing |
| 27 | `orders` | **50** | Order Processing |
| 28 | `order_items` | **50** | Order Processing |
| 29 | `order_fulfillments` | **30** | Fulfillment & Logistics |
| 30 | `billing_schedules` | **20** | Recurring Billing |
| 31 | `invoices` | **30** | Financial Management |
| 32 | `invoice_items` | **30** | Financial Management |
| 33 | `payments` | **15** | Financial Management |
| 34 | `credit_notes` | **5** | Financial Management |
| 35 | `negotiations` | **15** | Customer Portal |
| 36 | `negotiation_messages` | **15** | Customer Portal |
| 37 | `negotiation_line_requests` | **10** | Customer Portal |
| 38 | `audit_logs` | **10** | Security & Compliance |
| 39 | `report_configurations` | **5** | Analytics & BI |

**Total Test Cases Count: Exactly 1641**
