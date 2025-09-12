import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  AlertTriangle, 
  Info, 
  Menu, 
  X,
  Globe,
  Shield,
  UserCheck,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { currentLanguage, languages, changeLanguage } = useLanguage();
  
  console.log(user);
  const isOfficial = user && (user.role === 'official' || user.role === 'admin');

  // Dynamic navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { name: t('navbar.dashboard'), href: '/dashboard', icon: BarChart3, public: true },
    ];

    // Add role-specific items
    if (isOfficial) {
      baseItems.push(
        { name: t('navbar.verification'), href: '/admin/verify', icon: UserCheck, public: false }
      );
    } else {
      baseItems.push(
        { name: t('navbar.reportHazard'), href: '/report', icon: AlertTriangle, public: true }
      );
    }

    // Add common items
    baseItems.push(
      { name: t('navbar.about'), href: '/about', icon: Info, public: true }
    );

    return baseItems;
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  return (
    <nav className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive(item.href)
                      ? 'text-primary bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* User Role Badge for Officials */}
            {isOfficial && (
              <div className="flex items-center space-x-2 px-2 py-1 bg-primary/10 rounded-md">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary capitalize">
                  {t(`navbar.${user?.role}`)}
                </span>
              </div>
            )}
            
            {/* Language Selector */}
            <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 h-9 border-muted">
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

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {t('navbar.welcome')}, {user.firstName || user.name}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  {t('navbar.logout')}
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">{t('navbar.login')}</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-border"
          >
            <div className="space-y-2">
              {/* User Info for Mobile */}
              {user && (
                <div className="px-4 py-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {user.firstName || user.name}
                    </span>
                    {isOfficial && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-primary/10 rounded text-xs">
                        <Shield className="w-3 h-3 text-primary" />
                        <span className="text-primary capitalize">{t(`navbar.${user.role}`)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-smooth ${
                      isActive(item.href)
                        ? 'text-primary bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="px-4 py-2">
                {user ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      logout(); 
                      setIsOpen(false);
                    }}
                  >
                    {t('navbar.logout')}
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      {t('navbar.login')}
                    </Link>
                  </Button>
                )}
              </div>
              
              <div className="px-4 py-2">
                <Select value={currentLanguage.code} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full">
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
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;