import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge tailwind classes correctly", () => {
      // Basic merge
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");

      // Merge with conflicting tailwind classes (tailwind-merge behavior)
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");

      // Merge with conditional classes (clsx behavior)
      expect(cn("px-4", { "py-2": true, "py-4": false })).toBe("px-4 py-2");

      // Merge with undefined/null
      expect(cn("p-4", undefined, null, "m-2")).toBe("p-4 m-2");
    });
  });
});
