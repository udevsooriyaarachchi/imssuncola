import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, UserPermissions } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  LogOut, 
  ClipboardList,
  BarChart3,
  CreditCard
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to check permission
  // Superadmin always returns true
  // Admin now relies on explicit permissions, same as Member
  const hasPermission = (perm: keyof UserPermissions) => {
    if (!user) return false;
    if (user.role === UserRole.SUPERADMIN) return true;
    return user.permissions?.[perm] ?? false;
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  if (hasPermission('inventory')) {
    navItems.push({ label: 'Inventory', path: '/inventory', icon: Package });
  }

  if (hasPermission('orders')) {
     navItems.push({ label: 'Orders', path: '/orders', icon: ClipboardList });
  }

  if (hasPermission('reports')) {
     navItems.push({ label: 'Reports', path: '/reports', icon: BarChart3 });
  }

  if (hasPermission('invoices')) {
    navItems.push({ label: 'Invoices', path: '/invoices', icon: FileText });
  }

  if (hasPermission('team')) {
    navItems.push({ label: 'Team', path: '/team', icon: Users });
  }
  
  // Billing is strictly Superadmin
  if (user?.role === UserRole.SUPERADMIN) {
      navItems.push({ label: 'Billing', path: '/billing', icon: CreditCard });
  }

  return (
    <div className="flex h-screen bg-[#F2F2F7] overflow-hidden print:h-auto print:overflow-visible">
      {/* Sidebar - Desktop (iPadOS Style) */}
      <aside className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-sm no-print z-20">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            InvoiceFlow
          </h1>
          <div className="flex items-center mt-2 space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-sm font-medium text-gray-500">
              {user?.username}
            </p>
          </div>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200">
            {user?.role}
          </span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto no-scrollbar">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-md shadow-blue-200'
                    : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'
                }`
              }
            >
              <item.icon className={`w-5 h-5 mr-3.5`} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200/50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 mr-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Layout */}
      <div className="flex-1 flex flex-col overflow-hidden print:h-auto print:overflow-visible relative">
        {/* Mobile Header (Top) - Simplified for branding and logout */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-lg border-b border-gray-200 no-print sticky top-0 z-30">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">InvoiceFlow</h1>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                 <span className="text-xs font-bold text-gray-900">{user?.username}</span>
                 <span className="text-[10px] text-gray-400 font-bold uppercase">{user?.role}</span>
             </div>
             <button 
                onClick={handleLogout}
                className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Main Content Area - Added padding bottom for mobile nav bar */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-32 md:pb-8 print:overflow-visible print:p-0 print:bg-white print:block">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Icon Bar) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-2 py-2 pb-6 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] no-print">
            <nav className="flex justify-around items-center overflow-x-auto no-scrollbar">
               {navItems.map((item) => (
                   <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex flex-col items-center justify-center min-w-[4rem] py-1 rounded-xl transition-all ${
                          isActive
                            ? 'text-[#007AFF]'
                            : 'text-gray-400 hover:text-gray-600'
                        }`
                      }
                   >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`w-6 h-6 mb-1`} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-[10px] font-bold tracking-tight truncate max-w-[4rem]">{item.label.split(' ')[0]}</span>
                        </>
                      )}
                   </NavLink>
               ))}
            </nav>
        </div>
      </div>
    </div>
  );
};

export default Layout;