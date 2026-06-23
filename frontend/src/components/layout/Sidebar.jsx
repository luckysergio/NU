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

  const navRef = useRef(null);
  const activeItemRef = useRef(null);

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

  // ============ PERBAIKAN PERMISSIONS ============
  
  // 1. Dashboard - Semua bisa melihat
  const canAccessDashboard = true;

  // 2. Manajemen User - Hanya Super Admin dan Admin PC
  const canAccessUsers = isSuperAdmin || (isAdmin && isPCLevel);

  // 3. Manajemen Organisasi - Semua bisa melihat
  const canAccessOrganizations = true;

  // 4. Manajemen Anggota - Semua bisa melihat
  const canAccessAnggota = true;

  // 5. Program Kerja PC - Super Admin, Admin, Operator, Anggota PC
  const canAccessProgramKerjaPC = isSuperAdmin || isAdmin || isOperator || (isAnggota && isPCLevel);

  // 6. Program Kerja MWC - Semua bisa melihat
  const canAccessProgramKerjaMWC = true;

  // 7. Kegiatan - Semua bisa melihat
  const canAccessActivities = true;

  // 8. Master Data - Hanya Super Admin
  const canAccessMasterData = isSuperAdmin;

  // 9. Data Wilayah - Hanya Super Admin
  const canAccessRegion = isSuperAdmin;

  // 10. Log Aktivitas - Hanya Super Admin
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

  // Management Items
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

  // Program Kerja PC Items
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

  // Program Kerja MWC Items
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

  // Activities Items
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

  // Master Data Items
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

  // Region Items
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

  // Log Activity Items
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
  const getFilteredMenuItems = () => menuItems.filter((item) => item.canAccess);
  const getFilteredManagementItems = () =>
    managementItems.filter((item) => item.canAccess);
  const getFilteredMasterDataItems = () =>
    masterDataItems.filter((item) => item.canAccess);
  const getFilteredLogActivityItems = () =>
    logActivityItems.filter((item) => item.canAccess);
  const getFilteredRegionItems = () =>
    regionItems.filter((item) => item.canAccess);
  const getFilteredProgramKerjaPCItems = () =>
    programKerjaPCItems.filter((item) => item.canAccess);
  const getFilteredProgramKerjaMWCItems = () =>
    programKerjaMWCItems.filter((item) => item.canAccess);
  const getFilteredActivitiesItems = () =>
    activitiesItems.filter((item) => item.canAccess);

  const filteredMasterDataItems = getFilteredMasterDataItems();
  const filteredLogActivityItems = getFilteredLogActivityItems();
  const filteredMenuItems = getFilteredMenuItems();
  const filteredManagementItems = getFilteredManagementItems();
  const filteredRegionItems = getFilteredRegionItems();
  const filteredProgramKerjaPCItems = getFilteredProgramKerjaPCItems();
  const filteredProgramKerjaMWCItems = getFilteredProgramKerjaMWCItems();
  const filteredActivitiesItems = getFilteredActivitiesItems();

  // Scroll management
  const saveScrollPosition = () => {
    if (navRef.current) {
      sessionStorage.setItem(
        "sidebar_scroll_position",
        navRef.current.scrollTop,
      );
    }
  };

  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem("sidebar_scroll_position");
    if (navRef.current && savedPosition) {
      navRef.current.scrollTop = parseInt(savedPosition);
      sessionStorage.removeItem("sidebar_scroll_position");
    }
  };

  const scrollToActiveItem = () => {
    if (activeItemRef.current && navRef.current) {
      const containerRect = navRef.current.getBoundingClientRect();
      const activeRect = activeItemRef.current.getBoundingClientRect();

      if (
        activeRect.top < containerRect.top ||
        activeRect.bottom > containerRect.bottom
      ) {
        activeItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const isAnyMasterDataActive = () => {
    return filteredMasterDataItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/"),
    );
  };

  const isAnyLogActivityActive = () => {
    return filteredLogActivityItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/"),
    );
  };

  const isAnyRegionActive = () => {
    return filteredRegionItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/"),
    );
  };

  const isAnyProgramKerjaPCActive = () => {
    return filteredProgramKerjaPCItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/"),
    );
  };

  const isAnyProgramKerjaMWCActive = () => {
    return filteredProgramKerjaMWCItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/"),
    );
  };

  const isAnyActivitiesActive = () => {
    return filteredActivitiesItems.some(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/"),
    );
  };

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
    if (
      isAnyProgramKerjaMWCActive() &&
      filteredProgramKerjaMWCItems.length > 0
    ) {
      setIsProgramKerjaMWCOpen(true);
    }
    if (isAnyActivitiesActive() && filteredActivitiesItems.length > 0) {
      setIsActivityOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    restoreScrollPosition();
    setTimeout(() => scrollToActiveItem(), 100);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    saveScrollPosition();
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
      },
      () => console.log("Logout dibatalkan"),
      "Ya, Keluar",
      "Batal",
    );
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMasterData = () => setIsMasterDataOpen(!isMasterDataOpen);
  const toggleLogActivity = () => setIsLogActivityOpen(!isLogActivityOpen);
  const toggleRegion = () => setIsRegionOpen(!isRegionOpen);
  const toggleProgramKerjaPC = () =>
    setIsProgramKerjaPCOpen(!isProgramKerjaPCOpen);
  const toggleProgramKerjaMWC = () =>
    setIsProgramKerjaMWCOpen(!isProgramKerjaMWCOpen);
  const toggleActivity = () => setIsActivityOpen(!isActivityOpen);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");
  const isMasterDataActive = () =>
    filteredMasterDataItems.some((item) => isActive(item.path));
  const isLogActivityActive = () =>
    filteredLogActivityItems.some((item) => isActive(item.path));
  const isRegionActive = () =>
    filteredRegionItems.some((item) => isActive(item.path));
  const isProgramKerjaPCActive = () =>
    filteredProgramKerjaPCItems.some((item) => isActive(item.path));
  const isProgramKerjaMWCActive = () =>
    filteredProgramKerjaMWCItems.some((item) => isActive(item.path));
  const isActivityActive = () =>
    filteredActivitiesItems.some((item) => isActive(item.path));

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <button
        key={item.id}
        ref={active ? activeItemRef : null}
        onClick={() => handleNavigation(item.path)}
        className={`
          w-full flex items-center rounded-xl transition-all duration-200 group
          ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
          ${
            active
              ? "bg-emerald-600 shadow-lg shadow-emerald-500/30"
              : "hover:bg-slate-700/50"
          }
        `}
        title={isCollapsed ? item.label : ""}
      >
        <Icon
          className={`w-5 h-5 shrink-0 ${active ? "text-white" : item.color} group-hover:text-white transition-colors`}
        />
        {!isCollapsed && (
          <>
            <span
              className={`font-medium ${active ? "text-white" : "text-slate-300"} whitespace-nowrap`}
            >
              {item.label}
            </span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </>
        )}
        {isCollapsed && active && (
          <div className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full"></div>
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
          w-full flex items-center rounded-xl transition-all duration-200 group
          ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
          ${isSubmenu && !isCollapsed ? "pl-11" : ""}
          ${
            active
              ? "bg-emerald-600 shadow-lg shadow-emerald-500/30"
              : "hover:bg-slate-700/50"
          }
        `}
        title={isCollapsed ? item.label : ""}
      >
        <Icon
          className={`w-5 h-5 shrink-0 ${active ? "text-white" : item.color} group-hover:text-white transition-colors`}
        />
        {!isCollapsed && (
          <>
            <span
              className={`font-medium ${active ? "text-white" : "text-slate-300"} whitespace-nowrap`}
            >
              {item.label}
            </span>
            {active && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </>
        )}
        {isCollapsed && active && (
          <div className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full"></div>
        )}
      </button>
    );
  };

  const renderProgramKerjaPCMenu = () => {
    if (filteredProgramKerjaPCItems.length === 0) return null;

    const isActiveParent = isProgramKerjaPCActive();

    return (
      <div className="space-y-1">
        <button
          onClick={toggleProgramKerjaPC}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-emerald-600/20" : "hover:bg-slate-700/50"}
          `}
          title={isCollapsed ? "Program Kerja PC" : ""}
        >
          <Building2
            className={`w-5 h-5 shrink-0 ${isActiveParent ? "text-emerald-400" : "text-slate-400"} group-hover:text-white transition-colors`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium ${isActiveParent ? "text-emerald-400" : "text-slate-300"} whitespace-nowrap flex-1 text-left`}
              >
                Program Kerja PC
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isProgramKerjaPCOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isProgramKerjaPCOpen && (
          <div className="ml-4 space-y-1">
            {filteredProgramKerjaPCItems.map((item) =>
              renderSubMenuItem(item, true),
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Program Kerja PC
          </div>
        )}
      </div>
    );
  };

  const renderProgramKerjaMWCMenu = () => {
    if (filteredProgramKerjaMWCItems.length === 0) return null;

    const isActiveParent = isProgramKerjaMWCActive();

    return (
      <div className="space-y-1">
        <button
          onClick={toggleProgramKerjaMWC}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-emerald-600/20" : "hover:bg-slate-700/50"}
          `}
          title={isCollapsed ? "Program Kerja MWC" : ""}
        >
          <Building
            className={`w-5 h-5 shrink-0 ${isActiveParent ? "text-emerald-400" : "text-slate-400"} group-hover:text-white transition-colors`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium ${isActiveParent ? "text-emerald-400" : "text-slate-300"} whitespace-nowrap flex-1 text-left`}
              >
                Program Kerja MWC
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isProgramKerjaMWCOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isProgramKerjaMWCOpen && (
          <div className="ml-4 space-y-1">
            {filteredProgramKerjaMWCItems.map((item) =>
              renderSubMenuItem(item, true),
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Program Kerja MWC
          </div>
        )}
      </div>
    );
  };

  const renderActivitiesMenu = () => {
    if (filteredActivitiesItems.length === 0) return null;

    const isActiveParent = isActivityActive();

    return (
      <div className="space-y-1">
        <button
          onClick={toggleActivity}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-emerald-600/20" : "hover:bg-slate-700/50"}
          `}
          title={isCollapsed ? "Kegiatan" : ""}
        >
          <Calendar
            className={`w-5 h-5 shrink-0 ${isActiveParent ? "text-purple-400" : "text-slate-400"} group-hover:text-white transition-colors`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium ${isActiveParent ? "text-purple-400" : "text-slate-300"} whitespace-nowrap flex-1 text-left`}
              >
                Kegiatan
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isActivityOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isActivityOpen && (
          <div className="ml-4 space-y-1">
            {filteredActivitiesItems.map((item) =>
              renderSubMenuItem(item, true),
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Kegiatan
          </div>
        )}
      </div>
    );
  };

  const renderMasterDataMenu = () => {
    if (filteredMasterDataItems.length === 0) return null;

    const isActiveParent = isMasterDataActive();

    return (
      <div className="space-y-1">
        <button
          onClick={toggleMasterData}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-emerald-600/20" : "hover:bg-slate-700/50"}
          `}
          title={isCollapsed ? "Master Data" : ""}
        >
          <Database
            className={`w-5 h-5 shrink-0 ${isActiveParent ? "text-emerald-400" : "text-slate-400"} group-hover:text-white transition-colors`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium ${isActiveParent ? "text-emerald-400" : "text-slate-300"} whitespace-nowrap flex-1 text-left`}
              >
                Master Data
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isMasterDataOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isMasterDataOpen && (
          <div className="ml-4 space-y-1">
            {filteredMasterDataItems.map((item) =>
              renderSubMenuItem(item, true),
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Master Data
          </div>
        )}
      </div>
    );
  };

  const renderLogActivityMenu = () => {
    if (filteredLogActivityItems.length === 0) return null;

    const isActiveParent = isLogActivityActive();

    return (
      <div className="space-y-1">
        <button
          onClick={toggleLogActivity}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-emerald-600/20" : "hover:bg-slate-700/50"}
          `}
          title={isCollapsed ? "Log Aktivitas" : ""}
        >
          <ClipboardList
            className={`w-5 h-5 shrink-0 ${isActiveParent ? "text-emerald-400" : "text-slate-400"} group-hover:text-white transition-colors`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium ${isActiveParent ? "text-emerald-400" : "text-slate-300"} whitespace-nowrap flex-1 text-left`}
              >
                Log Aktivitas
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isLogActivityOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isLogActivityOpen && (
          <div className="ml-4 space-y-1">
            {filteredLogActivityItems.map((item) =>
              renderSubMenuItem(item, true),
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Log Aktivitas
          </div>
        )}
      </div>
    );
  };

  const renderRegionMenu = () => {
    if (filteredRegionItems.length === 0) return null;

    const isActiveParent = isRegionActive();

    return (
      <div className="space-y-1">
        <button
          onClick={toggleRegion}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
            ${isActiveParent ? "bg-emerald-600/20" : "hover:bg-slate-700/50"}
          `}
          title={isCollapsed ? "Wilayah" : ""}
        >
          <MapPin
            className={`w-5 h-5 shrink-0 ${isActiveParent ? "text-emerald-400" : "text-slate-400"} group-hover:text-white transition-colors`}
          />
          {!isCollapsed && (
            <>
              <span
                className={`font-medium ${isActiveParent ? "text-emerald-400" : "text-slate-300"} whitespace-nowrap flex-1 text-left`}
              >
                Data Wilayah
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isRegionOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!isCollapsed && isRegionOpen && (
          <div className="ml-4 space-y-1">
            {filteredRegionItems.map((item) => renderSubMenuItem(item, true))}
          </div>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Data Wilayah
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-emerald-600 text-white p-2 rounded-lg shadow-lg hover:bg-emerald-700 transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 bg-linear-to-b from-slate-900 to-slate-800 text-white shadow-2xl 
          flex flex-col transition-all duration-300 ease-in-out h-full
          ${isCollapsed ? "w-20" : "w-72"}
          ${isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
        `}
      >
        {/* Logo Section */}
        <div
          className={`p-6 border-b border-slate-700 ${isCollapsed ? "px-4" : ""}`}
        >
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}
          >
            {!isCollapsed && (
              <div className="w-full text-center">
                <h1 className="text-xl font-bold bg-linear-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  NU Management
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Nahdatul Ulama</p>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 bg-linear-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NU</span>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-emerald-600 text-white p-1.5 rounded-full shadow-lg hover:bg-emerald-700 transition hidden lg:block"
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
          {renderProgramKerjaPCMenu()}
          {renderProgramKerjaMWCMenu()}
          {renderActivitiesMenu()}
          {renderMasterDataMenu()}
          {renderRegionMenu()}
          {renderLogActivityMenu()}

          {/* Logout Button */}
          <div className="pt-4 mt-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                w-full flex items-center rounded-xl transition-all duration-200 group
                ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
                hover:bg-red-600/20 hover:text-red-400
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={isCollapsed ? "Logout" : ""}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-5 h-5 shrink-0 text-red-400 animate-spin" />
                  {!isCollapsed && (
                    <span className="font-medium text-slate-300 whitespace-nowrap">
                      Logging out...
                    </span>
                  )}
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 shrink-0 text-red-400" />
                  {!isCollapsed && (
                    <span className="font-medium text-slate-300 whitespace-nowrap">
                      Logout
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </nav>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #475569 #1e293b;
        }
      `}</style>
    </>
  );
};

export default Sidebar;