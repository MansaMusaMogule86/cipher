import Link from 'next/link';

export default function InstantLinkButton({ href, children, ...props }: { href: string; children: React.ReactNode }) {
  return <Link href={href} {...props}>{children}</Link>;
}
