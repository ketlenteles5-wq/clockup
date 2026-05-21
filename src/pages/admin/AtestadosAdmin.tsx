import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";

type StatusAtestado = "Pendente" | "Aprovado" | "Reprovado";

interface Atestado {
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
  motivoReprovacao?: string;
}

const atestadosMock: Atestado[] = [
  {
    id: "1",
    funcionario: "Nicole Ferreira",
    avatar: "NF",
    cargo: "Analista de RH",
    periodoInicio: "16/04/2026",
    periodoFim: "17/04/2026",
    diasAfastamento: 2,
    dataEnvio: "16/04/2026",
    observacao: "Gripe forte com febre",
    status: "Pendente",
  },
  {
    id: "2",
    funcionario: "Carlos Mendes",
    avatar: "CM",
    cargo: "Desenvolvedor",
    periodoInicio: "10/04/2026",
    periodoFim: "12/04/2026",
    diasAfastamento: 3,
    dataEnvio: "10/04/2026",
    observacao: "Dor nas costas, indicação de repouso",
    status: "Pendente",
  },
  {
    id: "3",
    funcionario: "Amanda Costa",
    avatar: "AC",
    cargo: "Designer",
    periodoInicio: "05/04/2026",
    periodoFim: "06/04/2026",
    diasAfastamento: 2,
    dataEnvio: "05/04/2026",
    observacao: "Gastrite aguda",
    status: "Aprovado",
  },
  {
    id: "4",
    funcionario: "Roberto Silva",
    avatar: "RS",
    cargo: "Vendedor",
    periodoInicio: "01/04/2026",
    periodoFim: "01/04/2026",
    diasAfastamento: 1,
    dataEnvio: "02/04/2026",
    observacao: "Consulta de rotina",
    status: "Reprovado",
    motivoReprovacao: "Consulta de rotina não justifica afastamento.",
  },
];

const statusConfig = {
  Pendente: { bg: "#fef9e6", text: "#f59e0b" },
  Aprovado: { bg: "#e6f9f0", text: "#22c55e" },
  Reprovado: { bg: "#fee6e6", text: "#ef4444" },
};

export default function AtestadosEmpresario() {
  const navigate = useNavigate();
  const [atestados, setAtestados] = useState<Atestado[]>(atestadosMock);
  const [filtro, setFiltro] = useState<"Todos" | StatusAtestado>("Todos");
  const [confirmando, setConfirmando] = useState<{
    id: string;
    acao: "Aprovado" | "Reprovado";
  } | null>(null);
  const [detalhe, setDetalhe] = useState<string | null>(null);

  const filtrados = atestados.filter(
    (a) => filtro === "Todos" || a.status === filtro,
  );

  const pendentes = atestados.filter((a) => a.status === "Pendente").length;

  const confirmarDecisao = (id: string, acao: "Aprovado" | "Reprovado") => {
    setAtestados((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: acao } : a)),
    );
    setConfirmando(null);
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
      {/* Bolinhas decorativas */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280,
          height: 280,
          background: "#d0daf0",
          opacity: 0.45,
          top: 35,
          right: -80,
          zIndex: 0,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280,
          height: 280,
          background: "#d0daf0",
          opacity: 0.45,
          bottom: 60,
          left: -100,
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2A5E"
                strokeWidth="2"
              >
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
          {/* Filtros */}
          <div
            className="flex gap-2 mb-5 overflow-x-auto pb-1"
            style={
              {
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              } as React.CSSProperties
            }
          >
            {(["Todos", "Pendente", "Aprovado", "Reprovado"] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                  style={{
                    background: filtro === f ? "#1B2A5E" : "white",
                    color: filtro === f ? "white" : "#64748b",
                    boxShadow: "0 2px 8px rgba(27,42,94,0.08)",
                  }}
                >
                  {f}
                </button>
              ),
            )}
          </div>

          {/* Lista */}
          <div className="flex flex-col gap-3">
            {filtrados.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">
                  Nenhum atestado encontrado.
                </p>
              </div>
            ) : (
              filtrados.map((at) => {
                const cor = statusConfig[at.status];
                return (
                  <div
                    key={at.id}
                    className="bg-white rounded-2xl px-4 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    {/* Funcionário */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B2A5E] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {at.avatar}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#1B2A5E] text-sm">
                          {at.funcionario}
                        </p>
                        <p className="text-gray-400 text-xs">{at.cargo}</p>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {at.status}
                      </span>
                    </div>

                    {/* Detalhes */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Período</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {at.periodoInicio} a {at.periodoFim}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Dias</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
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

                    {/* Painel de detalhes expandido */}
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
                            style={{ color: statusConfig[at.status].text }}
                          >
                            {at.status}
                          </p>
                        </div>
                        {at.status === "Reprovado" && at.motivoReprovacao && (
                          <div
                            className="rounded-xl px-3 py-2 col-span-2"
                            style={{ background: "#fee6e6" }}
                          >
                            <p className="text-xs" style={{ color: "#ef4444" }}>
                              Motivo da reprovação
                            </p>
                            <p
                              className="text-xs font-semibold mt-0.5"
                              style={{ color: "#ef4444" }}
                            >
                              {at.motivoReprovacao}
                            </p>
                          </div>
                        )}
                        {at.status === "Aprovado" && (
                          <div
                            className="rounded-xl px-3 py-2 col-span-2"
                            style={{ background: "#e6f9f0" }}
                          >
                            <p
                              className="text-xs font-semibold"
                              style={{ color: "#22c55e" }}
                            >
                              ✓ Atestado aprovado.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botões */}
                    {filtro === "Pendente" && at.status === "Pendente" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setConfirmando({ id: at.id, acao: "Reprovado" })
                          }
                          className="flex-1 border border-red-200 rounded-xl py-2 text-sm font-semibold text-[#ef4444]"
                        >
                          Reprovar
                        </button>
                        <button
                          onClick={() =>
                            setConfirmando({ id: at.id, acao: "Aprovado" })
                          }
                          className="flex-1 bg-[#1B2A5E] rounded-xl py-2 text-sm font-semibold text-white"
                        >
                          Aprovar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setDetalhe(at.id === detalhe ? null : at.id)
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

      {/* Modal de confirmação */}
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
            <p className="text-gray-400 text-sm text-center mb-6">
              {confirmando.acao === "Aprovado"
                ? "O atestado será aprovado e o funcionário será notificado."
                : "O atestado será reprovado e o funcionário será notificado."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmando(null)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  confirmarDecisao(confirmando.id, confirmando.acao)
                }
                className="flex-1 rounded-2xl py-3 text-white font-semibold text-sm"
                style={{
                  background:
                    confirmando.acao === "Aprovado" ? "#22c55e" : "#ef4444",
                }}
              >
                {confirmando.acao === "Aprovado" ? "Aprovar" : "Reprovar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}
