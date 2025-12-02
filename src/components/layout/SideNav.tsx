import { Home, List, Search, TrendingUp, Star, Calendar, Newspaper, Users, Settings, Info, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/anime-runch-logo.png";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIMARY_LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-list", label: "My Anime List", icon: List },
  { to: "/lookup", label: "Lookup", icon: Search },
  { to: "/rankings", label: "Rankings", icon: Star },
  { to: "/trending", label: "Trending", icon: TrendingUp },
  { to: "/upcoming", label: "Upcoming", icon: Calendar },
];

const SECONDARY_LINKS = [
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/community", label: "Community", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: Info },
];

export const SideNav = ({ isOpen, onClose }: SideNavProps) => {
  const location = useLocation();

  const NavLink = ({ to, label, icon: Icon }: typeof PRIMARY_LINKS[0]) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
          isActive
            ? "bg-sidebar-accent text-primary font-semibold"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
        )}
      >
        <Icon className={cn("w-6 h-6 transition-colors", isActive ? "text-primary" : "text-secondary group-hover:text-primary")} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Side Navigation */}
      <nav
        className={cn(
          "fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border shadow-2xl z-50 transition-transform duration-300 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Anime Runch" className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tight">
              <span className="text-primary">ANIME</span>
              <span className="text-secondary"> RUNCH</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-8">
          <div className="space-y-1">
            {PRIMARY_LINKS.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </div>

          <div className="border-t border-sidebar-border pt-4 space-y-1">
            {SECONDARY_LINKS.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};
