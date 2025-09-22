
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Sliders,
  Database,
  BarChart2,
  Users,
  GraduationCap,
  ClipboardCheck,
  Library,
  Newspaper,
  LifeBuoy,
  Settings,
  Info,
  FileText,
  ShieldCheck,
  BookCopy, // Added for LMS
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useContext } from "react";
import { DataContext } from "@/context/data-context";

const allNavItems = {
  main: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['admin', 'faculty'] },
    { href: "/timetable", label: "Timetable & LMS", icon: BookCopy, roles: ['admin', 'faculty', 'student'] },
    { href: "/constraints", label: "Constraints", icon: Sliders, roles: ['admin'] },
    { href: "/data", label: "Data Import", icon: Database, roles: ['admin'] },
  ],
  analytics: [
    { href: "/analytics", label: "Analytics", icon: BarChart2, roles: ['admin', 'faculty'] },
    { href: "/reports", label: "Reports", icon: FileText, roles: ['admin', 'faculty'] },
    { href: "/audit-log", label: "Audit Log", icon: ShieldCheck, roles: ['admin'] },
  ],
  academics: [
    { href: "/progress", label: "Academic Progress", icon: GraduationCap, roles: ['admin', 'student'] },
    { href: "/results", label: "Grades", icon: ClipboardCheck, roles: ['admin', 'student'] },
    { href: "/quizzes", label: "Quiz Marks", icon: ClipboardCheck, roles: ['admin', 'faculty', 'student'] },
    { href: "/alumni", label: "Alumni Records", icon: Users, roles: ['admin', 'faculty'] },
  ],
  studentLife: [
    { href: "/library", label: "Library", icon: Library, roles: ['admin', 'faculty', 'student'] },
    { href: "/editorials", label: "Editorials", icon: Newspaper, roles: ['admin', 'faculty', 'student'] },
  ],
  help: [
    { href: "/about", label: "About", icon: Info, roles: ['admin', 'faculty', 'student'] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ['admin', 'faculty', 'student'] },
    { href: "/support", label: "Support", icon: LifeBuoy, roles: ['admin', 'faculty', 'student'] },
  ]
};


export function AppSidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { userRole } = useContext(DataContext);

  const isNavItemActive = (href: string) => {
    // Make timetable link active even if on LMS sub-routes
    if (href === "/timetable") {
      return pathname.startsWith("/timetable") || pathname.startsWith("/lms");
    }
    return pathname === href;
  };

  const NavGroup = ({ title, items }: { title: string, items: typeof allNavItems.main }) => {
      const visibleItems = items.filter(item => item.roles.includes(userRole));
      if (visibleItems.length === 0) return null;

      return (
        <div className="space-y-1">
            {state === 'expanded' && (
              <SidebarGroupLabel className="text-purple-300/80 font-medium text-xs uppercase tracking-wider">
                {title}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
            {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isNavItemActive(item.href)} 
                  tooltip={item.label}
                  className="text-slate-300 hover:text-white hover:bg-purple-500/20 data-[active=true]:bg-purple-500/30 data-[active=true]:text-white data-[active=true]:border-l-2 data-[active=true]:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                >
                    <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full space-y-6 px-2">
      <div className="space-y-6 flex-1">
        <NavGroup title="Main" items={allNavItems.main} />
        <NavGroup title="Analytics" items={allNavItems.analytics} />
        <NavGroup title="Academics" items={allNavItems.academics} />
        <NavGroup title="Student Life" items={allNavItems.studentLife} />
      </div>

      <div className="mt-auto space-y-4">
        <SidebarSeparator className="bg-purple-500/20" />
        <NavGroup title="Help" items={allNavItems.help} />
      </div>
    </div>
  );
}
