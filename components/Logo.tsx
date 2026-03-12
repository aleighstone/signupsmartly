import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  /** If true, wrap in a link to home. Default: true */
  link?: boolean;
  /** Additional class names */
  className?: string;
}

export function Logo({ link = true, className = '' }: LogoProps) {
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
      <span className="font-heading font-semibold text-charcoal">
        SignupSmartly
      </span>
    </>
  );

  if (link) {
    return (
      <Link
        href="/"
        className={`inline-flex items-center gap-2 text-lg hover:opacity-90 transition-opacity ${className}`}
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
