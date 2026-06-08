import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavAdmin from "../../components/BottomNavAdmin";
import { api, ApiError } from "../../lib/api";

export default function CadastrarFuncionario() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [showSucesso, setShowSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const cadastrar = async () => {
    if (!nome || !email || !cpf || !cargo || !dataAdmissao || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      await api.post("/admin/funcionarios", {
        nome,
        email,
        cpf: cpf.replace(/\D/g, ""),
        cargo,
        senha,
        dataAdmissao,
      });
      setShowSucesso(true);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "Não foi possível conectar ao servidor.";
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  };

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
          <h1 className="text-xl font-bold text-[#1B2A5E]">
            Cadastrar Funcionário
          </h1>
        </div>

        <div className="px-5 mt-5">
          {/* Formulário */}
          <div
            className="bg-white rounded-3xl overflow-hidden mb-5"
            style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
          >
            {[
              {
                label: "Nome completo",
                value: nome,
                setter: setNome,
                placeholder: "Ex: João da Silva",
                type: "text",
              },
              {
                label: "E-mail",
                value: email,
                setter: setEmail,
                placeholder: "joao@empresa.com",
                type: "email",
              },
              {
                label: "Cargo",
                value: cargo,
                setter: setCargo,
                placeholder: "Ex: Desenvolvedor",
                type: "text",
              },
            ].map((field, i, arr) => (
              <div
                key={field.label}
                className={`px-5 py-4 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <p className="text-xs text-gray-400 mb-1">{field.label}</p>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => {
                    field.setter(e.target.value);
                    setErro("");
                  }}
                  className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
                />
              </div>
            ))}

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-1">CPF</p>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatarCpf(e.target.value));
                  setErro("");
                }}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Data de admissão</p>
              <input
                type="date"
                value={dataAdmissao}
                onChange={(e) => {
                  setDataAdmissao(e.target.value);
                  setErro("");
                }}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Senha de acesso</p>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro("");
                }}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>

            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-1">Confirmar senha</p>
              <input
                type="password"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  setErro("");
                }}
                className="w-full text-sm font-semibold text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#f0f4ff] rounded-2xl px-4 py-3 mb-4">
            <p className="text-xs text-[#2563EB] font-medium">
              ℹ️ Como funciona
            </p>
            <p className="text-xs text-[#2563EB] mt-1">
              O funcionário usará o CPF e a senha cadastrados aqui para acessar
              o app.
            </p>
          </div>

          {erro && (
            <div className="bg-[#fee6e6] rounded-2xl px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/funcionarios")}
              className="flex-1 bg-white border border-gray-200 rounded-2xl py-4 text-[#1B2A5E] font-semibold text-sm"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.08)" }}
            >
              Cancelar
            </button>
            <button
              onClick={cadastrar}
              disabled={carregando}
              className="flex-1 bg-[#1B2A5E] rounded-2xl py-4 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {carregando ? "Cadastrando..." : "Cadastrar"}
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
              Funcionário cadastrado!
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              {nome} já pode acessar o app com CPF e senha cadastrados.
            </p>
            <button
              onClick={() => navigate("/admin/funcionarios")}
              className="bg-[#1B2A5E] rounded-2xl px-10 py-3 text-white font-bold"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <BottomNavAdmin />
    </div>
  );
}
