import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SwipePage from './pages/SwipePage';
import LikedPage from './pages/LikedPage';
import HistoryPage from './pages/HistoryPage';
import TopicDetailPage from './pages/TopicDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<SwipePage />} />
            <Route path="/liked" element={<LikedPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/topic/:id" element={<TopicDetailPage />} />
          </Routes>
        </div>
        <Navbar />
      </div>
    </BrowserRouter>
  );
}
