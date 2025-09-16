import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Building, 
  Users, 
  UserPlus, 
  Bed, 
  Calendar,
  FileText,
  Settings,
  ChefHat,
  Receipt
} from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'hostels', label: 'Manage Hostels', icon: Building },
          { id: 'create-hostel', label: 'Create Hostel', icon: Building },
          { id: 'create-user', label: 'Create User', icon: UserPlus },
          { id: 'sessions', label: 'Manage Sessions', icon: Calendar },
        ];
      case 'warden':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'students', label: 'Manage Students', icon: Users },
          { id: 'enroll-student', label: 'Enroll Student', icon: UserPlus },
          { id: 'room-allotment', label: 'Room Allotment', icon: Bed },
        ];
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'profile', label: 'My Profile', icon: Users },
          { id: 'mess-bills', label: 'Mess Bills', icon: Receipt },
        ];
      case 'mess':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'menus', label: 'Manage Menus', icon: ChefHat },
          { id: 'create-menu', label: 'Create Menu', icon: ChefHat },
          { id: 'bills', label: 'Mess Bills', icon: Receipt },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-6">Navigation</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
