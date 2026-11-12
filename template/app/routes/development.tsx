/**
 * Wiring example only. Replace the markup with the real design.
 * One development: photos, description, key figures, the units table
 * (availability and prices; a unit that is a public listing links to it),
 * location, agent and an enquiry form. Unknown slug: 404.
 */
import type { Route } from './+types/development';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { SafeHtml, sanitized } from '@realadvisor/sites-kit-react/components/SafeHtml';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit-core/image';
import { LOCALE, formatSurface } from '@realadvisor/sites-kit-core/format';
import { count, featureLabel, t } from '@realadvisor/sites-kit-core/i18n';
import {
  DEVELOPMENTS_PATH, developmentStatus, formatFloor, formatRooms, priceFrom, sortUnits, unitEnquiryUrl, unitLabel, unitListingUrl, unitOptions, unitPrice,
  unitStatusLabel,
} from '@realadvisor/sites-kit-core/developments';
import { Layout } from '../components/Layout';
import { agency, sites } from '../lib/data.server';

export async function loader({ params, request }: Route.LoaderArgs) {
  const dev = await sites.development(params.slug);
  if (!dev) throw notFound();
  // A unit row's "Enquire" link (?lot=<id>#contact) preselects it in the form.
  return { dev, name: (await agency()).name, lot: new URL(request.url).searchParams.get('lot') };
}

const range = (r: { min: number; max: number } | undefined, f: (n: number) => string) =>
  r ? (r.min === r.max ? f(r.min) : `${f(r.min)} – ${f(r.max)}`) : '';

export default function Page({ loaderData: { dev, name, lot } }: Route.ComponentProps) {
  const units = sortUnits(dev.units);
  const agent = dev.agents[0];
  const chosen = units.find((u) => u.id === lot && u.status !== 'sold');
  const place = [dev.address.street, [dev.address.postcode, dev.address.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const summary = [
    developmentStatus(dev),
    dev.stats.units ? `${count('unitsAvailable', dev.stats.available)} / ${count('unitsTotal', dev.stats.units)}` : '',
    priceFrom(dev),
  ].filter(Boolean).join(' · ');
  const description = (dev.description_text ?? [dev.title, place, summary].filter(Boolean).join(' – ')).replace(/\s+/g, ' ').slice(0, 155);
  return (
    <Layout
      title={`${dev.title}${dev.address.city && !dev.title.includes(dev.address.city) ? ` · ${dev.address.city}` : ''} | ${name}`}
      description={description}
      image={dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 })}
    >
      <p><a href={DEVELOPMENTS_PATH}>{t('developments')}</a></p>
      <h1>{dev.title}</h1>
      {place && <p>{place}</p>}
      {summary && <p>{summary}</p>}
      {dev.photos[0] && (
        <RaImage src={dev.photos[0]} width={1600} height={900} priority sizes="100vw" mobile={{ width: 800, height: 600 }} alt={dev.photos[0].alt ?? dev.title} />
      )}
      {dev.photos.length > 1 && (
        <ul>
          {dev.photos.slice(1).map((p, i) => (
            <li key={p.url}><RaImage src={p} width={720} height={480} sizes="(min-width: 960px) 33vw, 100vw" alt={p.alt ?? `${dev.title}, ${i + 2}`} /></li>
          ))}
        </ul>
      )}
      {dev.description && <SafeHtml className="prose" html={sanitized(dev.description)} />}

      <dl>
        {dev.stats.units > 0 && <><dt>{t('units')}</dt><dd>{count('unitsTotal', dev.stats.units)}</dd></>}
        {dev.stats.rooms && <><dt>{t('rooms')}</dt><dd>{range(dev.stats.rooms, (n) => formatRooms(n))}</dd></>}
        {dev.stats.living_surface && <><dt>{t('livingArea')}</dt><dd>{range(dev.stats.living_surface, formatSurface)}</dd></>}
        {dev.delivery_date && <><dt>{t('delivery')}</dt><dd>{new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(new Date(dev.delivery_date))}</dd></>}
      </dl>

      {units.length > 0 && (
        <section id="lots">
          <h2>{t('units')}</h2>
          <table>
            <thead><tr><th>{t('unit')}</th><th>{t('floor')}</th><th>{t('livingArea')}</th><th>{t('price')}</th><th>{t('status')}</th></tr></thead>
            <tbody>
              {units.map((u) => {
                const href = unitListingUrl(u);
                return (
                  <tr key={u.id} data-status={u.status}>
                    <td>{href ? <a href={href}>{formatRooms(u.rooms) || t('unit')}</a> : formatRooms(u.rooms) || t('unit')}
                      {u.features?.length ? <small>{` · ${u.features.map((f) => featureLabel(f)).join(', ')}`}</small> : null}</td>
                    <td>{formatFloor(u)}</td>
                    <td>{formatSurface(u.living_surface)}</td>
                    <td>{u.status === 'available' ? unitPrice(u) : '–'}</td>
                    <td>{unitStatusLabel(u)}{href && u.status === 'available' ? <> · <a href={href}>{t('seeListing')}</a></> : null}
                      {u.status !== 'sold' && <> · <a href={unitEnquiryUrl(dev, u)} rel="nofollow">{t('askUnit')}</a></>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {dev.address.lat != null && dev.address.lng != null && (
        <section>
          <h2>{t('location')}</h2>
          {place && <p>{place}</p>}
          <p><a href={`https://www.google.com/maps/search/?api=1&query=${dev.address.lat},${dev.address.lng}`} target="_blank" rel="noopener">{t('openInGoogleMaps')}</a></p>
        </section>
      )}

      <section id="contact">
        <h2>{t('contactUs')}</h2>
        {agent && <p>{agent.first_name} {agent.last_name}{agent.phone && <> · <a href={`tel:${agent.phone.replace(/[^\d+]/g, '')}`}>{agent.phone}</a></>}</p>}
        {/* developmentId links the enquiry to the development in the CRM (its broker gets it); the required unit select files it on a unit. */}
        <EnquiryForm
          developmentId={dev.id}
          units={unitOptions(units)}
          selectedUnit={chosen?.id}
          agentName={agent?.first_name}
          message={chosen ? t('unitInterested', { unit: unitLabel(chosen), title: dev.title }) : t('devInterested', { title: dev.title })}
        />
      </section>
    </Layout>
  );
}
