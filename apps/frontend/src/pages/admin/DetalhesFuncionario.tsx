import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNavAdmin from "../../components/BottomNavAdmin";
import { api, ApiError } from "../../lib/api";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface FuncionarioDetalhe {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  cpf: string;
  status: string;
  avatar: string;
  dataAdmissao: string;
  resumoMes: {
    horasTrabalhadas: string;
    bancoHoras: string;
    pontualidade: number;
  };
}

type TipoPonto = "entrada" | "saida_intervalo" | "retorno_intervalo" | "saida";

interface RegistroDia {
  id: string;
  tipo: TipoPonto;
  horario: string;
  modalidade: string;
  latitude: number;
  longitude: number;
}

interface DiaPonto {
  data: string;
  dataISO: string;
  diaSemana: string;
  horasTrabalhadas: string;
  minutos: number;
  status: "completo" | "atraso" | "em_andamento";
  registros: RegistroDia[];
}

interface PontoRange {
  inicio: string;
  fim: string;
  totalMinutos: number;
  totalFormatado: string;
  dias: DiaPonto[];
}

const tagColors: Record<string, { bg: string; text: string; rotulo: string }> = {
  entrada: { bg: "#e6eeff", text: "#2563EB", rotulo: "entrada" },
  saida_intervalo: { bg: "#fef9e6", text: "#f59e0b", rotulo: "pausa" },
  retorno_intervalo: { bg: "#e6eeff", text: "#2563EB", rotulo: "retorno" },
  saida: { bg: "#fee6e6", text: "#ef4444", rotulo: "saída" },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  Presente: { bg: "#e6f9f0", text: "#22c55e" },
  Ausente: { bg: "#fee6e6", text: "#ef4444" },
  Férias: { bg: "#e6eeff", text: "#2563EB" },
};

const corStatus = (status: string) =>
  statusConfig[status] ?? { bg: "#f1f5f9", text: "#64748b" };

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function isoHoje(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

interface MapaAberto {
  data: string;
  registros: RegistroDia[];
}

export default function DetalhesFuncionario() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [funcionario, setFuncionario] = useState<FuncionarioDetalhe | null>(
    null,
  );
  const [carregandoFunc, setCarregandoFunc] = useState(true);
  const [erroFunc, setErroFunc] = useState("");

  const [dataInicio, setDataInicio] = useState(isoHoje(-29));
  const [dataFim, setDataFim] = useState(isoHoje());

  const [periodo, setPeriodo] = useState<PontoRange | null>(null);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(true);
  const [erroPeriodo, setErroPeriodo] = useState("");

  const [mapaAberto, setMapaAberto] = useState<MapaAberto | null>(null);

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    (async () => {
      setCarregandoFunc(true);
      setErroFunc("");
      try {
        const data = await api.get<FuncionarioDetalhe>(
          `/admin/funcionarios/${id}`,
        );
        if (ativo) setFuncionario(data);
      } catch (e) {
        if (!ativo) return;
        setErroFunc(
          e instanceof ApiError
            ? e.message
            : "Não foi possível carregar o funcionário.",
        );
      } finally {
        if (ativo) setCarregandoFunc(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (!dataInicio || !dataFim) return;
    if (dataInicio > dataFim) {
      setErroPeriodo("Data inicial não pode ser maior que a final.");
      setPeriodo(null);
      return;
    }
    let ativo = true;
    const t = setTimeout(async () => {
      setCarregandoPeriodo(true);
      setErroPeriodo("");
      try {
        const data = await api.get<PontoRange>(
          `/admin/funcionarios/${id}/ponto?inicio=${dataInicio}&fim=${dataFim}`,
        );
        if (ativo) setPeriodo(data);
      } catch (e) {
        if (!ativo) return;
        setErroPeriodo(
          e instanceof ApiError
            ? e.message
            : "Não foi possível carregar os registros.",
        );
      } finally {
        if (ativo) setCarregandoPeriodo(false);
      }
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [id, dataInicio, dataFim]);

  const cor = useMemo(
    () => corStatus(funcionario?.status ?? ""),
    [funcionario?.status],
  );

  const bancoColor = useMemo(() => {
    const b = funcionario?.resumoMes.bancoHoras ?? "";
    if (b.startsWith("-")) return "text-[#ef4444]";
    if (b.startsWith("+") && b !== "+0h") return "text-[#22c55e]";
    return "text-[#1B2A5E]";
  }, [funcionario?.resumoMes.bancoHoras]);

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
        <div className="bg-white px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/funcionarios")}
            aria-label="Voltar"
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
          <h1 className="text-xl font-bold text-[#1B2A5E]">Detalhes</h1>
        </div>

        <div className="px-5 mt-4">
          {/* Card funcionário */}
          {erroFunc ? (
            <div
              role="alert"
              className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-5"
            >
              <p className="text-sm text-[#ef4444] font-medium">{erroFunc}</p>
            </div>
          ) : carregandoFunc || !funcionario ? (
            <div
              className="bg-[#1B2A5E] rounded-3xl p-5 mb-5 text-white opacity-70"
              style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
              aria-busy="true"
            >
              <p className="text-sm">Carregando funcionário...</p>
            </div>
          ) : (
            <div
              className="bg-[#1B2A5E] rounded-3xl p-5 mb-5 text-white"
              style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg font-bold">
                    {funcionario.avatar}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">
                    {funcionario.nome}
                  </p>
                  <p className="text-blue-200 text-sm truncate">
                    {funcionario.cargo}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ background: cor.bg, color: cor.text }}
                >
                  {funcionario.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                  <p className="text-blue-200 text-xs">E-mail</p>
                  <p className="text-white text-xs font-semibold mt-0.5 truncate">
                    {funcionario.email}
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                  <p className="text-blue-200 text-xs">CPF</p>
                  <p className="text-white text-xs font-semibold mt-0.5 tabular-nums">
                    {formatCpf(funcionario.cpf)}
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                  <p className="text-blue-200 text-xs">Admissão</p>
                  <p className="text-white text-xs font-semibold mt-0.5 tabular-nums">
                    {funcionario.dataAdmissao}
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                  <p className="text-blue-200 text-xs">Pontualidade</p>
                  <p className="text-white text-xs font-semibold mt-0.5 tabular-nums">
                    {funcionario.resumoMes.pontualidade}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resumo do mês */}
          <h2 className="text-base font-bold text-[#1B2A5E] mb-3">
            Resumo do mês
          </h2>
          <div className="grid grid-cols-3 gap-2 mb-5" aria-busy={carregandoFunc}>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-lg font-bold text-[#1B2A5E] tabular-nums">
                {funcionario ? funcionario.resumoMes.horasTrabalhadas : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Trabalhadas</p>
            </div>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className={`text-lg font-bold tabular-nums ${bancoColor}`}>
                {funcionario ? funcionario.resumoMes.bancoHoras : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Banco hrs</p>
            </div>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-lg font-bold text-[#1B2A5E] tabular-nums">
                {funcionario ? `${funcionario.resumoMes.pontualidade}%` : "—"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Pontual.</p>
            </div>
          </div>

          {/* Filtro período */}
          <h2 className="text-base font-bold text-[#1B2A5E] mb-3">
            Registros por período
          </h2>
          <div
            className="bg-white rounded-2xl px-4 py-3 mb-3 flex gap-3"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
          >
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>
            <div className="w-px bg-gray-100" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#f0f4ff] rounded-2xl px-4 py-3 mb-4 flex justify-between items-center">
            <p className="text-sm text-[#2563EB] font-medium">
              Total no período
            </p>
            <p className="text-lg font-bold text-[#2563EB] tabular-nums">
              {periodo ? periodo.totalFormatado : "—"}
            </p>
          </div>

          {erroPeriodo && (
            <div
              role="alert"
              className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4"
            >
              <p className="text-sm text-[#ef4444] font-medium">
                {erroPeriodo}
              </p>
            </div>
          )}

          {/* Registros */}
          <div className="flex flex-col gap-3" aria-busy={carregandoPeriodo}>
            {carregandoPeriodo ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">Carregando registros...</p>
              </div>
            ) : !periodo || periodo.dias.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">
                  Nenhum registro neste período.
                </p>
              </div>
            ) : (
              periodo.dias.map((dia) => (
                <div
                  key={dia.dataISO}
                  className="bg-white rounded-2xl px-4 py-3"
                  style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-[#1B2A5E] text-sm">
                      {dia.data}
                    </p>
                    {dia.status === "em_andamento" ? (
                      <p className="text-xs font-semibold text-orange-400">
                        Em andamento
                      </p>
                    ) : (
                      <p
                        className={`text-xs font-semibold tabular-nums ${dia.status === "atraso" ? "text-[#ef4444]" : "text-green-500"}`}
                      >
                        {dia.horasTrabalhadas} trabalhadas
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dia.registros.map((reg) => {
                      const tag = tagColors[reg.tipo] ?? {
                        bg: "#f1f5f9",
                        text: "#64748b",
                        rotulo: reg.tipo,
                      };
                      return (
                        <span
                          key={reg.id}
                          className="text-xs font-medium px-2 py-1 rounded-lg tabular-nums"
                          style={{ background: tag.bg, color: tag.text }}
                        >
                          {reg.horario} {tag.rotulo}
                        </span>
                      );
                    })}
                  </div>
                  {dia.registros.length > 0 && (
                    <button
                      onClick={() =>
                        setMapaAberto({
                          data: dia.data,
                          registros: dia.registros,
                        })
                      }
                      className="flex items-center gap-1 text-xs text-[#2563EB] font-medium mt-1"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      ver localização
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal mapa */}
      {mapaAberto && mapaAberto.registros[0] && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setMapaAberto(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-[#1B2A5E]">{mapaAberto.data}</p>
              <button
                onClick={() => setMapaAberto(null)}
                aria-label="Fechar mapa"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1B2A5E"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              className="w-full rounded-2xl overflow-hidden mb-3"
              style={{ height: 220 }}
            >
              <MapContainer
                center={[
                  mapaAberto.registros[0].latitude,
                  mapaAberto.registros[0].longitude,
                ]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapaAberto.registros.map((reg) => (
                  <Marker
                    key={reg.id}
                    position={[reg.latitude, reg.longitude]}
                  >
                    <Popup>
                      {reg.horario} — {tagColors[reg.tipo]?.rotulo ?? reg.tipo}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="flex flex-wrap gap-2">
              {mapaAberto.registros.map((reg) => {
                const tag = tagColors[reg.tipo] ?? {
                  bg: "#f1f5f9",
                  text: "#64748b",
                  rotulo: reg.tipo,
                };
                return (
                  <span
                    key={reg.id}
                    className="text-xs font-medium px-2 py-1 rounded-lg tabular-nums"
                    style={{ background: tag.bg, color: tag.text }}
                  >
                    {reg.horario} {tag.rotulo}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}
