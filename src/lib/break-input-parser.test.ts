import { describe, it, expect } from "vitest";
import { parseBreakInputTags } from "./break-input-parser";

describe("parseBreakInputTags", () => {
  it("recognizes glutes_hips keywords and colloquial forms", () => {
    expect(parseBreakInputTags("boli mnie dupa")).toContain("glutes_hips");
    expect(parseBreakInputTags("boli mnie w dupie")).toContain("glutes_hips");
    expect(parseBreakInputTags("rozciągnij dupę")).toContain("glutes_hips");
    expect(parseBreakInputTags("ból pośladków od siedzenia")).toContain("glutes_hips");
    expect(parseBreakInputTags("rwa kulszowa")).toContain("glutes_hips");
    expect(parseBreakInputTags("spięty piriformis")).toContain("glutes_hips");
    expect(parseBreakInputTags("ból biodra")).toContain("glutes_hips");
  });

  it("recognizes wrists_hands keywords", () => {
    expect(parseBreakInputTags("ból nadgarstka")).toContain("wrists_hands");
    expect(parseBreakInputTags("drętwieją mi dłonie od myszki")).toContain("wrists_hands");
    expect(parseBreakInputTags("cieśń nadgarstka")).toContain("wrists_hands");
    expect(parseBreakInputTags("forearm and finger stretches")).toContain("wrists_hands");
  });

  it("recognizes lower_back keywords including typos and without diacritics", () => {
    expect(parseBreakInputTags("boli mnie lędźwie")).toContain("lower_back");
    expect(parseBreakInputTags("ból ledzwi")).toContain("lower_back");
    expect(parseBreakInputTags("boli kregoslup")).toContain("lower_back");
    expect(parseBreakInputTags("dół pleców")).toContain("lower_back");
    expect(parseBreakInputTags("lumbar tension")).toContain("lower_back");
  });

  it("recognizes random keywords", () => {
    expect(parseBreakInputTags("Zaskocz mnie")).toContain("random");
    expect(parseBreakInputTags("daj coś losowego")).toContain("random");
    expect(parseBreakInputTags("miks ćwiczeń")).toContain("random");
  });

  it("recognizes eyes, neck, and shoulders", () => {
    expect(parseBreakInputTags("pieką mnie oczy od ekranu")).toContain("eyes");
    expect(parseBreakInputTags("sztywny kark")).toContain("neck");
    expect(parseBreakInputTags("spięte barki")).toContain("shoulders");
  });

  it("falls back to general when no keywords match (FR-012)", () => {
    expect(parseBreakInputTags("abracadabra")).toEqual(["general"]);
    expect(parseBreakInputTags("")).toEqual(["general"]);
  });
});
