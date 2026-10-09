import { cloneElement, isValidElement, useEffect, useId, useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import { X, Check, ArrowUpRight, Box, Layers3 } from "lucide-react";
export function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
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
        className="modal"
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
  return (
    <svg
      className={`piece ${large ? "large" : ""}`}
      viewBox="0 0 460 300"
      role="img"
      aria-label="Pieza de referencia: X 12 mm, Y 10 mm, pines 7 y 5 mm, alojamientos 7,10 y 5,10 mm"
    >
      <defs>
        <linearGradient id="top" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a3d9c1" />
          <stop offset="1" stopColor="#59a789" />
        </linearGradient>
        <linearGradient id="side" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#4a8f74" />
          <stop offset="1" stopColor="#29634f" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="245"
        cy="242"
        rx="137"
        ry="20"
        fill="#0e4436"
        opacity=".15"
        filter="url(#shadow)"
      />
      <g stroke="#2c745b" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M98 159 248 83 377 154 230 236z" fill="url(#top)" />
        <path d="M98 159v23l132 78v-24z" fill="#3f866c" />
        <path d="m230 236 147-82v23l-147 83z" fill="url(#side)" />
        <ellipse cx="284" cy="152" rx="27" ry="15" fill="#275d4a" />
        <path d="M257 152q27-18 54 0" fill="none" stroke="#bce6d3" />
        <ellipse cx="239" cy="182" rx="20" ry="12" fill="#275d4a" />
        <path d="M219 182q20-13 40 0" fill="none" stroke="#bce6d3" />
        <path
          d="M151 148v-38c0-20 57-20 57 0v38c0 21-57 21-57 0"
          fill="url(#side)"
        />
        <ellipse cx="179.5" cy="110" rx="28.5" ry="16" fill="url(#top)" />
        <path
          d="M211 121V94c0-15 41-15 41 0v27c0 15-41 15-41 0"
          fill="url(#side)"
        />
        <ellipse cx="231.5" cy="94" rx="20.5" ry="12" fill="url(#top)" />
      </g>
      <g fill="none" stroke="#6a8d7f" strokeWidth="1" strokeDasharray="3 4">
        <path d="m91 192-14 9 147 84 12-7M389 176l17 10-146 80-15-6M179 88V55h-40M314 151h66V107" />
      </g>
      <g fill="#355f4e" fontFamily="monospace" fontSize="12">
        <text x="123" y="261" transform="rotate(30 123 261)">
          X · 12 mm
        </text>
        <text x="303" y="258" transform="rotate(-29 303 258)">
          Y · 10 mm
        </text>
        <text x="108" y="48">
          Ø 7 / 5 mm
        </text>
        <text x="330" y="98">
          7,10 / 5,10
        </text>
      </g>
    </svg>
  );
}
