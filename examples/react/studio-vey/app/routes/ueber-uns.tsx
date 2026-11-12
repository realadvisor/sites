import type { Route } from './+types/ueber-uns';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { img } from '@realadvisor/sites-kit/image';
import { Layout } from '../components/Layout';
import { AgentCard } from '../components/AgentCard';
import { TalkBand } from '../components/TalkBand';
import { areas, brandName, site, sites } from '../lib/data.server';
import { areaUrl } from '../lib/urls';
import { languages } from '../lib/format';
import { PHOTOS } from '../content/places';
import './ueber-uns.css';

export async function loader() {
  const [s, all, places] = await Promise.all([site(), sites.allListings(), areas()]);
  // Figures computed from the data only.
  const available = all.filter((l) => l.status === 'available');
  return {
    s,
    brand: brandName(s),
    forSale: available.filter((l) => l.offer_type === 'buy').length,
    forRent: available.filter((l) => l.offer_type === 'rent').length,
    sold: all.filter((l) => l.status === 'sold').length,
    cities: [...new Set(all.map((l) => l.address.city).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, 'de')) as string[],
    areaCities: places.map((p) => p.city),
  };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? `ein ${one}` : `${n} ${many}`);

export default function About({ loaderData: d }: Route.ComponentProps) {
  const { s, brand, cities } = d;
  const langs = languages([...new Set(s.agents.flatMap((a) => a.languages ?? []))]);
  const photo = PHOTOS.lakeAlps;
  return (
    <Layout title={`Über uns | ${brand}`} description={s.team.description_text ?? `Über ${brand}.`} image={img(photo.url, { w: 1200, h: 630 })}>
      <section className="ab wrap">
        <div className="ab-text">
          <h1 className="h-display">Ein unabhängiges Maklerbüro im Seefeld.</h1>
          {s.team.description_text && <p className="lede">{s.team.description_text}</p>}
        </div>
      </section>
      <div className="ab-media"><RaImage src={photo.url} alt={photo.alt} width={1920} height={900} priority sizes="100vw" mobile={{ width: 800, height: 600 }} /></div>

      <section className="wrap section ab-body flow" aria-labelledby="h-approach">
        <h2 className="h3" id="h-approach">Wie wir arbeiten</h2>
        <div className="prose ab-prose">
          <p>Unser Büro liegt an der {s.team.address.street ?? 'Seefeldstrasse'} in {s.team.address.city}. Wir verkaufen und vermieten Wohnungen und Häuser am Zürichsee, in der Stadt und in Zug.{langs && <> Beraten wird auf {langs}.</>}</p>
          <p>Im Moment betreuen wir {plural(d.forSale, 'Objekt', 'Objekte')} zum Kauf und {plural(d.forRent, 'Objekt', 'Objekte')} zur Miete{cities.length > 0 && <> in {cities.length === 1 ? cities[0] : `${cities.slice(0, -1).join(', ')} und ${cities.at(-1)}`}</>}.{d.sold > 0 && <> Zuletzt verkauft haben wir {plural(d.sold, 'Objekt', 'Objekte')}.</>}</p>
          <p>Jede Besichtigung führt die Person durch, die das Mandat betreut. Zu jedem Objekt gibt es Grundbuchauszug, Pläne und Nebenkostenabrechnung, bevor es online geht. Wie ein Verkauf mit uns abläuft, steht auf der Seite <a href="/verkaufen">Verkaufen</a>.</p>
        </div>
      </section>

      <section className="section people" aria-labelledby="h-team">
        <div className="wrap">
          <header className="sec sec--row"><h2 className="h2" id="h-team">Team</h2><a className="more" href="/team">Alle Profile</a></header>
          <ul className="people-grid">{s.agents.map((a) => <li key={a.id}><AgentCard agent={a} /></li>)}</ul>
        </div>
      </section>

      {cities.length > 0 && (
        <section className="wrap section flow" aria-labelledby="h-cities">
          <header className="sec"><h2 className="h2" id="h-cities">Wo unsere Objekte liegen</h2></header>
          <ul className="cities">{cities.map((c) => <li key={c}>{d.areaCities.includes(c) ? <a href={areaUrl(c)}>{c}</a> : <span>{c}</span>}</li>)}</ul>
        </section>
      )}

      <TalkBand text="Wir treffen Sie im Büro oder bei Ihnen vor Ort." phone={s.team.phone} email={s.team.email} action={{ href: '/kontakt', label: 'Termin vereinbaren' }} />
    </Layout>
  );
}
