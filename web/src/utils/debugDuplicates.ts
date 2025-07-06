import { findAndFixDuplicateChapters } from "./storyService";

/**
 * Debug utility to find and fix duplicate chapters
 * Call this in the browser console to clean up duplicates
 */
export const debugDuplicateChapters = async (storyId: string) => {
  console.log(`🔍 Starting duplicate chapter detection for story: ${storyId}`);

  try {
    const result = await findAndFixDuplicateChapters(storyId);

    console.log(`📊 Duplicate Detection Results:`);
    console.log(`   Found: ${result.found} duplicates`);
    console.log(`   Fixed: ${result.fixed} duplicates`);

    if (result.details.length > 0) {
      console.log(`📝 Details:`);
      result.details.forEach((detail, index) => {
        console.log(`   ${index + 1}. Chapter: "${detail.title}"`);
        console.log(`      Action: ${detail.action}`);
        console.log(`      Duplicates found:`);
        detail.duplicates.forEach((dup) => {
          console.log(`        - ID: ${dup.id}`);
          console.log(`          Has Tokens: ${dup.hasTokens}`);
          console.log(`          Published: ${dup.published}`);
          console.log(
            `          Created: ${dup.createdAt?.toDate?.() || "Unknown"}`
          );
        });
        console.log("");
      });
    }

    return result;
  } catch (error) {
    console.error("❌ Error during duplicate detection:", error);
    throw error;
  }
};

// Make it available globally for console debugging
declare global {
  interface Window {
    debugDuplicateChapters: (storyId: string) => Promise<any>;
  }
}

if (typeof window !== "undefined") {
  window.debugDuplicateChapters = debugDuplicateChapters;
}
