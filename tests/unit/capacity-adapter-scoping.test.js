/**
 * Pool scoping: getCapacityAdapterModels(settings, requiredCapabilities) must
 * consult only the pools for the capabilities the request actually needs.
 * Without scoping, an enabled pool for a different capability leaks its models
 * into the request: an empty enabled pool falls back to DEFAULT_FALLBACK_MODEL,
 * and even a fully wrong pool can satisfy the wanted capability.
 */
import { describe, expect, it } from "vitest";
import { getCapacityAdapterModels, augmentModelsWithCapacityAdapter } from "../../open-sse/services/capacityAdapter.js";

describe("capacity adapter pool scoping", () => {
  const bothPools = {
    capacityAdapter: {
      vision: { enabled: true, models: ["m-vision"] },
      audioInput: { enabled: true, models: ["m-audio"] },
    },
  };

  it("with requiredCapabilities only the matching pools are consulted", () => {
    expect(getCapacityAdapterModels(bothPools, ["vision"])).toEqual(["m-vision"]);
    expect(getCapacityAdapterModels(bothPools, ["audioInput"])).toEqual(["m-audio"]);
  });

  it("without requiredCapabilities keeps the legacy flatten behaviour", () => {
    expect(getCapacityAdapterModels(bothPools)).toEqual(["m-vision", "m-audio"]);
  });

  it("a vision request does not borrow the audio pool's models", () => {
    // The audio pool is enabled and holds a vision-capable model, but no audio
    // capability is requested, so it must not be consulted at all.
    const settings = {
      capacityAdapter: {
        vision: { enabled: false, models: [] },
        audioInput: { enabled: true, models: ["ds/deepseek-v4-flash-vision-exp"] },
      },
    };
    const models = ["oc/text-only-model"];
    const out = augmentModelsWithCapacityAdapter(models, ["vision"], settings);
    expect(out).toEqual(models);
  });

  it("an enabled vision pool still answers a vision request", () => {
    const settings = {
      capacityAdapter: {
        vision: { enabled: true, models: ["ds/deepseek-v4-flash-vision-exp"] },
      },
    };
    const out = augmentModelsWithCapacityAdapter(["oc/text-only-model"], ["vision"], settings);
    expect(out[0]).toBe("ds/deepseek-v4-flash-vision-exp");
    expect(out).toContain("oc/text-only-model");
  });
});
