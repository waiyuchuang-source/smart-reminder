import { prisma } from "./prisma";

export interface ExperimentVariant {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}

export interface ExperimentWithVariants {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  variants: ExperimentVariant[];
  createdAt: Date;
}

function parseVariants(raw: string): ExperimentVariant[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function hashAssign(userId: string, experimentId: string, variantCount: number): number {
  let hash = 0;
  const key = `${userId}:${experimentId}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % variantCount;
}

export async function getActiveExperiments(): Promise<ExperimentWithVariants[]> {
  const rows = await prisma.experiment.findMany({ where: { status: "active" } });
  return rows.map((r) => ({ ...r, variants: parseVariants(r.variants) }));
}

export async function getOrCreateAssignment(
  userId: string,
  experiment: ExperimentWithVariants,
): Promise<{ variantId: string; variantIndex: number }> {
  const existing = await prisma.experimentAssignment.findUnique({
    where: { userId_experimentId: { userId, experimentId: experiment.id } },
  });

  if (existing) {
    const idx = experiment.variants.findIndex((v) => v.id === existing.variantId);
    return { variantId: existing.variantId, variantIndex: idx >= 0 ? idx : 0 };
  }

  const variantIndex = hashAssign(userId, experiment.id, experiment.variants.length);
  const variantId = experiment.variants[variantIndex].id;

  await prisma.experimentAssignment.create({
    data: { userId, experimentId: experiment.id, variantId },
  });

  return { variantId, variantIndex };
}
