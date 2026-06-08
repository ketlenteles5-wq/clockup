import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";
import { api, ApiError } from "../../lib/api";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  cpf: string;
  status: "Presente" | "Ausente" | "Férias";
  avatar: string;
  horasTrabalhadas: string;
  pontualidade: number;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Presente: { bg: "#e6f9f0", text: "#22c55e" },
  Ausente: { bg: "#fee6e6", text: "#ef4444" },
  Férias: { bg: "#e6eeff", text: "#2563EB" },
};

const corStatus = (status: string) =>
  statusConfig[status] ?? { bg: "#f1f5f9", text: "#64748b" };

export default function Funcionarios() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    const t = setTimeout(async () => {
      setCarregando(true);
      setErro("");
      try {
        const q = busca ? `?busca=${encodeURIComponent(busca)}` : "";
        const data = await api.get<Funcionario[]>(`/admin/funcionarios${q}`);
        if (ativo) setFuncionarios(data);
      } catch (e) {
        if (!ativo) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : "Não foi possível carregar a lista.";
        setErro(msg);
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [busca]);

  const totalPresentes = funcionarios.filter((f) => f.status === "Presente").length;
  const totalAusentes = funcionarios.filter((f) => f.status === "Ausente").length;

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
            <h1 className="text-xl font-bold text-[#1B2A5E]">Equipe</h1>
          </div>
          <button
            onClick={() => navigate("/admin/cadastrar")}
            className="bg-[#1B2A5E] text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            + Cadastrar
          </button>
        </div>

        <div className="px-5 mt-4">
          {/* Busca */}
          <div
            className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 mb-4"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.06)" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 text-sm text-[#1B2A5E] bg-transparent outline-none"
            />
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-xl font-bold text-[#1B2A5E]">
                {funcionarios.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total</p>
            </div>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-xl font-bold text-[#22c55e]">{totalPresentes}</p>
              <p className="text-xs text-gray-400 mt-0.5">Presentes</p>
            </div>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-xl font-bold text-[#ef4444]">{totalAusentes}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ausentes</p>
            </div>
          </div>

          {erro && (
            <div className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          {/* Lista */}
          <div className="flex flex-col gap-3">
            {carregando ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">Carregando...</p>
              </div>
            ) : funcionarios.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">
                  Nenhum funcionário cadastrado ainda.
                </p>
              </div>
            ) : (
              funcionarios.map((func) => {
                const cor = corStatus(func.status);
                return (
                  <button
                    key={func.id}
                    onClick={() => navigate(`/admin/funcionarios/${func.id}`)}
                    className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-95 transition-transform"
                    style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#1B2A5E] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {func.avatar}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1B2A5E] text-sm">
                        {func.nome}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {func.cargo}
                      </p>
                      <p className="text-gray-300 text-xs mt-0.5">
                        {func.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cor.bg, color: cor.text }}
                      >
                        {func.status}
                      </span>
                      <p className="text-xs text-gray-400">
                        {func.pontualidade}%
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <BottomNavAdmin />
    </div>
  );
}
