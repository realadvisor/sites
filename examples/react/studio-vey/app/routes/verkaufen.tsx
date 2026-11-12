import type { Route } from './+types/verkaufen';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { PlacePhoto } from '../components/PlacePhoto';
import { Steps } from '../components/Steps';
import { Collection } from '../components/Collection';
import { AgentCard } from '../components/AgentCard';
import { AREAS } from '../content/places';
import { SELL_STEPS } from '../content/process';
import { brandName, site, sites } from '../lib/data.server';
import { telHref } from '../lib/format';
import './verkaufen.css';

export async function loader() {
  const [s, sold] = await Promise.all([site(), sites.listings({ status: 'sold', limit: 3 })]);
  return { s, brand: brandName(s), sold: sold.data };
}

export default function Sell({ loaderData: { s, brand, sold } }: Route.ComponentProps) {
  const photo = sold.find((l) => l.photos[0])?.photos[0];
  return (
    <Layout title={`Immobilie verkaufen und bewerten lassen | ${brand}`} description={`Verkaufen mit ${brand}: persönliche Bewertung, sorgfältige Vorbereitung und Begleitung bis zur Beurkundung in Zürich, am See und in Zug.`} image={photo && img(photo.url, { w: 1200, h: 630 })}>
      <section className="sh">
        <div className="wrap sh-in">
          <div className="sh-text">
            <h1 className="h-display">Ihre Wohnung oder Ihr Haus verkaufen</h1>
            <p className="lede muted">Wir bewerten vor Ort, stellen die Unterlagen für Käufer und Banken zusammen und führen jede Besichtigung selbst. Die Bewertung ist unverbindlich.</p>
            <p className="sh-actions"><a className="button button--solid" href="#bewertung">Bewertung anfragen</a>{s.team.phone && <a className="more" href={telHref(s.team.phone)}>{s.team.phone}</a>}</p>
          </div>
          {/* Houses on the slope above the lake (bucket photo): the sold villa itself already leads the "Zuletzt vermittelt" row below. */}
          <div className="sh-media"><PlacePhoto photo={AREAS.kuesnacht!.photo} width={1200} height={1200} priority sizes="(min-width: 1024px) 40vw, 100vw" /></div>
        </div>
      </section>

      <section className="section wrap flow" aria-labelledby="steps-title">
        <header className="sec"><h2 className="h2" id="steps-title">So läuft ein Verkauf ab</h2></header>
        <Steps steps={SELL_STEPS} />
      </section>

      <Collection id="c-sold" label="Verkauft" title="Zuletzt vermittelt" listings={sold} href="/verkauft" linkLabel="Alle verkauften Objekte" />

      <section id="bewertung" className="val section" aria-labelledby="val-title">
        <div className="wrap val-in">
          <div className="val-side">
            <h2 className="h2" id="val-title">Was ist Ihre Immobilie wert?</h2>
            <p className="muted">Beschreiben Sie Ihr Objekt in ein paar Sätzen: Art, Ort, Grösse und Zeitrahmen. Wir melden uns für einen Termin vor Ort. Die Einschätzung ist unverbindlich.</p>
            <ul className="val-agents">{s.agents.map((a) => <li key={a.id}><AgentCard agent={a} layout="row" link /></li>)}</ul>
          </div>
          <EnquiryForm id="valuation" contactReason="valuation" message="Guten Tag, ich möchte meine Immobilie bewerten lassen. Art und Ort des Objekts: " submitLabel="Bewertung anfragen" />
        </div>
      </section>
    </Layout>
  );
}
