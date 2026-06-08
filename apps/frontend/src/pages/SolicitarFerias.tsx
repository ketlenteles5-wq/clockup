import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { api, ApiError } from "../lib/api";

const ANTECEDENCIA_MINIMA_DIAS = 30;

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toBr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function maskBr(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function brToIso(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo}-${d}`;
  const date = new Date(`${iso}T00:00:00`);
  if (isNaN(date.getTime())) return null;
  // Garante que a data não foi normalizada (ex: 31/02/2026 vira 03/03/2026)
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() + 1 !== Number(mo) ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return iso;
}

function BrDateInput({
  value,
  onChange,
  className,
  ariaLabel,
  min,
}: {
  value: string;
  onChange: (iso: string) => void;
  className?: string;
  ariaLabel?: string;
  min?: string;
}) {
  const [text, setText] = useState(value ? toBr(value) : "");
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value ? toBr(value) : "");
  }, [value]);

  const abrirPicker = () => {
    const el = hiddenRef.current;
    if (!el) return;
    const showPicker = (el as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (typeof showPicker === "function") {
      try {
        showPicker.call(el);
        return;
      } catch {
        // fallback abaixo
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div className="flex items-center gap-2 w-full relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={text}
        aria-label={ariaLabel}
        onChange={(e) => {
          const masked = maskBr(e.target.value);
          setText(masked);
          if (masked.length === 0) {
            onChange("");
            return;
          }
          if (masked.length === 10) {
            const iso = brToIso(masked);
            if (iso) onChange(iso);
            else onChange("");
          } else {
            onChange("");
          }
        }}
        className={`flex-1 min-w-0 ${className ?? ""}`}
      />
      <button
        type="button"
        onClick={abrirPicker}
        aria-label="Abrir calendário"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2563EB] hover:bg-[#eff5ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] flex-shrink-0"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function SolicitarFerias() {
  const navigate = useNavigate();

  const { hojeIso, minimoIso, minimoBr } = useMemo(() => {
    const hoje = new Date();
    const hojeIsoLocal = toIso(hoje);
    const minimo = new Date(hoje);
    minimo.setDate(minimo.getDate() + ANTECEDENCIA_MINIMA_DIAS);
    const minimoIsoLocal = toIso(minimo);
    return {
      hojeIso: hojeIsoLocal,
      minimoIso: minimoIsoLocal,
      minimoBr: toBr(minimoIsoLocal),
    };
  }, []);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [venderDias, setVenderDias] = useState(false);
  const [diasVender, setDiasVender] = useState(10);
  const [observacao, setObservacao] = useState("");
  const [showSucesso, setShowSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [avisoFechado, setAvisoFechado] = useState(false);

  const regraAtendida = !!dataInicio && dataInicio >= minimoIso;
  void hojeIso;

  const calcularDias = () => {
    if (!dataInicio || !dataFim) return 0;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diff =
      Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const enviar = async () => {
    if (!dataInicio || !dataFim) {
      setErro("Selecione as datas de início e fim.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      await api.post("/funcionario/ferias/solicitar", {
        dataInicio,
        dataFim,
        venderDias,
        diasVender: venderDias ? diasVender : 0,
        observacao: observacao || undefined,
      });
      setShowSucesso(true);
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível enviar a solicitação.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, top: 35, right: -80, zIndex: 0 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, bottom: 60, left: -100, zIndex: 0 }} />

      <div className="relative z-10">
        <div className="bg-white px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/ferias")}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#1B2A5E]">Solicitar Férias</h1>
        </div>

        <div className="px-5 mt-5">
          {(!avisoFechado || regraAtendida) && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl px-4 py-3 mb-4 flex items-start gap-3 transition-colors duration-200 motion-reduce:transition-none"
              style={{
                background: regraAtendida ? "#e6f9f0" : "#eff5ff",
                border: regraAtendida
                  ? "1px solid #bbf2d2"
                  : "1px solid #d6e3ff",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 motion-reduce:transition-none"
                style={{ background: regraAtendida ? "#bbf2d2" : "#d6e3ff" }}
                aria-hidden="true"
              >
                {regraAtendida ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {regraAtendida ? (
                  <>
                    <p className="text-sm font-bold text-[#15803d] leading-tight">
                      Aviso prévio atendido
                    </p>
                    <p className="text-xs text-[#166534] mt-1 leading-snug">
                      Data escolhida cumpre o mínimo de{" "}
                      {ANTECEDENCIA_MINIMA_DIAS} dias da CLT (Art. 135).
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-[#1B2A5E] leading-tight">
                      Aviso prévio de {ANTECEDENCIA_MINIMA_DIAS} dias
                    </p>
                    <p className="text-xs text-[#2563EB] mt-1 leading-snug">
                      A CLT (Art. 135) exige solicitar com pelo menos{" "}
                      {ANTECEDENCIA_MINIMA_DIAS} dias de antecedência.
                    </p>
                    <p className="text-xs text-[#1B2A5E] mt-2">
                      Data mais próxima permitida:{" "}
                      <span className="font-bold tabular-nums">{minimoBr}</span>
                    </p>
                  </>
                )}
              </div>

              {!regraAtendida && (
                <button
                  type="button"
                  onClick={() => setAvisoFechado(true)}
                  aria-label="Fechar aviso"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2563EB] hover:bg-[#d6e3ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] flex-shrink-0"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
          >
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <p className="font-bold text-[#1B2A5E] text-base mb-4">
                Período de férias
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Início
                  </label>
                  <BrDateInput
                    value={dataInicio}
                    min={minimoIso}
                    ariaLabel="Data de início das férias"
                    onChange={(iso) => {
                      setDataInicio(iso);
                      setErro("");
                    }}
                    className="text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none tabular-nums placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Fim
                  </label>
                  <BrDateInput
                    value={dataFim}
                    min={dataInicio || minimoIso}
                    ariaLabel="Data de fim das férias"
                    onChange={(iso) => {
                      setDataFim(iso);
                      setErro("");
                    }}
                    className="text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none tabular-nums placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-[#f0f4ff]">
              <p className="text-sm text-[#2563EB] font-medium">
                Duração calculada
              </p>
              <p className="text-lg font-bold text-[#2563EB] tabular-nums">
                {calcularDias()} Dias
              </p>
            </div>

            <div className="px-5 pt-4 pb-2 border-b border-gray-100">
              <p className="font-bold text-[#1B2A5E] text-base mb-4">
                Abono Pecuniário
              </p>

              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#1B2A5E]">
                    Vender dias de férias
                  </p>
                  <p className="text-xs text-gray-400">
                    Máximo de 10 dias vendidos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVenderDias((v) => !v)}
                  role="switch"
                  aria-checked={venderDias}
                  aria-label="Vender dias"
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: venderDias ? "#22c55e" : "#d1d5db" }}
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow"
                    style={{ left: venderDias ? "26px" : "2px" }}
                  />
                </button>
              </div>

              {venderDias && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Dias a vender</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDiasVender((d) => Math.max(1, d - 1))}
                      aria-label="Diminuir"
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#1B2A5E] font-bold"
                    >
                      −
                    </button>
                    <p className="text-base font-bold text-[#1B2A5E] tabular-nums">
                      {diasVender} dias
                    </p>
                    <button
                      onClick={() => setDiasVender((d) => Math.min(10, d + 1))}
                      aria-label="Aumentar"
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#1B2A5E] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pt-4 pb-5">
              <label className="text-sm text-gray-400 mb-2 block">
                Observação (opcional)
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="EX: Viagem marcada"
                className="w-full text-sm text-[#1B2A5E] bg-transparent outline-none resize-none"
                rows={2}
              />
            </div>
          </div>

          {erro && (
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mt-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate("/ferias")}
              className="flex-1 bg-white border border-gray-200 rounded-2xl py-4 text-[#1B2A5E] font-semibold text-sm"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              Cancelar
            </button>
            <button
              onClick={enviar}
              disabled={enviando}
              className="flex-1 bg-[#1B2A5E] rounded-2xl py-4 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar Solicitação"}
            </button>
          </div>
        </div>
      </div>

      {showSucesso && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center w-full max-w-xs">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#e6f9f0" }}>
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#1B2A5E] mb-2">
              Solicitação enviada!
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Sua solicitação de férias foi enviada para aprovação.
            </p>
            <button
              onClick={() => navigate("/ferias")}
              className="bg-[#1B2A5E] rounded-2xl px-10 py-3 text-white font-bold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
