'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';

/** Bare hostnames (e.g. www.amazon.com) are relative in HTML; prepend https so links work off-site. */
function normalizeExternalHref(href: string): string {
  const t = href.trim();
  if (!t) return t;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/') || t.startsWith('#')) return t;

  const looksLikeHost =
    /^(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[\w./~?#%+\-=&;:@!$'()*,[\]]*)?$/i.test(t) ||
    /^localhost(?::\d+)?(?:\/.*)?$/i.test(t) ||
    /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/.*)?$/.test(t);

  if (looksLikeHost) return `https://${t}`;
  return t;
}

export function MarkdownBody({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => {
            const safeHref = href ? normalizeExternalHref(href) : '';
            return safeHref ? (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
