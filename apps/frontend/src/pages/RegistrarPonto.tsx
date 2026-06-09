import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNav from "../components/BottomNav";
import ConfirmarPontoDialog from "../components/ConfirmarPontoDialog";
import { api, ApiError } from "../lib/api";
import type { Registro } from "../types";

interface PendingRegistro {
  tipo: Registro["tipo"];
  tipoLabel: string;
  modalidade: Registro["modalidade"];
  horario: string;
  latitude: number;
  longitude: number;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface DiaEspelho {
  data: string;
  diaSemana: string;
  status: string;
  horasTrabalhadas: string;
  registros: {
    id: string;
    tipo: Registro["tipo"];
    horario: string;
    data: string;
    modalidade: Registro["modalidade"];
  }[];
}

type TipoPonto = Registro["tipo"];
type Modalidade = Registro["modalidade"];

const TIPOS_ORDEM: TipoPonto[] = [
  "entrada",
  "saida_intervalo",
  "retorno_intervalo",
  "saida",
];

function getTipoLabel(tipo: TipoPonto) {
  switch (tipo) {
    case "entrada":
      return "Entrada";
    case "saida_intervalo":
      return "Saída Intervalo";
    case "retorno_intervalo":
      return "Retorno Intervalo";
    case "saida":
      return "Saída";
  }
}

function getTipoIcon(tipo: TipoPonto) {
  const isUp = tipo === "entrada" || tipo === "retorno_intervalo";
  const colors = {
    entrada: { bg: "#e6f9f0", icon: "#22c55e" },
    saida_intervalo: { bg: "#fef9e6", icon: "#f59e0b" },
    retorno_intervalo: { bg: "#e6eeff", icon: "#3b82f6" },
    saida: { bg: "#fee6e6", icon: "#ef4444" },
  };
  const c = colors[tipo];
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{ background: c.bg }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.5">
        {isUp ? (
          <polyline points="18 15 12 9 6 15" />
        ) : (
          <polyline points="6 9 12 15 18 9" />
        )}
      </svg>
    </div>
  );
}

function modalidadeParaTipo(modalidade: Modalidade, proximoTipo: TipoPonto): Modalidade {
  if (proximoTipo === "saida_intervalo") return "Pausa";
  return modalidade === "Pausa" ? "Presencial" : modalidade;
}

export default function RegistrarPonto() {
  const navigate = useNavigate();
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [posicao, setPosicao] = useState<[number, number] | null>(null);
  const [modalidade, setModalidade] = useState<Modalidade>("Presencial");
  const [dia, setDia] = useState<DiaEspelho | null>(null);
  const [carregandoDia, setCarregandoDia] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [erro, setErro] = useState("");
  const [pendente, setPendente] = useState<PendingRegistro | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPosicao([-26.9195, -49.0661]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosicao([pos.coords.latitude, pos.coords.longitude]),
      () => setPosicao([-26.9195, -49.0661]),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const carregarDia = async () => {
    setCarregandoDia(true);
    try {
      const dias = await api.get<DiaEspelho[]>(
        "/funcionario/ponto/registros",
      );
      const hoje = new Date();
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const ddMes = `${hoje.getDate()} ${meses[hoje.getMonth()]}`;
      const diaHoje = dias.find((d) =>
        d.registros.some((r) => r.data === ddMes),
      );
      setDia(diaHoje ?? null);
    } catch {
      setDia(null);
    } finally {
      setCarregandoDia(false);
    }
  };

  useEffect(() => {
    carregarDia();
  }, []);

  const proximoTipo: TipoPonto = useMemo(() => {
    const jaFeitos = new Set(dia?.registros.map((r) => r.tipo) ?? []);
    return TIPOS_ORDEM.find((t) => !jaFeitos.has(t)) ?? "saida";
  }, [dia]);

  const formatHora = (date: Date) =>
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const diaSemana = horaAtual.toLocaleDateString("pt-BR", { weekday: "long" });

  const abrirConfirmacao = () => {
    if (!posicao || registrando) return;
    const tipoEfetivo = proximoTipo;
    const modalidadeEfetiva = modalidadeParaTipo(modalidade, tipoEfetivo);
    setErro("");
    setPendente({
      tipo: tipoEfetivo,
      tipoLabel: getTipoLabel(tipoEfetivo),
      modalidade: modalidadeEfetiva,
      horario: formatHora(new Date()),
      latitude: posicao[0],
      longitude: posicao[1],
    });
  };

  const cancelarConfirmacao = () => {
    if (registrando) return;
    setPendente(null);
  };

  const confirmarRegistro = async () => {
    if (!pendente || registrando) return;
    setRegistrando(true);
    setErro("");
    try {
      await api.post("/funcionario/ponto/registrar", {
        tipo: pendente.tipo,
        modalidade: pendente.modalidade,
        latitude: pendente.latitude,
        longitude: pendente.longitude,
      });
      setPendente(null);
      setShowModal(true);
      await carregarDia();
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : "Não foi possível registrar o ponto.",
      );
      setPendente(null);
    } finally {
      setRegistrando(false);
    }
  };

  const ultimos = (dia?.registros ?? []).slice().reverse();

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] pb-24 overflow-hidden">
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, top: 35, right: -80, zIndex: 0 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, bottom: 60, left: -100, zIndex: 0 }} />

      <div className="relative z-10">
        <div className="bg-white px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#1B2A5E]">Registrar Ponto</h1>
        </div>

        <div className="px-5 pt-8 pb-4 flex flex-col items-center">
          <p className="text-gray-400 text-sm mb-1">
            Próximo: {getTipoLabel(proximoTipo)}
          </p>
          <p className="text-6xl font-bold text-[#1B2A5E] tracking-tight tabular-nums">
            {formatHora(horaAtual)}
          </p>
          <p className="text-gray-400 text-sm mt-2 capitalize">{diaSemana}</p>
        </div>

        {/* Modalidade */}
        <div className="px-5 mb-3">
          <p className="text-xs text-gray-400 mb-2">Modalidade</p>
          <div
            className="flex gap-2"
            role="radiogroup"
            aria-label="Modalidade do ponto"
          >
            {(["Presencial", "Remoto"] as const).map((m) => {
              const ativo = modalidade === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setModalidade(m)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors"
                  style={{
                    background: ativo ? "#1B2A5E" : "white",
                    color: ativo ? "white" : "#64748b",
                    boxShadow: "0 2px 12px rgba(27,42,94,0.06)",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
          {proximoTipo === "saida_intervalo" && (
            <p className="text-xs text-gray-400 mt-2">
              Saída para intervalo será registrada como "Pausa".
            </p>
          )}
        </div>

        {erro && (
          <div className="px-5">
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-3">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          </div>
        )}

        <div className="px-5 pb-5">
          <button
            onClick={abrirConfirmacao}
            disabled={!posicao || registrando || !!pendente}
            className="w-full bg-[#1B2A5E] text-white font-bold py-4 rounded-2xl tracking-widest text-sm active:scale-95 transition-transform motion-reduce:transition-none disabled:opacity-60"
          >
            {registrando
              ? "REGISTRANDO..."
              : !posicao
                ? "OBTENDO LOCALIZAÇÃO..."
                : "REGISTRAR PONTO"}
          </button>
        </div>

        <div className="px-5 mb-6">
          <div className="w-full rounded-2xl overflow-hidden" style={{ height: 200 }}>
            {posicao ? (
              <MapContainer
                center={posicao}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={posicao}>
                  <Popup>Você está aqui</Popup>
                </Marker>
                <Circle
                  center={posicao}
                  radius={100}
                  pathOptions={{ color: "#2563EB", fillColor: "#2563EB", fillOpacity: 0.15 }}
                />
              </MapContainer>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-2xl">
                <p className="text-gray-400 text-sm">Carregando mapa...</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-[#1B2A5E]">
              Registros de hoje
            </h2>
            <button
              onClick={() => navigate("/espelho")}
              className="text-sm text-[#2563EB] font-medium"
            >
              Ver espelho
            </button>
          </div>
          <div className="flex flex-col gap-3" aria-busy={carregandoDia}>
            {carregandoDia ? (
              <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">Carregando...</p>
              </div>
            ) : ultimos.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">
                  Nenhum registro hoje. Seu próximo será {getTipoLabel(proximoTipo).toLowerCase()}.
                </p>
              </div>
            ) : (
              ultimos.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
                >
                  {getTipoIcon(reg.tipo)}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1B2A5E] text-sm">
                      {getTipoLabel(reg.tipo)}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {reg.data} • {reg.modalidade}
                    </p>
                  </div>
                  <p className="font-bold text-[#1B2A5E] text-base tabular-nums">
                    {reg.horario}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmarPontoDialog
        open={!!pendente}
        tipoLabel={pendente?.tipoLabel ?? ""}
        horario={pendente?.horario ?? ""}
        modalidade={pendente?.modalidade ?? ""}
        carregando={registrando}
        onCancel={cancelarConfirmacao}
        onConfirm={confirmarRegistro}
      />

      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8"
          style={{ zIndex: 9999, background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center w-full max-w-xs">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#e6f9f0" }}>
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#1B2A5E] mb-2">
              Ponto Registrado!
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Seu registro foi enviado com sucesso.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="border border-gray-200 rounded-2xl px-10 py-3 text-[#1B2A5E] font-bold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
