import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import CreateHostel from './components/admin/CreateHostel';
import CreateUser from './components/admin/CreateUser';
import ManageHostels from './components/admin/ManageHostels';

// Warden Components
import WardenDashboard from './components/warden/WardenDashboard';
import EnrollStudent from './components/warden/EnrollStudent';
import ManageStudents from './components/warden/ManageStudents';
import RoomAllotment from './components/warden/RoomAllotment';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import ViewBills from './components/student/viewBills';

// Mess Components
import MessDashboard from './components/mess/MessDashboard';
import CreateMenu from './components/mess/CreateMenu';
import ManageBills from './components/mess/ManageBills';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderComponent = () => {
    switch (user?.role) {
      case 'admin':
        switch (currentView) {
          case 'dashboard':
            return <AdminDashboard />;
          case 'hostels':
            return <ManageHostels />;
          case 'create-hostel':
            return <CreateHostel />;
          case 'create-user':
            return <CreateUser />;
          default:
            return <AdminDashboard />;
        }
      
      case 'warden':
        switch (currentView) {
          case 'dashboard':
            return <WardenDashboard />;
          case 'students':
            return <ManageStudents />;
          case 'enroll-student':
            return <EnrollStudent />;
          case 'room-allotment':
            return <RoomAllotment />;
          default:
            return <WardenDashboard />;
        }
      
      case 'student':
        switch (currentView) {
          case 'dashboard':
            return <StudentDashboard />;
          case 'mess-bills':
            return <ViewBills />;
          default:
            return <StudentDashboard />;
        }
      
      case 'mess':
        switch (currentView) {
          case 'dashboard':
            return <MessDashboard />;
          case 'create-menu':
            return <CreateMenu />;
          case 'bills':
            return <ManageBills />;
          default:
            return <MessDashboard />;
        }
      
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderComponent()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
