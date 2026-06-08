import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";
import { api, ApiError } from "../../lib/api";

type StatusAtestado = "Pendente" | "Aprovado" | "Reprovado";

interface AtestadoApi {
  id: string;
  funcionario: string;
  avatar: string;
  cargo: string;
  periodoInicio: string;
  periodoFim: string;
  diasAfastamento: number;
  dataEnvio: string;
  observacao: string;
  status: StatusAtestado;
  motivoReprovacao?: string | null;
}

const statusConfig: Record<StatusAtestado, { bg: string; text: string }> = {
  Pendente: { bg: "#fef9e6", text: "#f59e0b" },
  Aprovado: { bg: "#e6f9f0", text: "#22c55e" },
  Reprovado: { bg: "#fee6e6", text: "#ef4444" },
};

export default function AtestadosAdmin() {
  const navigate = useNavigate();
  const [atestados, setAtestados] = useState<AtestadoApi[]>([]);
  const [filtro, setFiltro] = useState<"Todos" | StatusAtestado>("Todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<{
    id: string;
    acao: "Aprovado" | "Reprovado";
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
      const data = await api.get<AtestadoApi[]>(`/admin/atestados${q}`);
      setAtestados(data);
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível carregar os atestados.",
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  const pendentes = atestados.filter((a) => a.status === "Pendente").length;

  const abrirModal = (id: string, acao: "Aprovado" | "Reprovado") => {
    setConfirmando({ id, acao });
    setMotivoInput("");
    setMotivoErro(false);
    setErroAcao("");
  };

  const confirmar = async () => {
    if (!confirmando) return;
    if (confirmando.acao === "Reprovado" && !motivoInput.trim()) {
      setMotivoErro(true);
      return;
    }
    setAcaoEmCurso(true);
    setErroAcao("");
    try {
      await api.put(`/admin/atestados/${confirmando.id}/status`, {
        status: confirmando.acao,
        motivoReprovacao:
          confirmando.acao === "Reprovado" ? motivoInput : undefined,
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
            <h1 className="text-xl font-bold text-[#1B2A5E]">Atestados</h1>
          </div>
          {pendentes > 0 && (
            <span className="bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              {pendentes} pendente{pendentes > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="px-5 mt-4">
          <div
            className="flex gap-2 mb-5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {(["Todos", "Pendente", "Aprovado", "Reprovado"] as const).map((f) => (
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
                <p className="text-gray-400 text-sm">Carregando atestados...</p>
              </div>
            ) : atestados.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">
                  Nenhum atestado encontrado.
                </p>
              </div>
            ) : (
              atestados.map((at) => {
                const cor = statusConfig[at.status];
                return (
                  <div
                    key={at.id}
                    className="bg-white rounded-2xl px-4 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B2A5E] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {at.avatar}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1B2A5E] text-sm truncate">
                          {at.funcionario}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {at.cargo}
                        </p>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {at.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Período</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {at.periodoInicio} a {at.periodoFim}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Dias</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5 tabular-nums">
                          {at.diasAfastamento} dias
                        </p>
                      </div>
                      {at.observacao && (
                        <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                          <p className="text-xs text-gray-400">Observação</p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                            "{at.observacao}"
                          </p>
                        </div>
                      )}
                    </div>

                    {detalhe === at.id && (
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-xs text-gray-400">Data de envio</p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                            {at.dataEnvio}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-xs text-gray-400">Status atual</p>
                          <p
                            className="text-xs font-semibold mt-0.5"
                            style={{ color: cor.text }}
                          >
                            {at.status}
                          </p>
                        </div>
                        {at.status === "Reprovado" && at.motivoReprovacao && (
                          <div className="rounded-xl px-3 py-2 col-span-2" style={{ background: "#fee6e6" }}>
                            <p className="text-xs" style={{ color: "#ef4444" }}>
                              Motivo da reprovação
                            </p>
                            <p className="text-xs font-semibold mt-0.5" style={{ color: "#ef4444" }}>
                              {at.motivoReprovacao}
                            </p>
                          </div>
                        )}
                        {at.status === "Aprovado" && (
                          <div className="rounded-xl px-3 py-2 col-span-2" style={{ background: "#e6f9f0" }}>
                            <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                              Atestado aprovado.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {at.status === "Pendente" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModal(at.id, "Reprovado")}
                          className="flex-1 border border-red-200 rounded-xl py-2 text-sm font-semibold text-[#ef4444]"
                        >
                          Reprovar
                        </button>
                        <button
                          onClick={() => abrirModal(at.id, "Aprovado")}
                          className="flex-1 bg-[#1B2A5E] rounded-xl py-2 text-sm font-semibold text-white"
                        >
                          Aprovar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setDetalhe(detalhe === at.id ? null : at.id)
                        }
                        className="w-full border border-gray-200 rounded-xl py-2 text-sm font-semibold text-[#1B2A5E]"
                      >
                        {detalhe === at.id ? "Fechar detalhes" : "Ver detalhes"}
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
              {confirmando.acao === "Aprovado"
                ? "Aprovar atestado?"
                : "Reprovar atestado?"}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              {confirmando.acao === "Aprovado"
                ? "O atestado será aprovado e o funcionário será notificado."
                : "Informe o motivo. O funcionário será notificado."}
            </p>

            {confirmando.acao === "Reprovado" && (
              <div className="mb-4">
                <textarea
                  value={motivoInput}
                  onChange={(e) => {
                    setMotivoInput(e.target.value);
                    setMotivoErro(false);
                  }}
                  placeholder="Motivo da reprovação..."
                  rows={3}
                  className="w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-[#1B2A5E] placeholder-gray-300 outline-none resize-none"
                  style={{ borderColor: motivoErro ? "#ef4444" : "#E5E7EB" }}
                />
                {motivoErro && (
                  <p className="text-xs text-red-400 mt-1">
                    O motivo é obrigatório para reprovar.
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
                    confirmando.acao === "Aprovado" ? "#22c55e" : "#ef4444",
                }}
              >
                {acaoEmCurso
                  ? "..."
                  : confirmando.acao === "Aprovado"
                    ? "Aprovar"
                    : "Reprovar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}
