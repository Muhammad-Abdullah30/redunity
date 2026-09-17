import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Droplet, Calendar, MapPin, Clock, Settings, Bell, Activity, Phone, AlertCircle, Building } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useFirebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';
import { formatRelativeTime } from '../utils/formatters';
import { MyBloodRequests } from './MyBloodRequests';
import { useInteractionTracker } from '../hooks/useInteractionTracker';
import { useToast } from './ui/ToastNotification';

export const DonorDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { trackInteraction } = useInteractionTracker();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [matchingAlerts, setMatchingAlerts] = useState<any[]>([]);
  const [society, setSociety] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    requestsResponded: 0,
    livesSaved: 0
  });

  useEffect(() => {
    if (userProfile) {
      fetchDonorData();
    }
  }, [userProfile]);

  const fetchDonorData = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      // Fetch affiliated society if societyId exists
      if (userProfile.societyId) {
        try {
          const societyDoc = await getDoc(doc(db, 'societies', userProfile.societyId));
          if (societyDoc.exists()) {
            setSociety({ id: societyDoc.id, ...societyDoc.data() });
          }
        } catch (sErr) {
          console.warn('Could not fetch affiliated society:', sErr);
        }
      }

      // Fetch donation history (from interactions)
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('fromUser.uid', '==', userProfile.redunityId || ''),
        orderBy('timestamp', 'desc')
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);
      const interactions = interactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDonationHistory(interactions);

      // Fetch matching urgent alerts
      try {
        const reqSnapshot = await getDocs(query(collection(db, 'bloodRequests'), orderBy('createdAt', 'desc')));
        const allReqs = reqSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const matching = allReqs.filter((r: any) => {
          if (r.status === 'fulfilled' || r.status === 'cancelled') return false;
          const bgMatch = r.bloodGroup === userProfile.bloodGroup;
          const cityMatch = userProfile.city && r.city && r.city.toLowerCase() === userProfile.city.toLowerCase();
          return bgMatch || cityMatch;
        });
        setMatchingAlerts(matching);
      } catch (err) {
        console.warn('Could not fetch matching requests:', err);
      }

      // Calculate stats
      setStats({
        totalDonations: interactions.length,
        requestsResponded: interactions.filter((i: any) => i.method === 'blood_donation').length,
        livesSaved: interactions.length * 3
      });
    } catch (error) {
      console.error('Error fetching donor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (status: string) => {
    if (!userProfile) return;
    
    try {
      await updateDoc(doc(db, 'users', userProfile.redunityId), {
        availability: status,
        lastAvailabilityUpdate: new Date()
      });

      await trackInteraction({
        method: 'availability_updated',
        additionalData: { status }
      });

      showToast(
        'Availability Updated!',
        `Your donor availability status is now set to "${status.toUpperCase()}".`,
        status === 'available' ? 'success' : 'warning'
      );

      setAvailabilityStatus(status);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-slate-200/80 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center shadow-md text-white font-bold">
              {society?.logoUrl ? (
                <img src={society.logoUrl} alt={society.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {userProfile?.name}</h2>
              </div>
              <p className="text-gray-600 font-medium">Donor Dashboard</p>
              {society && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mt-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>Affiliated with <strong>{society.name}</strong></span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              availabilityStatus === 'available' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {availabilityStatus === 'available' ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Droplet className="w-8 h-8 text-brand-red" />
                <span className="text-3xl font-bold text-gray-900">{stats.totalDonations}</span>
              </div>
              <p className="text-gray-600">Total Donations</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-brand-red" />
                <span className="text-3xl font-bold text-gray-900">{stats.requestsResponded}</span>
              </div>
              <p className="text-gray-600">Requests Responded</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 text-brand-red" />
                <span className="text-3xl font-bold text-gray-900">{stats.livesSaved}</span>
              </div>
              <p className="text-gray-600">Lives Saved</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Emergency Alerts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-red-200/80 bg-gradient-to-br from-white to-red-50/30">
          <CardHeader className="border-b border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                  <Bell className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Matching Emergency Alerts</h3>
                  <p className="text-xs text-slate-500">Urgent requests matching blood group {userProfile?.bloodGroup} or {userProfile?.city}</p>
                </div>
              </div>
              <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {matchingAlerts.length} Active
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {matchingAlerts.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Urgent Requests Matching Your Group</p>
                <p className="text-xs text-slate-500 mt-0.5">We will notify you immediately when a patient near you needs {userProfile?.bloodGroup || 'blood'}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchingAlerts.map((req) => (
                  <div key={req.id} className="p-4 bg-white rounded-xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.patientName}</span>
                        <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-md">
                          {req.bloodGroup}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{[req.hospital, req.city, req.country].filter(Boolean).join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <a
                        href={`tel:${req.contactPhone}`}
                        onClick={() => trackInteraction({ method: 'call_click', toUser: { id: req.userId || req.requestedBy?.id || 'unknown', name: req.patientName || 'Patient' } })}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${req.contactPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackInteraction({ method: 'whatsapp_click', toUser: { id: req.userId || req.requestedBy?.id || 'unknown', name: req.patientName || 'Patient' } })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Availability Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-red" />
              <h3 className="font-semibold text-gray-900">Availability Status</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => updateAvailability('available')}
                variant={availabilityStatus === 'available' ? 'primary' : 'outline'}
                className="flex-1"
              >
                Available
              </Button>
              <Button
                onClick={() => updateAvailability('unavailable')}
                variant={availabilityStatus === 'unavailable' ? 'primary' : 'outline'}
                className="flex-1"
              >
                Unavailable
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Update your availability to let blood requestors know when you're ready to donate.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Donation History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-red" />
              <h3 className="font-semibold text-gray-900">Donation History</h3>
            </div>
          </CardHeader>
          <CardContent>
            {donationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No donation history yet. Start donating to save lives!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donationHistory.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {donation.toUser?.name || 'Blood Request'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {donation.toUser?.bloodGroup} • {donation.toUser?.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(donation.timestamp?.toDate())}
                      </p>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mt-1">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* My Blood Requests (Recipient Management) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <MyBloodRequests />
      </motion.div>
    </div>
  );
};