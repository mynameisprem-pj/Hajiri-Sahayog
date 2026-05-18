import { useEffect, useState } from 'react'
import {
  Home,
  BookOpen,
  Calendar,
  Settings,
} from 'lucide-react'

import {
  useAppStore,
  useProfile,
  useIsInitialized,
  useIsLoading,
  useActiveTab,
} from '@/store/useAppStore'

import {
  ToastContainer,
  BottomNav,
  LoadingScreen,
} from '@/components/ui'

import {
  WelcomePage,
  DashboardPage,
  ClassesPage,
  ClassDetailPage,
  StudentProfilePage,
  HolidaysPage,
  SettingsPage,
} from '@/pages'

// ─── Screen Stack ─────────────────────────────────────────────────────────────

type Screen =
  | { name: 'class-detail'; classId: number }
  | { name: 'student-profile'; studentId: number }

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar() {
  const activeTab = useActiveTab()
  const setActiveTab = useAppStore(s => s.setActiveTab)

  const navItems = [
    {
      key: 'dashboard',
      label: 'Home',
      icon: Home,
    },
    {
      key: 'classes',
      label: 'Classes',
      icon: BookOpen,
    },
    {
      key: 'holidays',
      label: 'Holidays',
      icon: Calendar,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <aside
      className="
        hidden lg:flex
        w-72
        border-r
        border-slate-200
        bg-white/80
        backdrop-blur-xl
        flex-col
        p-5
      "
    >
      {/* App Branding */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">
          Hajiri Sahayog
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Smart Attendance Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.key

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as any)}
              className={`
                flex items-center gap-4
                px-4 py-4
                rounded-2xl
                transition-all duration-200
                text-left

                ${
                  isActive
                    ? 'bg-primary shadow-lg'
                    : 'hover:bg-slate-100'
                }
              `}
            >
              <Icon size={22} />

              <span className="font-medium">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Info */}
      <div className="mt-auto pt-6">
        <div
          className="
            rounded-2xl
            bg-slate-100
            p-4
          "
        >
          <p className="text-sm font-medium text-slate-700">
            Offline Ready
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Your attendance data stays safely stored locally.
          </p>
        </div>
      </div>
    </aside>
  )
}

// ─── Shared App Shell ─────────────────────────────────────────────────────────

function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-100
        via-slate-200
        to-slate-300

        lg:p-5
      "
    >
      <div
        className="
          w-full
          min-h-screen
          bg-surface-secondary

          lg:min-h-[calc(100vh-40px)]
          lg:rounded-[32px]
          lg:overflow-hidden
          lg:shadow-2xl
          lg:shadow-slate-400/20
          lg:border
          lg:border-white/40

          flex
        "
      >
        {/* Desktop Sidebar */}
        <DesktopSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const isInitialized = useIsInitialized()
  const isLoading = useIsLoading()
  const profile = useProfile()
  const activeTab = useActiveTab()

  const initialize = useAppStore(s => s.initialize)
  const setActiveTab = useAppStore(s => s.setActiveTab)

  const selectClass = useAppStore(s => s.selectClass)
  const selectStudent = useAppStore(s => s.selectStudent)

  const clearSelectedClass = useAppStore(s => s.clearSelectedClass)
  const clearSelectedStudent = useAppStore(s => s.clearSelectedStudent)

  // Local screen stack
  const [screenStack, setScreenStack] = useState<Screen[]>([])

  useEffect(() => {
    initialize()
  }, [initialize])

  // Reset stack on tab change
  useEffect(() => {
    setScreenStack([])
    clearSelectedClass()
    clearSelectedStudent()
  }, [activeTab])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!isInitialized || isLoading) {
    return <LoadingScreen />
  }

  // ── Welcome ────────────────────────────────────────────────────────────────

  if (!profile) {
    return <WelcomePage />
  }

  // ── Navigation Helpers ─────────────────────────────────────────────────────

  const pushScreen = (screen: Screen) => {
    setScreenStack(prev => [...prev, screen])
  }

  const popScreen = () => {
    setScreenStack(prev => prev.slice(0, -1))
  }

  const handleSelectClass = async (classId: number) => {
    await selectClass(classId)

    pushScreen({
      name: 'class-detail',
      classId,
    })
  }

  const handleSelectStudent = async (
    studentId: number
  ) => {
    await selectStudent(studentId)

    pushScreen({
      name: 'student-profile',
      studentId,
    })
  }

  const handleBackFromClassDetail = () => {
    clearSelectedClass()
    popScreen()
  }

  const handleBackFromStudentProfile = () => {
    clearSelectedStudent()
    popScreen()
  }

  // ── Current Screen ─────────────────────────────────────────────────────────

  const currentScreen =
    screenStack[screenStack.length - 1]

  // ── Student Profile ────────────────────────────────────────────────────────

  if (currentScreen?.name === 'student-profile') {
    return (
      <>
        <AppShell>
          <div className="flex-1 overflow-auto">
            <StudentProfilePage
              onBack={handleBackFromStudentProfile}
            />
          </div>
        </AppShell>

        <ToastContainer />
      </>
    )
  }

  // ── Class Detail ───────────────────────────────────────────────────────────

  if (currentScreen?.name === 'class-detail') {
    return (
      <>
        <AppShell>
          <div className="flex-1 overflow-auto">
            <ClassDetailPage
              onBack={handleBackFromClassDetail}
              onSelectStudent={handleSelectStudent}
            />
          </div>
        </AppShell>

        <ToastContainer />
      </>
    )
  }

  // ── Root Pages ─────────────────────────────────────────────────────────────

  return (
    <>
      <AppShell>
        <main
          className="
            flex-1
            overflow-auto

            pb-20
            lg:pb-0

            lg:px-6
            xl:px-8
          "
        >
          {activeTab === 'dashboard' && (
            <DashboardPage
              onSelectClass={handleSelectClass}
              onGoToClasses={() =>
                setActiveTab('classes')
              }
              onGoToHolidays={() =>
                setActiveTab('holidays')
              }
            />
          )}

          {activeTab === 'classes' && (
            <ClassesPage
              onSelectClass={handleSelectClass}
            />
          )}

          {activeTab === 'holidays' && (
            <HolidaysPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </AppShell>

      <ToastContainer />
    </>
  )
}