import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNav from "../components/BottomNav";
import type { Registro } from "../types";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const registrosMock: Registro[] = [
  {
    id: "1",
    tipo: "entrada",
    horario: "08:02",
    data: "13 de Abr",
    modalidade: "Presencial",
  },
  {
    id: "2",
    tipo: "saida_intervalo",
    horario: "12:05",
    data: "13 de Abr",
    modalidade: "Pausa",
  },
  {
    id: "3",
    tipo: "retorno_intervalo",
    horario: "13:06",
    data: "13 de Abr",
    modalidade: "Presencial",
  },
];

function getTipoLabel(tipo: Registro["tipo"]) {
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

function getTipoIcon(tipo: Registro["tipo"]) {
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
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c.icon}
        strokeWidth="2.5"
      >
        {isUp ? (
          <polyline points="18 15 12 9 6 15" />
        ) : (
          <polyline points="6 9 12 15 18 9" />
        )}
      </svg>
    </div>
  );
}

export default function RegistrarPonto() {
  const navigate = useNavigate();
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [posicao, setPosicao] = useState<[number, number] | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosicao([pos.coords.latitude, pos.coords.longitude]),
      () => setPosicao([-26.9195, -49.0661]),
    );
  }, []);

  const formatHora = (date: Date) =>
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const diaSemana = horaAtual.toLocaleDateString("pt-BR", { weekday: "long" });

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
          zIndex: 0,
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
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white px-5 pt-6 pb-4 flex items-center gap-3">
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
          <h1 className="text-xl font-bold text-[#1B2A5E]">Registrar Ponto</h1>
        </div>

        {/* Relógio */}
        <div className="px-5 pt-8 pb-6 flex flex-col items-center">
          <p className="text-gray-400 text-sm mb-1">Registrar Saída</p>
          <p className="text-6xl font-bold text-[#1B2A5E] tracking-tight">
            {formatHora(horaAtual)}
          </p>
          <p className="text-gray-400 text-sm mt-2 capitalize">{diaSemana}</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 w-full bg-[#1B2A5E] text-white font-bold py-4 rounded-2xl tracking-widest text-sm active:scale-95 transition-transform"
          >
            REGISTRAR PONTO
          </button>
        </div>

        {/* Mapa */}
        <div className="px-5 mb-6">
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{ height: 200 }}
          >
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
                  pathOptions={{
                    color: "#2563EB",
                    fillColor: "#2563EB",
                    fillOpacity: 0.15,
                  }}
                />
              </MapContainer>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-2xl">
                <p className="text-gray-400 text-sm">Carregando mapa...</p>
              </div>
            )}
          </div>
        </div>

        {/* Últimos registros */}
        <div className="px-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-[#1B2A5E]">
              Últimos registros
            </h2>
            <button
              onClick={() => navigate("/espelho")}
              className="text-sm text-[#2563EB] font-medium"
            >
              Ver espelho
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {registrosMock.map((reg) => (
              <div
                key={reg.id}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                {getTipoIcon(reg.tipo)}
                <div className="flex-1">
                  <p className="font-bold text-[#1B2A5E] text-sm">
                    {getTipoLabel(reg.tipo)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {reg.data} • {reg.modalidade}
                  </p>
                </div>
                <p className="font-bold text-[#1B2A5E] text-base">
                  {reg.horario}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal sucesso — fora do z-10 para ficar acima de tudo */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8"
          style={{ zIndex: 9999, background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center w-full max-w-xs">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#e6f9f0" }}
            >
              <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                >
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
