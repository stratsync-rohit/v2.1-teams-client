import { z } from "zod";
import type { Risk } from "../types.js";

const riskBlockSchema = z.record(z.string(), z.unknown());

const riskViewSchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    action_label: z.string().optional(),
    blocks: z.array(riskBlockSchema).optional(),
  })
  .passthrough();

const riskSchema = z
  .object({
    risk_id: z.string().min(1),
    schema_version: z.number().optional(),
    card_id: z.string().optional(),
    industry_slug: z.string().optional(),
    industry_name: z.string().optional(),
    title: z.string().min(1),
    severity: z.string().optional(),
    severity_label: z.string().optional(),
    subtitle: z.string().optional(),
    summary: z.string().optional(),
    sender: z
      .object({
        name: z.string().optional(),
        source: z.string().optional(),
        risk_id: z.string().optional(),
        // The backend may intentionally return an empty string here.
        timestamp: z.string().optional(),
      })
      .passthrough()
      .optional(),
    entity: z
      .object({
        type: z.string().optional(),
        id: z.string().optional(),
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
    views: z
      .object({
        notification: riskViewSchema.optional(),
        details: riskViewSchema.optional(),
        mitigation: riskViewSchema.optional(),
      })
      .passthrough()
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    is_active: z.boolean().optional(),
    status: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

const riskListSchema = z.array(riskSchema);

export class InvalidRiskResponseError extends Error {
  code = "INVALID_RESPONSE";

  constructor() {
    super("The service returned invalid risk data.");
    this.name = "InvalidRiskResponseError";
  }
}

export function parseRiskList(payload: unknown): Risk[] {
  const parsed = riskListSchema.safeParse(payload);
  if (!parsed.success) throw new InvalidRiskResponseError();
  return parsed.data as Risk[];
}

export function parseRisk(payload: unknown): Risk {
  const parsed = riskSchema.safeParse(payload);
  if (!parsed.success) throw new InvalidRiskResponseError();
  return parsed.data as Risk;
}
