import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginFuncionario() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleLogin = () => {
    if (!cpf || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (cpf.length < 14) {
      setErro("CPF inválido.");
      return;
    }
    if (cpf === "123.456.789-00" && senha === "123456") {
      navigate("/home");
    } else {
      setErro("CPF ou senha incorretos.");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] flex flex-col overflow-hidden">
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "#d0daf0",
          opacity: 0.45,
          top: -60,
          right: -80,
          zIndex: 0,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: "#d0daf0",
          opacity: 0.45,
          bottom: -60,
          left: -80,
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        <button
          onClick={() => navigate("/login")}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center mb-8"
          style={{ boxShadow: "0 2px 8px rgba(27,42,94,0.08)" }}
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

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2A5E] flex items-center justify-center mb-4">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1B2A5E]">
            Olá, Funcionário!
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Entre com seu CPF e senha cadastrados.
          </p>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium">CPF</p>
            <div
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.06)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatarCpf(e.target.value));
                  setErro("");
                }}
                className="flex-1 text-sm text-[#1B2A5E] bg-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1 font-medium">Senha</p>
            <div
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ boxShadow: "0 2px 12px rgba(27,42,94,0.06)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro("");
                }}
                className="flex-1 text-sm text-[#1B2A5E] bg-transparent outline-none"
              />
              <button onClick={() => setMostrarSenha(!mostrarSenha)}>
                {mostrarSenha ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div className="bg-[#fee6e6] rounded-xl px-4 py-3">
              <p className="text-sm text-[#ef4444] font-medium">{erro}</p>
            </div>
          )}

          <div className="bg-[#f0f4ff] rounded-xl px-4 py-3">
            <p className="text-xs text-[#2563EB] font-medium">
              💡 Acesso de teste
            </p>
            <p className="text-xs text-[#2563EB] mt-0.5">
              CPF: 123.456.789-00 · Senha: 123456
            </p>
          </div>

          <div className="flex-1" />

          <button
            onClick={handleLogin}
            className="w-full bg-[#1B2A5E] text-white font-bold py-4 rounded-2xl text-sm active:scale-95 transition-transform"
            style={{ boxShadow: "0 4px 16px rgba(27,42,94,0.2)" }}
          >
            Entrar
          </button>

          <p className="text-center text-xs text-gray-400">
            Não tem acesso?{" "}
            <span className="text-[#2563EB] font-medium">
              Fale com sua empresa
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
