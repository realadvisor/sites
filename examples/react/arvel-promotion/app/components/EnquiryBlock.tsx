/**
 * Programme enquiry: the kit EnquiryForm on a paper panel, with the
 * programme's adviser. Always `developmentId`, plus the unit select (every
 * development enquiry is filed on a unit) with `selectedUnit` preselected.
 */
import type { DevelopmentWithUnits } from '@realadvisor/sites-sdk/types';
import { EnquiryForm } from '@realadvisor/sites-kit-react/components/EnquiryForm';
import { AgentPhoto } from './AgentPhoto';
import { enquiryMessage, languageList, telHref, unitOptions } from '../lib/fr';
import './EnquiryBlock.css';

type Props = {
  programme: Pick<DevelopmentWithUnits, 'id' | 'title' | 'units' | 'agents'>;
  selectedUnit?: string;
  id?: string;
  title?: string;
};

export function EnquiryBlock({ programme: d, selectedUnit, id = 'contact', title = `Recevoir la brochure et les prix de ${d.title}` }: Props) {
  const units = unitOptions(d.units);
  const chosen = d.units.find((u) => u.id === selectedUnit && u.status !== 'sold');
  const agent = d.agents[0];
  return (
    <section className="section enquiry-section" id={id} aria-labelledby={`${id}-h`}>
      <div className="wrap eb-grid">
        <div className="eb-side">
          <h2 id={`${id}-h`} className="eb-h">{title}</h2>
          <p className="muted">Votre conseiller vous rappelle, vous envoie le plan du logement et propose un rendez-vous au bureau ou sur place.</p>
          {agent && (
            <div className="eb-agent">
              <AgentPhoto agent={agent} />
              <div>
                <p className="eb-an">{agent.first_name} {agent.last_name}</p>
                <p className="eb-ar">{agent.title ?? `Ventes, ${d.title}`}{agent.languages?.length ? ` · ${languageList(agent.languages)}` : ''}</p>
                <p className="eb-ac">
                  {agent.phone && <a href={telHref(agent.phone)} className="num">{agent.phone}</a>}
                  {agent.email && <a href={`mailto:${agent.email}`}>{agent.email}</a>}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="paper eb-card">
          <EnquiryForm
            id={`${id}-form`}
            developmentId={d.id}
            units={units}
            selectedUnit={chosen?.id}
            agentId={agent?.id}
            agentName={agent?.first_name}
            message={enquiryMessage(d, chosen)}
            submitLabel="Envoyer ma demande"
          />
        </div>
      </div>
    </section>
  );
}
