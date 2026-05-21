import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNavAdmin from "../../components/BottomNavAdmin";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const funcionariosMock = [
  {
    id: "1",
    nome: "Nicole Ferreira",
    cargo: "Desenvolvedora",
    email: "nicole@empresa.com",
    cpf: "123.456.789-00",
    status: "Presente",
    avatar: "NF",
    pontualidade: 97,
    bancoHoras: "+3h",
    admissao: "01/03/2024",
    horasTrabalhadas: "72h",
  },
  {
    id: "2",
    nome: "Carlos Silva",
    cargo: "Designer",
    email: "carlos@empresa.com",
    cpf: "987.654.321-00",
    status: "Ausente",
    avatar: "CS",
    pontualidade: 85,
    bancoHoras: "-2h",
    admissao: "15/06/2023",
    horasTrabalhadas: "68h",
  },
  {
    id: "3",
    nome: "Ana Souza",
    cargo: "Product Manager",
    email: "ana@empresa.com",
    cpf: "456.789.123-00",
    status: "Presente",
    avatar: "AS",
    pontualidade: 99,
    bancoHoras: "+5h",
    admissao: "10/01/2022",
    horasTrabalhadas: "80h",
  },
  {
    id: "4",
    nome: "Pedro Lima",
    cargo: "DevOps",
    email: "pedro@empresa.com",
    cpf: "321.654.987-00",
    status: "Férias",
    avatar: "PL",
    pontualidade: 92,
    bancoHoras: "0h",
    admissao: "20/09/2023",
    horasTrabalhadas: "40h",
  },
];

const registrosTodos = [
  {
    data: "Seg, 14 Abr",
    dataISO: "2026-04-14",
    horas: "8h02",
    minutos: 482,
    registros: ["08:00 entrada", "12:05 pausa", "13:06 retorno", "17:01 saída"],
    status: "completo",
    lat: -26.9195,
    lng: -49.0661,
  },
  {
    data: "Ter, 15 Abr",
    dataISO: "2026-04-15",
    horas: "7h48",
    minutos: 468,
    registros: ["08:12 entrada", "12:00 pausa", "13:00 retorno", "17:00 saída"],
    status: "atraso",
    lat: -26.9198,
    lng: -49.0665,
  },
  {
    data: "Qua, 16 Abr",
    dataISO: "2026-04-16",
    horas: "4h00",
    minutos: 240,
    registros: ["08:00 entrada", "12:00 pausa"],
    status: "em_andamento",
    lat: -26.9192,
    lng: -49.0658,
  },
  {
    data: "Qui, 17 Abr",
    dataISO: "2026-04-17",
    horas: "8h00",
    minutos: 480,
    registros: ["08:00 entrada", "12:00 pausa", "13:00 retorno", "17:00 saída"],
    status: "completo",
    lat: -26.9195,
    lng: -49.0661,
  },
  {
    data: "Sex, 18 Abr",
    dataISO: "2026-04-18",
    horas: "8h10",
    minutos: 490,
    registros: ["07:50 entrada", "12:00 pausa", "13:00 retorno", "17:00 saída"],
    status: "completo",
    lat: -26.92,
    lng: -49.067,
  },
  {
    data: "Seg, 21 Abr",
    dataISO: "2026-04-21",
    horas: "8h00",
    minutos: 480,
    registros: ["08:00 entrada", "12:00 pausa", "13:00 retorno", "17:00 saída"],
    status: "completo",
    lat: -26.9195,
    lng: -49.0661,
  },
  {
    data: "Ter, 22 Abr",
    dataISO: "2026-04-22",
    horas: "8h05",
    minutos: 485,
    registros: ["07:55 entrada", "12:00 pausa", "13:00 retorno", "17:00 saída"],
    status: "completo",
    lat: -26.9193,
    lng: -49.0663,
  },
];

const tagColors: Record<string, { bg: string; text: string }> = {
  entrada: { bg: "#e6eeff", text: "#2563EB" },
  pausa: { bg: "#fef9e6", text: "#f59e0b" },
  retorno: { bg: "#e6eeff", text: "#2563EB" },
  saída: { bg: "#fee6e6", text: "#ef4444" },
};

const statusConfig = {
  Presente: { bg: "#e6f9f0", text: "#22c55e" },
  Ausente: { bg: "#fee6e6", text: "#ef4444" },
  Férias: { bg: "#e6eeff", text: "#2563EB" },
};

interface RegistroMapa {
  data: string;
  lat: number;
  lng: number;
  registros: string[];
}

export default function DetalhesFuncionario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const func = funcionariosMock.find((f) => f.id === id) ?? funcionariosMock[0];
  const cor = statusConfig[func.status as keyof typeof statusConfig];

  const [dataInicio, setDataInicio] = useState("2026-04-14");
  const [dataFim, setDataFim] = useState("2026-04-22");
  const [mapaAberto, setMapaAberto] = useState<RegistroMapa | null>(null);

  const registrosFiltrados = registrosTodos.filter(
    (r) => r.dataISO >= dataInicio && r.dataISO <= dataFim,
  );

  const totalMinutos = registrosFiltrados.reduce(
    (acc, r) => acc + r.minutos,
    0,
  );
  const totalHoras = Math.floor(totalMinutos / 60);
  const totalMin = totalMinutos % 60;
  const totalFormatado = `${totalHoras}h${totalMin > 0 ? totalMin + "min" : ""}`;

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
          <div
            className="bg-[#1B2A5E] rounded-3xl p-5 mb-5 text-white"
            style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {func.avatar}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{func.nome}</p>
                <p className="text-blue-200 text-sm">{func.cargo}</p>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: cor.bg, color: cor.text }}
              >
                {func.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                <p className="text-blue-200 text-xs">E-mail</p>
                <p className="text-white text-xs font-semibold mt-0.5">
                  {func.email}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                <p className="text-blue-200 text-xs">CPF</p>
                <p className="text-white text-xs font-semibold mt-0.5">
                  {func.cpf}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                <p className="text-blue-200 text-xs">Admissão</p>
                <p className="text-white text-xs font-semibold mt-0.5">
                  {func.admissao}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-2xl px-3 py-2">
                <p className="text-blue-200 text-xs">Pontualidade</p>
                <p className="text-white text-xs font-semibold mt-0.5">
                  {func.pontualidade}%
                </p>
              </div>
            </div>
          </div>

          {/* Resumo do mês */}
          <h2 className="text-base font-bold text-[#1B2A5E] mb-3">
            Resumo do mês
          </h2>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-lg font-bold text-[#1B2A5E]">
                {func.horasTrabalhadas}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Trabalhadas</p>
            </div>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p
                className={`text-lg font-bold ${func.bancoHoras.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"}`}
              >
                {func.bancoHoras}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Banco hrs</p>
            </div>
            <div
              className="bg-white rounded-2xl p-3 text-center"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              <p className="text-lg font-bold text-[#1B2A5E]">
                {func.pontualidade}%
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
              <p className="text-xs text-gray-400 mb-1">De</p>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>
            <div className="w-px bg-gray-100" />
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Até</p>
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
            <p className="text-lg font-bold text-[#2563EB]">{totalFormatado}</p>
          </div>

          {/* Registros */}
          <div className="flex flex-col gap-3">
            {registrosFiltrados.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-6 text-center"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <p className="text-gray-400 text-sm">
                  Nenhum registro neste período.
                </p>
              </div>
            ) : (
              registrosFiltrados.map((dia) => (
                <div
                  key={dia.data}
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
                      <p className="text-xs font-semibold text-green-500">
                        {dia.horas} trabalhadas
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dia.registros.map((reg) => {
                      const tipo = reg.split(" ")[1] as string;
                      const tag = tagColors[tipo] ?? {
                        bg: "#f1f5f9",
                        text: "#64748b",
                      };
                      return (
                        <span
                          key={reg}
                          className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ background: tag.bg, color: tag.text }}
                        >
                          {reg}
                        </span>
                      );
                    })}
                  </div>
                  {dia.status === "atraso" && (
                    <p className="text-xs text-gray-400 italic mb-2">
                      Atraso registrado
                    </p>
                  )}
                  {/* Botão ver mapa */}
                  <button
                    onClick={() =>
                      setMapaAberto({
                        data: dia.data,
                        lat: dia.lat,
                        lng: dia.lng,
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
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    ver localização
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal mapa */}
      {mapaAberto && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-[#1B2A5E]">{mapaAberto.data}</p>
              <button
                onClick={() => setMapaAberto(null)}
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
                center={[mapaAberto.lat, mapaAberto.lng]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[mapaAberto.lat, mapaAberto.lng]}>
                  <Popup>{mapaAberto.registros[0]}</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="flex flex-wrap gap-2">
              {mapaAberto.registros.map((reg) => {
                const tipo = reg.split(" ")[1] as string;
                const tag = tagColors[tipo] ?? {
                  bg: "#f1f5f9",
                  text: "#64748b",
                };
                return (
                  <span
                    key={reg}
                    className="text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ background: tag.bg, color: tag.text }}
                  >
                    {reg}
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
