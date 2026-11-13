// Wiring example only. Replace the markup with the real home page design.
import type { Route } from './+types/home';
import { useKit } from '@realadvisor/sites-kit-react/components/Document';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { agencyJsonLd } from '@realadvisor/sites-kit-core/seo';
import { img } from '@realadvisor/sites-kit-core/image';
import { Layout } from '../components/Layout';
import { agency } from '../lib/data.server';

export async function loader() {
  return { agency: await agency() };
}

export default function Page({ loaderData: { agency: a } }: Route.ComponentProps) {
  const kit = useKit();
  return (
    <Layout
      title={a.name}
      description={a.description_text?.slice(0, 155) ?? a.name}
      image={a.logo ? img(a.logo.url, { w: 1200, h: 630, fit: 'fit' }) : undefined}
      jsonLd={agencyJsonLd(a, kit.siteUrl)}
    >
      <h1>{a.name}</h1>
      <p><a href="/listings">Listings</a></p>
      <h2>Contact</h2>
      <EnquiryForm contactReason="other" />
    </Layout>
  );
}
