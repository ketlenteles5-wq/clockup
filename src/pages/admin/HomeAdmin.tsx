import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";

const funcionariosMock = [
  {
    id: "1",
    nome: "Nicole Ferreira",
    cargo: "Desenvolvedora",
    status: "Presente",
    avatar: "NF",
  },
  {
    id: "2",
    nome: "Carlos Silva",
    cargo: "Designer",
    status: "Ausente",
    avatar: "CS",
  },
  {
    id: "3",
    nome: "Ana Souza",
    cargo: "Product Manager",
    status: "Presente",
    avatar: "AS",
  },
  {
    id: "4",
    nome: "Pedro Lima",
    cargo: "DevOps",
    status: "Férias",
    avatar: "PL",
  },
];

const statusConfig = {
  Presente: { bg: "#e6f9f0", text: "#22c55e" },
  Ausente: { bg: "#fee6e6", text: "#ef4444" },
  Férias: { bg: "#e6eeff", text: "#2563EB" },
};

export default function HomeAdmin() {
  const navigate = useNavigate();

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
        <div className="bg-white px-5 pt-6 pb-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-[#1B2A5E]">
                Olá, ClockUp!
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Painel administrativo
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

        <div className="px-5 mt-5">
          {/* Resumo */}
          <h2 className="text-lg font-bold text-[#1B2A5E] mb-3">Resumo</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div
              className="bg-[#1B2A5E] rounded-2xl p-4 text-white"
              style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
            >
              <p className="text-3xl font-bold">4</p>
              <p className="text-blue-200 text-xs mt-1">Funcionários</p>
              <p className="text-blue-300 text-xs mt-2">ativos</p>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-3xl font-bold text-[#22c55e]">3</p>
              <p className="text-gray-400 text-xs mt-1">Presentes</p>
              <p className="text-gray-300 text-xs mt-2">hoje</p>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-3xl font-bold text-orange-400">2</p>
              <p className="text-gray-400 text-xs mt-1">Pendências</p>
              <p className="text-gray-300 text-xs mt-2">para aprovar</p>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-3xl font-bold text-[#2563EB]">1</p>
              <p className="text-gray-400 text-xs mt-1">Contestações</p>
              <p className="text-gray-300 text-xs mt-2">em aberto</p>
            </div>
          </div>

          {/* Equipe hoje */}
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[#1B2A5E]">Equipe hoje</h2>
            <button
              onClick={() => navigate("/admin/funcionarios")}
              className="text-sm text-[#2563EB] font-medium"
            >
              ver todos
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {funcionariosMock.map((func) => {
              const cor =
                statusConfig[func.status as keyof typeof statusConfig];
              return (
                <button
                  key={func.id}
                  onClick={() => navigate(`/admin/funcionarios/${func.id}`)}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 text-left active:scale-95 transition-transform"
                  style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1B2A5E] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {func.avatar}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1B2A5E] text-sm">
                      {func.nome}
                    </p>
                    <p className="text-gray-400 text-xs">{func.cargo}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: cor.bg, color: cor.text }}
                  >
                    {func.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNavAdmin />
    </div>
  );
}
