// Retain historical values in storage while omitting the retired product-cost field.
export function withoutProductCost<T extends { cost: number }>(product: T): Omit<T, "cost"> {
  const { cost: _cost, ...result } = product;
  return result;
}
