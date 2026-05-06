import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default("tone"),
  variants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      config: z.record(z.string(), z.unknown()).optional(),
    }),
  ).min(2),
});

export async function GET() {
  const experiments = await prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });

  return NextResponse.json({
    success: true,
    data: experiments.map((e) => ({
      ...e,
      variants: JSON.parse(e.variants),
      assignmentCount: e._count.assignments,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = CreateSchema.parse(body);

    const experiment = await prisma.experiment.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        variants: JSON.stringify(input.variants),
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...experiment, variants: JSON.parse(experiment.variants) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to create experiment" }, { status: 500 });
  }
}
