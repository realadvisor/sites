/** Sell: the valuation request (kit EnquiryForm, reason "valuation"), how it works, the agencies and recent sales. */
import type { Route } from './+types/vendre';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { ListingCard } from '../components/ListingCard';
import { siteData, sites } from '../lib/data.server';
import { joinFr, R, teamHref, teamShortName, tel } from '../lib/site';
import './vendre.css';

export async function loader() {
  const [{ org, teams }, sold] = await Promise.all([siteData(), sites.allListings({ status: 'sold' })]);
  return { brand: org.name.replace(/\s+SAS$/, ''), teams, sold: sold.slice(0, 3), nSold: sold.length };
}

export default function Page({ loaderData: { brand, teams, sold, nSold } }: Route.ComponentProps) {
  const cities = [...new Set(teams.map((t) => t.address.city).filter(Boolean))] as string[];
  return (
    <Layout nav="sell" title={`Estimer mon bien à ${joinFr(cities)} | ${brand}`}
      description={`Demandez une estimation gratuite de votre appartement ou de votre maison à ${joinFr(cities)} : visite par un agent de l'agence la plus proche et avis de valeur écrit.`}>
      <PageHead title="Estimer mon bien" lede={`Un agent de l'agence la plus proche visite votre bien à ${joinFr(cities)} ou alentour, puis vous remet un avis de valeur écrit. Gratuit et sans engagement.`} />

      <div className="wrap sell">
        <div className="sell__text">
          <h2 className="h3">Comment ça se passe</h2>
          <ol className="how">
            <li><strong>Vous nous décrivez le bien</strong> dans le formulaire : adresse, type, surface, ce qui compte pour vous. L'agence du secteur vous rappelle pour fixer une visite.</li>
            <li><strong>L'agent visite</strong> le bien avec vous, environ une heure. Il regarde l'état, l'exposition, l'immeuble ou le terrain, et note les diagnostics déjà faits.</li>
            <li><strong>Vous recevez un avis de valeur écrit</strong> avec une fourchette de prix, les ventes comparables du quartier que nous avons réalisées ou relevées, et le prix de mise en vente que nous conseillons.</li>
          </ol>
          <p className="muted">Vous décidez ensuite, sans délai imposé. Si vous nous confiez la vente, le mandat précise nos honoraires avant toute signature.</p>
          <h2 className="h3 sell__h">Nos agences</h2>
          <ul className="offices">
            {teams.map((t) => (
              <li key={t.id}>
                <a href={teamHref(t)} className="offices__name">{teamShortName(t)}</a>
                <span className="muted">{[t.address.street, t.address.city].filter(Boolean).join(', ')}</span>
                {t.phone && <a className="num" href={tel(t.phone)}>{t.phone}</a>}
              </li>
            ))}
          </ul>
        </div>
        <div className="sell__form">
          <h2 className="h3">Votre demande d'estimation</h2>
          <EnquiryForm id="valuation" contactReason="valuation" message="Bonjour, je souhaite faire estimer mon bien. Adresse : … Type et surface : …" submitLabel="Demander mon estimation" />
        </div>
      </div>

      {nSold > 0 && (
        <section className="wrap recent" aria-labelledby="sold-h">
          <div className="section-head">
            <h2 id="sold-h" className="h3">Vendus récemment par nos agences</h2>
            <a className="link" href={R.sold}>Tous nos biens vendus</a>
          </div>
          <ul className="cards">{sold.map((l) => <li key={l.id}><ListingCard listing={l} /></li>)}</ul>
        </section>
      )}
    </Layout>
  );
}
