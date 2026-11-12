/**
 * Contact and register interest (/contacto, /en/contact): the enquiry form
 * with the unit select (?lot=<id> preselects one, ?aviso=<plan key> asks to
 * be told when a sold-out type comes back, ?dossier=1 asks for the
 * documents), the team, the sales office and its map.
 */
import type { Route } from './+types/contact';
import { img } from '@realadvisor/sites-kit/image';
import { agencyJsonLd } from '@realadvisor/sites-kit/seo';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { siteUrl } from '@realadvisor/sites-kit-react/server/kit';
import { Layout } from '../components/Layout';
import { People, person } from '../components/People';
import { StaticMap } from '../components/StaticMap';
import { legalAgency, loadSite } from '../lib/data.server';
import { LOCALE_OF, alternates, fill, langOfPath, tr } from '../lib/i18n';
import { docHref, tel } from '../lib/docs';
import { kindLabel, planVariants, unitNumber, unitOptions, unitTitle } from '../lib/units.server';
import './contact.css';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const lang = langOfPath(url.pathname);
  const t = tr(lang);
  const site = await loadSite();
  const { dev, org, team } = site;
  const q = url.searchParams;
  const chosen = dev.units.find((u) => u.id === q.get('lot') && u.status !== 'sold');
  const notify = planVariants(dev.units).find((v) => v.key === q.get('aviso'));
  const nearest = notify && (dev.units.find((u) => u.status !== 'sold' && notify.units.some((x) => x.bedrooms === u.bedrooms)) ?? undefined);
  const kind = notify ? (notify.kind === 'atico' ? `${t.kinds.atico[0].toLowerCase()} (${notify.bedrooms} ${t.bedroomsShort})` : kindLabel(notify.kind, lang).toLowerCase()) : '';
  const message = chosen
    ? fill(t.msgUnit, { u: unitNumber(chosen) ? `${t.unit.toLowerCase()} ${unitNumber(chosen)} (${unitTitle(chosen, lang)})` : unitTitle(chosen, lang) })
    : notify
      ? fill(t.msgNotify, { k: kind, w: t.wings[notify.wing] })
      : q.get('dossier') === '1'
        ? t.msgDossier
        : t.msgDefault;
  const office = [org.address?.street, [org.address?.postcode, org.address?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return {
    lang,
    title: `${t.contactH1} | ${dev.title}`,
    description: `${t.contactLead} ${t.sales}: ${org.name}.`,
    image: dev.photos[0] && img(dev.photos[0].url, { w: 1200, h: 630 }),
    jsonLd: agencyJsonLd(legalAgency(site), new URL('/', siteUrl()).href),
    noindex: q.has('lot') || q.has('aviso') || q.has('dossier'),
    people: site.people.map(person),
    orgName: org.name,
    office,
    geo: org.address?.lat != null && org.address?.lng != null ? { lat: org.address.lat, lng: org.address.lng } : null,
    phone: team?.phone,
    email: team?.email,
    notify: !!notify,
    devId: dev.id,
    options: unitOptions(dev.units, lang),
    selected: chosen?.id ?? nearest?.id,
    agentName: dev.agents[0]?.first_name,
    message,
  };
}

export default function Contact({ loaderData: d }: Route.ComponentProps) {
  const { lang } = d;
  const t = tr(lang);
  return (
    <Layout lang={lang} route="contact" title={d.title} description={d.description} image={d.image} jsonLd={d.jsonLd} alternates={alternates('contact')} noindex={d.noindex} page="pg-contact">
      <div className="wrap grid">
        <div className="left">
          <h1>{t.contactH1}</h1>
          <p className="lede">{t.contactLead}</p>
          <People people={d.people} lang={lang} className="people" />
          <dl className="office">
            <div><dt>{t.office}</dt><dd>{d.orgName}{d.office && <><br />{d.office}</>}</dd></div>
            {d.phone && <div><dt>{t.phone}</dt><dd><a href={tel(d.phone)}>{d.phone}</a></dd></div>}
            {d.email && <div><dt>{t.email}</dt><dd><a href={`mailto:${d.email}`}>{d.email}</a></dd></div>}
            <div><dt>{t.dossier}</dt><dd><a href={docHref('dossier', lang)}>{t.dossierPdf}</a></dd></div>
          </dl>
        </div>
        <div className="right" id="consulta">
          <h2>{t.formTitle}</h2>
          {d.notify && <p className="note">{t.notifyText}</p>}
          <EnquiryForm id="contacto" developmentId={d.devId} units={d.options} selectedUnit={d.selected} agentName={d.agentName} locale={LOCALE_OF[lang]} message={d.message} />
        </div>
      </div>
      {d.geo && (
        <section className="wrap map" aria-labelledby="m-h">
          <h2 id="m-h">{t.office}</h2>
          <StaticMap lat={d.geo.lat} lng={d.geo.lng} zoom={16} lang={lang} label={[d.orgName, d.office].filter(Boolean).join(', ')} />
        </section>
      )}
    </Layout>
  );
}
