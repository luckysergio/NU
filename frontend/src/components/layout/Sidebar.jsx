import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Loader2,
  Database,
  Layers,
  ChevronDown,
  MapPin,
  Map,
  MapPinned,
  Tag,
  Activity,
  ClipboardList,
  Users,
  Shield,
  History,
  Briefcase,
  FileText,
  Smartphone,
  Home,
  FolderOpen,
  FolderTree,
  Target,
  Flag,
  Building,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../contexts/ModalContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { success, error, warning } = useModal();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isProgramKerjaPCOpen, setIsProgramKerjaPCOpen] = useState(false);
  const [isProgramKerjaMWCOpen, setIsProgramKerjaMWCOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navRef = useRef(null);
  const activeItemRef = useRef(null);
  const sidebarRef = useRef(null);

  // Get user role and organization level
  const userRole = user?.role?.slug;

  let userOrgLevel = null;
  if (user?.organization?.level) {
    if (typeof user?.organization?.level === "object") {
      userOrgLevel = user?.organization?.level?.slug;
    } else {
      userOrgLevel = user?.organization?.level;
    }
  }

  const isSuperAdmin = userRole === "super-admin";
  const isAdmin = userRole === "admin";
  const isOperator = userRole === "operator";
  const isAnggota = userRole === "anggota";
  const isPCLevel = userOrgLevel === "pc";
  const isMWCLevel = userOrgLevel === "mwc";

  // Permissions
  const canAccessDashboard = true;
  const canAccessUsers = isSuperAdmin || (isAdmin && isPCLevel);
  const canAccessOrganizations = true;
  const canAccessAnggota = true;
  const canAccessProgramKerjaPC = isSuperAdmin || 
    (isAdmin && isPCLevel) || 
    (isOperator && isPCLevel) || 
    (isAnggota && isPCLevel);
  const canAccessProgramKerjaMWC = true;
  const canAccessActivities = true;
  const canAccessMasterData = isSuperAdmin;
  const canAccessRegion = isSuperAdmin;
  const canAccessLogActivity = isSuperAdmin;

  // Menu Items
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-emerald-400",
      path: "/dashboard",
      canAccess: canAccessDashboard,
    },
  ];

  const managementItems = [
    {
      id: "users",
      label: "Manajemen User",
      icon: Users,
      color: "text-cyan-400",
      path: "/users",
      canAccess: canAccessUsers,
    },
    {
      id: "organizations",
      label: "Manajemen Organisasi",
      icon: Building2,
      color: "text-emerald-400",
      path: "/organizations",
      canAccess: canAccessOrganizations,
    },
    {
      id: "anggotas",
      label: "Manajemen Anggota",
      icon: Users,
      color: "text-sky-400",
      path: "/anggotas",
      canAccess: canAccessAnggota,
    },
  ];

  const programKerjaPCItems = [
    {
      id: "work-programs-pc",
      label: "Program Kerja",
      icon: Briefcase,
      color: "text-emerald-400",
      path: "/program-themes",
      canAccess: canAccessProgramKerjaPC,
    },
    {
      id: "program-fields-pc",
      label: "Bidang Program",
      icon: FolderTree,
      color: "text-teal-400",
      path: "/program-fields",
      canAccess: canAccessProgramKerjaPC,
    },
    {
      id: "program-targets-pc",
      label: "Sasaran Program",
      icon: Target,
      color: "text-amber-400",
      path: "/program-targets",
      canAccess: canAccessProgramKerjaPC,
    },
    {
      id: "program-goals-pc",
      label: "Tujuan Program",
      icon: Flag,
      color: "text-purple-400",
      path: "/program-goals",
      canAccess: canAccessProgramKerjaPC,
    },
  ];

  const programKerjaMWCItems = [
    {
      id: "work-programs-mwc",
      label: "Program Kerja MWC",
      icon: Briefcase,
      color: "text-emerald-400",
      path: "/work-programs-mwc",
      canAccess: canAccessProgramKerjaMWC,
    },
  ];

  const activitiesItems = [
    {
      id: "activities",
      label: "Kegiatan Proker",
      icon: Calendar,
      color: "text-purple-400",
      path: "/activity-prokers",
      canAccess: canAccessActivities,
    },
    {
      id: "attendance",
      label: "Absensi Kegiatan",
      icon: CheckSquare,
      color: "text-emerald-400",
      path: "/attendance",
      canAccess: canAccessActivities,
    },
  ];

  const masterDataItems = [
    {
      id: "roles",
      label: "Role",
      icon: Shield,
      color: "text-indigo-400",
      path: "/roles",
      canAccess: canAccessMasterData,
    },
    {
      id: "jabatans",
      label: "Jabatan",
      icon: Briefcase,
      color: "text-amber-400",
      path: "/jabatans",
      canAccess: canAccessMasterData,
    },
    {
      id: "document-specifications",
      label: "Spesifikasi Dokumen",
      icon: FileText,
      color: "text-sky-400",
      path: "/document-specifications",
      canAccess: canAccessMasterData,
    },
    {
      id: "organization-levels",
      label: "Level Organisasi",
      icon: Layers,
      color: "text-purple-400",
      path: "/organization-levels",
      canAccess: canAccessMasterData,
    },
    {
      id: "organization-types",
      label: "Tipe Organisasi",
      icon: Tag,
      color: "text-pink-400",
      path: "/organization-types",
      canAccess: canAccessMasterData,
    },
  ];

  const regionItems = [
    {
      id: "kotas",
      label: "Kota/Kabupaten",
      icon: MapPin,
      color: "text-blue-400",
      path: "/kotas",
      canAccess: canAccessRegion,
    },
    {
      id: "kecamatans",
      label: "Kecamatan",
      icon: Map,
      color: "text-orange-400",
      path: "/kecamatans",
      canAccess: canAccessRegion,
    },
    {
      id: "kelurahans",
      label: "Kelurahan/Desa",
      icon: MapPinned,
      color: "text-teal-400",
      path: "/kelurahans",
      canAccess: canAccessRegion,
    },
    {
      id: "rws",
      label: "Rukun Warga (RW)",
      icon: Home,
      color: "text-emerald-400",
      path: "/rws",
      canAccess: canAccessRegion,
    },
  ];

  const logActivityItems = [
    {
      id: "login-logs",
      label: "Log Aktivitas Login",
      icon: Activity,
      color: "text-amber-400",
      path: "/login-logs",
      canAccess: canAccessLogActivity,
    },
    {
      id: "activity-logs",
      label: "Log Aktivitas Sistem",
      icon: History,
      color: "text-indigo-400",
      path: "/activity-logs",
      canAccess: canAccessLogActivity,
    },
    {
      id: "user-devices",
      label: "Perangkat User",
      icon: Smartphone,
      color: "text-teal-400",
      path: "/user-devices",
      canAccess: canAccessLogActivity,
    },
    {
      id: "blocked-ips",
      label: "Blocked IPs",
      icon: Shield,
      color: "text-red-400",
      path: "/blocked-ips",
      canAccess: canAccessLogActivity,
    },
  ];

  // Filter menus
  const filteredMasterDataItems = masterDataItems.filter((item) => item.canAccess);
  const filteredLogActivityItems = logActivityItems.filter((item) => item.canAccess);
  const filteredMenuItems = menuItems.filter((item) => item.canAccess);
  const filteredManagementItems = managementItems.filter((item) => item.canAccess);
  const filteredRegionItems = regionItems.filter((item) => item.canAccess);
  const filteredProgramKerjaPCItems = programKerjaPCItems.filter((item) => item.canAccess);
  const filteredProgramKerjaMWCItems = programKerjaMWCItems.filter((item) => item.canAccess);
  const filteredActivitiesItems = activitiesItems.filter((item) => item.canAccess);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const isAnyMasterDataActive = () => filteredMasterDataItems.some((item) => isActive(item.path));
  const isAnyLogActivityActive = () => filteredLogActivityItems.some((item) => isActive(item.path));
  const isAnyRegionActive = () => filteredRegionItems.some((item) => isActive(item.path));
  const isAnyProgramKerjaPCActive = () => filteredProgramKerjaPCItems.some((item) => isActive(item.path));
  const isAnyProgramKerjaMWCActive = () => filteredProgramKerjaMWCItems.some((item) => isActive(item.path));
  const isAnyActivitiesActive = () => filteredActivitiesItems.some((item) => isActive(item.path));

  useEffect(() => {
    if (isAnyMasterDataActive() && filteredMasterDataItems.length > 0) {
      setIsMasterDataOpen(true);
    }
    if (isAnyLogActivityActive() && filteredLogActivityItems.length > 0) {
      setIsLogActivityOpen(true);
    }
    if (isAnyRegionActive() && filteredRegionItems.length > 0) {
      setIsRegionOpen(true);
    }
    if (isAnyProgramKerjaPCActive() && filteredProgramKerjaPCItems.length > 0) {
      setIsProgramKerjaPCOpen(true);
    }
    if (isAnyProgramKerjaMWCActive() && filteredProgramKerjaMWCItems.length > 0) {
      setIsProgramKerjaMWCOpen(true);
    }
    if (isAnyActivitiesActive() && filteredActivitiesItems.length > 0) {
      setIsActivityOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem("sidebar_scroll_position");
    if (navRef.current && savedPosition) {
      navRef.current.scrollTop = parseInt(savedPosition);
      sessionStorage.removeItem("sidebar_scroll_position");
    }
    setTimeout(() => {
      if (activeItemRef.current && navRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    if (navRef.current) {
      sessionStorage.setItem("sidebar_scroll_position", navRef.current.scrollTop);
    }
    if (isMobileOpen) {
      setIsMobileOpen(false);
      setIsCollapsed(true);
    }
    navigate(path);
  };

  const handleLogout = () => {
    warning(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      async () => {
        setIsLoggingOut(true);
        const result = await logout();
        if (result && result.success) {
          success("Logout Berhasil", "Anda telah keluar dari aplikasi.", () => {
            navigate("/login");
          });
        } else {
          error(
            "Logout Gagal",
            result?.message || "Terjadi kesalahan saat logout.",
          );
        }
        setIsLoggingOut(false);
      }
    );
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
    if (!isMobileOpen) {
      setIsCollapsed(false);
    }
  };

  const toggleMasterData = () => setIsMasterDataOpen((prev) => !prev);
  const toggleLogActivity = () => setIsLogActivityOpen((prev) => !prev);
  const toggleRegion = () => setIsRegionOpen((prev) => !prev);
  const toggleProgramKerjaPC = () => setIsProgramKerjaPCOpen((prev) => !prev);
  const toggleProgramKerjaMWC = () => setIsProgramKerjaMWCOpen((prev) => !prev);
  const toggleActivity = () => setIsActivityOpen((prev) => !prev);

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <button
        key={item.id}
        ref={active ? activeItemRef : null}
        onClick={() => handleNavigation(item.path)}
        className={`
          w-full flex items-center rounded-xl transition-all duration-300 ease-in-out group
          ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
          ${
            active
              ? "bg-linear-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30"
              : "hover:bg-green-800/40"
          }
          transform hover:scale-[1.02] active:scale-[0.98]
        `}
        title={isCollapsed ? item.label : ""}
      >
        <Icon
          className={`w-5 h-5 shrink-0 transition-all duration-300 ${
            active ? "text-white" : item.color
          } group-hover:text-white`}
        />
        {!isCollapsed && (
          <>
            <span
              className={`font-medium transition-all duration-300 ${
                active ? "text-white" : "text-green-100"
              } whitespace-nowrap`}
            >
              {item.label}
            </span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            )}
          </>
        )}
        {isCollapsed && active && (
          <div className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full animate-pulse"></div>
        )}
      </button>
    );
  };

  const renderSubMenuItem = (item, isSubmenu = false) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <button
        key={item.id}
        ref={active ? activeItemRef : null}
        onClick={() => handleNavigation(item.path)}
        className={`
          w-full flex items-center rounded-xl transition-all duration-300 ease-in-out group
          ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
          ${isSubmenu && !isCollapsed ? "pl-11" : ""}
          ${
            active
              ? "bg-linear-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30"
              : "hover:bg-green-800/40"
          }
          transform hover:scale-[1.02] active:scale-[0.98]
        `}
        title={isCollapsed ? item.label : ""}
      >
        <Icon
          className={`w-5 h-5 shrink-0 transition-all duration-300 ${
            active ? "text-white" : item.color
          } group-hover:text-white`}
        />
        {!isCollapsed && (
          <>
            <span
              className={`font-medium transition-all duration-300 ${
                active ? "text-white" : "text-green-100"
              } whitespace-nowrap`}
            >
              {item.label}
            </span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            )}
          </>
        )}
        {isCollapsed && active && (
          <div className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full animate-pulse"></div>
        )}
      </button>
    );
  };

  const renderCollapsibleMenu = ({
    isOpen,
    toggle,
    label,
    icon: Icon,
    iconColor,
    items,
    isActiveParent,
    collapsedLabel,
  }) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1">
        <button
          onClick={toggle}
          className={`
            w-full flex items-center rounded-xl transition-all duration-300 ease-in-out group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-green-800/40" : "hover:bg-green-800/40"}
            transform hover:scale-[1.02] active:scale-[0.98]
          `}
          title={isCollapsed ? collapsedLabel : ""}
        >
          <Icon
            className={`w-5 h-5 shrink-0 transition-all duration-300 ${
              isActiveParent ? "text-emerald-400" : "text-green-300"
            } group-hover:text-white`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium transition-all duration-300 ${
                  isActiveParent ? "text-emerald-400" : "text-green-100"
                } whitespace-nowrap flex-1 text-left`}
              >
                {label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-green-300 transition-all duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isOpen && (
          <div className="ml-4 space-y-1 overflow-hidden animate-slideDown">
            {items.map((item) => renderSubMenuItem(item, true))}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {collapsedLabel}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-linear-to-r from-emerald-600 to-green-600 text-white p-2.5 rounded-lg shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:relative z-50 bg-linear-to-b from-green-900 to-green-800 text-white shadow-2xl 
          flex flex-col transition-all duration-500 ease-in-out h-full
          ${isCollapsed ? "w-20" : "w-72"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo Section */}
        <div
          className={`p-6 border-b border-green-700/50 transition-all duration-500 ${
            isCollapsed ? "px-4" : ""
          }`}
        >
          <div
            className={`flex items-center transition-all duration-500 ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            {!isCollapsed && (
              <div className="w-full text-center">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <img 
                    src="/logo.png" 
                    alt="NU Logo" 
                    className="w-10 h-10 object-contain transition-all duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/40?text=NU";
                    }}
                  />
                  <h1 className="text-xl font-bold bg-linear-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    NU Management
                  </h1>
                </div>
                <p className="text-xs text-green-300/70 mt-0.5">Nahdlatul Ulama</p>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 bg-linear-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg transition-all duration-500">
                <img 
                  src="/logo.png" 
                  alt="NU" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/32?text=NU";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-linear-to-r from-emerald-600 to-green-600 text-white p-1.5 rounded-full shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-300 hidden lg:block transform hover:scale-110 active:scale-95"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Navigation */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll"
        >
          {filteredMenuItems.map(renderMenuItem)}
          {filteredManagementItems.map(renderMenuItem)}
          
          {renderCollapsibleMenu({
            isOpen: isProgramKerjaPCOpen,
            toggle: toggleProgramKerjaPC,
            label: "Program Kerja PC",
            icon: Building2,
            iconColor: "text-emerald-400",
            items: filteredProgramKerjaPCItems,
            isActiveParent: isAnyProgramKerjaPCActive(),
            collapsedLabel: "Program Kerja PC",
          })}

          {renderCollapsibleMenu({
            isOpen: isProgramKerjaMWCOpen,
            toggle: toggleProgramKerjaMWC,
            label: "Program Kerja MWC",
            icon: Building,
            iconColor: "text-emerald-400",
            items: filteredProgramKerjaMWCItems,
            isActiveParent: isAnyProgramKerjaMWCActive(),
            collapsedLabel: "Program Kerja MWC",
          })}

          {renderCollapsibleMenu({
            isOpen: isActivityOpen,
            toggle: toggleActivity,
            label: "Kegiatan",
            icon: Calendar,
            iconColor: "text-purple-400",
            items: filteredActivitiesItems,
            isActiveParent: isAnyActivitiesActive(),
            collapsedLabel: "Kegiatan",
          })}

          {renderCollapsibleMenu({
            isOpen: isMasterDataOpen,
            toggle: toggleMasterData,
            label: "Master Data",
            icon: Database,
            iconColor: "text-emerald-400",
            items: filteredMasterDataItems,
            isActiveParent: isAnyMasterDataActive(),
            collapsedLabel: "Master Data",
          })}

          {renderCollapsibleMenu({
            isOpen: isRegionOpen,
            toggle: toggleRegion,
            label: "Data Wilayah",
            icon: MapPin,
            iconColor: "text-emerald-400",
            items: filteredRegionItems,
            isActiveParent: isAnyRegionActive(),
            collapsedLabel: "Data Wilayah",
          })}

          {renderCollapsibleMenu({
            isOpen: isLogActivityOpen,
            toggle: toggleLogActivity,
            label: "Log Aktivitas",
            icon: ClipboardList,
            iconColor: "text-emerald-400",
            items: filteredLogActivityItems,
            isActiveParent: isAnyLogActivityActive(),
            collapsedLabel: "Log Aktivitas",
          })}

          {/* Logout Button */}
          <div className="pt-4 mt-4 border-t border-green-700/50">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                w-full flex items-center rounded-xl transition-all duration-300 ease-in-out group
                ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
                hover:bg-red-600/20 hover:text-red-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transform hover:scale-[1.02] active:scale-[0.98]
              `}
              title={isCollapsed ? "Logout" : ""}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-5 h-5 shrink-0 text-red-400 animate-spin" />
                  {!isCollapsed && (
                    <span className="font-medium text-green-100 whitespace-nowrap">
                      Logging out...
                    </span>
                  )}
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 shrink-0 text-red-400 transition-all duration-300 group-hover:text-red-300" />
                  {!isCollapsed && (
                    <span className="font-medium text-green-100 whitespace-nowrap transition-all duration-300 group-hover:text-red-300">
                      Logout
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </nav>
      </aside>

      {/* Custom Scrollbar & Animation Styles */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #064e3b;
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #065f46;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #065f46 #064e3b;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

export default Sidebar;