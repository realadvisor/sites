/**
 * Mes favoris: the shortlist and saved searches kept in this browser
 * (saved() in app/client.ts renders them from localStorage). Static: no data here.
 */
import { Layout } from '../components/Layout';
import { PageHead } from '../components/PageHead';
import { searchUrl } from '../lib/site';
import './favoris.css';

export default function Page() {
  return (
    <Layout nav="saved" title="Mes favoris | Vellane Immobilier" description="Vos annonces et recherches enregistrées sur cet appareil." noindex>
      <PageHead title="Mes favoris" lede="Les annonces et les recherches que vous avez enregistrées. Elles restent sur cet appareil : rien n'est envoyé à nos agences." />
      <div className="wrap saved">
        <div className="saved__empty" data-saved-empty="">
          <p>Aucun favori pour l'instant. Touchez le cœur d'une annonce pour la retrouver ici.</p>
          <p className="saved__go"><a className="vb" href={searchUrl('buy')}>Biens à vendre</a><a className="vb vb--ghost" href={searchUrl('rent')}>Biens à louer</a></p>
        </div>
        <ul className="saved__list" data-saved-list="" hidden></ul>
        <section className="saved__searches" data-searches="" hidden aria-labelledby="ss-h">
          <h2 id="ss-h" className="h3">Recherches enregistrées</h2>
          <ul data-searches-list=""></ul>
        </section>
      </div>
    </Layout>
  );
}
