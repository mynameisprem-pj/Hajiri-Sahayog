import { useEffect, useState } from 'react'
import { useAppStore, useProfile, useIsInitialized, useIsLoading, useActiveTab } from '@/store/useAppStore'
import { ToastContainer, BottomNav, LoadingScreen } from '@/components/ui'
import {
  WelcomePage, DashboardPage, ClassesPage,
  ClassDetailPage, StudentProfilePage,
  HolidaysPage, SettingsPage,
} from '@/pages'

// ─── Screen Stack ─────────────────────────────────────────────────────────────

type Screen =
  | { name: 'class-detail'; classId: number }
  | { name: 'student-profile'; studentId: number }

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

  // Local screen stack — detail pages only
  const [screenStack, setScreenStack] = useState<Screen[]>([])

  useEffect(() => {
    initialize()
  }, [initialize])

  // Clear stack when tab changes
  useEffect(() => {
    setScreenStack([])
    clearSelectedClass()
    clearSelectedStudent()
  }, [activeTab])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!isInitialized || isLoading) {
    return <LoadingScreen />
  }

  // ── Welcome / Onboarding ───────────────────────────────────────────────────
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
    pushScreen({ name: 'class-detail', classId })
  }

  const handleSelectStudent = async (studentId: number) => {
    await selectStudent(studentId)
    pushScreen({ name: 'student-profile', studentId })
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

  const currentScreen = screenStack[screenStack.length - 1]

  if (currentScreen?.name === 'student-profile') {
    return (
      <>
        <div className="max-w-lg mx-auto min-h-screen">
          <StudentProfilePage onBack={handleBackFromStudentProfile} />
        </div>
        <ToastContainer />
      </>
    )
  }

  if (currentScreen?.name === 'class-detail') {
    return (
      <>
        <div className="max-w-lg mx-auto min-h-screen">
          <ClassDetailPage
            onBack={handleBackFromClassDetail}
            onSelectStudent={handleSelectStudent}
          />
        </div>
        <ToastContainer />
      </>
    )
  }

  // ── Tab Root Pages ─────────────────────────────────────────────────────────

  return (
    <>
      <main className="max-w-lg mx-auto min-h-screen">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onSelectClass={handleSelectClass}
            onGoToClasses={() => setActiveTab('classes')}
            onGoToHolidays={() => setActiveTab('holidays')}
          />
        )}
        {activeTab === 'classes' && (
          <ClassesPage onSelectClass={handleSelectClass} />
        )}
        {activeTab === 'holidays' && (
          <HolidaysPage />
        )}
        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      <BottomNav />
      <ToastContainer />
    </>
  )
}