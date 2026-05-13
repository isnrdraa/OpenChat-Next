import { prisma } from "@/lib/prisma";

export interface ProviderConfigInput {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  enabled: boolean;
  isPrimary: boolean;
}

export interface ProviderConfigRecord {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
}

export function sortProviderRecords<T extends { isPrimary: boolean; sortOrder: number; createdAt?: Date }>(
  configs: T[]
) {
  return [...configs].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    const aCreated = a.createdAt?.getTime() ?? 0;
    const bCreated = b.createdAt?.getTime() ?? 0;
    return aCreated - bCreated;
  });
}

function mapProviderConfig(config: {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isPrimary: boolean;
  sortOrder: number;
}): ProviderConfigRecord {
  return {
    id: config.id,
    name: config.name,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    enabled: config.enabled,
    isPrimary: config.isPrimary,
    sortOrder: config.sortOrder,
  };
}

export async function ensureProviderConfigs() {
  const existing = await prisma.providerConfig.findMany({
    orderBy: [
      { isPrimary: "desc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  if (existing.length > 0) {
    return existing.map(mapProviderConfig);
  }

  return [];
}

export async function saveProviderConfigs(inputs: ProviderConfigInput[]) {
  const normalized = normalizeProviderInputs(inputs);
  validateProviderInputs(normalized);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.providerConfig.findMany();
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const keptIds = new Set<string>();

    for (let index = 0; index < normalized.length; index += 1) {
      const item = normalized[index];
      const sortOrder = index;

      if (item.id && existingById.has(item.id)) {
        keptIds.add(item.id);
        const updateData: Record<string, string | boolean | number> = {
          name: item.name,
          baseUrl: item.baseUrl,
          model: item.model,
          enabled: item.enabled,
          isPrimary: item.isPrimary,
          sortOrder,
        };

        if (item.apiKey) {
          updateData.apiKey = item.apiKey;
        }

        await tx.providerConfig.update({
          where: { id: item.id },
          data: updateData,
        });
        continue;
      }

      if (!item.apiKey) {
        throw new Error(`API key wajib diisi untuk provider baru: ${item.name || "tanpa nama"}`);
      }

      const created = await tx.providerConfig.create({
        data: {
          name: item.name,
          baseUrl: item.baseUrl,
          apiKey: item.apiKey,
          model: item.model,
          enabled: item.enabled,
          isPrimary: item.isPrimary,
          sortOrder,
        },
      });

      keptIds.add(created.id);
    }

    const deleteIds = existing
      .filter((item) => !keptIds.has(item.id))
      .map((item) => item.id);

    if (deleteIds.length > 0) {
      await tx.providerConfig.deleteMany({
        where: { id: { in: deleteIds } },
      });
    }

    const providerConfigs = await tx.providerConfig.findMany({
      orderBy: [
        { isPrimary: "desc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });

    return providerConfigs.map(mapProviderConfig);
  });
}

export async function getProviderChain() {
  const configs = await ensureProviderConfigs();
  return configs.filter((config) => config.enabled);
}

export function normalizeProviderInputs(inputs: ProviderConfigInput[]) {
  const filtered = inputs.filter(
    (item) => item.name.trim() || item.baseUrl.trim() || item.model.trim()
  );
  const primaryIndex = filtered.findIndex((item) => item.isPrimary && item.enabled);
  const fallbackPrimaryIndex = primaryIndex >= 0 ? primaryIndex : filtered.findIndex((item) => item.enabled);

  return filtered.map((item, index) => ({
    ...item,
    name: item.name.trim(),
    baseUrl: item.baseUrl.trim(),
    model: item.model.trim(),
    apiKey: item.apiKey?.trim(),
    enabled: !!item.enabled,
    isPrimary: index === fallbackPrimaryIndex,
  }));
}

export function validateProviderInputs(inputs: ProviderConfigInput[]) {
  if (inputs.length === 0) {
    throw new Error("Minimal 1 provider harus ada");
  }

  if (!inputs.some((item) => item.enabled)) {
    throw new Error("Minimal 1 provider aktif");
  }

  for (const input of inputs) {
    if (!input.name.trim()) {
      throw new Error("Nama provider wajib diisi");
    }

    if (!input.baseUrl.trim()) {
      throw new Error(`Base URL wajib diisi untuk ${input.name || "provider"}`);
    }

    if (!input.model.trim()) {
      throw new Error(`Model wajib diisi untuk ${input.name || "provider"}`);
    }
  }
}
