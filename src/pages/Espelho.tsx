import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import BottomNav from "../components/BottomNav";
import type { DiaTrabalho } from "../types";

const diasMock: DiaTrabalho[] = [
  {
    data: "Seg, 14 Abr",
    diaSemana: "Seg",
    status: "completo",
    horasTrabalhadas: "8h02",
    registros: [
      {
        id: "1",
        tipo: "entrada",
        horario: "08:00",
        data: "14 Abr",
        modalidade: "Presencial",
      },
      {
        id: "2",
        tipo: "saida_intervalo",
        horario: "12:05",
        data: "14 Abr",
        modalidade: "Pausa",
      },
      {
        id: "3",
        tipo: "retorno_intervalo",
        horario: "13:06",
        data: "14 Abr",
        modalidade: "Presencial",
      },
      {
        id: "4",
        tipo: "saida",
        horario: "17:01",
        data: "14 Abr",
        modalidade: "Presencial",
      },
    ],
  },
  {
    data: "Ter, 15 Abr",
    diaSemana: "Ter",
    status: "atraso",
    horasTrabalhadas: "7h48",
    registros: [
      {
        id: "5",
        tipo: "entrada",
        horario: "08:12",
        data: "15 Abr",
        modalidade: "Presencial",
      },
      {
        id: "6",
        tipo: "saida_intervalo",
        horario: "12:00",
        data: "15 Abr",
        modalidade: "Pausa",
      },
      {
        id: "7",
        tipo: "retorno_intervalo",
        horario: "13:00",
        data: "15 Abr",
        modalidade: "Presencial",
      },
      {
        id: "8",
        tipo: "saida",
        horario: "17:00",
        data: "15 Abr",
        modalidade: "Presencial",
      },
    ],
  },
  {
    data: "Qua, 16 Abr",
    diaSemana: "Qua",
    status: "em_andamento",
    horasTrabalhadas: "",
    registros: [
      {
        id: "9",
        tipo: "entrada",
        horario: "08:00",
        data: "16 Abr",
        modalidade: "Presencial",
      },
    ],
  },
  {
    data: "Qui, 17 Abr",
    diaSemana: "Qui",
    status: "completo",
    horasTrabalhadas: "8h00",
    registros: [
      {
        id: "10",
        tipo: "entrada",
        horario: "08:00",
        data: "17 Abr",
        modalidade: "Presencial",
      },
      {
        id: "11",
        tipo: "saida_intervalo",
        horario: "12:00",
        data: "17 Abr",
        modalidade: "Pausa",
      },
      {
        id: "12",
        tipo: "retorno_intervalo",
        horario: "13:00",
        data: "17 Abr",
        modalidade: "Presencial",
      },
      {
        id: "13",
        tipo: "saida",
        horario: "17:00",
        data: "17 Abr",
        modalidade: "Presencial",
      },
    ],
  },
  {
    data: "Sex, 18 Abr",
    diaSemana: "Sex",
    status: "completo",
    horasTrabalhadas: "8h10",
    registros: [
      {
        id: "14",
        tipo: "entrada",
        horario: "07:50",
        data: "18 Abr",
        modalidade: "Presencial",
      },
      {
        id: "15",
        tipo: "saida_intervalo",
        horario: "12:00",
        data: "18 Abr",
        modalidade: "Pausa",
      },
      {
        id: "16",
        tipo: "retorno_intervalo",
        horario: "13:00",
        data: "18 Abr",
        modalidade: "Presencial",
      },
      {
        id: "17",
        tipo: "saida",
        horario: "17:00",
        data: "18 Abr",
        modalidade: "Presencial",
      },
    ],
  },
];

const tagColors: Record<string, { bg: string; text: string; label: string }> = {
  entrada: { bg: "#e6eeff", text: "#2563EB", label: "entrada" },
  saida_intervalo: { bg: "#fef9e6", text: "#f59e0b", label: "pausa" },
  retorno_intervalo: { bg: "#e6eeff", text: "#2563EB", label: "retorno" },
  saida: { bg: "#fee6e6", text: "#ef4444", label: "saída" },
};

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const motivosContestacao = [
  "Esqueci de registrar entrada",
  "Esqueci de registrar saída",
  "Horário registrado incorretamente",
  "Erro no aplicativo",
  "Hora extra não registrada",
  "Saída para intervalo não registrada",
  "Retorno do intervalo não registrado",
  "Outro motivo",
];

export default function Espelho() {
  const navigate = useNavigate();
  const [mesAtual, setMesAtual] = useState(3);
  const anoAtual = 2026;
  const [showContestar, setShowContestar] = useState(false);
  const [contestarDia, setContestarDia] = useState("");
  const [contestarMotivo, setContestarMotivo] = useState("");
  const [showSucesso, setShowSucesso] = useState(false);

  const exportarPDF = () => {
    const doc = new jsPDF();
    const mes = `${meses[mesAtual]} ${anoAtual}`;
    doc.setFontSize(18);
    doc.setTextColor(27, 42, 94);
    doc.text("CLOCKUP — Espelho de Ponto", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Funcionário: Nicole Ferreira`, 14, 30);
    doc.text(`Período: ${mes}`, 14, 37);
    doc.text(`Horas trabalhadas: 72h de 88h previstas`, 14, 44);
    doc.text(`Banco de horas: +3h | Pontualidade: 97%`, 14, 51);
    doc.setDrawColor(200);
    doc.line(14, 56, 196, 56);
    let y = 64;
    diasMock.forEach((dia) => {
      doc.setFontSize(11);
      doc.setTextColor(27, 42, 94);
      doc.text(`${dia.data}`, 14, y);
      if (dia.horasTrabalhadas) {
        doc.setTextColor(34, 197, 94);
        doc.text(`${dia.horasTrabalhadas} trabalhadas`, 140, y);
      } else {
        doc.setTextColor(251, 146, 60);
        doc.text("Em andamento", 140, y);
      }
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100);
      dia.registros.forEach((reg) => {
        const label = tagColors[reg.tipo].label;
        doc.text(`  ${reg.horario} — ${label} (${reg.modalidade})`, 14, y);
        y += 5;
      });
      if (dia.status === "atraso") {
        doc.setTextColor(251, 146, 60);
        doc.text("  Atraso de 12 min registrado", 14, y);
        y += 5;
      }
      y += 4;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`espelho-${meses[mesAtual].toLowerCase()}-${anoAtual}.pdf`);
  };

  const enviarContestacao = () => {
    if (!contestarDia || !contestarMotivo) return;
    setShowContestar(false);
    setShowSucesso(true);
    setContestarDia("");
    setContestarMotivo("");
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden">
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

      <div className="relative z-10 pb-40">
        <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <h1 className="text-xl font-bold text-[#1B2A5E]">Espelho</h1>
          </div>
          <button
            onClick={exportarPDF}
            className="text-sm text-[#2563EB] font-medium"
          >
            exportar
          </button>
        </div>

        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMesAtual((m) => Math.max(0, m - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2A5E"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <p className="text-base font-semibold text-[#1B2A5E]">
              {meses[mesAtual]} {anoAtual}
            </p>
            <button
              onClick={() => setMesAtual((m) => Math.min(11, m + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B2A5E"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs text-gray-400">Horas trabalhadas</p>
              <p className="text-lg font-bold text-[#1B2A5E] mt-1">72h</p>
              <p className="text-xs text-gray-400">de 88h previstas</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs text-gray-400">Banco de horas</p>
              <p className="text-lg font-bold text-green-500 mt-1">+3h</p>
              <p className="text-xs text-gray-400">saldo extra</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs text-gray-400">Pontualidade</p>
              <p className="text-lg font-bold text-[#1B2A5E] mt-1">97%</p>
              <p className="text-xs text-gray-400">no mês</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {diasMock.map((dia) => (
              <div
                key={dia.data}
                className="bg-white rounded-2xl px-4 py-3"
                style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-[#1B2A5E] text-sm">{dia.data}</p>
                  {dia.status === "em_andamento" ? (
                    <p className="text-xs font-semibold text-orange-400">
                      Em andamento
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-green-500">
                      {dia.horasTrabalhadas} trabalhadas
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dia.registros.map((reg) => {
                    const tag = tagColors[reg.tipo];
                    return (
                      <span
                        key={reg.id}
                        className="text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ background: tag.bg, color: tag.text }}
                      >
                        {reg.horario} {tag.label}
                      </span>
                    );
                  })}
                </div>
                {dia.status === "atraso" && (
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Atraso de 12 min registrado
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botões fixos — esconde quando modal aberto */}
      {!showContestar && !showSucesso && (
        <div
          className="fixed left-1/2 -translate-x-1/2 w-full max-w-sm px-5 flex gap-3 bg-[#F1F5F9] pt-3 pb-2"
          style={{ bottom: 65, zIndex: 40 }}
        >
          <button
            onClick={() => setShowContestar(true)}
            className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
          >
            Contestar ponto
          </button>
          <button
            onClick={exportarPDF}
            className="flex-1 bg-[#1B2A5E] rounded-2xl py-3 text-white font-semibold text-sm"
          >
            Exportar PDF
          </button>
        </div>
      )}

      {/* Modal contestar */}
      {showContestar && (
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-5">
              Contestar ponto
            </h2>

            <p className="text-xs text-gray-400 mb-1">Dia</p>
            <select
              value={contestarDia}
              onChange={(e) => setContestarDia(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1B2A5E] mb-4 bg-white"
            >
              <option value="">Selecione o dia</option>
              {diasMock.map((d) => (
                <option key={d.data} value={d.data}>
                  {d.data}
                </option>
              ))}
            </select>

            <p className="text-xs text-gray-400 mb-1">Motivo</p>
            <select
              value={contestarMotivo}
              onChange={(e) => setContestarMotivo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1B2A5E] mb-6 bg-white"
            >
              <option value="">Selecione o motivo</option>
              {motivosContestacao.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setShowContestar(false)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={enviarContestacao}
                disabled={!contestarDia || !contestarMotivo}
                className="flex-1 bg-[#1B2A5E] rounded-2xl py-3 text-white font-semibold text-sm disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

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
              Contestação enviada!
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Seu gestor receberá a solicitação de ajuste em breve.
            </p>
            <button
              onClick={() => setShowSucesso(false)}
              className="border border-gray-200 rounded-2xl px-10 py-3 text-[#1B2A5E] font-bold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {!showContestar && !showSucesso && <BottomNav />}
    </div>
  );
}
