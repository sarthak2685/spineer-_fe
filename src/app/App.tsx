import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { homeFor, useAuth } from './auth';
import { AboutPage, CustomerRegisterPage, ErrorPage, ForgotPage, HomePage, LoginPage, RegisterPage, ResetPage } from '../features/public/pages';
import { LegalPage } from '../features/public/legal';
import { legalNav } from '../features/public/legal-nav';
import { GuestPlaceShell } from '../features/public/guest-places';
import { BusinessDetailsPage, ClaimsPage, CustomerDashboard, ExplorePage, HistoryPage, MyOrdersPage, NotificationsPage, PrizesPage, ProfilePage, RewardsPage, WalletPage } from '../features/customer/pages';
import { BusinessClaimsPage, BusinessDashboard, BusinessProfilePage, BusinessReviewsPage, CustomersPage, GameAdminPage, MenuStudio, OrderDetailPage, OrdersPage, PlaysPage, PosterPage, PushPage, QrPage, RedemptionsPage, RewardsAdminPage } from '../features/business/pages';
import { SuperBusinesses, SuperDashboard, SuperDemos, SuperHowVideo, SuperTypes } from '../features/super-admin/pages';
import { PlatformShell, StoreShell, WalletShell } from '../components/layout/Shells';
import { SiteInstall } from '../components/install-app';
import { ScrollToTop } from '../components/scroll-top';
import { PushPrompt } from '../features/customer/push-prompt';

function Guard({ role }: { role: string }) {
  const auth = useAuth();
  if (!auth.ready) return null;
  if (!auth.user) return <Navigate to="/login" replace />;
  if (auth.user.role.toLowerCase() !== role.toLowerCase()) return <Navigate to={homeFor(auth.user.role)} replace />;
  return <Outlet />;
}

export function App() {
  return (
    <>
    <ScrollToTop />
    <SiteInstall />
    <PushPrompt />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<Navigate to="/#demo" replace />} />
      {legalNav.map((link) => <Route key={link.to} path={link.to} element={<LegalPage slug={link.to.slice(1)} />} />)}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPage />} />
      <Route path="/reset-password" element={<ResetPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/customer-register" element={<CustomerRegisterPage />} />
      <Route element={<GuestPlaceShell />}>
        <Route path="/play/:token" element={<span className="sr-only">Play</span>} />
        <Route path="/menu/:token" element={<span className="sr-only">Menu</span>} />
        <Route path="/bill/:token" element={<span className="sr-only">Bill</span>} />
        <Route path="/review/:token" element={<span className="sr-only">Review</span>} />
      </Route>
      <Route path="/error" element={<ErrorPage />} />

      <Route element={<Guard role="Customer" />}>
        <Route element={<WalletShell />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/explore" element={<ExplorePage />} />
          <Route path="/customer/business/:id" element={<BusinessDetailsPage />} />
          <Route path="/customer/wallet" element={<WalletPage />} />
          <Route path="/customer/history" element={<HistoryPage />} />
          <Route path="/customer/rewards" element={<RewardsPage />} />
          <Route path="/customer/offers" element={<RewardsPage offers />} />
          <Route path="/customer/my-prizes" element={<PrizesPage />} />
          <Route path="/customer/my-orders" element={<MyOrdersPage />} />
          <Route path="/customer/purchase-claims" element={<ClaimsPage />} />
          <Route path="/customer/notifications" element={<NotificationsPage />} />
          <Route path="/customer/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<Guard role="BusinessAdmin" />}>
        <Route element={<StoreShell />}>
          <Route path="/business/dashboard" element={<BusinessDashboard />} />
          <Route path="/business/customers" element={<CustomersPage />} />
          <Route path="/business/plays" element={<PlaysPage />} />
          <Route path="/business/rewards" element={<RewardsAdminPage />} />
          <Route path="/business/redemptions" element={<RedemptionsPage />} />
          <Route path="/business/purchase-claims" element={<BusinessClaimsPage />} />
          <Route path="/business/qr" element={<QrPage />} />
          <Route path="/business/poster" element={<PosterPage />} />
          <Route path="/business/profile" element={<BusinessProfilePage />} />
          <Route path="/business/menu" element={<MenuStudio />} />
          <Route path="/business/menu/categories" element={<Navigate to="/business/menu" replace />} />
          <Route path="/business/menu/items" element={<Navigate to="/business/menu" replace />} />
          <Route path="/business/menu/orders" element={<OrdersPage />} />
          <Route path="/business/menu/orders/:id" element={<OrderDetailPage />} />
          <Route path="/business/push" element={<PushPage />} />
          <Route path="/business/reviews" element={<BusinessReviewsPage />} />
          <Route path="/business/games/:code" element={<GameAdminPage />} />
        </Route>
      </Route>

      <Route element={<Guard role="SuperAdmin" />}>
        <Route element={<PlatformShell />}>
          <Route path="/super/dashboard" element={<SuperDashboard />} />
          <Route path="/super/businesses" element={<SuperBusinesses />} />
          <Route path="/super/demos" element={<SuperDemos />} />
          <Route path="/super/business-types" element={<SuperTypes />} />
          <Route path="/super/how-video" element={<SuperHowVideo />} />
        </Route>
      </Route>

      <Route path="*" element={<ErrorPage />} />
    </Routes>
    </>
  );
}
