import { BODY_AREA_KEYWORD_MAP } from "./break-input-keywords";

/**
 * Maps Polish and English keywords to database body_areas
 * ('eyes', 'neck', 'shoulders', 'lower_back', 'glutes_hips', 'wrists_hands', 'random', 'general').
 * Falls back to ['general'] if no keywords match (FR-012).
 */
export function parseBreakInputTags(text: string): string[] {
  const textLower = text.toLowerCase();
  const tagSet = new Set<string>();

  for (const [tag, keywords] of Object.entries(BODY_AREA_KEYWORD_MAP)) {
    if (keywords.some((keyword) => textLower.includes(keyword))) {
      tagSet.add(tag);
    }
  }

  return tagSet.size > 0 ? Array.from(tagSet) : ["general"];
}
