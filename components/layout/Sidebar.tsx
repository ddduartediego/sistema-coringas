'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Person, 
  Dashboard, 
  Settings,
  Menu as MenuIcon,
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  AttachMoney,
  SupervisorAccount
} from '@mui/icons-material';

interface SidebarProps {
  isAdmin: boolean;
  isLeader: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ isAdmin, isLeader, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (onCollapse) {
      onCollapse(isCollapsed);
    }
  }, [isCollapsed, onCollapse]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isLinkActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button 
          onClick={toggleSidebar}
          className="lg:hidden fixed z-50 top-4 left-4 p-2 rounded-md bg-white shadow-md text-primary-600"
          aria-label="Toggle Menu"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-40 bg-white shadow-xl transform transition-all duration-300 ease-in-out
          ${isMobile ? (isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64') : 
          isCollapsed ? 'w-16 translate-x-0' : 'w-64 translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full relative">
          {/* Collapse button (desktop only) */}
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md text-primary-600 hover:text-primary-800 z-50"
              aria-label={isCollapsed ? "Expandir menu" : "Retrair menu"}
              title={isCollapsed ? "Expandir menu" : "Retrair menu"}
            >
              {isCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
            </button>
          )}

          {/* Logo */}
          <div className={`p-6 border-b border-gray-100 flex ${isCollapsed ? 'justify-center' : ''}`}>
            {isCollapsed ? (
              <span className="font-bold text-primary-600 text-2xl">C</span>
            ) : (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-500 bg-clip-text text-transparent">Sistema Coringas</h1>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 pt-8 ${isCollapsed ? 'px-2' : 'px-4'} space-y-2`}>
            {isAdmin && (
              <Link 
                href="/admin" 
                className={`
                  flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors
                  ${isLinkActive('/admin') 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'}
                `}
                onClick={closeSidebarOnMobile}
                title={isCollapsed ? "Administração" : ""}
              >
                <Dashboard className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && <span>Administração</span>}
              </Link>
            )}

            {isLeader && (
              <Link 
                href="/lideranca" 
                className={`
                  flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors
                  ${isLinkActive('/lideranca') 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'}
                `}
                onClick={closeSidebarOnMobile}
                title={isCollapsed ? "Liderança" : ""}
              >
                <SupervisorAccount className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && <span>Liderança</span>}
              </Link>
            )}

            {isAdmin && (
              <Link 
                href="/cobrancas" 
                className={`
                  flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors
                  ${isLinkActive('/cobrancas') 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'}
                `}
                onClick={closeSidebarOnMobile}
                title={isCollapsed ? "Cobranças" : ""}
              >
                <AttachMoney className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && <span>Cobranças</span>}
              </Link>
            )}

            <Link 
              href="/profile" 
              className={`
                flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors
                ${isLinkActive('/profile') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
              onClick={closeSidebarOnMobile}
              title={isCollapsed ? "Perfil" : ""}
            >
              <Person className={isCollapsed ? '' : 'mr-3'} />
              {!isCollapsed && <span>Perfil</span>}
            </Link>

            {isAdmin && (
              <Link 
                href="/settings" 
                className={`
                  flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 rounded-lg transition-colors
                  ${isLinkActive('/settings') 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'}
                `}
                onClick={closeSidebarOnMobile}
                title={isCollapsed ? "Configurações" : ""}
              >
                <Settings className={isCollapsed ? '' : 'mr-3'} />
                {!isCollapsed && <span>Configurações</span>}
              </Link>
            )}
          </nav>

          {/* Footer */}
          <div className={`p-4 border-t mt-auto border-gray-100 ${isCollapsed ? 'text-center' : ''}`}>
            {!isCollapsed && (
              <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Equipe Coringas</p>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
} 