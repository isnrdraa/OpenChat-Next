import { describe, expect, it } from "vitest";
import {
  normalizeProviderInputs,
  sortProviderRecords,
  validateProviderInputs,
} from "./provider-configs";

describe("provider-configs", () => {
  it("sorts primary first then sortOrder", () => {
    const result = sortProviderRecords([
      { id: "b", isPrimary: false, sortOrder: 2 },
      { id: "a", isPrimary: true, sortOrder: 9 },
      { id: "c", isPrimary: false, sortOrder: 1 },
    ]);

    expect(result.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("normalizes inputs and picks first enabled as primary", () => {
    const result = normalizeProviderInputs([
      { name: "A", baseUrl: "https://a", apiKey: "1", model: "m1", enabled: false, isPrimary: true },
      { name: "B", baseUrl: "https://b", apiKey: "2", model: "m2", enabled: true, isPrimary: false },
      { name: "C", baseUrl: "https://c", apiKey: "3", model: "m3", enabled: true, isPrimary: false },
    ]);

    expect(result[0].isPrimary).toBe(false);
    expect(result[1].isPrimary).toBe(true);
    expect(result[2].isPrimary).toBe(false);
  });

  it("rejects empty provider list", () => {
    expect(() => validateProviderInputs([])).toThrow("Minimal 1 provider harus ada");
  });
});
