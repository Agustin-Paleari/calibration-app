import { cloneElement, isValidElement, useEffect, useId, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { X, Check, ArrowUpRight, Box, Layers3 } from "lucide-react";
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const root = ref.current!;
    const focusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"]',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = focusable(),
          first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
      old?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="icon-btn close"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">TU LABORATORIO</span>
        <h2 id="modal-title">{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(
            children as ReactElement<{
              id: string;
              "aria-describedby"?: string;
            }>,
            { id, "aria-describedby": hint ? `${id}-hint` : undefined },
          )
        : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "good" | "warning" | "neutral";
}) {
  return (
    <span className={`badge ${tone}`}>
      <span />
      {children}
    </span>
  );
}
export function Empty({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Layers3 size={28} />
      </div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action && (
        <button className="btn secondary" onClick={onAction}>
          {action}
          <ArrowUpRight size={16} />
        </button>
      )}
    </div>
  );
}
export function Criterion({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={`criterion ${pass ? "pass" : ""}`}>
      <span>
        {pass ? <Check size={15} /> : <span className="criterion-dot" />}
      </span>
      {label}
      <strong>{pass ? "Aprobado" : "Revisar"}</strong>
    </div>
  );
}
export function Logo() {
  return (
    <>
      <span className="logo-mark">
        <Box size={27} strokeWidth={1.6} />
      </span>
      <span className="logo-type">
        calibration
        <span>
          hub<span className="logo-dot">.</span>
        </span>
      </span>
    </>
  );
}
export function Piece({ large = false }: { large?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`piece ${large ? "large" : ""}`}
      viewBox="0 0 460 300"
      role="img"
      aria-label="Bloque de referencia de 12 por 10 mm, con un único alojamiento central y un pin separado para probar el encastre"
    >
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a3d9c1" />
          <stop offset="1" stopColor="#59a789" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#4a8f74" />
          <stop offset="1" stopColor="#29634f" />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <ellipse
        cx="192"
        cy="234"
        rx="117"
        ry="16"
        fill="#0e4436"
        opacity=".15"
        filter={`url(#${id}-shadow)`}
      />
      <ellipse
        cx="368"
        cy="206"
        rx="28"
        ry="9"
        fill="#0e4436"
        opacity=".15"
        filter={`url(#${id}-shadow)`}
      />
      <g stroke="#2c745b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="m66 145 130-71 129 76-129 75z" fill={`url(#${id}-top)`} />
        <path d="M66 145v24l130 79v-23z" fill="#3f866c" />
        <path d="m196 225 129-75v24l-129 74z" fill={`url(#${id}-side)`} />
        <ellipse cx="196" cy="148" rx="35" ry="21" fill="#275d4a" />
        <path d="M162 151q34-20 68 0" fill="none" stroke="#7fbea1" />
        <path
          d="M344 190v-51c0-16 49-16 49 0v51c0 17-49 17-49 0"
          fill={`url(#${id}-side)`}
        />
        <ellipse
          cx="368.5"
          cy="139"
          rx="24.5"
          ry="14"
          fill={`url(#${id}-top)`}
        />
      </g>
      <g fill="none" stroke="#6a8d7f" strokeWidth="1" strokeDasharray="3 4">
        <path d="m58 179-10 9 144 85 13-9M337 177l14 9-133 79M196 122V47h-55M369 120V86h39" />
      </g>
      <g fill="#355f4e" fontFamily="monospace" fontSize="11">
        <text x="99" y="241" transform="rotate(30 99 241)">
          X · 12 mm
        </text>
        <text x="257" y="247" transform="rotate(-29 257 247)">
          Y · 10 mm
        </text>
        <text x="87" y="40">
          Alojamiento central
        </text>
        <text x="350" y="77">
          Pin
        </text>
      </g>
    </svg>
  );
}
