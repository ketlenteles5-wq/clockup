import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import type { SaldoFerias } from "../types";

const saldoMock: SaldoFerias = {
  diasDisponiveis: 30,
  periodoAquisitivo: "Jan 2025 - Jan 2026",
  venceEm: "8 meses",
  abono: 10,
  solicitacoes: [
    {
      id: "1",
      dataInicio: "01 jul",
      dataFim: "20 jul 2025",
      dias: 20,
      status: "Aprovado",
    },
    {
      id: "2",
      dataInicio: "03 dez",
      dataFim: "07 dez 2025",
      dias: 5,
      status: "Pendente",
    },
    {
      id: "3",
      dataInicio: "Jan 2027",
      dataFim: "",
      dias: 0,
      status: "Pendente",
    },
  ],
};

export default function Ferias() {
  const navigate = useNavigate();
  const [saldo] = useState(saldoMock);

  const statusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return { bg: "#e6f9f0", text: "#22c55e" };
      case "Pendente":
        return { bg: "#fef9e6", text: "#f59e0b" };
      case "Reprovado":
        return { bg: "#fee6e6", text: "#ef4444" };
      default:
        return { bg: "#f1f5f9", text: "#64748b" };
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
      {/* Círculos decorativos */}
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
              onClick={() => navigate("/home")}
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
          <button
            onClick={() => navigate("/ferias/solicitar")}
            className="text-sm text-[#2563EB] font-medium"
          >
            + solicitar
          </button>
        </div>

        <div className="px-5 mt-5">
          {/* Card saldo */}
          <div className="bg-[#1B2A5E] rounded-3xl p-5 mb-6">
            <p className="text-blue-300 text-sm mb-1">Saldo disponivel</p>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-5xl font-bold text-white">
                {saldo.diasDisponiveis}
              </p>
              <p className="text-white text-lg">dias</p>
            </div>
            <p className="text-blue-300 text-sm mb-4">
              Período aquisitivo: {saldo.periodoAquisitivo}
            </p>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#243a6e] rounded-2xl px-3 py-2 text-center">
                <p className="text-blue-200 text-xs leading-tight">vence em</p>
                <p className="text-white text-sm font-bold">{saldo.venceEm}</p>
              </div>
              <div className="flex-1 bg-[#243a6e] rounded-2xl px-3 py-2 text-center">
                <p className="text-blue-200 text-xs leading-tight">
                  Abono: até
                </p>
                <p className="text-white text-sm font-bold">
                  {saldo.abono} dias
                </p>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <p className="text-gray-400 text-sm font-medium mb-3">
            Histórico de Solicitações
          </p>
          <div className="flex flex-col gap-3">
            {saldo.solicitacoes.map((sol) => {
              const cor = statusColor(sol.status);
              const isProximo = sol.dias === 0;
              return (
                <div
                  key={sol.id}
                  className="bg-white rounded-2xl px-4 py-4"
                  style={{
                    boxShadow: "0 2px 12px rgba(27,42,94,0.08)",
                    border: isProximo ? "1px solid #f59e0b" : "none",
                    background: isProximo ? "#fffbf0" : "white",
                  }}
                >
                  {isProximo ? (
                    <>
                      <p className="font-bold text-[#1B2A5E] text-sm mb-1">
                        Próximo período
                      </p>
                      <p className="text-orange-400 text-sm font-semibold">
                        A vencer {sol.dataInicio}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {sol.dias} dias
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-[#1B2A5E] text-sm mb-2">
                        {sol.dataInicio} - {sol.dataFim}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: cor.bg, color: cor.text }}
                        >
                          {sol.status}
                        </span>
                        <p className="text-gray-400 text-sm">{sol.dias} dias</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botão solicitar */}
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
