import { describe, it, expect } from "vitest";
import { clientErrorMessage } from "./errors";

describe("clientErrorMessage", () => {
  it("returns the real error message in development", () => {
    const msg = clientErrorMessage(new Error("Gemini quota exceeded"), "Fallback", {
      isProduction: false,
    });
    expect(msg).toBe("Gemini quota exceeded");
  });

  it("hides the real message behind the fallback in production", () => {
    const msg = clientErrorMessage(new Error("Gemini quota exceeded"), "Fallback", {
      isProduction: true,
    });
    expect(msg).toBe("Fallback");
  });

  it("uses the fallback for non-Error throwables in development", () => {
    const msg = clientErrorMessage("just a string", "Fallback", {
      isProduction: false,
    });
    expect(msg).toBe("Fallback");
  });

  it("uses the fallback for non-Error throwables in production", () => {
    const msg = clientErrorMessage({ weird: true }, "Fallback", {
      isProduction: true,
    });
    expect(msg).toBe("Fallback");
  });
});
