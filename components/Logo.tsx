import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  /** If true, wrap in a link to home. Default: true */
  link?: boolean;
  /** Link href when link is true. Default: "/" */
  href?: string;
  /** Additional class names */
  className?: string;
}

export function Logo({ link = true, href = '/', className = '' }: LogoProps) {
  const content = (
    <>
      <Image
        src="/smartly-icon.png"
        alt=""
        width={28}
        height={28}
        className="shrink-0"
        aria-hidden
      />
      <span className="hidden font-display font-semibold text-charcoal sm:inline">
        SignupSmartly
      </span>
    </>
  );

  if (link) {
    return (
      <Link
        href={href}
        className={`inline-flex shrink-0 items-center gap-2 text-lg hover:opacity-90 transition-opacity ${className}`}
        aria-label="SignupSmartly home"
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-lg ${className}`}
    >
      {content}
    </span>
  );
}
