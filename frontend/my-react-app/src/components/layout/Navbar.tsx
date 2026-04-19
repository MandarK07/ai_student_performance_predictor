import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, UserCircle2, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

type NavbarProps = {
  onToggleSidebar: () => void;
};

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/95 backdrop-blur shadow-sm w-full">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-slate-100 transition-all w-10 h-10 flex-shrink-0"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>

          <span className="font-semibold text-lg text-slate-900 tracking-tight">
            AI Edu Predict
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 md:gap-3 rounded-full md:rounded-xl border border-slate-200/60 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2 text-left shadow-sm hover:shadow-md transition-all hover:bg-white hover:border-slate-300">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 ring-2 ring-white">
                {(user?.full_name?.[0] || user?.username?.[0] || "U").toUpperCase()}
              </span>
              <span className="hidden md:block">
                <span className="block text-sm font-semibold text-slate-900 leading-tight">{user?.full_name || user?.username || "User"}</span>
                <span className="flex items-center gap-1 mt-0.5">
                  {user?.role && (
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-1.5 py-0 text-[9px] font-bold tracking-wider uppercase text-slate-600">
                      {user.role}
                    </span>
                  )}
                </span>
              </span>
              <ChevronDown className="hidden md:block h-4 w-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 shadow-xl shadow-slate-200/50">
            <DropdownMenuLabel className="font-semibold px-3 py-2 text-slate-900">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer gap-2 px-3 py-2 text-sm text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 focus:bg-indigo-50 rounded-lg mx-1 mt-1 transition-colors">
              <UserCircle2 className="h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/about')} className="cursor-pointer gap-2 px-3 py-2 text-sm text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 focus:bg-indigo-50 rounded-lg mx-1 my-1 transition-colors">
              <Info className="h-4 w-4" />
              About Application
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 rounded-lg mx-1 mb-1 transition-colors">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
