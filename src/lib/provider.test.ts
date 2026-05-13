import { describe, expect, it } from "vitest";
import {
  isRetryableProviderError,
  isRetryableProviderStatus,
} from "./provider";

describe("provider retry helpers", () => {
  it("treats 5xx and 429 as retryable", () => {
    expect(isRetryableProviderStatus(500)).toBe(true);
    expect(isRetryableProviderStatus(429)).toBe(true);
    expect(isRetryableProviderStatus(401)).toBe(false);
  });

  it("treats error instances as retryable", () => {
    expect(isRetryableProviderError(new Error("x"))).toBe(true);
    expect(isRetryableProviderError("x")).toBe(false);
  });
});
