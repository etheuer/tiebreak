import Link from "next/link";

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="cb-logo" aria-label="Clinchmark home">
      {/* Native image keeps the generated transparent lockup intact in static exports. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/clinchmark-logo.png"
        alt="clinchmark"
        width={2172}
        height={724}
      />
    </Link>
  );
}
