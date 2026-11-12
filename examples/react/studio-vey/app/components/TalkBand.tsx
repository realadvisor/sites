/** Contact band: plain heading, one sentence, phone, e-mail and an appointment link. */
import { telHref } from '../lib/format';
import './TalkBand.css';

type Props = { title?: string; text?: string; phone?: string; email?: string; action?: { href: string; label: string } };

export function TalkBand({ title = 'Kontakt', text, phone, email, action }: Props) {
  return (
    <section className="talk on-accent" aria-labelledby="talk-title">
      <div className="wrap talk-in">
        <div className="talk-head">
          <h2 className="talk-title h2" id="talk-title">{title}</h2>
          {text && <p className="talk-text">{text}</p>}
        </div>
        <ul className="talk-actions">
          {phone && <li><span className="caps">Telefon</span><a href={telHref(phone)}>{phone}</a></li>}
          {email && <li><span className="caps">E-Mail</span><a href={`mailto:${email}`}>{email}</a></li>}
          {action && <li><span className="caps">Termin</span><a href={action.href}>{action.label}</a></li>}
        </ul>
      </div>
    </section>
  );
}
