import React, { useState, useEffect } from 'react';
import { Database, Search, Download, RefreshCw, Users, Activity, AlertCircle, Building, Check, X, Pencil, Trash2, Shield, User } from 'lucide-react';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useAuth } from '../hooks/useFirebase';
import { formatRelativeTime, parseDate } from '../utils/formatters';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { useToast } from './ui/ToastNotification';

type TabType = 'users' | 'requests' | 'interactions' | 'societies';

interface DataExplorerProps {
  initialTab?: TabType;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ initialTab = 'users' }) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchData(activeTab);
  }, []);

  const fetchData = async (tab: TabType) => {
    setLoading(true);
    try {
      let queryRef;
      switch (tab) {
        case 'users':
          queryRef = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
          break;
        case 'requests':
          queryRef = query(collection(db, 'bloodRequests'), orderBy('createdAt', 'desc'), limit(50));
          break;
        case 'interactions':
          queryRef = query(collection(db, 'interactions'), orderBy('timestamp', 'desc'), limit(50));
          break;
        case 'societies':
          queryRef = query(collection(db, 'societies'), orderBy('createdAt', 'desc'), limit(50));
          break;
        default:
          queryRef = query(collection(db, 'users'), limit(50));
      }
      const querySnapshot = await getDocs(queryRef);
      setData(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch('');
    fetchData(tab);
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    if (!confirm(`Are you sure you want to ${currentRole === 'admin' ? 'revoke' : 'grant'} admin privileges?`)) return;
    try {
      const newRole = currentRole === 'admin' ? 'donor' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showToast('Role Updated', `User role changed to ${newRole}.`, 'success');
      fetchData(activeTab);
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setData(prev => prev.filter(u => u.id !== userId));
      showToast('User Deleted', `User "${userName}" was permanently removed.`, 'warning');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name?.trim(),
        phone: editingUser.phone?.trim(),
        bloodGroup: editingUser.bloodGroup,
        city: editingUser.city,
        role: editingUser.role,
        status: editingUser.status || 'active'
      });

      setData(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      showToast('User Updated', `Updated details for ${editingUser.name}.`, 'success');
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error saving user edits:', error);
      alert('Failed to save changes: ' + (error?.message || 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bloodRequests', requestId), { status: newStatus });
      // Update local data so the UI reflects immediately
      setData(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const updateSocietyStatus = async (societyId: string, newStatus: 'pending' | 'approved' | 'rejected', adminUid?: string) => {
    try {
      await updateDoc(doc(db, 'societies', societyId), { status: newStatus });
      
      // If approved, update creator's role to 'society_admin' and set societyId
      if (newStatus === 'approved' && adminUid) {
        try {
          await updateDoc(doc(db, 'users', adminUid), { role: 'society_admin', societyId });
        } catch (uErr) {
          console.warn('Could not update user role to society_admin:', uErr);
        }
      } else if (newStatus === 'rejected' && adminUid) {
        try {
          await updateDoc(doc(db, 'users', adminUid), { role: 'donor' });
        } catch (uErr) {
          console.warn('Could not reset user role to donor:', uErr);
        }
      }

      // Update local data immediately
      setData(prev => prev.map(s => s.id === societyId ? { ...s, status: newStatus } : s));
    } catch (error: any) {
      console.error('Error updating society status:', error);
      alert('Failed to update society status: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleExport = () => {
    if (!data.length) return;
    const csvContent = 'data:text/csv;charset=utf-8,'
      + Object.keys(data[0]).join(',') + '\n'
      + data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(item).some(v => String(v).toLowerCase().includes(s));
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h3>
        <p className="text-gray-600">You need admin privileges to view this section.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'users' as TabType, label: 'Manage Users', icon: Users },
    { id: 'societies' as TabType, label: 'Societies', icon: Building },
    { id: 'requests' as TabType, label: 'Blood Requests', icon: Activity },
    { id: 'interactions' as TabType, label: 'Activity Log', icon: Database },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-gray-200 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors rounded-t-xl ${
              activeTab === tab.id
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/60'
                : 'text-gray-500 hover:text-gray-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <Button onClick={() => fetchData(activeTab)} variant="outline" size="md">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={handleExport} variant="outline" size="md">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No records found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          {activeTab === 'users' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">City</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Blood Group</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100 hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-gray-900">{user.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{user.city || '—'}</td>
                    <td className="py-3 px-4">
                      {user.bloodGroup ? (
                        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs">{user.bloodGroup}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'donor' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setEditingUser(user)}
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-auto text-slate-700 hover:bg-slate-100 border-slate-200"
                          title="Edit User Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => toggleAdmin(user.id, user.role)}
                          variant={user.role === 'admin' ? 'outline' : 'primary'}
                          size="sm"
                          className="px-2.5 py-1 h-auto text-xs"
                        >
                          {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        </Button>
                        <Button
                          onClick={() => deleteUser(user.id, user.name || 'User')}
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 h-auto text-red-600 border-red-200 hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'requests' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Blood Group</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">City</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Posted</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={row.id || i} className="border-t border-gray-100 hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-gray-900">{row.patientName || '—'}</td>
                    <td className="py-3 px-4">
                      {row.bloodGroup ? (
                        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs">{row.bloodGroup}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{row.city || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{row.contactPhone || '—'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={row.status || 'active'}
                        onChange={(e) => updateRequestStatus(row.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 ${
                          row.status === 'active'    ? 'bg-green-50  text-green-700  border-green-200' :
                          row.status === 'fulfilled' ? 'bg-blue-50   text-blue-700   border-blue-200' :
                          row.status === 'cancelled' ? 'bg-red-50    text-red-600    border-red-200' :
                                                       'bg-gray-50   text-gray-600   border-gray-200'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {parseDate(row.createdAt)
                        ? formatRelativeTime(parseDate(row.createdAt))
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'interactions' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">From User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">To User</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((interaction) => (
                  <tr key={interaction.id} className="border-t border-gray-100 hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {interaction.timestamp ? formatRelativeTime(interaction.timestamp.toDate()) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        interaction.method === 'whatsapp_click' ? 'bg-emerald-100 text-emerald-700' :
                        interaction.method === 'call_click' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {interaction.method === 'whatsapp_click' ? '💬' : interaction.method === 'call_click' ? '📞' : '•'}
                        {' '}{interaction.method?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{interaction.fromUser?.name || 'Guest'}</td>
                    <td className="py-3 px-4 text-gray-600">{interaction.toUser?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'societies' && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Society Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((society) => (
                  <tr key={society.id} className="border-t border-gray-100 hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                      {society.logoUrl ? (
                        <img src={society.logoUrl} alt={society.name} className="w-6 h-6 rounded-md object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                          {society.name?.charAt(0)}
                        </div>
                      )}
                      {society.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{society.location || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{society.contactPhone || '—'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={society.status || 'pending'}
                        onChange={(e) => updateSocietyStatus(society.id, e.target.value as any, society.adminUid)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 ${
                          society.status === 'approved' ? 'bg-green-50  text-green-700  border-green-200' :
                          society.status === 'rejected' ? 'bg-red-50    text-red-600    border-red-200' :
                                                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {society.status !== 'approved' && (
                          <Button
                            onClick={() => updateSocietyStatus(society.id, 'approved', society.adminUid)}
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 h-auto text-white text-xs"
                            title="Approve Society"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                        )}
                        {society.status !== 'rejected' && (
                          <Button
                            onClick={() => updateSocietyStatus(society.id, 'rejected', society.adminUid)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 px-2.5 py-1 h-auto text-xs"
                            title="Reject Society"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">Showing {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}</p>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name || 'User'}`}
          size="md"
        >
          <form onSubmit={handleSaveUserEdit} className="space-y-4">
            <Input
              label="Full Name"
              value={editingUser.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={editingUser.phone || ''}
              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
              required
            />
            <Select
              label="Blood Group"
              value={editingUser.bloodGroup || 'A+'}
              onChange={(e) => setEditingUser({ ...editingUser, bloodGroup: e.target.value })}
              options={bloodGroups.map(bg => ({ value: bg, label: bg }))}
            />
            <Select
              label="City"
              value={editingUser.city || 'Lahore'}
              onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
              options={getCitiesByCountry(editingUser.country || 'Pakistan').map(c => ({ value: c, label: c }))}
            />
            <Select
              label="User Role"
              value={editingUser.role || 'donor'}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              options={[
                { value: 'donor', label: 'Donor' },
                { value: 'requestor', label: 'Requestor' },
                { value: 'society_admin', label: 'Society Admin' },
                { value: 'admin', label: 'Admin' }
              ]}
            />
            <Select
              label="Account Status"
              value={editingUser.status || 'active'}
              onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive / Suspended' }
              ]}
            />
            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={editLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Keep backwards-compatible named export that was previously used as a modal
export const DataExplorerModal = DataExplorer;