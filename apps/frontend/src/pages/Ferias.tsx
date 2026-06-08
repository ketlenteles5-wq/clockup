import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { api, ApiError } from "../lib/api";

interface SolicitacaoApi {
  id: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  status: "Pendente" | "Aprovado" | "Reprovado";
  observacao?: string;
}

interface SaldoApi {
  diasDisponiveis: number;
  periodoAquisitivo: string;
  venceEm: string;
  abono: number;
}

interface RespostaFerias {
  saldo: SaldoApi;
  solicitacoes: SolicitacaoApi[];
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Aprovado: { bg: "#e6f9f0", text: "#22c55e" },
  Pendente: { bg: "#fef9e6", text: "#f59e0b" },
  Reprovado: { bg: "#fee6e6", text: "#ef4444" },
};

const corStatus = (s: string) =>
  statusConfig[s] ?? { bg: "#f1f5f9", text: "#64748b" };

export default function Ferias() {
  const navigate = useNavigate();
  const [dados, setDados] = useState<RespostaFerias | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        const r = await api.get<RespostaFerias>("/funcionario/ferias");
        if (ativo) setDados(r);
      } catch (e) {
        if (!ativo) return;
        setErro(
          e instanceof ApiError
            ? e.message
            : "Não foi possível carregar suas férias.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, top: 35, right: -80, zIndex: 0 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, bottom: 60, left: -100, zIndex: 0 }} />

      <div className="relative z-10">
        <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              aria-label="Voltar"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#1B2A5E]">Férias</h1>
          </div>
          <button
            onClick={() => navigate("/ferias/solicitar")}
            className="text-sm text-[#2563EB] font-medium"
          >
            + solicitar
          </button>
        </div>

        <div className="px-5 mt-5">
          {erro && (
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div
            className="bg-[#1B2A5E] rounded-3xl p-5 mb-6"
            aria-busy={carregando}
          >
            <p className="text-blue-300 text-sm mb-1">Saldo disponivel</p>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-5xl font-bold text-white tabular-nums">
                {carregando ? "—" : (dados?.saldo.diasDisponiveis ?? 0)}
              </p>
              <p className="text-white text-lg">dias</p>
            </div>
            <p className="text-blue-300 text-sm mb-4">
              Período aquisitivo:{" "}
              {carregando ? "—" : (dados?.saldo.periodoAquisitivo ?? "—")}
            </p>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#243a6e] rounded-2xl px-3 py-2 text-center">
                <p className="text-blue-200 text-xs leading-tight">vence em</p>
                <p className="text-white text-sm font-bold">
                  {carregando ? "—" : (dados?.saldo.venceEm ?? "—")}
                </p>
              </div>
              <div className="flex-1 bg-[#243a6e] rounded-2xl px-3 py-2 text-center">
                <p className="text-blue-200 text-xs leading-tight">
                  Abono: até
                </p>
                <p className="text-white text-sm font-bold">
                  {carregando ? "—" : `${dados?.saldo.abono ?? 0} dias`}
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-sm font-medium mb-3">
            Histórico de Solicitações
          </p>
          <div className="flex flex-col gap-3">
            {carregando ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">Carregando...</p>
              </div>
            ) : !dados || dados.solicitacoes.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">
                  Nenhuma solicitação ainda.
                </p>
              </div>
            ) : (
              dados.solicitacoes.map((sol) => {
                const cor = corStatus(sol.status);
                return (
                  <div
                    key={sol.id}
                    className="bg-white rounded-2xl px-4 py-4"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    <p className="font-bold text-[#1B2A5E] text-sm mb-2">
                      {sol.dataInicio} – {sol.dataFim}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {sol.status}
                      </span>
                      <p className="text-gray-400 text-sm tabular-nums">
                        {sol.dias} dias
                      </p>
                    </div>
                    {sol.observacao && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        "{sol.observacao}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => navigate("/ferias/solicitar")}
            className="w-full bg-[#1B2A5E] text-white font-bold py-4 rounded-2xl mt-6 text-sm active:scale-95 transition-transform"
          >
            Solicitar férias
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
