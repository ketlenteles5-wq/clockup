import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import LogoMenu from "../components/LogoMenu";
import { api, ApiError } from "../lib/api";

interface DiaEspelho {
  data: string;
  diaSemana: string;
  status: "completo" | "atraso" | "em_andamento";
  horasTrabalhadas: string;
  registros: { id: string; tipo: string; horario: string }[];
}

interface ResumoCalculado {
  pontualidade: number;
  horasTrabalhadas: string;
  bancoHoras: string;
}

const MIN_DIA = 480; // 8h

function parseHoras(h: string): number {
  const m = h.match(/^(-?)(\d+)h(\d{0,2})$/);
  if (!m) return 0;
  const sinal = m[1] === "-" ? -1 : 1;
  return sinal * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function formatHoras(min: number): string {
  const sign = min < 0 ? "-" : "";
  const abs = Math.abs(min);
  return `${sign}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, "0")}`;
}

function formatBanco(min: number): string {
  const sign = min >= 0 ? "+" : "-";
  return `${sign}${Math.floor(Math.abs(min) / 60)}h`;
}

function diasUteisDecorridosNoMes(hoje: Date): number {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  let count = 0;
  for (let d = 1; d <= hoje.getDate(); d++) {
    const dow = new Date(ano, mes, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function readNomeFuncionario(): string {
  const raw = localStorage.getItem("clockup.user");
  if (!raw) return "Funcionário";
  try {
    const u = JSON.parse(raw);
    const partes = String(u.nome ?? "").trim().split(/\s+/);
    return partes[0] || "Funcionário";
  } catch {
    return "Funcionário";
  }
}

interface QuickItem {
  label: string;
  sub: string;
  path: string;
  icon: React.ReactNode;
}

export default function Home() {
  const navigate = useNavigate();
  const nome = readNomeFuncionario();
  const [resumo, setResumo] = useState<ResumoCalculado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        const dias = await api.get<DiaEspelho[]>("/funcionario/ponto/registros");
        if (!ativo) return;
        const minutosTrabalhados = dias.reduce(
          (acc, d) => acc + parseHoras(d.horasTrabalhadas),
          0,
        );
        const esperados = diasUteisDecorridosNoMes(new Date()) * MIN_DIA;
        const banco = minutosTrabalhados - esperados;
        const comRegistro = dias.length;
        const completos = dias.filter((d) => d.status === "completo").length;
        const pontualidade = comRegistro
          ? Math.round((completos / comRegistro) * 100)
          : 0;
        setResumo({
          pontualidade,
          horasTrabalhadas: formatHoras(minutosTrabalhados),
          bancoHoras: formatBanco(banco),
        });
      } catch (e) {
        if (!ativo) return;
        setErro(
          e instanceof ApiError
            ? e.message
            : "Não foi possível carregar o resumo.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const quickItems: QuickItem[] = [
    {
      label: "Bater ponto",
      sub: "Registrar Agora",
      path: "/ponto",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Espelho",
      sub: "ver registros",
      path: "/espelho",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      label: "Férias",
      sub: "saldo e pedidos",
      path: "/ferias",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
  ];

  const bancoColor = resumo?.bancoHoras.startsWith("-")
    ? "text-red-300"
    : "text-blue-300";

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] pb-24 overflow-hidden">
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, top: 35, right: -80 }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, bottom: 60, left: -100 }}
      />

      <div className="relative z-10">
        <div className="bg-white px-5 pt-6 pb-5">
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1 pr-3">
              <h1 className="text-2xl font-bold text-[#1B2A5E] truncate">
                Olá, {nome}!
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Tenha um ótimo dia de trabalho.
              </p>
            </div>
            <LogoMenu />
          </div>
        </div>

        <div className="px-5 mt-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[#1B2A5E]">Resumo</h2>
            <button
              onClick={() => navigate("/espelho")}
              className="text-sm text-[#2563EB]"
            >
              ver tudo
            </button>
          </div>

          {erro && (
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-3">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2" aria-busy={carregando}>
            <div className="bg-[#1B2A5E] rounded-2xl p-3 text-white shadow-lg">
              <p className="text-2xl font-bold tabular-nums">
                {carregando ? "—" : `${resumo?.pontualidade ?? 0}%`}
              </p>
              <p className="text-xs text-blue-200 mt-1">pontualidade</p>
              <p className="text-xs text-blue-300 mt-2 leading-tight">
                no mês corrente
              </p>
            </div>
            <div className="bg-[#1B2A5E] rounded-2xl p-3 text-white shadow-lg">
              <p className="text-2xl font-bold tabular-nums">
                {carregando ? "—" : resumo?.horasTrabalhadas}
              </p>
              <p className="text-xs text-blue-200 mt-1">trabalhadas</p>
              <p className="text-xs text-blue-300 mt-2 leading-tight">
                Horas do mês
              </p>
            </div>
            <div className="bg-[#1B2A5E] rounded-2xl p-3 text-white shadow-lg">
              <p className={`text-2xl font-bold tabular-nums ${bancoColor}`}>
                {carregando ? "—" : resumo?.bancoHoras}
              </p>
              <p className="text-xs text-blue-200 mt-1">banco hrs</p>
              <p className="text-xs text-blue-300 mt-2 leading-tight">
                Saldo do mês
              </p>
            </div>
          </div>
        </div>

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
