// src/components/layout/Sidebar.jsx
import React, { useState, useEffect, useRef, memo } from "react";
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
  Award,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../contexts/ModalContext";

// ✅ Memoize menu item untuk mencegah re-render
const MenuItem = memo(({ item, isActive, isCollapsed, onClick, activeRef }) => {
  const Icon = item.icon;
  const active = isActive(item.path);

  return (
    <button
      ref={active ? activeRef : null}
      onClick={() => onClick(item.path)}
      className={`
        w-full flex items-center rounded-xl
        ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
        ${
          active
            ? "bg-linear-to-rrom-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30"
            : "hover:bg-green-800/40"
        }
        transition-[background-color,box-shadow,transform] duration-200 ease-in-out
        hover:translate-x-0.5 active:translate-x-0
        will-change-transform
      `}
      title={isCollapsed ? item.label : ""}
    >
      <Icon
        className={`
          w-5 h-5 shrink-0
          ${active ? "text-white" : item.color}
          transition-colors duration-200 ease-in-out
          group-hover:text-white
        `}
      />
      {!isCollapsed && (
        <>
          <span
            className={`
              font-medium
              ${active ? "text-white" : "text-green-100"}
              transition-colors duration-200 ease-in-out
              whitespace-nowrap
            `}
          >
            {item.label}
          </span>
          {active && (
            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-glow" />
          )}
        </>
      )}
      {isCollapsed && active && (
        <div className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full animate-glow" />
      )}
    </button>
  );
});

MenuItem.displayName = "MenuItem";

// ✅ Memoize submenu item
const SubMenuItem = memo(({ item, isActive, isCollapsed, onClick, activeRef }) => {
  const Icon = item.icon;
  const active = isActive(item.path);

  return (
    <button
      ref={active ? activeRef : null}
      onClick={() => onClick(item.path)}
      className={`
        w-full flex items-center rounded-xl
        ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3 pl-11"}
        ${
          active
            ? "bg-linear-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30"
            : "hover:bg-green-800/40"
        }
        transition-[background-color,box-shadow,transform] duration-200 ease-in-out
        hover:translate-x-0.5 active:translate-x-0
        will-change-transform
      `}
      title={isCollapsed ? item.label : ""}
    >
      <Icon
        className={`
          w-5 h-5 shrink-0
          ${active ? "text-white" : item.color}
          transition-colors duration-200 ease-in-out
        `}
      />
      {!isCollapsed && (
        <>
          <span
            className={`
              font-medium
              ${active ? "text-white" : "text-green-100"}
              transition-colors duration-200 ease-in-out
              whitespace-nowrap
            `}
          >
            {item.label}
          </span>
          {active && (
            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-glow" />
          )}
        </>
      )}
      {isCollapsed && active && (
        <div className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full animate-glow" />
      )}
    </button>
  );
});

SubMenuItem.displayName = "SubMenuItem";

// ✅ Memoize collapsible menu
const CollapsibleMenu = memo(({
  isOpen,
  toggle,
  label,
  icon: Icon,
  items,
  isActiveParent,
  isCollapsed,
  collapsedLabel,
  isActive,
  onClick,
  activeRef,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={toggle}
        className={`
          w-full flex items-center rounded-xl
          ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
          ${isActiveParent ? "bg-green-800/40" : "hover:bg-green-800/40"}
          transition-[background-color] duration-200 ease-in-out
          will-change-transform
        `}
        title={isCollapsed ? collapsedLabel : ""}
      >
        <Icon
          className={`
            w-5 h-5 shrink-0
            ${isActiveParent ? "text-emerald-400" : "text-green-300"}
            transition-colors duration-200 ease-in-out
          `}
        />
        {!isCollapsed && (
          <>
            <span
              className={`
                font-medium
                ${isActiveParent ? "text-emerald-400" : "text-green-100"}
                transition-colors duration-200 ease-in-out
                whitespace-nowrap flex-1 text-left
              `}
            >
              {label}
            </span>
            <ChevronDown
              className={`
                w-4 h-4 text-green-300
                transition-transform duration-250 ease-in-out
                ${isOpen ? "rotate-180" : ""}
              `}
            />
          </>
        )}
      </button>

      {/* ✅ Transform-based animation (bukan max-height) */}
      <div
        className={`
          ml-4 space-y-1 overflow-hidden
          transition-all duration-250 ease-in-out
          ${isOpen ? "opacity-100 max-h-250" : "opacity-0 max-h-0 pointer-events-none"}
        `}
      >
        {items.map((item) => (
          <SubMenuItem
            key={item.id}
            item={item}
            isActive={isActive}
            isCollapsed={isCollapsed}
            onClick={onClick}
            activeRef={activeRef}
          />
        ))}
      </div>

      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {collapsedLabel}
        </div>
      )}
    </div>
  );
});

CollapsibleMenu.displayName = "CollapsibleMenu";

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

  // User role & permissions
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
  const isRantingLevel = userOrgLevel === "ranting";

  const canAccessDashboard = true;
  const canAccessUsers = isSuperAdmin || (isAdmin && isPCLevel);
  const canAccessOrganizations = true;
  const canAccessAnggota = true;
  const canAccessProgramKerjaPC = isSuperAdmin || (isAdmin && isPCLevel) || (isOperator && isPCLevel) || (isAnggota && isPCLevel);
  const canAccessProgramKerjaMWC = isSuperAdmin || isMWCLevel;
  const canAccessActivities = isSuperAdmin || isRantingLevel;
  const canAccessMasterData = isSuperAdmin || (isAdmin && isPCLevel);
  const canAccessRegion = isSuperAdmin;
  const canAccessLogActivity = isSuperAdmin;

  // Menu items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-emerald-400", path: "/dashboard", canAccess: canAccessDashboard },
  ];

  const managementItems = [
    { id: "users", label: "Manajemen User", icon: Users, color: "text-cyan-400", path: "/users", canAccess: canAccessUsers },
    { id: "organizations", label: "Manajemen Organisasi", icon: Building2, color: "text-emerald-400", path: "/organizations", canAccess: canAccessOrganizations },
    { id: "anggotas", label: "Manajemen Anggota", icon: Users, color: "text-sky-400", path: "/anggotas", canAccess: canAccessAnggota },
  ];

  const programKerjaPCItems = [
    { id: "work-programs-pc", label: "Program Kerja", icon: Briefcase, color: "text-emerald-400", path: "/program-themes", canAccess: canAccessProgramKerjaPC },
    { id: "program-fields-pc", label: "Bidang Program", icon: FolderTree, color: "text-teal-400", path: "/program-fields", canAccess: canAccessProgramKerjaPC },
    { id: "program-targets-pc", label: "Sasaran Program", icon: Target, color: "text-amber-400", path: "/program-targets", canAccess: canAccessProgramKerjaPC },
    { id: "program-goals-pc", label: "Tujuan Program", icon: Flag, color: "text-purple-400", path: "/program-goals", canAccess: canAccessProgramKerjaPC },
  ];

  const programKerjaMWCItems = [
    { id: "work-programs-mwc", label: "Program Kerja MWC", icon: Briefcase, color: "text-emerald-400", path: "/work-programs-mwc", canAccess: canAccessProgramKerjaMWC },
  ];

  const activitiesItems = [
    { id: "activities", label: "Kegiatan Proker", icon: Calendar, color: "text-purple-400", path: "/activity-prokers", canAccess: canAccessActivities },
    { id: "attendance", label: "Absensi Kegiatan", icon: CheckSquare, color: "text-emerald-400", path: "/attendance", canAccess: canAccessActivities },
  ];

  const masterDataItems = [
    { id: "roles", label: "Role", icon: Shield, color: "text-indigo-400", path: "/roles", canAccess: isSuperAdmin },
    { id: "jabatans", label: "Jabatan", icon: Briefcase, color: "text-amber-400", path: "/jabatans", canAccess: canAccessMasterData },
    { id: "certificate-categories", label: "Kategori Sertifikat", icon: Award, color: "text-emerald-400", path: "/certificate-categories", canAccess: canAccessMasterData },
    { id: "document-specifications", label: "Spesifikasi Dokumen", icon: FileText, color: "text-sky-400", path: "/document-specifications", canAccess: isSuperAdmin },
    { id: "organization-levels", label: "Level Organisasi", icon: Layers, color: "text-purple-400", path: "/organization-levels", canAccess: canAccessMasterData },
    { id: "organization-types", label: "Tipe Organisasi", icon: Tag, color: "text-pink-400", path: "/organization-types", canAccess: canAccessMasterData },
  ];

  const regionItems = [
    { id: "kotas", label: "Kota/Kabupaten", icon: MapPin, color: "text-blue-400", path: "/kotas", canAccess: canAccessRegion },
    { id: "kecamatans", label: "Kecamatan", icon: Map, color: "text-orange-400", path: "/kecamatans", canAccess: canAccessRegion },
    { id: "kelurahans", label: "Kelurahan/Desa", icon: MapPinned, color: "text-teal-400", path: "/kelurahans", canAccess: canAccessRegion },
    { id: "rws", label: "Rukun Warga (RW)", icon: Home, color: "text-emerald-400", path: "/rws", canAccess: canAccessRegion },
  ];

  const logActivityItems = [
    { id: "login-logs", label: "Log Aktivitas Login", icon: Activity, color: "text-amber-400", path: "/login-logs", canAccess: canAccessLogActivity },
    { id: "activity-logs", label: "Log Aktivitas Sistem", icon: History, color: "text-indigo-400", path: "/activity-logs", canAccess: canAccessLogActivity },
    { id: "user-devices", label: "Perangkat User", icon: Smartphone, color: "text-teal-400", path: "/user-devices", canAccess: canAccessLogActivity },
    { id: "blocked-ips", label: "Blocked IPs", icon: Shield, color: "text-red-400", path: "/blocked-ips", canAccess: canAccessLogActivity },
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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const isAnyMasterDataActive = () => filteredMasterDataItems.some((item) => isActive(item.path));
  const isAnyLogActivityActive = () => filteredLogActivityItems.some((item) => isActive(item.path));
  const isAnyRegionActive = () => filteredRegionItems.some((item) => isActive(item.path));
  const isAnyProgramKerjaPCActive = () => filteredProgramKerjaPCItems.some((item) => isActive(item.path));
  const isAnyProgramKerjaMWCActive = () => filteredProgramKerjaMWCItems.some((item) => isActive(item.path));
  const isAnyActivitiesActive = () => filteredActivitiesItems.some((item) => isActive(item.path));

  // Auto-open submenu if active
  useEffect(() => {
    if (isAnyMasterDataActive() && filteredMasterDataItems.length > 0) setIsMasterDataOpen(true);
    if (isAnyLogActivityActive() && filteredLogActivityItems.length > 0) setIsLogActivityOpen(true);
    if (isAnyRegionActive() && filteredRegionItems.length > 0) setIsRegionOpen(true);
    if (isAnyProgramKerjaPCActive() && filteredProgramKerjaPCItems.length > 0) setIsProgramKerjaPCOpen(true);
    if (isAnyProgramKerjaMWCActive() && filteredProgramKerjaMWCItems.length > 0) setIsProgramKerjaMWCOpen(true);
    if (isAnyActivitiesActive() && filteredActivitiesItems.length > 0) setIsActivityOpen(true);
  }, [location.pathname]);

  // Smooth scroll to active item
  useEffect(() => {
    const savedPosition = sessionStorage.getItem("sidebar_scroll_position");
    if (navRef.current && savedPosition) {
      navRef.current.scrollTop = parseInt(savedPosition);
      sessionStorage.removeItem("sidebar_scroll_position");
    }
    
    // ✅ Gunakan requestAnimationFrame untuk smooth scroll
    requestAnimationFrame(() => {
      if (activeItemRef.current && navRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
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
        try {
          const result = await logout();
          if (result && result.success) {
            success("Logout Berhasil", "Anda telah keluar dari aplikasi.");
          } else {
            success("Logout Berhasil", "Anda telah keluar dari aplikasi.");
          }
        } catch (err) {
          console.error('Logout error:', err);
          error("Logout Gagal", err?.message || "Terjadi kesalahan saat logout.");
        } finally {
          setIsLoggingOut(false);
        }
      }
    );
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
    if (!isMobileOpen) setIsCollapsed(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-linear-to-r from-emerald-600 to-green-600 text-white p-2.5 rounded-lg shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay - Tanpa backdrop-blur untuk performa */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fadeIn"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:relative z-50 bg-linear-to-b from-green-900 to-green-800 text-white shadow-2xl
          flex flex-col h-full
          ${isCollapsed ? "w-20" : "w-72"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          transition-[width,transform] duration-250 ease-in-out
          will-change-[width,transform]
          contain-layout
        `}
      >
        {/* Logo Section */}
        <div
          className={`
            border-b border-green-700/50
            ${isCollapsed ? "p-4" : "p-6"}
            transition-[padding] duration-250 ease-in-out
          `}
        >
          <div
            className={`
              flex items-center
              ${isCollapsed ? "justify-center" : "justify-start"}
              transition-[justify-content] duration-250 ease-in-out
            `}
          >
            {!isCollapsed && (
              <div className="w-full text-center animate-fadeIn">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <img
                    src="/logo.png"
                    alt="NU Logo"
                    className="w-10 h-10 object-contain"
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
              <div className="w-10 h-10 bg-linear-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg animate-fadeIn">
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
          className="absolute -right-3 top-20 bg-linear-to-r from-emerald-600 to-green-600 text-white p-1.5 rounded-full shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 ease-in-out hidden lg:block transform hover:scale-110 active:scale-95"
        >
          <div className={`transition-transform duration-250 ease-in-out ${isCollapsed ? "rotate-0" : "rotate-180"}`}>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Navigation */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 sidebar-scroll"
        >
          {filteredMenuItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              onClick={handleNavigation}
              activeRef={activeItemRef}
            />
          ))}
          
          {filteredManagementItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              onClick={handleNavigation}
              activeRef={activeItemRef}
            />
          ))}

          <CollapsibleMenu
            isOpen={isProgramKerjaPCOpen}
            toggle={() => setIsProgramKerjaPCOpen((prev) => !prev)}
            label="Program Kerja PC"
            icon={Building2}
            items={filteredProgramKerjaPCItems}
            isActiveParent={isAnyProgramKerjaPCActive()}
            isCollapsed={isCollapsed}
            collapsedLabel="Program Kerja PC"
            isActive={isActive}
            onClick={handleNavigation}
            activeRef={activeItemRef}
          />

          <CollapsibleMenu
            isOpen={isProgramKerjaMWCOpen}
            toggle={() => setIsProgramKerjaMWCOpen((prev) => !prev)}
            label="Program Kerja MWC"
            icon={Building}
            items={filteredProgramKerjaMWCItems}
            isActiveParent={isAnyProgramKerjaMWCActive()}
            isCollapsed={isCollapsed}
            collapsedLabel="Program Kerja MWC"
            isActive={isActive}
            onClick={handleNavigation}
            activeRef={activeItemRef}
          />

          <CollapsibleMenu
            isOpen={isActivityOpen}
            toggle={() => setIsActivityOpen((prev) => !prev)}
            label="Kegiatan"
            icon={Calendar}
            items={filteredActivitiesItems}
            isActiveParent={isAnyActivitiesActive()}
            isCollapsed={isCollapsed}
            collapsedLabel="Kegiatan"
            isActive={isActive}
            onClick={handleNavigation}
            activeRef={activeItemRef}
          />

          <CollapsibleMenu
            isOpen={isMasterDataOpen}
            toggle={() => setIsMasterDataOpen((prev) => !prev)}
            label="Master Data"
            icon={Database}
            items={filteredMasterDataItems}
            isActiveParent={isAnyMasterDataActive()}
            isCollapsed={isCollapsed}
            collapsedLabel="Master Data"
            isActive={isActive}
            onClick={handleNavigation}
            activeRef={activeItemRef}
          />

          <CollapsibleMenu
            isOpen={isRegionOpen}
            toggle={() => setIsRegionOpen((prev) => !prev)}
            label="Data Wilayah"
            icon={MapPin}
            items={filteredRegionItems}
            isActiveParent={isAnyRegionActive()}
            isCollapsed={isCollapsed}
            collapsedLabel="Data Wilayah"
            isActive={isActive}
            onClick={handleNavigation}
            activeRef={activeItemRef}
          />

          <CollapsibleMenu
            isOpen={isLogActivityOpen}
            toggle={() => setIsLogActivityOpen((prev) => !prev)}
            label="Log Aktivitas"
            icon={ClipboardList}
            items={filteredLogActivityItems}
            isActiveParent={isAnyLogActivityActive()}
            isCollapsed={isCollapsed}
            collapsedLabel="Log Aktivitas"
            isActive={isActive}
            onClick={handleNavigation}
            activeRef={activeItemRef}
          />

          {/* Logout Button */}
          <div className="pt-4 mt-4 border-t border-green-700/50">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                w-full flex items-center rounded-xl
                ${isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"}
                hover:bg-red-600/20
                transition-[background-color] duration-200 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed
                will-change-transform
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
                  <LogOut className="w-5 h-5 shrink-0 text-red-400 transition-colors duration-200 ease-in-out" />
                  {!isCollapsed && (
                    <span className="font-medium text-green-100 whitespace-nowrap transition-colors duration-200 ease-in-out">
                      Logout
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </nav>
      </aside>

      {/* ✅ Optimized Styles - Smooth Animations */}
      <style>{`
        /* Smooth Scrollbar */
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
          transition: background-color 0.2s ease;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #065f46 #064e3b;
        }

        /* ✅ Smooth Fade In Animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ✅ Subtle Glow Animation (bukan pulse) */
        @keyframes glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          }
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
          will-change: opacity, box-shadow;
        }

        /* ✅ GPU Acceleration untuk semua elemen animasi */
        .will-change-transform {
          will-change: transform;
          transform: translateZ(0);
        }

        /* ✅ Layout Containment untuk performa */
        .contain-layout {
          contain: layout style;
        }

        /* ✅ Smooth transition untuk semua interactive elements */
        button {
          -webkit-tap-highlight-color: transparent;
        }

        /* ✅ Prevent layout shift */
        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
};

export default Sidebar;