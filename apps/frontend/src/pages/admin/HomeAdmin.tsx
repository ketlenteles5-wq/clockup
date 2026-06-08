import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";
import LogoMenu from "../../components/LogoMenu";
import { api, ApiError } from "../../lib/api";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  status: string;
  avatar: string;
}

interface Pendencia {
  id: string;
  status: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Presente: { bg: "#e6f9f0", text: "#22c55e" },
  Ausente: { bg: "#fee6e6", text: "#ef4444" },
  Férias: { bg: "#e6eeff", text: "#2563EB" },
};

const corStatus = (status: string) =>
  statusConfig[status] ?? { bg: "#f1f5f9", text: "#64748b" };

function readEmpresaNome(): string {
  const raw = localStorage.getItem("clockup.empresa");
  if (!raw) return "ClockUp";
  try {
    const e = JSON.parse(raw);
    return e.razao_social ?? "ClockUp";
  } catch {
    return "ClockUp";
  }
}

export default function HomeAdmin() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [feriasPendentes, setFeriasPendentes] = useState(0);
  const [atestadosPendentes, setAtestadosPendentes] = useState(0);
  const [contestacoesPendentes, setContestacoesPendentes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const empresaNome = readEmpresaNome();

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        const [func, ferias, atestados, contestacoes] = await Promise.all([
          api.get<Funcionario[]>("/admin/funcionarios"),
          api.get<Pendencia[]>("/admin/ferias?filtro=Pendente"),
          api.get<Pendencia[]>("/admin/atestados?filtro=Pendente"),
          api.get<Pendencia[]>("/admin/contestacoes?filtro=Pendente"),
        ]);
        if (!ativo) return;
        setFuncionarios(func);
        setFeriasPendentes(ferias.length);
        setAtestadosPendentes(atestados.length);
        setContestacoesPendentes(contestacoes.length);
      } catch (e) {
        if (!ativo) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : "Não foi possível carregar o painel.";
        setErro(msg);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const totalFuncionarios = funcionarios.length;
  const totalPresentes = funcionarios.filter((f) => f.status === "Presente")
    .length;
  const totalPendencias = feriasPendentes + atestadosPendentes;

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
            <div className="min-w-0 flex-1 pr-3">
              <h1 className="text-2xl font-bold text-[#1B2A5E] truncate">
                Olá, {empresaNome}!
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Painel administrativo
              </p>
            </div>
            <LogoMenu />
          </div>
        </div>

        <div className="px-5 mt-5">
          {erro && (
            <div
              role="alert"
              className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4"
            >
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          {/* Resumo */}
          <h2 className="text-lg font-bold text-[#1B2A5E] mb-3">Resumo</h2>
          <div
            className="grid grid-cols-2 gap-3 mb-6"
            aria-busy={carregando}
            aria-live="polite"
          >
            <div
              className="bg-[#1B2A5E] rounded-2xl p-4 text-white"
              style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
            >
              <p className="text-3xl font-bold tabular-nums">
                {carregando ? "—" : totalFuncionarios}
              </p>
              <p className="text-blue-200 text-xs mt-1">Funcionários</p>
              <p className="text-blue-300 text-xs mt-2">ativos</p>
            </div>
            <div
              className="bg-white rounded-2xl p-4"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-3xl font-bold text-[#22c55e] tabular-nums">
                {carregando ? "—" : totalPresentes}
              </p>
              <p className="text-gray-400 text-xs mt-1">Presentes</p>
              <p className="text-gray-300 text-xs mt-2">hoje</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/ferias")}
              className="bg-white rounded-2xl p-4 text-left active:scale-95 transition-transform"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-3xl font-bold text-orange-400 tabular-nums">
                {carregando ? "—" : totalPendencias}
              </p>
              <p className="text-gray-400 text-xs mt-1">Pendências</p>
              <p className="text-gray-300 text-xs mt-2">para aprovar</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/contestacoes")}
              className="bg-white rounded-2xl p-4 text-left active:scale-95 transition-transform"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-3xl font-bold text-[#2563EB] tabular-nums">
                {carregando ? "—" : contestacoesPendentes}
              </p>
              <p className="text-gray-400 text-xs mt-1">Contestações</p>
              <p className="text-gray-300 text-xs mt-2">em aberto</p>
            </button>
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
            {carregando ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">Carregando equipe...</p>
              </div>
            ) : funcionarios.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">
                  Nenhum funcionário cadastrado ainda.
                </p>
                <button
                  onClick={() => navigate("/admin/cadastrar")}
                  className="mt-3 text-sm text-[#2563EB] font-semibold"
                >
                  Cadastrar primeiro funcionário
                </button>
              </div>
            ) : (
              funcionarios.slice(0, 4).map((func) => {
                const cor = corStatus(func.status);
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
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1B2A5E] text-sm truncate">
                        {func.nome}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {func.cargo}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                      style={{ background: cor.bg, color: cor.text }}
                    >
                      {func.status}
                    </span>
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
