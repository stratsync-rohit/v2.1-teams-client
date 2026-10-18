import assert from "node:assert/strict";
import test from "node:test";
import { getActiveReactionCounts, getReactionUserLabel } from "../lib/api/reaction-utils.ts";

test("active reaction counts aggregate by reaction and exclude removed records", () => {
  const reactions = [
    { reaction_id: "1", reaction: "like", user_aad_id: "aad-1", is_active: true },
    { reaction_id: "2", reaction_type: "like", user_identifier: "user-2", is_active: true },
    { reaction_id: "3", reaction: "heart", user_aad_id: "aad-3", is_active: false },
  ];

  assert.deepEqual(getActiveReactionCounts(reactions), { like: 2 });
});

test("reaction user labels use real display fields or available identifiers", () => {
  assert.equal(
    getReactionUserLabel({ user_display_name: "Rohit Choukiker", is_active: true }),
    "Rohit Choukiker",
  );
  assert.equal(
    getReactionUserLabel({ user_identifier: "8f1a-user", is_active: true }),
    "8f1a-user",
  );
  assert.equal(getReactionUserLabel({ is_active: true }), "Unknown user");
});
