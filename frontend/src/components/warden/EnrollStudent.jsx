import React, { useState, useEffect } from 'react';
import { wardenAPI, adminAPI } from '../../services/api';
import { User, Lock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const EnrollStudent = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    session_id: ''
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      // Note: You'll need to add this endpoint to admin API
      // const response = await adminAPI.getSessions();
      // setSessions(response.data);
      
      // Mock data for now
      setSessions([
        { id: 1, name: '2023-2024', start_date: '2023-06-01', end_date: '2024-05-31' }
      ]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await wardenAPI.enrollStudent({
        ...formData,
        session_id: parseInt(formData.session_id)
      });
      
      setMessage({ type: 'success', text: 'Student enrolled successfully!' });
      setFormData({
        username: '',
        password: '',
        session_id: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to enroll student' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enroll Student</h1>
        <p className="text-gray-600 mt-2">Add a new student to the hostel</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} className="mr-2" />
            ) : (
              <AlertCircle size={20} className="mr-2" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter student username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                name="session_id"
                value={formData.session_id}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </button>
            
            <button
              type="button"
              onClick={() => setFormData({
                username: '',
                password: '',
                session_id: ''
              })}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollStudent;
