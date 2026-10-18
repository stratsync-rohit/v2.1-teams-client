import assert from "node:assert/strict";
import test from "node:test";
import { parseRisk, parseRiskList } from "../lib/api/risk-parser.ts";

const realRisk = {
  risk_id: "RSK-INV-1001",
  schema_version: 2,
  card_id: "inventory-action-required",
  industry_slug: "distribution-trading",
  industry_name: "Distribution & Trading",
  title: "INVENTORY ACTION REQUIRED",
  severity: "high",
  severity_label: "High",
  subtitle: "Clear 500 units of SKU 21132",
  summary: "Inventory requires commercial action based on recent sales.",
  sender: {
    name: "StratSync RRM",
    source: "Risk Monitor",
    risk_id: "RSK-INV-1001",
    timestamp: "",
  },
  entity: { type: "sku", id: "21132", name: "SKU 21132" },
  views: {
    notification: { title: "Inventory Snapshot", subtitle: "Pricing Recommendation", blocks: [] },
    details: { title: "Inventory Details", subtitle: "Current stock and timing signals", blocks: [] },
    mitigation: { title: "Mitigation Plan", blocks: [] },
  },
  is_active: true,
  status: "active",
  created_at: "2026-09-30T18:21:02.629000",
  updated_at: "2026-09-30T18:21:02.629000",
};

test("a real backend risk DTO parses for the list screen", () => {
  const [risk] = parseRiskList([realRisk]);

  assert.equal(risk.risk_id, "RSK-INV-1001");
  assert.equal(risk.title, "INVENTORY ACTION REQUIRED");
  assert.equal(risk.entity?.name, "SKU 21132");
  assert.equal(risk.views?.notification?.blocks?.length, 0);
});

test("an empty backend array remains an empty risk list", () => {
  assert.deepEqual(parseRiskList([]), []);
});

test("missing optional risk fields do not prevent parsing", () => {
  const risk = parseRisk({ risk_id: "RSK-MIN-1", title: "Minimal risk" });

  assert.equal(risk.risk_id, "RSK-MIN-1");
  assert.equal(risk.card_id, undefined);
  assert.equal(risk.sender, undefined);
  assert.equal(risk.views, undefined);
});

test("invalid risk responses fail at the API boundary", () => {
  assert.throws(() => parseRiskList({ data: [realRisk] }), {
    code: "INVALID_RESPONSE",
    message: "The service returned invalid risk data.",
  });
  assert.throws(() => parseRisk({ risk_id: "RSK-BAD" }), {
    code: "INVALID_RESPONSE",
    message: "The service returned invalid risk data.",
  });
});
