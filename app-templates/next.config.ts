import createMDX from "@next/mdx";
import rehypeHighlight from "rehype-highlight";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm, remarkFrontmatter],
    rehypePlugins: [rehypeHighlight],
  },
});

export default withMDX(nextConfig);
