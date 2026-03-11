"use server";

import { prisma } from "@/lib/db";

export interface ProductData {
  id: number;
  name: string;
  sku: string;
  product_type: string;
  manufacturer: string;
  warranty: string | null;
  scraped_url: string | null;
  server?: {
    cpu_model: string | null;
    cpu_cores: number | null;
    cpu_frequency: string | null;
    cpu_socket: string | null;
    ram_gb: number | null;
    ram_type: string | null;
    ram_max_gb: number | null;
    storage_capacity: string | null;
    rack_units: number | null;
    case_format: string | null;
    server_format: string | null;
    power_watts: number | null;
    redundant_psu: boolean;
    barebone: boolean;
    os_included: boolean;
  };
  switch?: {
    layer: number | null;
    managed: boolean;
    poe_support: boolean;
    poe_budget_watts: number | null;
    switching_capacity_gbps: number | null;
    rack_units: number | null;
    power_watts: number | null;
  };
  router?: {
    layer: number | null;
    managed: boolean;
    wifi_standard: string | null;
    vpn_support: boolean;
    max_throughput_mbps: number | null;
    rack_units: number | null;
    power_watts: number | null;
  };
  accessPoint?: {
    wifi_standard: string | null;
    max_throughput_mbps: number | null;
    poe_support: boolean;
    outdoor: boolean;
    power_watts: number | null;
  };
}

export async function getProducts(): Promise<ProductData[]> {
  const products = await prisma.product.findMany({
    include: {
      manufacturer: true,
      productServer: true,
      productSwitch: true,
      productRouter: true,
      productAccessPoint: true,
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    product_type: p.product_type,
    manufacturer: p.manufacturer.name,
    warranty: p.warranty,
    scraped_url: p.scraped_url,
    ...(p.productServer && {
      server: {
        cpu_model: p.productServer.cpu_model,
        cpu_cores: p.productServer.cpu_cores,
        cpu_frequency: p.productServer.cpu_frequency,
        cpu_socket: p.productServer.cpu_socket,
        ram_gb: p.productServer.ram_gb,
        ram_type: p.productServer.ram_type,
        ram_max_gb: p.productServer.ram_max_gb,
        storage_capacity: p.productServer.storage_capacity,
        rack_units: p.productServer.rack_units,
        case_format: p.productServer.case_format,
        server_format: p.productServer.server_format,
        power_watts: p.productServer.power_watts,
        redundant_psu: p.productServer.redundant_psu,
        barebone: p.productServer.barebone,
        os_included: p.productServer.os_included,
      },
    }),
    ...(p.productSwitch && {
      switch: {
        layer: p.productSwitch.layer,
        managed: p.productSwitch.managed,
        poe_support: p.productSwitch.poe_support,
        poe_budget_watts: p.productSwitch.poe_budget_watts,
        switching_capacity_gbps: p.productSwitch.switching_capacity_gbps,
        rack_units: p.productSwitch.rack_units,
        power_watts: p.productSwitch.power_watts,
      },
    }),
    ...(p.productRouter && {
      router: {
        layer: p.productRouter.layer,
        managed: p.productRouter.managed,
        wifi_standard: p.productRouter.wifi_standard,
        vpn_support: p.productRouter.vpn_support,
        max_throughput_mbps: p.productRouter.max_throughput_mbps,
        rack_units: p.productRouter.rack_units,
        power_watts: p.productRouter.power_watts,
      },
    }),
    ...(p.productAccessPoint && {
      accessPoint: {
        wifi_standard: p.productAccessPoint.wifi_standard,
        max_throughput_mbps: p.productAccessPoint.max_throughput_mbps,
        poe_support: p.productAccessPoint.poe_support,
        outdoor: p.productAccessPoint.outdoor,
        power_watts: p.productAccessPoint.power_watts,
      },
    }),
  }));
}

export async function getManufacturers(): Promise<string[]> {
  const manufacturers = await prisma.manufacturer.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return manufacturers.map((m) => m.name);
}

export async function getProductTypes(): Promise<string[]> {
  const types = await prisma.product.findMany({
    distinct: ["product_type"],
    select: { product_type: true },
    orderBy: { product_type: "asc" },
  });
  return types.map((t) => t.product_type);
}
