import { expect, test } from "vitest";
import { VERSION } from "../src/index.js";

test("VERSION is set", () => {
  expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
});
