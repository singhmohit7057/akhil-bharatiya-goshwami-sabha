import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, Users, Award, Heart, Briefcase,
  CalendarRange, Gift, IndianRupee, Images, Megaphone, FileText, Mail,
  ChevronDown, Menu,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

interface SubItem {
  to: string
  label: string
  dot?: boolean
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  exact?: boolean
  children?: SubItem[]
}

interface NavSection {
  title: string
  titleColor?: string
  iconColor?: string
  hoverBg?: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: '',
    iconColor: 'text-primary',
    hoverBg: 'hover:bg-primary/5',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    title: 'ADMINISTRATION',
    titleColor: 'text-violet-600',
    iconColor: 'text-violet-500',
    hoverBg: 'hover:bg-violet-50',
    items: [
      {
        to: '/admin/sub-admins', icon: ShieldCheck, label: 'Sub-Admins',
        children: [
          { to: '/admin/sub-admins/add', label: 'Add Sub-Admin' },
          { to: '/admin/sub-admins', label: 'All Sub-Admins' },
        ],
      },
    ],
  },
  {
    title: 'MEMBERS',
    titleColor: 'text-blue-600',
    iconColor: 'text-blue-500',
    hoverBg: 'hover:bg-blue-50',
    items: [
      {
        to: '/admin/members', icon: Users, label: 'Manage Members',
        children: [
          { to: '/admin/members/add', label: 'Add Member' },
          { to: '/admin/members', label: 'All Members' },
          { to: '/admin/members/pending', label: 'Pending Approvals' },
        ],
      },
      {
        to: '/admin/designations', icon: Award, label: 'Designations',
        children: [
          { to: '/admin/designations', label: 'All Designations' },
        ],
      },
    ],
  },
  {
    title: 'PAYMENTS',
    titleColor: 'text-emerald-600',
    iconColor: 'text-emerald-500',
    hoverBg: 'hover:bg-emerald-50',
    items: [
      {
        to: '/admin/payments', icon: IndianRupee, label: 'Payments',
        children: [
          { to: '/admin/payments/add', label: 'Add Payment' },
          { to: '/admin/payments', label: 'Payment History' },
          { to: '/admin/expenses/add', label: 'Add Expense' },
          { to: '/admin/expenses', label: 'Expense History' },
        ],
      },
    ],
  },
  {
    title: 'COMMUNITY',
    titleColor: 'text-orange-600',
    iconColor: 'text-orange-500',
    hoverBg: 'hover:bg-orange-50',
    items: [
      {
        to: '/admin/matrimonial', icon: Heart, label: 'Matrimonials',
        children: [
          { to: '/admin/matrimonial/add', label: 'Add' },
          { to: '/admin/matrimonial', label: 'All Matrimonials', dot: true },
        ],
      },
      {
        to: '/admin/business', icon: Briefcase, label: 'Business',
        children: [
          { to: '/admin/business/add', label: 'Add' },
          { to: '/admin/business', label: 'All Businesses', dot: true },
        ],
      },
      {
        to: '/admin/yearly-planner', icon: CalendarRange, label: 'Yearly Planner',
        children: [
          { to: '/admin/yearly-planner/add', label: 'Add Event' },
          { to: '/admin/yearly-planner', label: 'All Events', dot: true },
        ],
      },
    ],
  },
  {
    title: 'MEDIA & PROMOTIONS',
    titleColor: 'text-rose-600',
    iconColor: 'text-rose-500',
    hoverBg: 'hover:bg-rose-50',
    items: [
      { to: '/admin/gallery', icon: Images, label: 'Gallery' },
      { to: '/admin/souvenir', icon: Gift, label: 'Souvenir' },
      { to: '/admin/promo-popups', icon: Megaphone, label: 'Promo Popups' },
      { to: '/admin/forms', icon: FileText, label: 'Form Submissions' },
      { to: '/admin/subscribers', icon: Mail, label: 'Subscribers' },
    ],
  },
]

export function AdminLayout() {
  const location = useLocation()
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filteredSections = superAdmin
    ? sections
    : sections.map((s) => ({
        ...s,
        items: s.items.filter((item) => item.to !== '/admin/sub-admins'),
      })).filter((s) => s.items.length > 0)

  function isActive(path: string, exact?: boolean) {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  function isChildActive(item: NavItem) {
    if (item.children) {
      return item.children.some((c) => location.pathname === c.to)
    }
    return isActive(item.to, item.exact)
  }

  function toggleExpand(key: string) {
    setExpanded(expanded === key ? null : key)
  }

  function isExpanded(item: NavItem) {
    return expanded === item.to || isChildActive(item)
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* Header */}
      <Link to="/" className="flex items-center gap-3 px-5 py-5 border-b border-border hover:bg-gray-50 transition-colors">
        <img src="/logo.png" alt="ABGSPB" className="w-10 h-10 rounded-full object-cover shrink-0" />
        <div>
          <p className="text-sm font-bold leading-tight text-text-primary">ABGSPB</p>
          <p className="text-[11px] text-text-secondary flex items-center gap-1.5">
            Admin Panel
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${superAdmin ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {superAdmin ? 'Super Admin' : 'Admin'}
            </span>
          </p>
        </div>
      </Link>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {filteredSections.map((section) => (
          <div key={section.title || 'main'}>
            {section.title && (
              <p className={cn('px-2 mb-2 text-[10px] font-bold tracking-widest uppercase', section.titleColor || 'text-text-secondary/60')}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0
                const open = hasChildren && isExpanded(item)
                const active = isChildActive(item)

                return (
                  <div key={item.to}>
                    {hasChildren ? (
                      <button
                        onClick={() => toggleExpand(item.to)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : cn('text-gray-700', section.hoverBg || 'hover:bg-gray-50'),
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <item.icon className={cn('w-[18px] h-[18px]', active ? 'text-primary' : (section.iconColor || 'text-gray-500'))} />
                          {item.label}
                        </span>
                        <ChevronDown className={cn('w-3.5 h-3.5 opacity-50 transition-transform', open && 'rotate-180')} />
                      </button>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : cn('text-gray-700', section.hoverBg || 'hover:bg-gray-50'),
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <item.icon className={cn('w-[18px] h-[18px]', active ? 'text-primary' : (section.iconColor || 'text-gray-500'))} />
                          {item.label}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-30" />
                      </Link>
                    )}

                    {/* Sub-items */}
                    {hasChildren && open && (
                      <div className="mt-0.5 ml-5 pl-4 border-l border-border space-y-0.5">
                        {item.children!.map((child) => (
                          <Link
                            key={child.to + child.label}
                            to={child.to}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors',
                              location.pathname === child.to
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-secondary hover:text-text-primary hover:bg-gray-50',
                            )}
                          >
                            {child.dot && (
                              <span className={cn(
                                'w-1.5 h-1.5 rounded-full shrink-0',
                                location.pathname === child.to ? 'bg-primary' : 'bg-gray-300',
                              )} />
                            )}
                            {!child.dot && <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />}
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

    </div>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px]">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px]">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          <p className="text-sm font-bold text-text-primary">Admin Panel</p>
        </div>

        <main className="p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
