import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/protected-route';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';
import { MerchantLayout } from './components/layout/MerchantLayout';

// Pages
import LoginPage from './pages/LoginPage';

// Admin Pages
import RecentChangesPage from './pages/admin/RecentChangesPage';
import AdminCredentialsPage from './pages/admin/AdminCredentialsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import FloorPlansPage from './pages/admin/FloorPlansPage';
import KiosksPage from './pages/admin/KiosksPage';
import MerchantsPage from './pages/admin/MerchantsPage';
import PlacesPage from './pages/admin/PlacesPage';
import AdsPage from './pages/admin/AdsPage';

// Merchant Pages
import StoreInformationPage from './pages/merchant/StoreInformationPage';
import MerchantCredentialsPage from './pages/merchant/MerchantCredentialsPage';


function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="recent-changes" replace />} />
            <Route path="recent-changes" element={<RecentChangesPage />} />
            <Route path="places" element={<PlacesPage />} />
            <Route path="merchants" element={<MerchantsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="floor-plans" element={<FloorPlansPage />} />
            <Route path="kiosks" element={<KiosksPage />} />
            <Route path="ads" element={<AdsPage />} />
            <Route path="credentials" element={<AdminCredentialsPage />} />
          </Route>
        </Route>

        {/* Merchant Routes */}
        <Route element={<ProtectedRoute allowedRoles={['merchant']} />}>
          <Route path="/merchant" element={<MerchantLayout />}>
            <Route index element={<Navigate to="store-information" replace />} />
            <Route path="store-information" element={<StoreInformationPage />} />
            <Route path="credentials" element={<MerchantCredentialsPage />} />
          </Route>
        </Route>

        {/* Redirect based on role after login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              user?.role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/merchant" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
