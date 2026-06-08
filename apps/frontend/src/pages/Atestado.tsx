import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { api, ApiError } from "../lib/api";

interface AtestadoApi {
  id: string;
  arquivo: string;
  dataConsulta: string; // YYYY-MM-DD
  diasAfastamento: number;
  observacao: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
  dataEnvio: string; // DD/MM/YYYY
  motivoReprovacao?: string | null;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Aprovado: { bg: "#e6f9f0", text: "#22c55e" },
  Pendente: { bg: "#fef9e6", text: "#f59e0b" },
  Reprovado: { bg: "#fee6e6", text: "#ef4444" },
};

const corStatus = (s: string) =>
  statusConfig[s] ?? { bg: "#f1f5f9", text: "#64748b" };

function formatarData(data: string) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function isoHoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoParaBr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const MAX_DIAS_AFASTAMENTO = 180;

export default function Atestado() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataConsulta, setDataConsulta] = useState("");
  const [diasAfastamento, setDiasAfastamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [showSucesso, setShowSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState<AtestadoApi[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [avisoFechado, setAvisoFechado] = useState(false);

  const hojeIso = isoHoje();
  const hojeBr = isoParaBr(hojeIso);
  const diasParsed = parseInt(diasAfastamento || "0", 10);
  const regraAtendida =
    !!dataConsulta &&
    dataConsulta <= hojeIso &&
    diasParsed >= 1 &&
    diasParsed <= MAX_DIAS_AFASTAMENTO;

  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const lista = await api.get<AtestadoApi[]>("/funcionario/atestados");
      setHistorico(lista);
    } catch {
      setHistorico([]);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const handleArquivo = (file: File) => {
    setArquivo(file);
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const podEnviar = !!arquivo && !!dataConsulta && !!diasAfastamento;

  const enviar = async () => {
    if (!podEnviar || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      // Upload de arquivo não implementado: por ora mandamos só o nome.
      // Pipeline de storage (S3/local) é um item separado.
      await api.post("/funcionario/atestados/enviar", {
        dataConsulta,
        diasAfastamento: parseInt(diasAfastamento, 10),
        observacao: observacao || undefined,
        arquivoUrl: arquivo?.name ?? "atestado",
      });
      setArquivo(null);
      setPreview(null);
      setDataConsulta("");
      setDiasAfastamento("");
      setObservacao("");
      setShowSucesso(true);
      await carregarHistorico();
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível enviar o atestado.",
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
            onClick={() => navigate("/home")}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#1B2A5E]">Enviar atestado</h1>
        </div>

        <div className="px-5 mt-5">
          <p className="text-sm text-gray-400 mb-4">
            Anexe o atestado médico e preencha as informações abaixo.
          </p>

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
                      Pronto para enviar
                    </p>
                    <p className="text-xs text-[#166534] mt-1 leading-snug">
                      Data e dias de afastamento dentro das regras. Seu gestor
                      receberá o atestado para análise.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-[#1B2A5E] leading-tight">
                      Regras de envio
                    </p>
                    <p className="text-xs text-[#2563EB] mt-1 leading-snug">
                      A consulta pode ser passada para justificar ausência, mas
                      não pode estar no futuro. Afastamento máximo de{" "}
                      {MAX_DIAS_AFASTAMENTO} dias por atestado.
                    </p>
                    <p className="text-xs text-[#1B2A5E] mt-2">
                      Aceitamos consultas até{" "}
                      <span className="font-bold tabular-nums">{hojeBr}</span>
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
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center cursor-pointer mb-5 bg-white"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.06)" }}
          >
            {preview ? (
              <img
                src={preview}
                alt="preview do atestado"
                className="w-full rounded-xl mb-3 max-h-48 object-cover"
              />
            ) : arquivo ? (
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            )}
            <p className="font-semibold text-[#1B2A5E] text-sm text-center">
              {arquivo ? arquivo.name : "Adicionar documento"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Foto, PDF ou imagem · Máx. 10MB
            </p>
            <button
              type="button"
              className="mt-4 bg-[#1B2A5E] text-white text-sm font-semibold px-6 py-2.5 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Câmera ou galeria
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleArquivo(e.target.files[0])
            }
          />

          <div
            className="bg-white rounded-3xl overflow-hidden mb-5"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <label className="text-xs text-gray-400 mb-1 block">
                Data da consulta
              </label>
              <input
                type="date"
                value={dataConsulta}
                max={isoHoje()}
                onChange={(e) => setDataConsulta(e.target.value)}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Pode ser data passada para justificar ausência.
              </p>
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Dias de afastamento</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Diminuir"
                  onClick={() =>
                    setDiasAfastamento((d) =>
                      String(Math.max(1, parseInt(d || "1", 10) - 1)),
                    )
                  }
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1B2A5E] font-bold text-lg"
                >
                  −
                </button>
                <p className="text-lg font-bold text-[#1B2A5E] min-w-[60px] text-center tabular-nums">
                  {diasAfastamento || "0"}{" "}
                  {parseInt(diasAfastamento || "0", 10) === 1 ? "dia" : "dias"}
                </p>
                <button
                  type="button"
                  aria-label="Aumentar"
                  onClick={() =>
                    setDiasAfastamento((d) =>
                      String(parseInt(d || "0", 10) + 1),
                    )
                  }
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1B2A5E] font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              <label className="text-xs text-gray-400 mb-2 block">
                Observação (opcional)
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Retorno marcado para sexta-feira"
                className="w-full text-sm text-[#1B2A5E] bg-transparent outline-none resize-none"
                rows={2}
              />
            </div>
          </div>

          {!podEnviar && (arquivo || dataConsulta || diasAfastamento) && (
            <div className="bg-[#fff8e6] border border-[#f59e0b] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#f59e0b] font-medium">
                Preencha todos os campos obrigatórios.
              </p>
              <p className="text-xs text-[#f59e0b] mt-0.5">
                Arquivo, data e dias de afastamento são necessários.
              </p>
            </div>
          )}

          {erro && (
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <button
            type="button"
            onClick={enviar}
            disabled={!podEnviar || enviando}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 mb-8 disabled:opacity-60"
            style={{
              background: podEnviar ? "#1B2A5E" : "#cbd5e1",
              color: "white",
              cursor: podEnviar ? "pointer" : "not-allowed",
            }}
          >
            {enviando ? "Enviando..." : "Enviar atestado"}
          </button>

          <p className="text-sm font-bold text-[#1B2A5E] mb-3">
            Atestados enviados
          </p>
          <div className="flex flex-col gap-3" aria-busy={carregandoHistorico}>
            {carregandoHistorico ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">Carregando histórico...</p>
              </div>
            ) : historico.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">
                  Nenhum atestado enviado ainda.
                </p>
              </div>
            ) : (
              historico.map((at) => {
                const cor = corStatus(at.status);
                return (
                  <div
                    key={at.id}
                    className="bg-white rounded-2xl px-4 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1B2A5E] leading-tight truncate">
                            {at.arquivo}
                          </p>
                          <p className="text-xs text-gray-400">
                            Enviado em {at.dataEnvio}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {at.status}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Consulta</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] tabular-nums">
                          {formatarData(at.dataConsulta)}
                        </p>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Afastamento</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] tabular-nums">
                          {at.diasAfastamento}{" "}
                          {at.diasAfastamento === 1 ? "dia" : "dias"}
                        </p>
                      </div>
                    </div>
                    {at.observacao && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        "{at.observacao}"
                      </p>
                    )}
                    {at.status === "Reprovado" && at.motivoReprovacao && (
                      <div className="mt-2 rounded-xl px-3 py-2" style={{ background: "#fee6e6" }}>
                        <p className="text-xs" style={{ color: "#ef4444" }}>
                          Motivo da reprovação
                        </p>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: "#ef4444" }}>
                          {at.motivoReprovacao}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
              Atestado enviado!
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Seu atestado foi recebido e será analisado em breve.
            </p>
            <button
              onClick={() => setShowSucesso(false)}
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
