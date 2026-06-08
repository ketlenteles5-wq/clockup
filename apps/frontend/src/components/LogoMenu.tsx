import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type AccountInfo = { title: string; subtitle?: string };

function formatCnpj(cnpj?: string): string | undefined {
  if (!cnpj) return undefined;
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

function readAccount(): AccountInfo | null {
  const userStr = localStorage.getItem("clockup.user");
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      return { title: u.nome ?? "Funcionário", subtitle: u.cargo };
    } catch {
      /* ignore */
    }
  }
  const empStr = localStorage.getItem("clockup.empresa");
  if (empStr) {
    try {
      const e = JSON.parse(empStr);
      return {
        title: e.razao_social ?? "Empresa",
        subtitle: formatCnpj(e.cnpj),
      };
    } catch {
      /* ignore */
    }
  }
  return null;
}

export default function LogoMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const account = readAccount();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("clockup.token");
    localStorage.removeItem("clockup.user");
    localStorage.removeItem("clockup.empresa");
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menu da conta"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-14 h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A5E] focus-visible:ring-offset-2"
      >
        <img
          src="/logo.png"
          alt=""
          style={{
            height: 56,
            width: 56,
            objectFit: "contain",
            mixBlendMode: "multiply",
          }}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu da conta"
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl overflow-hidden origin-top-right animate-menu-in motion-reduce:animate-none"
          style={{
            boxShadow:
              "0 10px 30px rgba(27,42,94,0.18), 0 2px 8px rgba(27,42,94,0.08)",
            zIndex: 50,
          }}
        >
          {account && (
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-[#1B2A5E] truncate">
                {account.title}
              </p>
              {account.subtitle && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {account.subtitle}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-[#ef4444] hover:bg-[#fef2f2] active:bg-[#fee2e2] transition-colors focus:outline-none focus-visible:bg-[#fef2f2]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-sm font-semibold">Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}
