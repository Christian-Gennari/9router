import { describe, it, expect } from "vitest";
import { getExecutor } from "../../open-sse/executors/index.js";

// A combo seat can pin a thinking level with a model-name suffix: "gemini/gemini-3.6-flash(high)".
// chatCore strips the suffix from the request body, but executors that put the model id in the
// URL path received the raw name, so Google answered 400 "unexpected model name format".

describe("thinking suffix never reaches a Gemini URL path", () => {
  it("gemini (AI Studio) strips the suffix for stream and non-stream URLs", () => {
    const ex = getExecutor("gemini");
    const stream = ex.buildUrl("gemini-3.6-flash(high)", true, 0, {});
    const plain = ex.buildUrl("gemini-3.6-flash(none)", false, 0, {});
    expect(stream).toMatch(/\/gemini-3\.6-flash:streamGenerateContent\?alt=sse$/);
    expect(plain).toMatch(/\/gemini-3\.6-flash:generateContent$/);
    expect(stream).not.toContain("(");
  });

  it("gemini leaves a suffix-free model id unchanged", () => {
    const ex = getExecutor("gemini");
    expect(ex.buildUrl("gemma-4-31b-it", false, 0, {})).toMatch(/\/gemma-4-31b-it:generateContent$/);
  });

  it("vertex strips the suffix on both the project and projectless paths", () => {
    const ex = getExecutor("vertex");
    const projectless = ex.buildUrl("gemini-3.5-flash(8192)", false, 0, { apiKey: "k" });
    const scoped = ex.buildUrl("gemini-3.5-flash(low)", true, 0, { apiKey: "k", providerSpecificData: { projectId: "p" } });
    expect(projectless).toContain("/models/gemini-3.5-flash:generateContent");
    expect(scoped).toContain("/models/gemini-3.5-flash:streamGenerateContent");
    expect(projectless + scoped).not.toContain("(");
  });
});
