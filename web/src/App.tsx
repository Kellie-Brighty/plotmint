import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import StoriesPage from "./pages/StoriesPage";
import StoryDetailPage from "./pages/StoryDetailPage";
import ChapterReaderPage from "./pages/ChapterReaderPage";
import NotFoundPage from "./pages/NotFoundPage";
import ScrollToTop from "./components/ScrollToTop";
import ReaderDashboardPage from "./pages/ReaderDashboardPage";
import CreatorDashboardPage from "./pages/CreatorDashboardPage";
import CreateStoryPage from "./pages/CreateStoryPage";
import ChapterEditorPage from "./pages/ChapterEditorPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoveryPage from "./pages/DiscoveryPage";
import { AuthProvider } from "./utils/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="stories" element={<StoriesPage />} />
            <Route path="stories/:storyId" element={<StoryDetailPage />} />
            <Route
              path="stories/:storyId/chapters/:chapterId"
              element={
                <PrivateRoute>
                  <ChapterReaderPage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <PrivateRoute>
                  <ReaderDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="creator"
              element={
                <PrivateRoute>
                  <CreatorDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="creator/new-story"
              element={
                <PrivateRoute>
                  <CreateStoryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="creator/new-chapter"
              element={
                <PrivateRoute>
                  <ChapterEditorPage />
                </PrivateRoute>
              }
            />
            <Route
              path="profile/:userId"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route path="discover" element={<DiscoveryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
