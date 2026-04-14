'use client';

import { MarkdownBody } from '@/components/MarkdownBody';

/** Renders a single changelog line as markdown (bold titles, links, italics, line breaks). */
export function ChangelogEntryText({ markdown }: { markdown: string }) {
  return (
    <MarkdownBody
      markdown={markdown}
      className="prose prose-sm max-w-none text-charcoal font-body leading-relaxed prose-p:my-0 prose-p:leading-relaxed first:prose-p:mt-0 last:prose-p:mb-0 prose-strong:font-semibold prose-strong:text-charcoal prose-em:italic prose-a:text-charcoal prose-a:underline prose-br:leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    />
  );
}
