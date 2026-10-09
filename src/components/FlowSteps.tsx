import { Check } from "lucide-react";
const steps = [
  ["Equipo y resina", "Elegí qué vas a calibrar"],
  ["Imprimí y medí", "Registrá tu ensayo"],
  ["Revisá y ajustá", "Guardá lo que funcionó"],
];
export function FlowSteps({
  current,
  complete = false,
  compact = false,
}: {
  current: 0 | 1 | 2;
  complete?: boolean;
  compact?: boolean;
}) {
  return (
    <ol
      className={`flow-steps ${compact ? "compact" : ""}`}
      aria-label="Recorrido de calibración"
    >
      {steps.map(([title, detail], i) => (
        <li
          key={title}
          className={
            complete || i < current ? "done" : i === current ? "current" : ""
          }
          aria-current={!complete && i === current ? "step" : undefined}
        >
          <span className="flow-number" aria-hidden="true">
            {complete || i < current ? <Check size={15} /> : i + 1}
          </span>
          <div>
            <strong>{title}</strong>
            {!compact && <small>{detail}</small>}
          </div>
        </li>
      ))}
    </ol>
  );
}
