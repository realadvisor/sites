import type { Route } from './+types/kontakt';
import { agencyOf } from '@realadvisor/sites-kit-core/agency';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { img } from '@realadvisor/sites-kit-core/image';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { Layout } from '../components/Layout';
import { AgentCard } from '../components/AgentCard';
import { brandName, site } from '../lib/data.server';
import { telHref } from '../lib/format';
import { PHOTOS } from '../content/places';
import './kontakt.css';

export async function loader() {
  const s = await site();
  return { s, brand: brandName(s), jsonLd: agencyJsonLd(agencyOf(s.org, s.team), new URL('/', siteUrl()).href) };
}

export default function Contact({ loaderData: { s, brand, jsonLd } }: Route.ComponentProps) {
  const a = s.team.address;
  const street = [a.street, [a.postcode, a.city].filter(Boolean).join(' ')].filter(Boolean) as string[];
  const map = a.lat != null && a.lng != null ? `https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=16/${a.lat}/${a.lng}` : undefined;
  const photo = PHOTOS.riverside;
  return (
    <Layout title={`Kontakt | ${brand}`} description={`${brand}, ${street.join(', ')}. ${s.team.phone ?? ''}`} image={img(photo.url, { w: 1200, h: 630 })} jsonLd={jsonLd}>
      <section className="ch">
        <div className="ch-media"><RaImage src={photo.url} alt={photo.alt} width={1600} height={1100} priority sizes="(min-width: 1024px) 55vw, 100vw" mobile={{ width: 800, height: 600 }} /></div>
        <div className="ch-panel">
          <h1 className="h1">Besuchen Sie uns im Seefeld.</h1>
          <address className="ch-addr">
            <span className="caps muted">{brand}</span>
            {street.map((l) => <span key={l}>{l}</span>)}
          </address>
          <ul className="ch-list">
            {s.team.phone && <li><span className="caps muted">Telefon</span><a href={telHref(s.team.phone)}>{s.team.phone}</a></li>}
            {s.team.email && <li><span className="caps muted">E-Mail</span><a href={`mailto:${s.team.email}`}>{s.team.email}</a></li>}
          </ul>
          {map && <a className="more" href={map} rel="noopener" target="_blank">Auf der Karte ansehen</a>}
        </div>
      </section>

      <section className="section flow" aria-labelledby="h-form">
        <div className="wrap cf">
          <div className="cf-side">
            <h2 className="h2" id="h-form">Nachricht schreiben</h2>
            <p className="muted">Ihre Nachricht geht ans Büro. Geht es um ein bestimmtes Objekt, meldet sich die Person, die es betreut.</p>
          </div>
          <EnquiryForm contactReason="other" />
        </div>
      </section>

      <section className="section people" aria-labelledby="h-people">
        <div className="wrap">
          <header className="sec"><h2 className="h2" id="h-people">Direkt erreichen</h2></header>
          <ul className="people-grid">{s.agents.map((ag) => <li key={ag.id}><AgentCard agent={ag} /></li>)}</ul>
        </div>
      </section>
    </Layout>
  );
}
