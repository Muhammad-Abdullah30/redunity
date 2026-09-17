import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplet, MapPin, Phone, User, Clock, CheckCircle2, XCircle, Edit3, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Modal } from './ui/Modal';
import { useAuth } from '../hooks/useFirebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { formatRelativeTime } from '../utils/formatters';
import { validateName, validatePhoneNumber, validateBloodGroup, validateCity } from '../utils/validators';

export const MyBloodRequests: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'fulfilled' | 'cancelled'>('all');
  
  // Edit Modal State
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    patientName: '',
    contactPhone: '',
    bloodGroup: '',
    city: '',
    country: 'Pakistan',
    hospital: '',
    urgency: 'normal',
    notes: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (user || userProfile) {
      fetchMyRequests();
    }
  }, [user, userProfile]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const baseRef = collection(db, 'bloodRequests');
      const uidsToSearch = [
        user?.uid,
        userProfile?.redunityId,
        userProfile?.id
      ].filter(Boolean);

      const q = query(baseRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const allRequests = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Filter requests created by this user (by UID or phone number)
      const userReqs = allRequests.filter((r: any) => {
        const reqUid = r.requestedBy?.uid;
        const reqPhone = r.requestedBy?.phone || r.contactPhone;
        const userPhone = userProfile?.phone || '';
        
        if (uidsToSearch.includes(reqUid)) return true;
        if (userPhone && reqPhone && userPhone === reqPhone) return true;
        return false;
      });

      setMyRequests(userReqs);
    } catch (err) {
      console.error('Error fetching user blood requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bloodRequests', requestId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setMyRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Error updating request status:', err);
    }
  };

  const openEditModal = (request: any) => {
    setEditingRequest(request);
    setEditFormData({
      patientName: request.patientName || '',
      contactPhone: request.contactPhone || '',
      bloodGroup: request.bloodGroup || '',
      city: request.city || '',
      country: request.country || 'Pakistan',
      hospital: request.hospital || '',
      urgency: request.urgency || 'normal',
      notes: request.notes || ''
    });
    setEditError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setEditError('');

    const nameVal = validateName(editFormData.patientName);
    if (!nameVal.valid) {
      setEditError(nameVal.error || 'Invalid patient name');
      return;
    }

    const phoneVal = validatePhoneNumber(editFormData.contactPhone);
    if (!phoneVal.valid) {
      setEditError(phoneVal.error || 'Invalid phone number');
      return;
    }

    const bloodVal = validateBloodGroup(editFormData.bloodGroup);
    if (!bloodVal.valid) {
      setEditError(bloodVal.error || 'Invalid blood group');
      return;
    }

    const cityVal = validateCity(editFormData.city);
    if (!cityVal.valid) {
      setEditError(cityVal.error || 'Invalid city');
      return;
    }

    setSaveLoading(true);
    try {
      await updateDoc(doc(db, 'bloodRequests', editingRequest.id), {
        patientName: editFormData.patientName.trim(),
        contactPhone: editFormData.contactPhone,
        bloodGroup: editFormData.bloodGroup,
        city: editFormData.city,
        country: editFormData.country,
        hospital: editFormData.hospital.trim(),
        urgency: editFormData.urgency,
        notes: editFormData.notes.trim(),
        updatedAt: serverTimestamp()
      });

      setMyRequests(prev =>
        prev.map(r =>
          r.id === editingRequest.id
            ? { ...r, ...editFormData }
            : r
        )
      );

      setEditingRequest(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update request');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredRequests = myRequests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const activeCount = myRequests.filter(r => r.status === 'active').length;
  const fulfilledCount = myRequests.filter(r => r.status === 'fulfilled').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Requests</p>
            <p className="text-xl font-extrabold text-slate-900">{myRequests.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium font-semibold">Active Requests</p>
            <p className="text-xl font-extrabold text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Fulfilled / Received</p>
            <p className="text-xl font-extrabold text-slate-900">{fulfilledCount}</p>
          </div>
        </div>
      </div>

      {/* Main Request History Card */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Droplet className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-slate-900">My Blood Requests History</h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
              {(['all', 'active', 'fulfilled', 'cancelled'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    filter === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-7 h-7 text-red-600 animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">No Blood Requests Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {filter === 'all'
                  ? 'You have not submitted any emergency blood requests yet.'
                  : `No requests with status "${filter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className="p-4.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  {/* Top Bar: Patient & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{request.patientName}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                            request.status === 'active'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : request.status === 'fulfilled'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {[request.hospital, request.city, request.country].filter(Boolean).join(', ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {request.contactPhone}
                        </span>
                      </div>
                    </div>

                    {/* Blood Group Badge */}
                    <div className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white font-black text-sm shadow-sm">
                      {request.bloodGroup}
                    </div>
                  </div>

                  {request.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{request.notes}"
                    </p>
                  )}

                  {/* Actions & Status Changer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Posted {formatRelativeTime(request.createdAt?.toDate ? request.createdAt.toDate() : request.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <Button
                        onClick={() => openEditModal(request)}
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Edit
                      </Button>

                      {/* Status Dropdown Controls */}
                      {request.status !== 'fulfilled' && (
                        <Button
                          onClick={() => handleStatusChange(request.id, 'fulfilled')}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Mark Received / Fulfilled
                        </Button>
                      )}

                      {request.status === 'active' && (
                        <Button
                          onClick={() => handleStatusChange(request.id, 'cancelled')}
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Cancel
                        </Button>
                      )}

                      {request.status !== 'active' && (
                        <Button
                          onClick={() => handleStatusChange(request.id, 'active')}
                          variant="outline"
                          size="sm"
                          className="border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold text-xs"
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Request Modal */}
      {editingRequest && (
        <Modal
          isOpen={Boolean(editingRequest)}
          onClose={() => setEditingRequest(null)}
          title="Edit Blood Request"
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Patient Name"
                value={editFormData.patientName}
                onChange={e => setEditFormData(prev => ({ ...prev, patientName: e.target.value }))}
                icon={<User className="w-4 h-4 text-slate-400" />}
              />

              <Input
                type="tel"
                label="Contact Phone"
                value={editFormData.contactPhone}
                onChange={e => setEditFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                icon={<Phone className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Blood Group"
                value={editFormData.bloodGroup}
                onChange={e => setEditFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                options={bloodGroups.map(bg => ({ value: bg, label: bg }))}
              />

              <Select
                label="Urgency Level"
                value={editFormData.urgency}
                onChange={e => setEditFormData(prev => ({ ...prev, urgency: e.target.value }))}
                options={[
                  { value: 'normal', label: 'Normal (within 24 hours)' },
                  { value: 'urgent', label: 'Urgent (within 12 hours)' },
                  { value: 'critical', label: 'Critical (immediate)' }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Country"
                value={editFormData.country}
                onChange={e => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                options={getAllCountries().map(c => ({ value: c, label: c }))}
              />

              <Select
                label="City"
                value={editFormData.city}
                onChange={e => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                options={getCitiesByCountry(editFormData.country).map(c => ({ value: c, label: c }))}
              />
            </div>

            <Input
              type="text"
              label="Hospital Name"
              value={editFormData.hospital}
              onChange={e => setEditFormData(prev => ({ ...prev, hospital: e.target.value }))}
              icon={<MapPin className="w-4 h-4 text-slate-400" />}
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={editFormData.notes}
                onChange={e => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
              />
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingRequest(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saveLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
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
