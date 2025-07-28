// ./kiosk/src/App.tsx
import { useState } from 'react';
import HomePage from "./pages/HomePage";
import ProvisioningPage from "./pages/ProvisioningPage";
import { Toaster } from './components/ui/sonner';

const KIOSK_ID_STORAGE_KEY = 'binhinav-kiosk-id';

function App() {
  const [kioskId, setKioskId] = useState<string | null>(() => {
    return localStorage.getItem(KIOSK_ID_STORAGE_KEY);
  });

  const handleProvisionSuccess = (id: string) => {
    localStorage.setItem(KIOSK_ID_STORAGE_KEY, id);
    setKioskId(id);
  };

  if (!kioskId) {
    // If we don't have an ID, show the setup screen
    return (
      <>
        <ProvisioningPage onSuccess={handleProvisionSuccess} />
        <Toaster />
      </>
    );
  }

  // If we have an ID, load the main application
  return <HomePage kioskId={kioskId} />;
}

export default App;
