import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Shield, PlayCircle, LayoutDashboard, LogOut, Menu, X, User, Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { name: 'Training', icon: PlayCircle, page: 'Training' },
    ...(isAdmin ? [
      { name: 'Dashboard', icon: LayoutDashboard, page: 'AdminDashboard' },
      { name: 'Configure', icon: Settings, page: 'Configure' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Training')} className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 hidden sm:block">Safety Training</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentPageName === item.page 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Info */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span>{user.full_name || user.email}</span>
                  {isAdmin && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => base44.auth.logout()}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${currentPageName === item.page 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}