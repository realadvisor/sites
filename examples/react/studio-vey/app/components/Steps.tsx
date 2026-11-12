/** Process list: step title and a short line beside it, full-width rules. */
import './Steps.css';

export function Steps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s.title}>
          <span className="steps-n muted num">{i + 1}.</span>
          <h3 className="steps-title">{s.title}</h3>
          <p className="steps-text">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
