import assert from "node:assert/strict";
import test from "node:test";
import {
  getDisplayableReactionAggregates,
  getReactionAggregateTotal,
} from "../lib/api/reaction-utils.ts";

test("renders no aggregate chips for missing, empty, or zero-count reactions", () => {
  assert.deepEqual(getDisplayableReactionAggregates(), []);
  assert.deepEqual(getDisplayableReactionAggregates([]), []);
  assert.deepEqual(
    getDisplayableReactionAggregates([{ reaction: "like", emoji: "👍", count: 0 }]),
    [],
  );
});

test("keeps one aggregate chip per reaction type and its server count", () => {
  const reactions = getDisplayableReactionAggregates([
    { reaction: "like", emoji: "👍", count: 3 },
    { reaction: "heart", emoji: "❤️", count: 2 },
    { reaction: "laugh", emoji: "😆", count: 1 },
  ]);

  assert.deepEqual(reactions, [
    { reaction: "like", emoji: "👍", count: 3 },
    { reaction: "heart", emoji: "❤️", count: 2 },
    { reaction: "laugh", emoji: "😆", count: 1 },
  ]);
  assert.equal(getReactionAggregateTotal(reactions), 6);
});

test("uses server-provided emoji for future reaction types", () => {
  assert.deepEqual(
    getDisplayableReactionAggregates([{ reaction: "party_parrot", emoji: "🦜", count: 4 }]),
    [{ reaction: "party_parrot", emoji: "🦜", count: 4 }],
  );
});

test("a fresh backend response removes stale reactions and uses decremented counts", () => {
  const before = getDisplayableReactionAggregates([
    { reaction: "like", emoji: "👍", count: 1 },
    { reaction: "heart", emoji: "❤️", count: 1 },
    { reaction: "laugh", emoji: "😆", count: 1 },
  ]);
  const after = getDisplayableReactionAggregates([
    { reaction: "like", emoji: "👍", count: 1 },
    { reaction: "heart", emoji: "❤️", count: 0 },
    { reaction: "laugh", emoji: "😆", count: 1 },
  ]);

  assert.equal(before.length, 3);
  assert.deepEqual(after, [
    { reaction: "like", emoji: "👍", count: 1 },
    { reaction: "laugh", emoji: "😆", count: 1 },
  ]);
});
