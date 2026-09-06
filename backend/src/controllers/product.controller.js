const service = require("../services/product.service");
const { query } = require("../config/db");
const { success, failure } = require("../utils/response");

async function getValidCategoryId(catId) {
  if (catId) {
    const valid = await query("SELECT id FROM product_categories WHERE id = ?", [catId]);
    if (valid[0]) return valid[0].id;
  }
  const first = await query("SELECT id FROM product_categories WHERE status = 'ACTIVE' ORDER BY id LIMIT 1");
  return first[0] ? first[0].id : 7;
}

async function create(req, res, next) {
  try {
    const category_id = await getValidCategoryId(req.body.category_id);
    const data = {
      category_id,
      name: req.body.name,
      sku: req.body.sku || `SKU-${Date.now()}`,
      base_price: Number(req.body.base_price || 0),
      cost_price: Number(req.body.cost_price || 0),
      description: req.body.description || null,
      unit: req.body.unit || 'UNIT',
      tax_percent: Number(req.body.tax_percent || 18.00),
      billing_type: req.body.billing_type || 'ONE_TIME',
      status: req.body.status || 'ACTIVE'
    };

    if (!data.name) return failure(res, "Product name is required");

    return success(res, await service.create(data), 201);
  } catch (e) {
    next(e);
  }
}

async function bulkImport(req, res, next) {
  try {
    const items = req.body.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return failure(res, "No items provided for import");
    }

    const defaultCategoryId = await getValidCategoryId(null);
    const imported = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name) continue;

      const category_id = await getValidCategoryId(item.category_id || defaultCategoryId);
      const data = {
        category_id,
        name: item.name,
        sku: item.sku || `SKU-${Date.now()}-${i}`,
        base_price: Number(item.base_price || item.price || 0),
        cost_price: Number(item.cost_price || item.cost || 0),
        description: item.description || null,
        unit: item.unit || 'UNIT',
        tax_percent: 18.00,
        billing_type: 'ONE_TIME',
        status: 'ACTIVE'
      };

      const created = await service.create(data);
      imported.push(created);
    }

    return success(res, { count: imported.length, items: imported }, 201);
  } catch (e) {
    next(e);
  }
}
async function list(req, res, next) {
  try {
    return success(res, await service.list(req.query));
  } catch (e) {
    next(e);
  }
}
async function get(req, res, next) {
  try {
    const row = await service.findById(req.params.id);
    return row ? success(res, row) : failure(res, "Product not found", 404);
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const row = await service.update(req.params.id, req.body);
    return row ? success(res, row) : failure(res, "Product not found", 404);
  } catch (e) {
    next(e);
  }
}
async function remove(req, res, next) {
  try {
    return success(res, { deleted: await service.remove(req.params.id) });
  } catch (e) {
    next(e);
  }
}
module.exports = { create, bulkImport, list, get, update, remove };
