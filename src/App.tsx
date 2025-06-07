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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="stories/:storyId" element={<StoryDetailPage />} />
          <Route
            path="stories/:storyId/chapters/:chapterId"
            element={<ChapterReaderPage />}
          />
          <Route path="dashboard" element={<ReaderDashboardPage />} />
          <Route path="creator" element={<CreatorDashboardPage />} />
          <Route path="creator/new-story" element={<CreateStoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
