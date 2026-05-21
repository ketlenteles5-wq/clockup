import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";

interface Solicitacao {
  id: string;
  funcionario: string;
  avatar: string;
  cargo: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  abono: boolean;
  diasAbono: number;
  observacao: string;
  status: "Pendente" | "Aprovado" | "Reprovado";
}

const solicitacoesMock: Solicitacao[] = [
  {
    id: "1",
    funcionario: "Nicole Ferreira",
    avatar: "NF",
    cargo: "Desenvolvedora",
    dataInicio: "01/07/2026",
    dataFim: "20/07/2026",
    dias: 20,
    abono: true,
    diasAbono: 10,
    observacao: "Viagem marcada",
    status: "Pendente",
  },
  {
    id: "2",
    funcionario: "Carlos Silva",
    avatar: "CS",
    cargo: "Designer",
    dataInicio: "10/08/2026",
    dataFim: "20/08/2026",
    dias: 10,
    abono: false,
    diasAbono: 0,
    observacao: "",
    status: "Pendente",
  },
  {
    id: "3",
    funcionario: "Ana Souza",
    avatar: "AS",
    cargo: "Product Manager",
    dataInicio: "03/12/2025",
    dataFim: "07/12/2025",
    dias: 5,
    abono: false,
    diasAbono: 0,
    observacao: "",
    status: "Aprovado",
  },
  {
    id: "4",
    funcionario: "Pedro Lima",
    avatar: "PL",
    cargo: "DevOps",
    dataInicio: "01/03/2026",
    dataFim: "30/03/2026",
    dias: 30,
    abono: false,
    diasAbono: 0,
    observacao: "Férias anuais",
    status: "Aprovado",
  },
];

const statusConfig = {
  Pendente: { bg: "#fef9e6", text: "#f59e0b" },
  Aprovado: { bg: "#e6f9f0", text: "#22c55e" },
  Reprovado: { bg: "#fee6e6", text: "#ef4444" },
};

export default function FeriasAdmin() {
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState(solicitacoesMock);
  const [filtro, setFiltro] = useState<
    "Todos" | "Pendente" | "Aprovado" | "Reprovado"
  >("Todos");
  const [confirmando, setConfirmando] = useState<{
    id: string;
    acao: "Aprovado" | "Reprovado";
  } | null>(null);

  const filtradas = solicitacoes.filter(
    (s) => filtro === "Todos" || s.status === filtro,
  );

  const pendentes = solicitacoes.filter((s) => s.status === "Pendente").length;

  const aprovar = (id: string, acao: "Aprovado" | "Reprovado") => {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: acao } : s)),
    );
    setConfirmando(null);
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
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
            <h1 className="text-xl font-bold text-[#1B2A5E]">Férias</h1>
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
            {filtradas.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">
                  Nenhuma solicitação encontrada.
                </p>
              </div>
            ) : (
              filtradas.map((sol) => {
                const cor = statusConfig[sol.status];
                return (
                  <div
                    key={sol.id}
                    className="bg-white rounded-2xl px-4 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    {/* Funcionário */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B2A5E] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {sol.avatar}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#1B2A5E] text-sm">
                          {sol.funcionario}
                        </p>
                        <p className="text-gray-400 text-xs">{sol.cargo}</p>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {sol.status}
                      </span>
                    </div>

                    {/* Detalhes */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Período</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {sol.dataInicio} a {sol.dataFim}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-400">Dias</p>
                        <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                          {sol.dias} dias
                        </p>
                      </div>
                      {sol.abono && (
                        <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                          <p className="text-xs text-gray-400">
                            Abono pecuniário
                          </p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                            {sol.diasAbono} dias a vender
                          </p>
                        </div>
                      )}
                      {sol.observacao && (
                        <div className="bg-gray-50 rounded-xl px-3 py-2 col-span-2">
                          <p className="text-xs text-gray-400">Observação</p>
                          <p className="text-xs font-semibold text-[#1B2A5E] mt-0.5">
                            "{sol.observacao}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botões aprovação */}
                    {sol.status === "Pendente" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setConfirmando({ id: sol.id, acao: "Reprovado" })
                          }
                          className="flex-1 border border-red-200 rounded-xl py-2 text-sm font-semibold text-[#ef4444]"
                        >
                          Reprovar
                        </button>
                        <button
                          onClick={() =>
                            setConfirmando({ id: sol.id, acao: "Aprovado" })
                          }
                          className="flex-1 bg-[#1B2A5E] rounded-xl py-2 text-sm font-semibold text-white"
                        >
                          Aprovar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal confirmação */}
      {confirmando && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8 z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-2 text-center">
              {confirmando.acao === "Aprovado"
                ? "Aprovar férias?"
                : "Reprovar férias?"}
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              {confirmando.acao === "Aprovado"
                ? "A solicitação será aprovada e o funcionário será notificado."
                : "A solicitação será reprovada e o funcionário será notificado."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmando(null)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => aprovar(confirmando.id, confirmando.acao)}
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
