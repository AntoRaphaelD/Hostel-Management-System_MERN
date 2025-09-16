import React, { useState, useEffect } from 'react';
import { wardenAPI } from '../../services/api';
import { Bed, User, CheckCircle, AlertCircle } from 'lucide-react';

const RoomAllotment = () => {
  const [students, setStudents] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStudents();
    fetchAvailableRooms();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await wardenAPI.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await wardenAPI.getAvailableRooms();
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await wardenAPI.allotRoom({
        student_id: parseInt(selectedStudent),
        room_id: parseInt(selectedRoom)
      });
      
      setMessage({ type: 'success', text: 'Room allotted successfully!' });
      setSelectedStudent('');
      setSelectedRoom('');
      fetchAvailableRooms(); // Refresh available rooms
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to allot room' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Room Allotment</h1>
        <p className="text-gray-600 mt-2">Assign rooms to students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Allot Room</h2>
          
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Room *
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a room</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} - {room.tbl_RoomType?.name} (Floor {room.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedStudent || !selectedRoom}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Allotting...' : 'Allot Room'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Rooms</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableRooms.map(room => (
              <div key={room.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      Room {room.room_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {room.tbl_RoomType?.name} • Floor {room.floor}
                    </div>
                    <div className="text-xs text-gray-500">
                      Capacity: {room.tbl_RoomType?.capacity}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
            ))}
          </div>

          {availableRooms.length === 0 && (
            <div className="text-center py-8">
              <Bed className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No available rooms</h3>
              <p className="mt-1 text-sm text-gray-500">
                All rooms are currently occupied.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomAllotment;
