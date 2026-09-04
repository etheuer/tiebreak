import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getComparisons,
  getProductById,
  getProducts,
  inMarket,
  officialSourceUrl,
  priceOf,
} from "@/lib/data";
import type { MarketId } from "@/lib/markets";
import { pageAlternates, openGraphLocale } from "@/lib/hreflang";
import { catalogFor } from "@/data/spec-catalog";
import { highlightFields, specValue } from "@/lib/specs";
import { buildVerdict } from "@/lib/verdict";
import {
  buildHref,
  categoryHref,
  homeHref,
  isFeeBased,
  priceCaption,
  priceShort,
  productHref,
  subLabel,
} from "@/lib/nav";
import { absUrl, clip, CATALOG_AS_OF, SITE_NAME } from "@/lib/site";
import { formatCatalogDate, formatMoney } from "@/lib/format";
import { buildProductFaq } from "@/lib/faq";
import { ProductImage } from "@/components/ProductImage";
import { ProductSpecs } from "@/components/ProductSpecs";
import { VsCard } from "@/components/VsCard";
import { ProductCard } from "@/components/ProductCard";
import { FinanceDisclaimer, PriceNote } from "@/components/CatalogNotes";

export async function generateStaticParamsForMarket(market: MarketId) {
  const products = await getProducts(market);
  return products.map((product) => ({
    slug: [product.category, product.id],
  }));
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string[] }> },
  market: MarketId,
): Promise<Metadata> {
  const { slug } = await params;
  const product =
    slug?.length >= 2 ? await getProductById(slug[1], market) : null;
  if (!product || !inMarket(product, market))
    return { title: "Product not found" };
  const title = `${product.name} specs and price`;
  const description = clip(
    `${product.name} at ${priceShort(product, market)}: ${product.description}`,
    158,
  );
  const includeUk = inMarket(product, "uk");
  return {
    title,
    description,
    alternates: pageAlternates(productHref(product), market, includeUk),
    openGraph: {
      title,
      description,
      url: productHref(product, market),
      type: "website",
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function ProductDetail({
  params,
  market,
}: {
  params: Promise<{ slug: string[] }>;
  market: MarketId;
}) {
  const { slug } = await params;
  if (!slug || slug.length < 2) {
    notFound();
  }

  const product = await getProductById(slug[1], market);
  if (!product || !inMarket(product, market)) {
    notFound();
  }

  const [products, comparisons, categories] = await Promise.all([
    getProducts(market),
    getComparisons(market),
    getCategories(market),
  ]);

  const byId = new Map(products.map((item) => [item.id, item]));
  const category = categories.find((item) => item.id === product.category);

  const allMatchups = comparisons.filter(
    (comparison) =>
      comparison.productA === product.id || comparison.productB === product.id,
  );
  const matchups = allMatchups.slice(0, 4);

  // Closest in price reads as the real cross-shopping set.
  const alternatives = products
    .filter(
      (item) =>
        item.subcategory === product.subcategory && item.id !== product.id,
    )
    .sort(
      (x, y) =>
        Math.abs(x.price - product.price) - Math.abs(y.price - product.price),
    )
    .slice(0, 6);

  const keyNumbers = highlightFields(catalogFor(product.subcategory)).map(
    (field) => ({
      key: field.key,
      label: field.label,
      value: specValue(product, field.key),
    }),
  );

  const faq = buildProductFaq(product, comparisons, market);

  return (
    <div className="shell">
      <nav className="cb-breadcrumb" aria-label="Breadcrumb">
        <Link href={homeHref(market)}>Home</Link>
        <span>/</span>
        <Link href={categoryHref(product.category, market)}>
          {category?.name}
        </Link>
        <span>/</span>
        <span>{subLabel(product.subcategory)}</span>
      </nav>
      <header className="cb-product-hero">
        <div className="cb-product-visual">
          <ProductImage product={product} size="hero" eager />
        </div>
        <div>
          <p className="eyebrow">
            {product.brand} · {subLabel(product.subcategory)}
          </p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="cb-stage-price">
            <strong>{priceShort(product, market)}</strong>
            <span>{priceCaption(product.subcategory)}</span>
          </div>
          <PriceNote subcategory={product.subcategory} />
          <div className="cb-actions mt-6">
            <Link
              className="btn btn-primary"
              href={buildHref(product.id, "", market)}
            >
              Compare with another product →
            </Link>
            <a className="btn btn-ghost" href="#product-specs">
              Explore the specs
            </a>
          </div>
        </div>
      </header>
      {keyNumbers.length > 0 && (
        <dl className="cb-keyfacts">
          {keyNumbers.slice(0, 4).map((item) => (
            <div key={item.key}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <section className="cb-section">
        <div className="cb-section-head">
          <h2>A closer look.</h2>
        </div>
        <div className="cb-tradeoffs">
          <article className="cb-tone-a">
            <h3>Reasons to choose it</h3>
            <ul>
              {product.pros.map((pro) => (
                <li key={pro}>{pro}</li>
              ))}
            </ul>
          </article>
          <article className="cb-tone-b">
            <h3>Worth considering</h3>
            <ul>
              {product.cons.map((con) => (
                <li key={con}>{con}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      {matchups.length > 0 && (
        <section className="cb-section">
          <div className="cb-section-head">
            <div>
              <h2>Put it next to your other option.</h2>
              <p>
                {allMatchups.length} published comparisons feature this product.
              </p>
            </div>
            <Link href={buildHref(product.id, "", market)}>
              Choose another product →
            </Link>
          </div>
          <div className="cb-grid-pairs">
            {matchups.map((comparison) => {
              const a = byId.get(comparison.productA)!;
              const b = byId.get(comparison.productB)!;
              return (
                <VsCard
                  key={comparison.productName}
                  comparison={comparison}
                  productA={a}
                  productB={b}
                  verdict={buildVerdict(a, b, market)}
                  market={market}
                />
              );
            })}
          </div>
        </section>
      )}
      <section className="cb-section" id="product-specs">
        <ProductSpecs product={product} />
        <p className="cb-table-footnote">
          Catalog snapshot: {formatCatalogDate(CATALOG_AS_OF)}. Published
          specifications, not independent lab tests.
        </p>
        {officialSourceUrl(product) && (
          <a
            className="btn btn-ghost mt-4"
            href={officialSourceUrl(product)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            View the official source ↗
          </a>
        )}
        {isFeeBased(product.subcategory) && (
          <FinanceDisclaimer products={[product]} />
        )}
      </section>
      {alternatives.length > 0 && (
        <section className="cb-section">
          <div className="cb-section-head">
            <div>
              <p className="eyebrow">Keep your options open</p>
              <h2>Also worth a look.</h2>
            </div>
          </div>
          <div className="cb-grid">
            {alternatives.map((alternative) => (
              <ProductCard
                key={alternative.id}
                product={alternative}
                market={market}
                compareWith={product.id}
              />
            ))}
          </div>
        </section>
      )}
      <section className="cb-section">
        <div className="cb-section-head">
          <h2>A few common questions.</h2>
        </div>
        <div className="cb-faq">
          {faq.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            (() => {
              const point = priceOf(product, market);
              const sameAs = officialSourceUrl(product);
              if (isFeeBased(product.subcategory)) {
                return {
                  "@context": "https://schema.org",
                  "@type": "CreditCard",
                  name: product.name,
                  description: product.description,
                  url: absUrl(productHref(product, market)),
                  ...(sameAs ? { sameAs } : {}),
                  provider: {
                    "@type": "Organization",
                    name: product.brand,
                  },
                  feesAndCommissionsSpecification: point
                    ? `Annual fee ${formatMoney(point.amount, market)}`
                    : "Annual fee not listed",
                };
              }
              return {
                "@context": "https://schema.org",
                "@type": "Product",
                name: product.name,
                brand: {
                  "@type": "Brand",
                  name: product.brand,
                },
                description: product.description,
                category: subLabel(product.subcategory),
                url: absUrl(productHref(product, market)),
                ...(sameAs ? { sameAs } : {}),
                ...(point
                  ? {
                      offers: {
                        "@type": "Offer",
                        price: point.amount,
                        priceCurrency: point.currency,
                        url: absUrl(productHref(product, market)),
                      },
                    }
                  : {}),
              };
            })(),
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: absUrl(homeHref(market)),
              },
              ...(category
                ? [
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: category.name,
                      item: absUrl(categoryHref(category.id, market)),
                    },
                    {
                      "@type": "ListItem",
                      position: 3,
                      name: product.name,
                    },
                  ]
                : [
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: product.name,
                    },
                  ]),
            ],
          }),
        }}
      />

      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: a,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  );
}
