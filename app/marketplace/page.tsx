import { getProducts, getManufacturers, getProductTypes } from "../actions/products";
import MarketplaceClient from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const [products, manufacturers, productTypes] = await Promise.all([
    getProducts(),
    getManufacturers(),
    getProductTypes(),
  ]);

  return (
    <MarketplaceClient
      products={products}
      manufacturers={manufacturers}
      productTypes={productTypes}
    />
  );
}
