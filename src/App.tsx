import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HubPage from './pages/HubPage'
import PublicPage from './pages/PublicPage'
import EditPage from './pages/EditPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/p/:slug" element={<PublicPage />} />
        <Route path="/p/:slug/edit" element={<EditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
