import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { UserCog,RefreshCw,FileUser,CirclePause } from 'lucide-react';

const UserApprovals = () => {
  const queryClient = useQueryClient();

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: () => api.get('/admin/users/pending/').then(res => res.data),
  });

  const { data: approved, isLoading: approvedLoading } = useQuery({
    queryKey: ['approvedUsers'],
    queryFn: () => api.get('/admin/users/approved/').then(res => res.data),
  });

  const approveUser = useMutation({
    mutationFn: (userId) => api.post(`/admin/users/${userId}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingUsers']);
      queryClient.invalidateQueries(['approvedUsers']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const pauseUser = useMutation({
    mutationFn: (userId) => api.post(`/admin/users/${userId}/pause/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['approvedUsers']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const unpauseUser = useMutation({
    mutationFn: (userId) => api.post(`/admin/users/${userId}/unpause/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['approvedUsers']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const removeUser = useMutation({
    mutationFn: (userId) => api.delete(`/admin/users/${userId}/remove/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingUsers']);
      queryClient.invalidateQueries(['approvedUsers']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  if (pendingLoading || approvedLoading) return <div className="text-gray-400">Loading...</div>;

  // Separate paused users from approved (paused users are approved but paused)
  const pausedUsers = approved?.filter(u => u.paused) || [];
  const activeUsers = approved?.filter(u => !u.paused) || [];

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><UserCog className="w-6 h-6" />  User Approvals</h2>

      {/* Pending Approval */}
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300 mb-6">
        <h3 className="text-2xl font-bold mb-2 text-white flex items-center gap-2"><RefreshCw className="w-6 h-6" />  Pending Approval</h3>
        {pending && pending.length > 0 ? (
          <div className="space-y-2">
            {pending.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-dark-300 p-3 rounded">
                <div>
                  <span className="text-white">{user.email}</span>
                  <span className="text-gray-400 text-sm ml-4">
                    Joined: {new Date(user.created_at).toLocaleDateString()}       
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveUser.mutate(user.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm transition"
                    disabled={approveUser.isPending}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => removeUser.mutate(user.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm transition"
                    disabled={removeUser.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No pending approvals.</p>
        )}
      </div>

      {/* Active Users (Approved & Not Paused) */}
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-green-400 flex items-center gap-2"><FileUser className="w-6 h-6" />  Active Users</h3> 
        {activeUsers && activeUsers.length > 0 ? (
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-dark-300 p-3 rounded">
                <div>
                  <span className="text-white">{user.email}</span>
                  <span className="text-gray-400 text-sm ml-4">
                    {user.is_admin ? '👑 Admin' : '👤 User'}
                  </span>
                  <span className="text-gray-400 text-sm ml-4">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => pauseUser.mutate(user.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1 rounded text-sm transition"
                    disabled={pauseUser.isPending}
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => removeUser.mutate(user.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm transition"
                    disabled={removeUser.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No active users.</p>
        )}
      </div>

      {/* Paused Users */}
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
        <h3 className="text-lg font-semibold mb-3 text-gray-400 flex items-center gap-2"><CirclePause  className="w-6 h-6" /> Paused Users</h3>
        {pausedUsers && pausedUsers.length > 0 ? (
          <div className="space-y-2">
            {pausedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-dark-300 p-3 rounded">
                <div>
                  <span className="text-white">{user.email}</span>
                  <span className="text-gray-400 text-sm ml-4">
                    {user.is_admin ? '👑 Admin' : '👤 User'}
                  </span>
                  <span className="text-gray-400 text-sm ml-4">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => unpauseUser.mutate(user.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition"
                    disabled={unpauseUser.isPending}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => removeUser.mutate(user.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm transition"
                    disabled={removeUser.isPending}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No paused users.</p>
        )}
      </div>
    </div>
  );
};

export default UserApprovals;

