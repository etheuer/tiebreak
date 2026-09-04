import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getComparisonBySlug,
  getComparisons,
  getProductById,
  getProducts,
  inMarket,
  officialSourceUrl,
  priceOf,
  type Product,
} from "@/lib/data";
import { buildVerdict, verdictLine } from "@/lib/verdict";
import {
  buildHref,
  categoryHref,
  compareHref,
  findComparison,
  homeHref,
  isFeeBased,
  priceShort,
  productHref,
  subLabel,
} from "@/lib/nav";
import { pageAlternates, openGraphLocale } from "@/lib/hreflang";
import type { MarketId } from "@/lib/markets";
import { buildAnswer, checkDealBreakers, flattenRows } from "@/lib/decision";
import { buildCompareFaq, buildLensAnswers } from "@/lib/faq";
import { absUrl, clip, CATALOG_AS_OF, SITE_NAME } from "@/lib/site";
import { formatCatalogDate } from "@/lib/format";
import { casesFor } from "@/data/use-cases";
import { SpecTables } from "@/components/SpecTables";
import { ProductStage } from "@/components/ProductStage";
import { ProductPicker } from "@/components/ProductPicker";
import { ComparisonActions } from "@/components/ComparisonActions";
import { DecisionPanel } from "@/components/DecisionPanel";
import { GenerationalUpgradeBanner } from "@/components/GenerationalUpgradeBanner";
import { TcoCard } from "@/components/TcoCard";
import { PhysicalFitSection } from "@/components/PhysicalFitSection";
import { OwnerFrictionCheck } from "@/components/OwnerFrictionCheck";
import { FinanceDisclaimer, PriceNote } from "@/components/CatalogNotes";
import { OfficialSourceLink } from "@/components/OfficialSourceLink";

export async function generateStaticParamsForMarket(market: MarketId) {
  const comparisons = await getComparisons(market);
  return comparisons.map((comp) => ({
    slug: `${comp.productA}-vs-${comp.productB}`,
  }));
}

export async function generateMetadataForMarket(
  { params }: { params: Promise<{ slug: string }> },
  market: MarketId,
): Promise<Metadata> {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug, market);
  if (!comparison) return { title: "Comparison not found" };

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA, market),
    getProductById(comparison.productB, market),
  ]);
  if (!productA || !productB) return { title: comparison.productName };

  if (!inMarket(productA, market) || !inMarket(productB, market))
    return { title: "Comparison not found" };
  const includeUk = inMarket(productA, "uk") && inMarket(productB, "uk");
  const verdict = buildVerdict(productA, productB, market);
  const answer = verdictLine(productA, productB, verdict, market);
  const rawDesc =
    answer.length >= 120 ? answer : `${answer} ${comparison.description}`;
  const description = clip(rawDesc, 158);
  const title =
    comparison.productName.length <= 48
      ? comparison.productName
      : { absolute: comparison.productName };

  return {
    title,
    description,
    alternates: pageAlternates(`/compare/${slug}/`, market, includeUk),
    openGraph: {
      title: comparison.productName,
      description,
      url: compareHref(comparison, market),
      type: "website",
      siteName: SITE_NAME,
      locale: openGraphLocale(market),
    },
    twitter: {
      card: "summary_large_image",
      title: comparison.productName,
      description,
    },
    keywords: comparison.keywords,
  };
}

type SwapOption = {
  id: string;
  name: string;
  priceText: string;
  href: string | null;
};

async function swapOptions(
  target: Product,
  keep: Product,
  market: MarketId,
): Promise<SwapOption[]> {
  const [products, comparisons] = await Promise.all([
    getProducts(market),
    getComparisons(market),
  ]);
  return products
    .filter(
      (p) =>
        p.subcategory === target.subcategory &&
        p.id !== target.id &&
        p.id !== keep.id,
    )
    .sort(
      (x, y) =>
        (priceOf(x, market)?.amount ?? x.price) -
        (priceOf(y, market)?.amount ?? y.price),
    )
    .map((p) => {
      const match = findComparison(comparisons, p.id, keep.id);
      return {
        id: p.id,
        name: p.name,
        priceText: priceShort(p, market),
        href: match ? compareHref(match, market) : null,
      };
    });
}

export async function CompareMatchup({
  params,
  market,
}: {
  params: Promise<{ slug: string }>;
  market: MarketId;
}) {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug, market);

  if (!comparison) {
    notFound();
  }

  const [productA, productB] = await Promise.all([
    getProductById(comparison.productA, market),
    getProductById(comparison.productB, market),
  ]);

  if (
    !productA ||
    !productB ||
    !inMarket(productA, market) ||
    !inMarket(productB, market)
  ) {
    notFound();
  }

  const [allComparisons, categories, swapsA, swapsB] = await Promise.all([
    getComparisons(market),
    getCategories(market),
    swapOptions(productA, productB, market),
    swapOptions(productB, productA, market),
  ]);

  const verdict = buildVerdict(productA, productB, market);
  const category = categories.find((c) => c.id === productA.category);
  const rows = flattenRows(verdict);
  const checks = checkDealBreakers(productA, productB);
  const useCases = casesFor(productA.subcategory);

  const overall = buildAnswer({
    productA,
    productB,
    useCase: null,
    rows,
    checks,
    matters: new Set(),
    market,
  });
  const lenses = buildLensAnswers(
    productA,
    productB,
    rows,
    checks,
    useCases,
    market,
  );
  const faq = buildCompareFaq(
    productA,
    productB,
    verdict,
    overall.headline,
    overall.reasons,
    lenses,
    checks,
    market,
  );

  const otherComparisons = allComparisons
    .filter(
      (c) =>
        (c.productA === productA.id ||
          c.productB === productA.id ||
          c.productA === productB.id ||
          c.productB === productB.id) &&
        c.productName !== comparison.productName,
    )
    .slice(0, 4);
  return (
    <>
      <div className="shell">
        <nav className="cb-breadcrumb" aria-label="Breadcrumb">
          <Link href={homeHref(market)}>Home</Link>
          <span>/</span>
          <Link href={categoryHref(productA.category, market)}>
            {category?.name}
          </Link>
          <span>/</span>
          <span>{subLabel(productA.subcategory)}</span>
        </nav>
        <header className="cb-compare-title">
          <div>
            <p className="eyebrow">Your shortlist, side by side</p>
            <h1>
              {productA.name}
              <span className="text-ink-3 font-normal"> vs </span>
              {productB.name}
            </h1>
            <p>Find the differences that matter for your next decision.</p>
          </div>
        </header>
        <div className="cb-pair">
          <ProductStage product={productA} market={market}>
            <ProductPicker
              name={productA.name}
              options={swapsA.map((o) => ({
                ...o,
                href: o.href ?? buildHref(o.id, productB.id, market),
              }))}
            />
          </ProductStage>
          <ProductStage product={productB} side="b" market={market}>
            <ProductPicker
              name={productB.name}
              options={swapsB.map((o) => ({
                ...o,
                href: o.href ?? buildHref(productA.id, o.id, market),
              }))}
            />
          </ProductStage>
        </div>
        <div className="mt-4">
          <PriceNote subcategory={productA.subcategory} />
        </div>
        <ComparisonActions name={comparison.productName} />
        <DecisionPanel
          productA={productA}
          productB={productB}
          rows={rows}
          useCases={useCases}
          checks={checks}
          market={market}
        />
        <nav className="cb-section-nav" aria-label="Comparison sections">
          <a href="#spec-tables">The differences</a>
          <a href="#tradeoffs">Trade-offs</a>
          <a href="#ownership">Living with it</a>
          <a href="#sources">Sources & notes</a>
        </nav>
        <SpecTables
          productA={productA}
          productB={productB}
          groups={verdict.groups}
          aWins={verdict.aWins}
          bWins={verdict.bWins}
          market={market}
        />
        <section className="cb-section" id="tradeoffs">
          <div className="cb-section-head">
            <div>
              <p className="eyebrow">Both sides of the decision</p>
              <h2>What you gain. What you give up.</h2>
            </div>
          </div>
          <div className="cb-tradeoffs">
            {[productA, productB].map((p, i) => (
              <article className={`cb-tone-${i === 0 ? "a" : "b"}`} key={p.id}>
                <h3>{p.name}</h3>
                <h4>Reasons to choose it</h4>
                <ul>
                  {p.pros.map((pro) => (
                    <li key={pro}>{pro}</li>
                  ))}
                </ul>
                <h4>Worth considering</h4>
                <ul>
                  {p.cons.map((con) => (
                    <li key={con}>{con}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section className="cb-section" id="ownership">
          <div className="cb-section-head">
            <div>
              <p className="eyebrow">Beyond the spec sheet</p>
              <h2>Living with your choice.</h2>
              <p>Explore the ownership details available for this pair.</p>
            </div>
          </div>
          <GenerationalUpgradeBanner productA={productA} productB={productB} />
          <TcoCard productA={productA} productB={productB} market={market} />
          <PhysicalFitSection productA={productA} productB={productB} />
          <OwnerFrictionCheck productA={productA} productB={productB} />
        </section>
        <section className="cb-section cb-evidence" id="sources">
          <p className="eyebrow">Know what’s behind the comparison</p>
          <h2>Published specs. Visible sources.</h2>
          <p>
            Clinchmark compares manufacturer specifications and other published
            information. We have not independently lab-tested these products.
            Editorial assessments and unknown values are identified in the
            specification details.
          </p>
          <p>
            Catalog snapshot: {formatCatalogDate(CATALOG_AS_OF)}. Prices,
            availability, and provider terms can change.
          </p>
          <div className="cb-source-grid">
            {[productA, productB].map((p) => {
              const url = officialSourceUrl(p);
              return url ? (
                <OfficialSourceLink
                  key={p.id}
                  href={url}
                  productId={p.id}
                  brand={p.brand}
                >
                  <strong>{p.name} ↗</strong>
                  <small>Visit the official product source</small>
                </OfficialSourceLink>
              ) : (
                <p key={p.id}>{p.name}: official source not listed.</p>
              );
            })}
          </div>
          {isFeeBased(productA.subcategory) && (
            <FinanceDisclaimer products={[productA, productB]} />
          )}
        </section>
        <section className="cb-section">
          <div className="cb-section-head">
            <h2>Still weighing it up?</h2>
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
        <section className="cb-section">
          <div className="cb-section-head">
            <h2>A few other possibilities.</h2>
          </div>
          <div className="cb-grid-pairs">
            {otherComparisons.map((c) => (
              <Link
                className="card p-6"
                key={c.productName}
                href={compareHref(c, market)}
              >
                {c.productName} ↗
              </Link>
            ))}
          </div>
        </section>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: comparison.productName,
            url: absUrl(compareHref(comparison, market)),
            itemListElement: [productA, productB].map((product, index) => {
              const fee = isFeeBased(product.subcategory);
              const point = priceOf(product, market);
              const sameAs = officialSourceUrl(product);
              return {
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Product",
                  name: product.name,
                  brand: {
                    "@type": "Brand",
                    name: product.brand,
                  },
                  description: product.description,
                  url: absUrl(productHref(product, market)),
                  ...(sameAs ? { sameAs } : {}),
                  ...(fee
                    ? {
                        additionalProperty: [
                          {
                            "@type": "PropertyValue",
                            name: "Annual fee",
                            value: point?.amount ?? product.price,
                            unitText: `${point?.currency ?? "USD"}/year`,
                          },
                        ],
                      }
                    : point
                      ? {
                          offers: {
                            "@type": "Offer",
                            price: point.amount,
                            priceCurrency: point.currency,
                            url: absUrl(productHref(product, market)),
                          },
                        }
                      : {}),
                },
              };
            }),
          }),
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
                      name: subLabel(productA.subcategory),
                    },
                  ]
                : [
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: subLabel(productA.subcategory),
                    },
                  ]),
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: comparison.productName,
            url: absUrl(compareHref(comparison, market)),
            dateModified: CATALOG_AS_OF,
          }),
        }}
      />

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
    </>
  );
}
