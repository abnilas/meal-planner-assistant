import type { Product } from "@/schemas";

export function getStoreItems(products: Product[]) {
  const normalize = (s: string) =>
    ["ah", "albert heijn"].includes(s.toLowerCase().trim()) ? "Albert Heijn" : s;

  return Object.entries(
    products.reduce<Record<string, number>>((acc, { store, price }) => {
      const key = normalize(store);
      acc[key] = (acc[key] ?? 0) + price;
      return acc;
    }, {})
  ).map(([store, totalPrice]) => ({ store, totalPrice: Math.round(totalPrice * 100) / 100 }));
}