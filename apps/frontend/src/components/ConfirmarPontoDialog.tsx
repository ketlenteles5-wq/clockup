import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  tipoLabel: string;
  horario: string;
  modalidade: string;
  carregando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmarPontoDialog({
  open,
  tipoLabel,
  horario,
  modalidade,
  carregando,
  onCancel,
  onConfirm,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 50);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      const el = previousFocusRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (carregando) return;
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, carregando]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (carregando) return;
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-scrim-in motion-reduce:animate-none"
      />

      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-ponto-title"
        aria-describedby="confirm-ponto-desc"
        className="relative w-full max-w-sm bg-white rounded-3xl p-6 animate-dialog-in motion-reduce:animate-none"
        style={{ boxShadow: "0 24px 48px rgba(15,23,42,0.25)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#eff5ff] flex items-center justify-center mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1B2A5E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2
            id="confirm-ponto-title"
            className="text-lg font-bold text-[#1B2A5E] leading-tight"
          >
            Confirmar registro de ponto?
          </h2>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Tipo
            </span>
            <span className="text-sm font-bold text-[#1B2A5E]">
              {tipoLabel}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Horário
            </span>
            <span className="text-sm font-bold text-[#1B2A5E] tabular-nums">
              {horario}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              Modalidade
            </span>
            <span className="text-sm font-bold text-[#1B2A5E]">
              {modalidade}
            </span>
          </div>
        </div>

        <p
          id="confirm-ponto-desc"
          className="text-sm text-slate-500 mt-4 leading-relaxed text-center"
        >
          O registro será gravado de forma definitiva. Em caso de erro, abra
          uma contestação no espelho — não há como desfazer pelo app.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={carregando}
            className="flex-1 min-h-[48px] rounded-2xl border border-slate-200 bg-white text-[#1B2A5E] font-semibold text-sm active:scale-[0.98] transition-transform motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A5E] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={carregando}
            className="flex-1 min-h-[48px] rounded-2xl bg-[#1B2A5E] text-white font-bold text-sm active:scale-[0.98] transition-transform motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A5E] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? "Registrando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
