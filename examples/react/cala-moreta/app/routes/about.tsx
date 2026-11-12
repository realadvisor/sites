import type { Route } from './+types/about';
import { Site } from '../components/Site';
import { Photo } from '../components/Photo';
import { AgentPortrait } from '../components/AgentPortrait';
import { PHOTOS, photoOg } from '../lib/photos';
import { agency, brandName, sites } from '../lib/data.server';
import { agentSlug } from '../lib/data';
import { UI, alternates, fill, href, langOfPath, type Lang } from '../lib/i18n';
import { languageList, telHref } from '../lib/format';
import './about.css';

// Site copy (not API data): the agency's way of working, and the usual steps
// of a purchase in Spain for a buyer from abroad. General steps, no figures.
const COPY: Record<Lang, { story: string[]; steps: [string, string][]; cta: string }> = {
  es: {
    story: [
      'Conocemos estas casas porque vivimos aquí. Sabemos qué cala se llena en agosto, qué camino se corta con la lluvia y qué masía tiene el mejor pozo.',
      'Trabajamos con pocas casas a la vez para poder enseñarlas bien. Cada una tiene un agente que la ha visitado, que conoce a los propietarios y que responde al teléfono.',
      'Muchos compradores viven fuera de España. Atendemos en {langs} y les ponemos en contacto con abogados y gestores independientes de la zona.',
    ],
    steps: [
      ['NIE', 'Solicite el número de identificación de extranjero. Lo pedirán el banco, la notaría y Hacienda.'],
      ['Banco', 'Abra una cuenta en un banco español para los pagos de la compra y los recibos de la casa.'],
      ['Abogado', 'Elija un abogado independiente. Revisará la nota simple del Registro, las licencias y las cargas.'],
      ['Arras', 'Firme el contrato de arras con una señal. Fija el precio, el plazo y las condiciones de la compra.'],
      ['Notaría', 'La escritura se firma ante notario: se paga el resto del precio y recibe las llaves.'],
      ['Registro', 'Se pagan los impuestos de la compra y la escritura se inscribe a su nombre en el Registro de la Propiedad.'],
    ],
    cta: 'Escribir a la oficina',
  },
  en: {
    story: [
      'We know these houses because we live here. We know which cove fills up in August, which track floods after rain and which farmhouse has the best well.',
      'We work with few houses at a time so we can show them properly. Each one has an agent who has visited it, knows the owners and answers the phone.',
      'Many buyers live outside Spain. We work in {langs} and put them in touch with independent local lawyers and gestores.',
    ],
    steps: [
      ['NIE', 'Apply for the foreigner’s identification number. The bank, the notary and the tax office will ask for it.'],
      ['Bank', 'Open an account with a Spanish bank for the purchase payments and the house bills.'],
      ['Lawyer', 'Choose an independent lawyer. They will review the Land Registry extract (nota simple), licences and charges.'],
      ['Deposit', 'Sign the deposit contract (arras). It sets the price, the timing and the conditions of the purchase.'],
      ['Notary', 'The deed is signed before a notary: the balance is paid and you receive the keys.'],
      ['Registry', 'The purchase taxes are paid and the deed is recorded in your name at the Land Registry.'],
    ],
    cta: 'Write to the office',
  },
};

export async function loader({ request }: Route.LoaderArgs) {
  const lang = langOfPath(new URL(request.url).pathname);
  const [ag, agents] = await Promise.all([agency(), sites.agents()]);
  return {
    lang,
    name: brandName(ag),
    town: ag.team?.address.city ?? ag.org.address?.city ?? '',
    langs: languageList([...new Set(agents.flatMap((a) => a.languages ?? []))], lang),
    agents,
  };
}

export default function About({ loaderData: { lang, name, town, langs, agents } }: Route.ComponentProps) {
  const ui = UI[lang];
  const copy = COPY[lang];
  return (
    <Site lang={lang} current="about" title={`${ui.nav.about} | ${name}`} description={fill(ui.aboutLead, { name, town })}
      image={photoOg(PHOTOS.about)} alternates={alternates('about')}>
      <header className="phead wrap">
        <h1 className="display-l">{fill(ui.aboutH1, { town })}</h1>
      </header>

      <section className="wrap story">
        <div className="story-photo"><Photo photo={PHOTOS.about} lang={lang} priority landscapeAt="(max-width: 900px)" sizes="(min-width: 900px) 42vw, 100vw" /></div>
        <div className="story-text">
          <p className="story-lead">{fill(ui.aboutLead, { name, town })}</p>
          {copy.story.map((p, i) => <p key={i}>{fill(p, { langs })}</p>)}
        </div>
      </section>

      <section className="section wrap" aria-labelledby="process-h">
        <div className="section-head">
          <div>
            <h2 id="process-h" className="display-l">{ui.processTitle}</h2>
            <p className="lead">{ui.processLead}</p>
          </div>
        </div>
        <ol className="process">
          {copy.steps.map(([word, line]) => (
            <li key={word}><span className="p-word">{word}</span><span className="p-line">{line}</span></li>
          ))}
        </ol>
      </section>

      <section className="band">
        <Photo photo={PHOTOS.aboutBand} lang={lang} decorative />
      </section>

      {agents.length > 0 && (
        <section className="section wrap">
          <div className="section-head">
            <h2 className="display-m">{ui.teamTitle}</h2>
            <a className="link" href={href('team', lang)}>{ui.teamAll} <span className="arrow" aria-hidden="true">→</span></a>
          </div>
          <ul className="team-row">
            {agents.map((a) => (
              <li key={a.id}>
                <AgentPortrait agent={a} sizes="(min-width: 861px) 22vw, 70vw" className="team-photo" />
                <h3 className="team-name"><a href={href('team', lang, agentSlug(a))}>{a.first_name} {a.last_name}</a></h3>
                {a.title && <p>{a.title}</p>}
                {a.languages?.length ? <p className="team-langs">{ui.speaks} {languageList(a.languages, lang)}</p> : null}
                {a.phone && <p><a className="num" href={telHref(a.phone)}>{a.phone}</a></p>}
                {a.email && <p><a href={`mailto:${a.email}`}>{a.email}</a></p>}
              </li>
            ))}
          </ul>
          <p className="about-cta"><a className="cta cta-accent" href={href('contact', lang)}>{copy.cta}</a></p>
        </section>
      )}
    </Site>
  );
}
