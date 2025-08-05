import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/protected-route';
import { AdminLayout } from './components/layout/AdminLayout';
import { MerchantLayout } from './components/layout/MerchantLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import RecentChangesPage from './pages/admin/RecentChangesPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import CategoriesPage from './pages/admin/CategoriesPage';
import FloorPlansPage from './pages/admin/FloorPlansPage';
import KiosksPage from './pages/admin/KiosksPage';
import MerchantsPage from './pages/admin/MerchantsPage';
import PlacesPage from './pages/admin/PlacesPage';
import AdsPage from './pages/admin/AdsPage';
import StoreInformationPage from './pages/merchant/StoreInformationPage';
import MerchantProfilePage from './pages/merchant/MerchantProfilePage';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="recent-changes" element={<RecentChangesPage />} />
            <Route path="places" element={<PlacesPage />} />
            <Route path="merchants" element={<MerchantsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="floor-plans" element={<FloorPlansPage />} />
            <Route path="kiosks" element={<KiosksPage />} />
            <Route path="ads" element={<AdsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['merchant']} />}>
          <Route path="/merchant" element={<MerchantLayout />}>
            <Route index element={<Navigate to="store-information" replace />} />
            <Route path="store-information" element={<StoreInformationPage />} />
            <Route path="profile" element={<MerchantProfilePage />} />
          </Route>
        </Route>

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
