import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AppProvider } from "./context/AppContext";
import TopBar from "./components/layout/TopBar";
import LockScreen from "./components/LockScreen";
import Onboarding from "./components/Onboarding";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import DayDetail from "./pages/DayDetail";
import { authenticate } from "./lib/commands";

export type Screen = "calendar" | "analytics" | "settings" | "day-detail";

export interface DaySelection {
  date: Date;
}

const ONBOARDING_KEY = "cashlit_onboarding_completed";

function App() {
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  });
  const [unlocked, setUnlocked] = useState(false);
  const [screen, setScreen] = useState<Screen>("calendar");
  const [selectedDay, setSelectedDay] = useState<DaySelection | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (!onboarded) return;
    authenticate()
      .then((ok) => { if (ok) setUnlocked(true); })
      .catch(() => {});
  }, [onboarded]);

  function handleOnboardingComplete() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOnboarded(true);
  }

  function handleDayClick(date: Date) {
    setSelectedDay({ date });
    setScreen("day-detail");
  }

  function handleBack() {
    if (screen === "day-detail" && selectedDay) {
      setCalendarDate(
        new Date(selectedDay.date.getFullYear(), selectedDay.date.getMonth(), 1),
      );
    }
    setScreen("calendar");
    setSelectedDay(null);
  }

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <AppProvider>
      <div className="app-shell flex h-screen w-screen flex-col overflow-hidden rounded-2xl">
        <TopBar
          screen={screen}
          onNavigate={setScreen}
          onBack={handleBack}
          selectedDay={selectedDay}
        />
        <main className="relative z-[1] flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {screen === "calendar" && (
              <Calendar
                key="calendar"
                onDayClick={handleDayClick}
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
              />
            )}
            {screen === "analytics" && <Analytics key="analytics" />}
            {screen === "settings" && <Settings key="settings" />}
            {screen === "day-detail" && selectedDay && (
              <DayDetail key="day-detail" date={selectedDay.date} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
