import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  Receipt, 
  History, 
  LogOut, 
  UserPlus,
  ShieldCheck,
  Search,
  Bell,
  ChevronDown
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/medicines', label: 'Products', icon: Pill },
  { to: '/bills/new', label: 'Create Bill', icon: Receipt },
  { to: '/bills', label: 'Order History', icon: History },
  { to: '/admins', label: 'Admin Access', icon: UserPlus },
];

export default function AppShell({ children }) {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Get current page title for topbar
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/dashboard') return { title: 'Dashboard Overview', subtitle: "Let's check your pharmacy today" };
    if (path === '/medicines') return { title: 'Product Inventory', subtitle: 'Manage medicines, stocks, and expiration dates' };
    if (path === '/bills/new') return { title: 'Create Customer Bill', subtitle: 'Select medicines and calculate totals automatically' };
    if (path === '/bills') return { title: 'Sales & Bill History', subtitle: 'View previous customer invoices and receipts' };
    if (path === '/admins') return { title: 'Administrator Management', subtitle: 'Create secure access for trusted pharmacy administrators' };
    if (path.startsWith('/bills/')) return { title: 'Bill Details', subtitle: 'Customer invoice and receipt summary' };
    return { title: 'PharmaCare Admin', subtitle: 'Pharmacy Management System' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-shell">
      {/* Deep Pine Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-badge">P</div>
            <div>
              <div className="logo-title">Pharmly</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <span className="nav-icon">
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="sidebar-user-name">Pharmacy Admin</div>
              <div className="sidebar-user-role">{session?.user?.email || 'admin@pharmly.com'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} id="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Top Bar */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-greeting">
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.subtitle}</p>
          </div>

          <div className="topbar-right">
            {/* Topbar Search Pill */}
            <div className="topbar-search-box">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                id="topbar-search-input"
              />
            </div>

            {/* Notification Bell with indicator dot */}
            <button className="topbar-notification-btn" aria-label="Notifications" id="notifications-btn">
              <Bell size={18} />
              <span className="topbar-notification-dot" />
            </button>

            {/* User Profile Badge */}
            <div className="topbar-user-badge">
              <div className="topbar-avatar">PA</div>
              <span className="topbar-user-name">Pharmacy Admin</span>
              <ChevronDown size={14} color="var(--text-secondary)" style={{ marginLeft: 2 }} />
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
