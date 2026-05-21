import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import EscolhaLogin from "./pages/auth/EscolhaLogin";
import LoginFuncionario from "./pages/auth/LoginFuncionario";
import LoginEmpresa from "./pages/auth/LoginEmpresa";

// Funcionário
import Home from "./pages/Home";
import RegistrarPonto from "./pages/RegistrarPonto";
import Espelho from "./pages/Espelho";
import Ferias from "./pages/Ferias";
import SolicitarFerias from "./pages/SolicitarFerias";
import Atestado from "./pages/Atestado";

// Admin
import HomeAdmin from "./pages/admin/HomeAdmin";
import Funcionarios from "./pages/admin/Funcionarios";
import DetalhesFuncionario from "./pages/admin/DetalhesFuncionario";
import FeriasAdmin from "./pages/admin/FeriasAdmin";
import AtestadosAdmin from "./pages/admin/AtestadosAdmin";
import ContestacoesAdmin from "./pages/admin/ContestacoesAdmin";
import CadastrarFuncionario from "./pages/admin/CadastrarFuncionario";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F1F5F9] flex justify-center">
        <div className="w-full max-w-sm relative">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth */}
            <Route path="/login" element={<EscolhaLogin />} />
            <Route path="/login/funcionario" element={<LoginFuncionario />} />
            <Route path="/login/empresa" element={<LoginEmpresa />} />

            {/* Funcionário */}
            <Route path="/home" element={<Home />} />
            <Route path="/ponto" element={<RegistrarPonto />} />
            <Route path="/espelho" element={<Espelho />} />
            <Route path="/ferias" element={<Ferias />} />
            <Route path="/ferias/solicitar" element={<SolicitarFerias />} />
            <Route path="/atestado" element={<Atestado />} />

            {/* Admin */}
            <Route path="/admin" element={<HomeAdmin />} />
            <Route path="/admin/funcionarios" element={<Funcionarios />} />
            <Route
              path="/admin/funcionarios/:id"
              element={<DetalhesFuncionario />}
            />
            <Route path="/admin/ferias" element={<FeriasAdmin />} />
            <Route path="/admin/atestados" element={<AtestadosAdmin />} />
            <Route path="/admin/contestacoes" element={<ContestacoesAdmin />} />
            <Route path="/admin/cadastrar" element={<CadastrarFuncionario />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
