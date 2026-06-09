import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import BottomNav from "../components/BottomNav";
import { api, ApiError } from "../lib/api";

type TipoPonto = "entrada" | "saida_intervalo" | "retorno_intervalo" | "saida";

interface RegistroApi {
  id: string;
  tipo: TipoPonto;
  horario: string;
  data: string; // "13 Abr"
  modalidade: string;
}

interface DiaApi {
  data: string; // "Seg, 14 Abr"
  diaSemana: string;
  status: "completo" | "atraso" | "em_andamento";
  horasTrabalhadas: string;
  registros: RegistroApi[];
}

const tagColors: Record<TipoPonto, { bg: string; text: string; label: string }> = {
  entrada: { bg: "#e6eeff", text: "#2563EB", label: "entrada" },
  saida_intervalo: { bg: "#fef9e6", text: "#f59e0b", label: "pausa" },
  retorno_intervalo: { bg: "#e6eeff", text: "#2563EB", label: "retorno" },
  saida: { bg: "#fee6e6", text: "#ef4444", label: "saída" },
};

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
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

function parseHoras(h: string): number {
  const m = h.match(/^(-?)(\d+)h(\d{0,2})$/);
  if (!m) return 0;
  const sinal = m[1] === "-" ? -1 : 1;
  return sinal * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function formatHoras(min: number): string {
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

function readNomeFuncionario(): string {
  const raw = localStorage.getItem("clockup.user");
  if (!raw) return "Funcionário";
  try {
    return JSON.parse(raw).nome ?? "Funcionário";
  } catch {
    return "Funcionário";
  }
}

function diasUteisDoMes(ano: number, mes0: number): number {
  const last = new Date(ano, mes0 + 1, 0).getDate();
  let c = 0;
  for (let d = 1; d <= last; d++) {
    const dow = new Date(ano, mes0, d).getDay();
    if (dow !== 0 && dow !== 6) c++;
  }
  return c;
}

// Dias úteis "esperados até agora" no mês selecionado, respeitando admissão.
// Cutoff: [max(primeiroDoMes, dataAdmissao), min(hoje, ultimoDoMes)]
function diasUteisEsperadosAteAgora(
  ano: number,
  mes0: number,
  hoje: Date,
  dataAdmissao: Date | null,
): number {
  const primeiroDoMes = new Date(ano, mes0, 1);
  const ultimoDoMes = new Date(ano, mes0 + 1, 0);
  let inicio = primeiroDoMes;
  if (dataAdmissao && dataAdmissao > primeiroDoMes) {
    inicio = new Date(dataAdmissao);
    inicio.setHours(0, 0, 0, 0);
  }
  const fim = hoje < ultimoDoMes ? hoje : ultimoDoMes;
  if (inicio > fim) return 0;
  let c = 0;
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) c++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return c;
}

function readDataAdmissao(): Date | null {
  const raw = localStorage.getItem("clockup.user");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (!u.dataAdmissao) return null;
    const d = new Date(u.dataAdmissao);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isoFromDataLabel(label: string, ano: number): string | null {
  // "Seg, 14 Abr" → "2026-04-14"
  const m = label.match(/(\d{1,2})\s+([A-Za-z]+)$/);
  if (!m) return null;
  const dia = Number(m[1]);
  const nomeMes = m[2].toLowerCase();
  const idx = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    .findIndex((n) => nomeMes.startsWith(n));
  if (idx < 0) return null;
  return `${ano}-${String(idx + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export default function Espelho() {
  const navigate = useNavigate();
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());

  const [dias, setDias] = useState<DiaApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [showContestar, setShowContestar] = useState(false);
  const [contestarDia, setContestarDia] = useState("");
  const [contestarMotivo, setContestarMotivo] = useState("");
  const [contestarDescricao, setContestarDescricao] = useState("");
  const [contestarTurno, setContestarTurno] = useState("Dia Inteiro");
  const [enviandoContestacao, setEnviandoContestacao] = useState(false);
  const [erroContestacao, setErroContestacao] = useState("");
  const [showSucesso, setShowSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro("");
      try {
        const data = await api.get<DiaApi[]>(
          `/funcionario/ponto/registros?mes=${mesAtual + 1}&ano=${anoAtual}`,
        );
        if (ativo) setDias(data);
      } catch (e) {
        if (!ativo) return;
        setErro(
          e instanceof ApiError ? e.message : "Não foi possível carregar.",
        );
        setDias([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [mesAtual, anoAtual]);

  const trabalhadasMin = useMemo(
    () => dias.reduce((acc, d) => acc + parseHoras(d.horasTrabalhadas), 0),
    [dias],
  );
  const previstoMin = useMemo(
    () => diasUteisDoMes(anoAtual, mesAtual) * 480,
    [anoAtual, mesAtual],
  );
  const dataAdmissao = useMemo(() => readDataAdmissao(), []);
  const bancoEsperadoMin = useMemo(
    () => diasUteisEsperadosAteAgora(anoAtual, mesAtual, hoje, dataAdmissao) * 480,
    [anoAtual, mesAtual, hoje, dataAdmissao],
  );
  const bancoMin = trabalhadasMin - bancoEsperadoMin;
  const completos = dias.filter((d) => d.status === "completo").length;
  const pontualidade = dias.length
    ? Math.round((completos / dias.length) * 100)
    : 0;

  const trocarMes = (delta: number) => {
    const nova = mesAtual + delta;
    if (nova < 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else if (nova > 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(nova);
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const mes = `${meses[mesAtual]} ${anoAtual}`;
    doc.setFontSize(18);
    doc.setTextColor(27, 42, 94);
    doc.text("CLOCKUP — Espelho de Ponto", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Funcionário: ${readNomeFuncionario()}`, 14, 30);
    doc.text(`Período: ${mes}`, 14, 37);
    doc.text(
      `Horas trabalhadas: ${formatHoras(trabalhadasMin)} de ${formatHoras(previstoMin)} previstas`,
      14, 44,
    );
    const sinal = bancoMin >= 0 ? "+" : "-";
    doc.text(
      `Banco de horas: ${sinal}${formatHoras(Math.abs(bancoMin))} | Pontualidade: ${pontualidade}%`,
      14, 51,
    );
    doc.setDrawColor(200);
    doc.line(14, 56, 196, 56);
    let y = 64;
    dias.forEach((dia) => {
      doc.setFontSize(11);
      doc.setTextColor(27, 42, 94);
      doc.text(dia.data, 14, y);
      if (dia.status === "em_andamento") {
        doc.setTextColor(251, 146, 60);
        doc.text("Em andamento", 140, y);
      } else {
        doc.setTextColor(34, 197, 94);
        doc.text(`${dia.horasTrabalhadas} trabalhadas`, 140, y);
      }
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100);
      dia.registros.forEach((reg) => {
        const label = tagColors[reg.tipo].label;
        doc.text(`  ${reg.horario} — ${label} (${reg.modalidade})`, 14, y);
        y += 5;
      });
      y += 4;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`espelho-${meses[mesAtual].toLowerCase()}-${anoAtual}.pdf`);
  };

  const enviarContestacao = async () => {
    if (!contestarDia || !contestarMotivo) return;
    setEnviandoContestacao(true);
    setErroContestacao("");
    try {
      const dataFalta = isoFromDataLabel(contestarDia, anoAtual);
      if (!dataFalta) throw new Error("Data inválida.");
      await api.post("/funcionario/ponto/contestar", {
        dataFalta,
        turno: contestarTurno,
        motivo: contestarMotivo,
        descricao: contestarDescricao || contestarMotivo,
        evidencias: [],
      });
      setShowContestar(false);
      setShowSucesso(true);
      setContestarDia("");
      setContestarMotivo("");
      setContestarDescricao("");
    } catch (e) {
      setErroContestacao(
        e instanceof ApiError
          ? e.message
          : "Não foi possível enviar a contestação.",
      );
    } finally {
      setEnviandoContestacao(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] overflow-hidden">
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, top: 35, right: -80, zIndex: 0 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 280, height: 280, background: "#d0daf0", opacity: 0.45, bottom: 60, left: -100, zIndex: 0 }} />

      <div className="relative z-10 pb-40">
        <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              aria-label="Voltar"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
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
              onClick={() => trocarMes(-1)}
              aria-label="Mês anterior"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <p className="text-base font-semibold text-[#1B2A5E]">
              {meses[mesAtual]} {anoAtual}
            </p>
            <button
              onClick={() => trocarMes(1)}
              aria-label="Próximo mês"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B2A5E" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {erro && (
            <div role="alert" className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-5" aria-busy={carregando}>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs text-gray-400">Horas trabalhadas</p>
              <p className="text-lg font-bold text-[#1B2A5E] mt-1 tabular-nums">
                {carregando ? "—" : formatHoras(trabalhadasMin)}
              </p>
              <p className="text-xs text-gray-400">
                de {formatHoras(previstoMin)} previstas
              </p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs text-gray-400">Banco de horas</p>
              <p
                className={`text-lg font-bold mt-1 tabular-nums ${bancoMin >= 0 ? "text-green-500" : "text-[#ef4444]"}`}
              >
                {carregando ? "—" : `${bancoMin >= 0 ? "+" : "-"}${formatHoras(Math.abs(bancoMin))}`}
              </p>
              <p className="text-xs text-gray-400">saldo</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-xs text-gray-400">Pontualidade</p>
              <p className="text-lg font-bold text-[#1B2A5E] mt-1 tabular-nums">
                {carregando ? "—" : `${pontualidade}%`}
              </p>
              <p className="text-xs text-gray-400">no mês</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {carregando ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">Carregando registros...</p>
              </div>
            ) : dias.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}>
                <p className="text-gray-400 text-sm">
                  Nenhum registro neste mês.
                </p>
              </div>
            ) : (
              dias.map((dia) => (
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
                      <p
                        className={`text-xs font-semibold tabular-nums ${dia.status === "atraso" ? "text-[#ef4444]" : "text-green-500"}`}
                      >
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
                          className="text-xs font-medium px-2 py-1 rounded-lg tabular-nums"
                          style={{ background: tag.bg, color: tag.text }}
                        >
                          {reg.horario} {tag.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!showContestar && !showSucesso && (
        <div
          className="fixed left-1/2 -translate-x-1/2 w-full max-w-sm px-5 flex gap-3 bg-[#F1F5F9] pt-3 pb-2"
          style={{ bottom: 65, zIndex: 40 }}
        >
          <button
            onClick={() => setShowContestar(true)}
            disabled={dias.length === 0}
            className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm disabled:opacity-50"
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

      {showContestar && (
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#1B2A5E] mb-5">
              Contestar ponto
            </h2>

            <label className="text-xs text-gray-400 mb-1 block">Dia</label>
            <select
              value={contestarDia}
              onChange={(e) => setContestarDia(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1B2A5E] mb-4 bg-white"
            >
              <option value="">Selecione o dia</option>
              {dias.map((d) => (
                <option key={d.data} value={d.data}>
                  {d.data}
                </option>
              ))}
            </select>

            <label className="text-xs text-gray-400 mb-1 block">Turno</label>
            <select
              value={contestarTurno}
              onChange={(e) => setContestarTurno(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1B2A5E] mb-4 bg-white"
            >
              <option>Dia Inteiro</option>
              <option>Manhã</option>
              <option>Tarde</option>
            </select>

            <label className="text-xs text-gray-400 mb-1 block">Motivo</label>
            <select
              value={contestarMotivo}
              onChange={(e) => setContestarMotivo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1B2A5E] mb-4 bg-white"
            >
              <option value="">Selecione o motivo</option>
              {motivosContestacao.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <label className="text-xs text-gray-400 mb-1 block">
              Descrição
            </label>
            <textarea
              value={contestarDescricao}
              onChange={(e) => setContestarDescricao(e.target.value)}
              rows={2}
              placeholder="Detalhe a contestação"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#1B2A5E] mb-4 bg-white outline-none resize-none"
            />

            {erroContestacao && (
              <div role="alert" className="bg-[#fee6e6] rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-[#ef4444] font-medium">
                  {erroContestacao}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowContestar(false)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-[#1B2A5E] font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={enviarContestacao}
                disabled={!contestarDia || !contestarMotivo || enviandoContestacao}
                className="flex-1 bg-[#1B2A5E] rounded-2xl py-3 text-white font-semibold text-sm disabled:opacity-40"
              >
                {enviandoContestacao ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSucesso && (
        <div
          className="fixed inset-0 flex items-center justify-center px-8"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 9999 }}
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
