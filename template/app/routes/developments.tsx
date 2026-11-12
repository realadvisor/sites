/**
 * Wiring example only. Replace the markup with the real design.
 * Every published development of the agency (sites.developments()), one
 * card each, linking to its page. No developments: a 404 (do not link the
 * page). A replica keeps the source's path (rockwell.ch: /project-neuf/):
 * change the route in app/routes.ts and DEVELOPMENTS_PATH in site.json.
 */
import type { Route } from './+types/developments';
import { RaImage } from '@realadvisor/sites-kit-react/components/RaImage';
import { notFound } from '@realadvisor/sites-kit-react/server/seo';
import { img } from '@realadvisor/sites-kit-core/image';
import { count, t } from '@realadvisor/sites-kit-core/i18n';
import { developmentStatus, developmentUrl, priceFrom } from '@realadvisor/sites-kit-core/developments';
import { Layout } from '../components/Layout';
import { agency, sites } from '../lib/data.server';

export async function loader() {
  const [a, developments] = await Promise.all([agency(), sites.developments()]);
  if (!developments.length) throw notFound();
  return { name: a.name, developments };
}

export default function Page({ loaderData: { name, developments } }: Route.ComponentProps) {
  const title = t('developments');
  const cover = developments.find((d) => d.photos[0])?.photos[0];
  return (
    <Layout
      title={`${title} | ${name}`}
      description={`${title} ${name}: ${developments.map((d) => [d.title, d.address.city].filter(Boolean).join(', ')).join(' · ')}`.slice(0, 160)}
      image={cover && img(cover.url, { w: 1200, h: 630 })}
    >
      <h1>{title}</h1>
      <ul>
        {developments.map((d, i) => (
          <li key={d.id}>
            <a href={developmentUrl(d)}>
              {d.photos[0]
                ? <RaImage src={d.photos[0]} width={720} height={480} sizes="(min-width: 960px) 33vw, 100vw" priority={i === 0} alt={d.photos[0].alt ?? d.title} />
                : <span aria-hidden="true">{d.title}</span>}
              <h2>{d.title}</h2>
            </a>
            {d.address.city && <p>{d.address.city}</p>}
            <p>
              {[developmentStatus(d), d.stats.units ? `${count('unitsAvailable', d.stats.available)} / ${count('unitsTotal', d.stats.units)}` : '', priceFrom(d)]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {/* Card excerpt: description_text (plain, no markdown), clamped in CSS. */}
            {d.description_text && <p>{d.description_text}</p>}
          </li>
        ))}
      </ul>
    </Layout>
  );
}
