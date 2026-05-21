import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import type { ResumoMes } from "../types";

const resumo: ResumoMes = {
  pontualidade: 97,
  horasTrabalhadas: "72h",
  bancoHoras: "+3h",
};

interface QuickItem {
  label: string;
  sub: string;
  path: string;
  icon: React.ReactNode;
}

export default function Home() {
  const navigate = useNavigate();

  const quickItems: QuickItem[] = [
    {
      label: "Bater ponto",
      sub: "Registrar Agora",
      path: "/ponto",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1B2A5E"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Espelho",
      sub: "Abril 2026",
      path: "/espelho",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1B2A5E"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      label: "Férias",
      sub: "30 dias saldo",
      path: "/ferias",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1B2A5E"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      label: "Atestado",
      sub: "Enviar doc",
      path: "/atestado",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1B2A5E"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] pb-24 overflow-hidden">
      {/* Círculo superior direito */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280,
          height: 280,
          background: "#d0daf0",
          opacity: 0.45,
          top: 35,
          right: -80,
        }}
      />

      {/* Círculo inferior esquerdo */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280,
          height: 280,
          background: "#d0daf0",
          opacity: 0.45,
          bottom: 60,
          left: -100,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white px-5 pt-6 pb-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#1B2A5E]">
                Olá, Nicole!
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Tenha um ótimo dia de trabalho.
              </p>
            </div>
            <img
              src="/logo.png"
              alt="ClockUp"
              style={{
                height: 56,
                width: 56,
                objectFit: "contain",
                mixBlendMode: "multiply",
              }}
            />
          </div>
        </div>

        {/* Resumo */}
        <div className="px-5 mt-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[#1B2A5E]">Resumo</h2>
            <button className="text-sm text-[#2563EB]">ver tudo</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1B2A5E] rounded-2xl p-3 text-white shadow-lg">
              <p className="text-2xl font-bold">{resumo.pontualidade}%</p>
              <p className="text-xs text-blue-200 mt-1">pontualidade</p>
              <div className="mt-2 h-1 bg-blue-400 rounded-full w-4/5" />
              <p className="text-xs text-blue-300 mt-2 leading-tight">
                Pontualidade no mês
              </p>
            </div>
            <div className="bg-[#1B2A5E] rounded-2xl p-3 text-white shadow-lg">
              <p className="text-2xl font-bold">{resumo.horasTrabalhadas}</p>
              <p className="text-xs text-blue-200 mt-1">trabalhadas</p>
              <div className="mt-2 h-1 bg-teal-400 rounded-full w-3/5" />
              <p className="text-xs text-blue-300 mt-2 leading-tight">
                Horas do mês
              </p>
            </div>
            <div className="bg-[#1B2A5E] rounded-2xl p-3 text-white shadow-lg">
              <p className="text-2xl font-bold">{resumo.bancoHoras}</p>
              <p className="text-xs text-blue-200 mt-1">banco hrs</p>
              <div className="mt-2 h-1 bg-purple-400 rounded-full w-2/5" />
              <p className="text-xs text-blue-300 mt-2 leading-tight">
                Saldo extra
              </p>
            </div>
          </div>
        </div>

        {/* Acesso Rápido */}
        <div className="px-5">
          <h2 className="text-lg font-bold text-[#1B2A5E] mb-3">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-2xl p-4 text-left active:scale-95 transition-transform"
                style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.15)" }}
              >
                <div className="mb-3">{item.icon}</div>
                <p className="font-bold text-[#1B2A5E] text-sm">{item.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
