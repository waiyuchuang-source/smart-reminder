import { prisma } from "./prisma";

export interface FrequencyConfig {
  globalCoolingMinutes: number;
  typeCoolingMinutes: number;
  maxDailyNudges: number;
  fatigueThresholdHigh: number;
  fatigueThresholdMedium: number;
}

const DEFAULTS: FrequencyConfig = {
  globalCoolingMinutes: 15,
  typeCoolingMinutes: 60,
  maxDailyNudges: 5,
  fatigueThresholdHigh: 70,
  fatigueThresholdMedium: 40,
};

let cache: { config: FrequencyConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

export function invalidateFrequencyConfigCache(): void {
  cache = null;
}

export async function getFrequencyConfig(): Promise<FrequencyConfig> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) return cache.config;

  try {
    const row = await prisma.systemConfig.findUnique({ where: { key: "frequency_config" } });
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<FrequencyConfig>;
      const config: FrequencyConfig = { ...DEFAULTS, ...parsed };
      cache = { config, expiresAt: now + CACHE_TTL_MS };
      return config;
    }
  } catch {
    // fallback to defaults on any DB/parse error
  }

  cache = { config: DEFAULTS, expiresAt: now + CACHE_TTL_MS };
  return DEFAULTS;
}
