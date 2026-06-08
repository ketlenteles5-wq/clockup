import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";
import { api, ApiError } from "../../lib/api";

type StatusContestacao = "Pendente" | "Aceita" | "Recusada";

interface ContestacaoApi {
  id: string;
  funcionario: string;
  avatar: string;
  cargo: string;
  dataFalta: string;
  turno: string;
  motivo: string;
  descricao: string;
  evidencias: string[];
  dataAbertura: string;
  diasAbertos: number;
  status: StatusContestacao;
  motivoRecusa?: string | null;
}

const statusConfig: Record<StatusContestacao, { bg: string; text: string }> = {
  Pendente: { bg: "#fef9e6", text: "#f59e0b" },
  Aceita: { bg: "#e6f9f0", text: "#22c55e" },
  Recusada: { bg: "#fee6e6", text: "#ef4444" },
};

export default function ContestacoesAdmin() {
  const navigate = useNavigate();
  const [contestacoes, setContestacoes] = useState<ContestacaoApi[]>([]);
  const [filtro, setFiltro] = useState<"Todos" | StatusContestacao>("Todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<{
    id: string;
    acao: "Aceita" | "Recusada";
  } | null>(null);
  const [motivoInput, setMotivoInput] = useState("");
  const [motivoErro, setMotivoErro] = useState(false);
  const [acaoEmCurso, setAcaoEmCurso] = useState(false);
  const [erroAcao, setErroAcao] = useState("");

  const carregar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const q = filtro === "Todos" ? "" : `?filtro=${encodeURIComponent(filtro)}`;
      const data = await api.get<ContestacaoApi[]>(`/admin/contestacoes${q}`);
      setContestacoes(data);
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível carregar as contestações.",
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  const pendentes = contestacoes.filter((c) => c.status === "Pendente").length;
  const atrasadas = contestacoes.filter(
    (c) => c.status === "Pendente" && c.diasAbertos >= 5,
  ).length;

  const abrirModal = (id: string, acao: "Aceita" | "Recusada") => {
    setConfirmando({ id, acao });
    setMotivoInput("");
    setMotivoErro(false);
    setErroAcao("");
  };

  const confirmar = async () => {
    if (!confirmando) return;
    if (confirmando.acao === "Recusada" && !motivoInput.trim()) {
      setMotivoErro(true);
      return;
    }
    setAcaoEmCurso(true);
    setErroAcao("");
    try {
      await api.put(`/admin/contestacoes/${confirmando.id}/status`, {
        status: confirmando.acao,
        motivoRecusa:
          confirmando.acao === "Recusada" ? motivoInput : undefined,
      });
      setConfirmando(null);
      setMotivoInput("");
      await carregar();
    } catch (e) {
      setErroAcao(
        e instanceof ApiError
          ? e.message
          : "Não foi possível atualizar.",
      );
    } finally {
      setAcaoEmCurso(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, top: 35, right: -80, zIndex: 0 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, bottom: 60, left: -100, zIndex: 0 }} />

      <div className="relative z-10">
        <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              aria-label="Voltar"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#1B2A5E]">Contestações</h1>
          </div>
          {pendentes > 0 && (
            <span className="bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              {pendentes} pendente{pendentes > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-5 mt-4">
          {atrasadas > 0 && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4"
              style={{ background: "#fee6e6", boxShadow: "0 2px 8px rgba(239,68,68,0.10)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm font-semibold text-[#ef4444]">
                {atrasadas} contestaç{atrasadas === 1 ? "ão" : "ões"} aguardam há mais de 5 dias
              </p>
            </div>
          )}

          <div
            className="flex gap-2 mb-5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {(["Todos", "Pendente", "Aceita", "Recusada"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                aria-pressed={filtro === f}
                className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: filtro === f ? "#1B2A5E" : "white",
                  color: filtro === f ? "white" : "#64748b",
                  boxShadow: "0 2px 8px rgba(27,42,94,0.08)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {erro && (
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div className="flex flex-col gap-3" aria-busy={carregando}>
            {carregando ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">Carregando contestações...</p>
              </div>
            ) : contestacoes.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">
                  Nenhuma contestação encontrada.
                </p>
              </div>
            ) : (
              contestacoes.map((c) => {
                const cor = statusConfig[c.status];
                const atrasada = c.diasAbertos >= 5 && c.status === "Pendente";
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl px-4 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B2A5E] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {c.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1B2A5E] text-sm truncate">
                          {c.funcionario}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {c.cargo}
                        </p>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Falta</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {c.dataFalta}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Turno</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {c.turno}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                        <p className="text-xs text-gray-400">Motivo</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {c.motivo}
                        </p>
                      </div>
                      {c.descricao && (
                        <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                          <p className="text-xs text-gray-400">Descrição</p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                            "{c.descricao}"
                          </p>
                        </div>
                      )}
                      {c.evidencias.length > 0 && (
                        <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                          <p className="text-xs text-gray-400 mb-1">
                            Evidências ({c.evidencias.length})
                          </p>
                          {c.evidencias.map((arq, i) => (
                            <div key={i} className="flex items-center gap-2 mt-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <p className="text-xs font-semibold text-[#1B2A5E] truncate">
                                {arq}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {atrasada && (
                        <div className="col-span-2 flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <p className="text-xs font-medium text-red-500">
                            Em aberto há {c.diasAbertos} dias
                          </p>
                        </div>
                      )}
                    </div>

                    {detalhe === c.id && (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-xs text-gray-400">Aberta em</p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                            {c.dataAbertura}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-xs text-gray-400">Dias em aberto</p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5 tabular-nums">
                            {c.diasAbertos} dias
                          </p>
                        </div>
                        {c.status === "Recusada" && c.motivoRecusa && (
                          <div className="rounded-xl px-3 py-2 col-span-2" style={{ background: "#fee6e6" }}>
                            <p className="text-xs" style={{ color: "#ef4444" }}>
                              Motivo da recusa
                            </p>
                            <p className="text-xs font-semibold mt-0.5" style={{ color: "#ef4444" }}>
                              {c.motivoRecusa}
                            </p>
                          </div>
                        )}
                        {c.status === "Aceita" && (
                          <div className="rounded-xl px-3 py-2 col-span-2" style={{ background: "#e6f9f0" }}>
                            <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                              Contestação aceita. Falta justificada.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {c.status === "Pendente" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModal(c.id, "Recusada")}
                          className="flex-1 border border-red-200 rounded-xl py-2 text-sm font-semibold text-[#ef4444]"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => abrirModal(c.id, "Aceita")}
                          className="flex-1 bg-[#1B2A5E] rounded-xl py-2 text-sm font-semibold text-white"
                        >
                          Aceitar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setDetalhe(detalhe === c.id ? null : c.id)
                        }
                        className="w-full border border-gray-200 rounded-xl py-2 text-sm font-semibold text-[#1B2A5E]"
                      >
                        {detalhe === c.id ? "Fechar detalhes" : "Ver detalhes"}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {confirmando && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8 z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-2 text-center">
              {confirmando.acao === "Aceita"
                ? "Aceitar contestação?"
                : "Recusar contestação?"}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              {confirmando.acao === "Aceita"
                ? "A falta será justificada e o funcionário será notificado."
                : "Informe o motivo. O funcionário será notificado."}
            </p>

            {confirmando.acao === "Recusada" && (
              <div className="mb-4">
                <textarea
                  value={motivoInput}
                  onChange={(e) => {
                    setMotivoInput(e.target.value);
                    setMotivoErro(false);
                  }}
                  placeholder="Informe o motivo da recusa..."
                  rows={3}
                  className="w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1B2A5E] placeholder-gray-300 outline-none resize-none"
                  style={{ borderColor: motivoErro ? "#ef4444" : "#E5E7EB" }}
                />
                {motivoErro && (
                  <p className="text-xs text-red-400 mt-1">
                    O motivo é obrigatório para recusar.
                  </p>
                )}
              </div>
            )}

            {erroAcao && (
              <div role="alert" className="bg-[#fee6e6] rounded-xl px-3 py-2 mb-4">
                <p className="text-xs text-[#ef4444] font-medium">{erroAcao}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmando(null);
                  setMotivoInput("");
                  setMotivoErro(false);
                }}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={acaoEmCurso}
                className="flex-1 rounded-2xl py-3 text-white font-semibold text-sm disabled:opacity-60"
                style={{
                  background:
                    confirmando.acao === "Aceita" ? "#22c55e" : "#ef4444",
                }}
              >
                {acaoEmCurso
                  ? "..."
                  : confirmando.acao === "Aceita"
                    ? "Aceitar"
                    : "Recusar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}
