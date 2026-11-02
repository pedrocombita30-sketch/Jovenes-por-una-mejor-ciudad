import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute';
import ChatWidget from './components/chatbot/ChatWidget';
import { useAuth } from './context/AuthContext';

import Home from './pages/public/Home';
import About from './pages/public/About';
import Temas from './pages/public/Temas';
import Actividades from './pages/public/Actividades';
import InformacionCorporativa from './pages/public/InformacionCorporativa';
import Cursos from './pages/public/Cursos';
import Aula from './pages/aula/Aula';
import Contact from './pages/public/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Dashboard from './pages/admin/Dashboard';
import UserList from './pages/admin/users/UserList';
import ClientList from './pages/admin/clients/ClientList';
import ClientProfile from './pages/admin/clients/ClientProfile';
import CourseList from './pages/admin/courses/CourseList';
import CourseStructure from './pages/admin/courses/CourseStructure';
import EnrollmentList from './pages/admin/courses/EnrollmentList';
import ResourceList from './pages/admin/resources/ResourceList';
import ConversationList from './pages/admin/chat/ConversationList';
import ContentEditor from './pages/admin/content/ContentEditor';
import CorporateDocuments from './pages/admin/corporate/CorporateDocuments';

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

function MyAccount() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Mi cuenta</h1>
      <div className="card p-6">
        <p className="text-sm text-gray-600"><strong>Nombre:</strong> {user?.firstName} {user?.lastName}</p>
        <p className="mt-2 text-sm text-gray-600"><strong>Correo:</strong> {user?.email}</p>
        <p className="mt-2 text-sm text-gray-600"><strong>Rol:</strong> {user?.role}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/quienes-somos" element={<About />} />
          <Route path="/temas" element={<Temas />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/informacion-corporativa" element={<InformacionCorporativa />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/aula/:id" element={<ProtectedRoute><Aula /></ProtectedRoute>} />
          <Route path="/contacto" element={<Contact />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<AdminRoute><UserList /></AdminRoute>} />
          <Route path="clientes" element={<ClientList />} />
          <Route path="clientes/:id" element={<ClientProfile />} />
          <Route path="cursos" element={<CourseList />} />
          <Route path="cursos/:id/modulos" element={<CourseStructure />} />
          <Route path="inscripciones" element={<EnrollmentList />} />
          <Route path="recursos" element={<ResourceList />} />
          <Route path="conversaciones" element={<ConversationList />} />
          <Route path="contenido" element={<AdminRoute><ContentEditor /></AdminRoute>} />
          <Route path="informacion-corporativa" element={<CorporateDocuments />} />
        </Route>

        <Route path="/mi-cuenta" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}