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

  const settings = await prisma.appSettings.findFirst({
    where: { setupCompleted: true },
  });

  if (!settings?.providerBaseUrl || !settings.providerApiKey || !settings.providerModel) {
    return [];
  }

  const created = await prisma.providerConfig.create({
    data: {
      name: `${settings.siteName} Primary`,
      baseUrl: settings.providerBaseUrl,
      apiKey: settings.providerApiKey,
      model: settings.providerModel,
      enabled: true,
      isPrimary: true,
      sortOrder: 0,
    },
  });

  return [mapProviderConfig(created)];
}

export async function saveProviderConfigs(inputs: ProviderConfigInput[]) {
  const normalized = normalizeProviderInputs(inputs);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.providerConfig.findMany();
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const keptIds = new Set<string>();

    for (let index = 0; index < normalized.length; index += 1) {
      const item = normalized[index];
      const sortOrder = index;

      if (item.id && existingById.has(item.id)) {
        keptIds.add(item.id);
        await tx.providerConfig.update({
          where: { id: item.id },
          data: {
            name: item.name,
            baseUrl: item.baseUrl,
            ...(item.apiKey ? { apiKey: item.apiKey } : {}),
            model: item.model,
            enabled: item.enabled,
            isPrimary: item.isPrimary,
            sortOrder,
          },
        });
        continue;
      }

      const created = await tx.providerConfig.create({
        data: {
          name: item.name,
          baseUrl: item.baseUrl,
          apiKey: item.apiKey || "",
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

function normalizeProviderInputs(inputs: ProviderConfigInput[]) {
  const filtered = inputs.filter((item) => item.name.trim() || item.baseUrl.trim() || item.model.trim());
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
