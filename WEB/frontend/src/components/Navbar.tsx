import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "../contexts/LanguageContext";
import apiClient from "@/lib/api";
import {
  BarChart3,
  AlertTriangle,
  Info,
  Menu,
  X,
  Globe,
  UserCheck,
  User,
  LogOut,
  Waves,
  TrendingUp, // Icon for Analysis
} from "lucide-react";

// --- TYPE DEFINITIONS ---
interface AppUser {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
  role: "citizen" | "official" | "admin";
}

// --- API FUNCTIONS ---
const fetchCurrentUser = async (): Promise<AppUser> => {
  const response = await apiClient.get("/auth/me");
  if (!response.data.success || !response.data.user) {
    throw new Error("Failed to fetch user data from backend.");
  }
  return response.data.user;
};

// --- COMPONENT ---
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { t } = useTranslation();
  const { currentLanguage, languages, changeLanguage } = useLanguage();

  const { data: user } = useQuery<AppUser>({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: !!isSignedIn,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  const isAdmin = user && user.role === "admin";
  const isOfficial = user && (user.role === "official" || user.role === "admin");

  const getNavItems = () => {
    const baseItems = [
      { name: t("navbar.dashboard", "Dashboard"), href: "/dashboard", icon: BarChart3 },
      { name: t("navbar.liveFeeds", "Live Feeds"), href: "/live-feeds", icon: Waves },
    ];

    // Add Analysis page for admin users only
    if (isAdmin) {
      baseItems.push({
        name: t("navbar.analysis", "Analysis"),
        href: "/admin/analysis",
        icon: TrendingUp,
      });
    }

    if (isOfficial) {
      baseItems.push({
        name: t("navbar.verification", "Verification"),
        href: "/admin/verify",
        icon: UserCheck,
      });
    } else {
      baseItems.push({
        name: t("navbar.reportHazard", "Report Hazard"),
        href: "/report",
        icon: AlertTriangle,
      });
    }

    baseItems.push({ name: t("navbar.about", "About"), href: "/about", icon: Info });
    return baseItems;
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
              <Waves className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-foreground">OceanAlly</span>
              <div className="text-xs text-muted-foreground">Ministry of Earth Sciences</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive(item.href)
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Language Selector */}
            <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 h-9 text-sm border-muted focus:ring-0 focus:outline-none">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center space-x-2">
                      <span>{language.flag}</span>
                      <span>{language.nativeName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User Menu */}
            {isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={clerkUser?.imageUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback>
                        {(user.firstName?.[0] || "").toUpperCase()}
                        {(user.lastName?.[0] || "").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {/* Display user role */}
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t("navbar.profile", "Profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("navbar.logout", "Log out")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">{t("navbar.login", "Log In")}</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-border space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md font-medium transition ${
                        isActive(item.href)
                          ? "text-primary bg-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;