import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './utils/wagmiConfig'
import { AuthProvider } from "./utils/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import LandingPage from "./pages/LandingPage";
import StoriesPage from "./pages/StoriesPage";
import StoryPage from "./pages/StoryDetailPage";
import ChapterPage from "./pages/ChapterReaderPage";
import ReaderDashboardPage from "./pages/ReaderDashboardPage";
import CreatorDashboardPage from "./pages/CreatorDashboardPage";
import NewStoryPage from "./pages/CreateStoryPage";
import ChapterEditorPage from "./pages/ChapterEditorPage";
import DiscoverPage from "./pages/DiscoveryPage";
import MarketplacePage from "./pages/MarketplacePage";
import PlotVoting from "./components/PlotVoting";

// Create a client for React Query
const queryClient = new QueryClient()

// Wrapper component for PlotVoting to extract URL params
function PlotVotingPage() {
  const { storyId, chapterId } = useParams<{
    storyId: string;
    chapterId: string;
  }>();

  return (
    <PlotVoting
      storyId={storyId}
      chapterId={chapterId}
      creatorId=""
      plotOptions={[]}
    />
  );
}

function App() {
  useEffect(() => {
    // Force dark theme always - remove any light theme classes
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-parchment-50 dark:bg-dark-950">
              <Routes>
                {/* Landing page without layout (standalone) */}
                <Route path="/" element={<LandingPage />} />

                {/* All other pages with navbar and footer */}
                <Route element={<Layout />}>
                  {/* Protected story routes - require authentication */}
                  <Route
                    path="/stories"
                    element={
                      <ProtectedRoute>
                        <StoriesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stories/:storyId"
                    element={
                      <ProtectedRoute>
                        <StoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stories/:storyId/chapters/:chapterId"
                    element={
                      <ProtectedRoute>
                        <ChapterPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stories/:storyId/chapters/:chapterId/vote"
                    element={
                      <ProtectedRoute>
                        <PlotVotingPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboard and creator routes - require authentication */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <ReaderDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/creator"
                    element={
                      <ProtectedRoute>
                        <CreatorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/creator/new-story"
                    element={
                      <ProtectedRoute>
                        <NewStoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/creator/new-chapter"
                    element={
                      <ProtectedRoute>
                        <ChapterEditorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/creator/edit-chapter/:chapterId"
                    element={
                      <ProtectedRoute>
                        <ChapterEditorPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Public routes */}
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
