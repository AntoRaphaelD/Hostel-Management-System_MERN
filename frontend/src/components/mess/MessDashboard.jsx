import React from 'react';
import { ChefHat, Receipt, Calendar, Users } from 'lucide-react';

const MessDashboard = () => {
  const stats = [
    {
      title: 'Today\'s Menu',
      value: '3',
      subtitle: 'Meals Planned',
      icon: ChefHat,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Bills',
      value: '45',
      subtitle: 'Pending Payments',
      icon: Receipt,
      color: 'bg-green-500'
    },
    {
      title: 'This Month',
      value: '₹25,000',
      subtitle: 'Collections',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Students',
      value: '120',
      subtitle: 'Enrolled',
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mess Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage mess operations and billing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="font-medium text-blue-900">Create Today's Menu</div>
              <div className="text-sm text-blue-700">Plan meals for today</div>
            </button>
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="font-medium text-green-900">Generate Bills</div>
              <div className="text-sm text-green-700">Create monthly mess bills</div>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="font-medium text-purple-900">View Collections</div>
              <div className="text-sm text-purple-700">Check payment status</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Breakfast</div>
                <div className="text-sm text-gray-600">Menu planned</div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ready
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Lunch</div>
                <div className="text-sm text-gray-600">Menu planned</div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ready
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Dinner</div>
                <div className="text-sm text-gray-600">Menu pending</div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessDashboard;
