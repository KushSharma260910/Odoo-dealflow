require('dotenv').config({ path: 'backend/.env' });
const mysql = require('mysql2/promise');

async function createTestDeal() {
    const c = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dealflow360'
    });

    console.log('🚀 Generating Automated Test Deal...');

    // 1. Fetch random Customer, Sales Rep, Products
    const [customers] = await c.execute('SELECT id, name, tier FROM customers LIMIT 5');
    const [reps] = await c.execute("SELECT id, name FROM users WHERE role = 'SALES_REP' LIMIT 5");
    const [products] = await c.execute('SELECT id, name, sku, base_price FROM products LIMIT 5');

    if (!customers.length || !reps.length || !products.length) {
        console.error('❌ Missing master data. Please seed database first.');
        await c.end();
        return;
    }

    const customer = customers[Math.floor(Math.random() * customers.length)];
    const rep = reps[Math.floor(Math.random() * reps.length)];

    // 2. Create Quotation Draft
    const [qResult] = await c.execute(
        "INSERT INTO quotations (customer_id, sales_rep_id, status, valid_until) VALUES (?, ?, 'DRAFT', DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY))",
        [customer.id, rep.id]
    );

    const quoteId = qResult.insertId;
    console.log(`✅ Created Quotation #QT-${quoteId} for Customer '${customer.name}' by Sales Rep '${rep.name}'`);

    // 3. Add 2 Random Products as Line Items
    let subtotal = 0;
    let totalDiscount = 0;

    for (let i = 0; i < 2; i++) {
        const prod = products[i % products.length];
        const qty = Math.floor(Math.random() * 5) + 1;
        const discountPct = Math.floor(Math.random() * 15) + 5; // 5% - 20%

        const unitPrice = Number(prod.base_price);
        const gross = unitPrice * qty;
        const discAmt = (gross * discountPct) / 100;
        const taxAmt = ((gross - discAmt) * 18) / 100;
        const lineTotal = gross - discAmt + taxAmt;

        subtotal += gross;
        totalDiscount += discAmt;

        await c.execute(
            `INSERT INTO quotation_items 
            (quotation_id, product_id, quantity, unit_price, discount_percent, discount_amount, tax_percent, tax_amount, line_total)
             VALUES (?, ?, ?, ?, ?, ?, 18.00, ?, ?)`,
            [quoteId, prod.id, qty, unitPrice, discountPct, discAmt, taxAmt, lineTotal]
        );

        console.log(`   + Added Line Item: ${qty}x '${prod.name}' @ $${unitPrice} (Discount: ${discountPct}%) -> Line Total: $${lineTotal.toFixed(2)}`);
    }

    // 4. Update Quotation Totals & Calculate Risk
    const totalAmount = subtotal - totalDiscount + (subtotal - totalDiscount) * 0.18;
    const discountRate = (totalDiscount * 100) / subtotal;
    let riskScore = Math.min(100, Math.round(discountRate * 1.2 + (totalAmount > 100000 ? 15 : 0) + 10));
    let riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

    await c.execute(
        `UPDATE quotations SET subtotal = ?, discount_amount = ?, tax_amount = ?, total_amount = ?, risk_score = ?, risk_level = ? WHERE id = ?`,
        [subtotal, totalDiscount, (subtotal - totalDiscount) * 0.18, totalAmount, riskScore, riskLevel, quoteId]
    );

    console.log(`\n🎉 Test Deal #QT-${quoteId} Complete!`);
    console.log(`   Subtotal: $${subtotal.toFixed(2)} | Discount: -$${totalDiscount.toFixed(2)} | Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`   Risk Score: ${riskScore}/100 (${riskLevel})`);
    console.log(`\n💡 View this deal in your browser at: http://localhost:3000/sales/quotations/${quoteId}`);

    await c.end();
}

createTestDeal().catch(console.error);
