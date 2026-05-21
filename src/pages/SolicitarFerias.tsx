import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function SolicitarFerias() {
  const navigate = useNavigate();
  const [dataInicio, setDataInicio] = useState("2026-07-01");
  const [dataFim, setDataFim] = useState("2026-07-20");
  const [venderDias, setVenderDias] = useState(true);
  const [diasVender, setDiasVender] = useState(10);
  const [observacao, setObservacao] = useState("");
  const [showSucesso, setShowSucesso] = useState(false);

  const calcularDias = () => {
    if (!dataInicio || !dataFim) return 0;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diff =
      Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const formatarData = (data: string) => {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const enviar = () => {
    setShowSucesso(true);
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden pb-24">
      {/* Círculos decorativos */}
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
            onClick={() => navigate("/ferias")}
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
          <h1 className="text-xl font-bold text-[#1B2A5E]">Solicitar Férias</h1>
        </div>

        <div className="px-5 mt-5">
          {/* Card formulário */}
          <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
          >
            {/* Período */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <p className="font-bold text-[#1B2A5E] text-base mb-4">
                Período de férias
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Início</p>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
                  />
                  <p className="text-sm font-semibold text-[#1B2A5E] mt-1">
                    {formatarData(dataInicio)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Fim</p>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
                  />
                  <p className="text-sm font-semibold text-[#1B2A5E] mt-1">
                    {formatarData(dataFim)}
                  </p>
                </div>
              </div>
            </div>

            {/* Duração calculada */}
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-[#f0f4ff]">
              <p className="text-sm text-[#2563EB] font-medium">
                Duração calculada
              </p>
              <p className="text-lg font-bold text-[#2563EB]">
                {calcularDias()} Dias
              </p>
            </div>

            {/* Abono Pecuniário */}
            <div className="px-5 pt-4 pb-2 border-b border-gray-100">
              <p className="font-bold text-[#1B2A5E] text-base mb-4">
                Abono Pecuniário
              </p>

              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#1B2A5E]">
                    Vender dias de férias
                  </p>
                  <p className="text-xs text-gray-400">
                    Máximo de 10 dias vendidos
                  </p>
                </div>
                <button
                  onClick={() => setVenderDias(!venderDias)}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: venderDias ? "#22c55e" : "#d1d5db" }}
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow"
                    style={{ left: venderDias ? "26px" : "2px" }}
                  />
                </button>
              </div>

              {venderDias && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Dias a vender</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDiasVender((d) => Math.max(1, d - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#1B2A5E] font-bold"
                    >
                      −
                    </button>
                    <p className="text-base font-bold text-[#1B2A5E]">
                      {diasVender} dias
                    </p>
                    <button
                      onClick={() => setDiasVender((d) => Math.min(10, d + 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#1B2A5E] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Observação */}
            <div className="px-5 pt-4 pb-5">
              <p className="text-sm text-gray-400 mb-2">
                Observação (opcional)
              </p>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="EX: Viagem marcada"
                className="w-full text-sm text-[#1B2A5E] bg-transparent outline-none resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate("/ferias")}
              className="flex-1 bg-white border border-gray-200 rounded-2xl py-4 text-[#1B2A5E] font-semibold text-sm"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              Cancelar
            </button>
            <button
              onClick={enviar}
              className="flex-1 bg-[#1B2A5E] rounded-2xl py-4 text-white font-semibold text-sm active:scale-95 transition-transform"
            >
              Enviar Solicitação
            </button>
          </div>
        </div>
      </div>

      {/* Modal sucesso */}
      {showSucesso && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
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
              Solicitação enviada!
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Sua solicitação de férias foi enviada para aprovação.
            </p>
            <button
              onClick={() => navigate("/ferias")}
              className="bg-[#1B2A5E] rounded-2xl px-10 py-3 text-white font-bold"
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
