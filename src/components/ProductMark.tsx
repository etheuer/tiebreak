import type { Product } from "@/lib/data";

type Tone = "a" | "b" | "neutral";

export const SIZES = {
  hero: { box: 200, glyph: 136, radius: 24 },
  xs: { box: 28, glyph: 16, radius: 7 },
  sm: { box: 40, glyph: 22, radius: 9 },
  md: { box: 64, glyph: 34, radius: 12 },
  lg: { box: 96, glyph: 52, radius: 16 },
} as const;

export type ProductMarkSize = keyof typeof SIZES;

const TONE_VAR: Record<Tone, string> = {
  a: "var(--accent)",
  b: "var(--rival)",
  neutral: "var(--ink-3)",
};

/** Line art per product type. The dataset ships placeholder image URLs, so the
 *  silhouette is the honest thumbnail: it never 404s and reads at 28px. */
export function Glyph({
  subcategory,
  size,
}: {
  subcategory: string;
  size: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (subcategory) {
    case "headphones":
      return (
        <svg {...common}>
          <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
          <rect x="2.5" y="11" width="5" height="10" rx="2.5" />
          <rect x="16.5" y="11" width="5" height="10" rx="2.5" />
          <path d="M7 8a5.5 5.5 0 0 1 10 0" opacity=".35" />
        </svg>
      );
    case "air-purifiers":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="19" rx="3" />
          <path d="M8 6h8M8 13h8M8 16h8M8 19h8" />
          <circle cx="12" cy="9" r="1" />
        </svg>
      );
    case "credit-cards":
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 9h20M5 15h5M15 15h3" />
        </svg>
      );
    case "tvs":
      return (
        <svg {...common}>
          <rect x="2.5" y="4" width="19" height="12.5" rx="1.6" />
          <path d="M8.5 20h7M12 16.5V20" />
          <path d="M5.5 7h5" opacity="0.45" />
        </svg>
      );
    case "laptops":
      return (
        <svg {...common}>
          <rect x="4" y="4.5" width="16" height="11" rx="1.4" />
          <path d="M2 18.5h20l-1.4 1.6H3.4z" />
          <path d="M7 7.5h5" opacity="0.45" />
        </svg>
      );
    case "smartphones":
      return (
        <svg {...common}>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
          <path d="M10.4 5.2h3.2" />
          <path d="M9 9h4" opacity="0.45" />
        </svg>
      );
    case "cordless-vacuums":
      return (
        <svg {...common}>
          <path d="M14.5 3.2 9.2 12" />
          <path d="M13.2 2.2h3.4" />
          <path d="M9.2 12h4.4l1.6 3.4H7.6z" />
          <path d="M4.5 21h11" />
          <path d="M10 17.2 6 21" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="2" />
          <path d="M3.5 15l4.5-4 4 3.4 3.5-3 5 4.6" />
        </svg>
      );
  }
}

export function ProductMark({
  product,
  size = "sm",
  tone = "neutral",
  className = "",
}: {
  product: Product;
  size?: keyof typeof SIZES;
  tone?: Tone;
  className?: string;
}) {
  const spec = SIZES[size];
  return (
    <span
      className={`p-mark ${className}`}
      style={
        {
          width: spec.box,
          height: spec.box,
          borderRadius: spec.radius,
          "--mark-hue": TONE_VAR[tone],
        } as React.CSSProperties
      }
      title={product.name}
    >
      <Glyph subcategory={product.subcategory} size={spec.glyph} />
    </span>
  );
}
