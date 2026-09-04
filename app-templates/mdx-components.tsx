import type { MDXComponents } from "mdx/types";
import { Quiz, Flashcards } from "@/components/widgets";
import { Exercise } from "@/components/Exercise";
import { Qa } from "@/components/Qa";

// Client components exposed to MDX pages. Direct imports inside .mdx files
// break build-time page-data collection in Next 16; this mapping is the
// supported boundary.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { Quiz, Exercise, Qa, Flashcards, ...components };
}
