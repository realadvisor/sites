// Wiring example only. Replace the markup with the real design.
import type { Route } from './+types/listing';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { SafeHtml, sanitized } from '@realadvisor/sites-kit-react/components/SafeHtml';
import { useKit } from '@realadvisor/sites-kit-react/components/Document';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { listingIdFromSlug } from '@realadvisor/sites-kit-core';
import { formatPrice, formatSurface, listingUrl } from '@realadvisor/sites-kit-core/format';
import { img } from '@realadvisor/sites-kit-core/image';
import { featureLabel, offerTypeLabel, propertyTypeLabel, t } from '@realadvisor/sites-kit-core/i18n';
import { listingJsonLd, listingRef, listingTitle } from '@realadvisor/sites-kit-core/seo';
import { Layout } from '../components/Layout';
import { sites } from '../lib/data.server';

export async function loader({ params }: Route.LoaderArgs) {
  const listing = await sites.listing(params.slug);
  // Not found: the site's 404 page with a real 404. A slug that ends with a
  // listing id was a listing of this site (sold, removed from the portal):
  // 410 Gone with "no longer available", so search engines drop it.
  if (!listing) throw notFound(!!listingIdFromSlug(params.slug));
  // Same-city listings: a reused title gets the reference (listingTitle).
  const sameCity = listing.address.city ? await sites.allListings({ city: listing.address.city }) : [];
  return { listing, title: listingTitle(listing, sameCity) };
}

export default function Page({ loaderData: { listing, title } }: Route.ComponentProps) {
  const kit = useKit();
  const plain = (listing.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const pageUrl = new URL(listingUrl(listing), kit.siteUrl).href;
  return (
    <Layout
      title={`${title} | ${formatPrice(listing)}`}
      description={plain.slice(0, 155) || listing.title}
      image={listing.photos[0] && img(listing.photos[0].url, { w: 1200, h: 630 })}
      jsonLd={listingJsonLd(listing, pageUrl)}
    >
      <h1>{listing.title}</h1>
      <p>{formatPrice(listing)}</p>
      <dl>
        {/* Labels, never raw codes: "À vendre" (not "buy" / "ACHETER"), "Attique" (not "apartment_penthouse" / "Bien"). */}
        <dt>{t('offer')}</dt><dd>{offerTypeLabel(listing.offer_type)}</dd>
        <dt>{t('propertyType')}</dt><dd>{propertyTypeLabel(listing.property_type)}</dd>
        {listing.rooms != null && <><dt>{t('rooms')}</dt><dd>{listing.rooms}</dd></>}
        {listing.living_surface != null && <><dt>{t('livingArea')}</dt><dd>{formatSurface(listing.living_surface)}</dd></>}
      </dl>
      {listing.agent && <p>{listing.agent.first_name} {listing.agent.last_name}</p>}
      {listing.photos[0] && (
        <RaImage src={listing.photos[0]} width={960} height={640} sizes="(min-width: 960px) 960px, 100vw" style={{ maxWidth: '100%', height: 'auto' }} priority alt={listing.photos[0].alt ?? listing.title} />
      )}
      <p>{t('reference')} {listingRef(listing)}</p>
      {/* description: HTML the SDK already sanitized; SafeHtml sanitizes again. Never dangerouslySetInnerHTML. */}
      {listing.description && <SafeHtml className="prose" html={sanitized(listing.description)} />}
      {listing.features?.length ? (
        <>
          <h2>{t('features')}</h2>
          <ul>{listing.features.map((f) => <li key={f}>{featureLabel(f)}</li>)}</ul>
        </>
      ) : null}
      <h2>Contact</h2>
      <EnquiryForm
        listingId={listing.id}
        agentId={listing.agent?.id}
        agentName={listing.agent?.first_name}
        message={t('interested', { title: listing.title, ref: listingRef(listing) })}
      />
    </Layout>
  );
}
