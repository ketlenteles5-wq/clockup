import { useNavigate } from "react-router-dom";

export default function EscolhaLogin() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] flex flex-col overflow-hidden">
      {/* Círculo superior direito */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "#d0daf0",
          opacity: 0.45,
          top: -60,
          right: -80,
          zIndex: 0,
        }}
      />
      {/* Círculo inferior esquerdo */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "#d0daf0",
          opacity: 0.45,
          bottom: -60,
          left: -80,
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen px-6 py-12">
        {/* Logo e título */}
        <div className="flex flex-col items-center mt-10">
          <img
            src="/logo.png"
            alt="ClockUp"
            style={{
              height: 100,
              width: 300,
              objectFit: "contain",
              mixBlendMode: "multiply",
            }}
          />
          <p className="text-gray-400 text-sm mt-5 text-center">
            Gestão de ponto simples e eficiente
          </p>
        </div>

        {/* Opções de login */}
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-gray-400 text-sm mb-2">
            Como deseja entrar?
          </p>

          {/* Funcionário */}
          <button
            onClick={() => navigate("/login/funcionario")}
            className="w-full bg-[#1B2A5E] rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform"
            style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-base">Sou Funcionário</p>
              <p className="text-blue-200 text-xs mt-0.5">
                Acesse seu ponto e registros
              </p>
            </div>
            <svg
              className="ml-auto"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Empresa */}
          <button
            onClick={() => navigate("/login/empresa")}
            className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform"
            style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.08)" }}
          >
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2A5E"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[#1B2A5E] font-bold text-base">Sou Empresa</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Gerencie sua equipe e registros
              </p>
            </div>
            <svg
              className="ml-auto"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1B2A5E"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Rodapé */}
        <p className="text-gray-400 text-xs text-center">
          © 2026 ClockUp · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
