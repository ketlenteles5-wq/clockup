import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const items: NavItem[] = [
    {
      label: "Início",
      path: "/home",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      label: "Espelho",
      path: "/espelho",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      label: "Ponto",
      path: "/ponto",
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Férias",
      path: "/ferias",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="12" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      label: "Atestado",
      path: "/atestado",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100 px-2 pb-4 pt-2 z-50">
      <div className="flex justify-around items-end">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const isPonto = item.path === "/ponto";

          if (isPonto) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-[#1B2A5E] flex items-center justify-center text-white shadow-lg">
                  {item.icon}
                </div>
                <span className="text-xs mt-1 text-[#1B2A5E] font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-2 py-1"
            >
              <span className={isActive ? "text-[#1B2A5E]" : "text-gray-400"}>
                {item.icon}
              </span>
              <span
                className={`text-xs whitespace-nowrap ${isActive ? "text-[#1B2A5E] font-semibold" : "text-gray-400"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
