import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { SearchPage } from './pages/SearchPage';
import { RelationshipsPage } from './pages/RelationshipsPage';
import { RelationshipRequestsPage } from './pages/RelationshipRequestsPage';
import { FamilyTreePage } from './pages/FamilyTreePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { DummyProfilesPage } from './pages/DummyProfilesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { HowRelatedPage } from './pages/HowRelatedPage';
import { FamilyTimelinePage } from './pages/FamilyTimelinePage';
import { FamilyEventsPage } from './pages/FamilyEventsPage';
import { EventDetailPage } from './pages/EventDetailPage';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/feed" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="dashboard" element={<Navigate to="/feed" replace />} />

          {/* Phase 3 — Family Timeline */}
          <Route path="timeline" element={<FamilyTimelinePage />} />

          {/* Phase 3 — Family Events */}
          <Route path="events" element={<FamilyEventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />


          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="users/:id" element={<UserProfilePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="relationships" element={<RelationshipsPage />} />
          <Route path="relationships/requests" element={<RelationshipRequestsPage />} />
          <Route path="family-tree" element={<FamilyTreePage />} />
          <Route path="dummy-profiles" element={<DummyProfilesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="how-related/:userId" element={<HowRelatedPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
