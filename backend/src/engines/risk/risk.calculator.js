function calculate(quote, items = []) {
  const discountRate = Number(quote.subtotal)
    ? (Number(quote.discount_amount || 0) * 100) / Number(quote.subtotal)
    : 0;
  const marginRate = Number(quote.subtotal)
    ? (Number(quote.margin_amount || 0) * 100) / Number(quote.subtotal)
    : 0;
  const quantity = items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
  let score =
    discountRate * 1.2 +
    (marginRate < 10 ? 25 : 0) +
    (Number(quote.total_amount) > 100000 ? 15 : 0) +
    (quantity > 100 ? 10 : 0);
  return {
    score: Math.min(100, Math.round(score * 100) / 100),
    discount_rate: discountRate,
    margin_rate: marginRate,
    quantity,
  };
}
module.exports = { calculate };
