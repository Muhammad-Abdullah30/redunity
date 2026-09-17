import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Droplet, MapPin, Phone, Clock, AlertTriangle, ShieldAlert, Filter, Lock, LogIn } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useFirebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase-config';
import { formatRelativeTime } from '../utils/formatters';
import { useInteractionTracker } from '../hooks/useInteractionTracker';

interface EmergencyAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

export const EmergencyAlertsModal: React.FC<EmergencyAlertsModalProps> = ({ isOpen, onClose, onOpenLogin }) => {
  const { user, userProfile } = useAuth();
  const { trackInteraction } = useInteractionTracker();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all_relevant' | 'blood_group' | 'city'>('all_relevant');

  useEffect(() => {
    if (isOpen && user) {
      fetchRelevantAlerts();
    }
  }, [isOpen, user, userProfile]);

  const fetchRelevantAlerts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'bloodRequests'),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      const userBloodGroup = userProfile?.bloodGroup;
      const userCity = userProfile?.city?.toLowerCase();
      const userUid = user?.uid || userProfile?.redunityId;

      // Filter for relevant active requests targeting logged in user
      const relevant = fetched.filter((r: any) => {
        // Must be active
        if (r.status === 'fulfilled' || r.status === 'cancelled') return false;

        // Exclude own requests
        if (userUid && r.requestedBy?.uid === userUid) return false;

        // Relevance check: Blood group match or City match
        const isBloodGroupMatch = Boolean(userBloodGroup && r.bloodGroup === userBloodGroup);
        const isCityMatch = Boolean(userCity && r.city && r.city.toLowerCase() === userCity);

        return isBloodGroupMatch || isCityMatch;
      });

      setAlerts(relevant);
    } catch (err) {
      console.error('Error fetching relevant emergency alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Immediate Critical
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgent (12h)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
            Standard (24h)
          </span>
        );
    }
  };

  // Filter display by tab
  const displayedAlerts = alerts.filter((alert) => {
    const userBloodGroup = userProfile?.bloodGroup;
    const userCity = userProfile?.city?.toLowerCase();

    if (activeFilter === 'blood_group') {
      return userBloodGroup && alert.bloodGroup === userBloodGroup;
    }
    if (activeFilter === 'city') {
      return userCity && alert.city && alert.city.toLowerCase() === userCity;
    }
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Personalized Emergency Alerts</h2>
              <p className="text-xs text-slate-500">Live requests matching your blood group or city</p>
            </div>
          </div>

          {userProfile && (
            <div className="flex items-center gap-2">
              {userProfile.bloodGroup && (
                <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-sm">
                  {userProfile.bloodGroup}
                </span>
              )}
              {userProfile.city && (
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200">
                  {userProfile.city}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Guest View: Require Login */}
        {!user ? (
          <div className="text-center py-10 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Login Required for Alerts</h3>
              <p className="text-xs text-slate-500">
                Personalized emergency alerts are available for logged-in donors to receive requests matching their specific blood group and location.
              </p>
            </div>
            <Button
              onClick={() => {
                onClose();
                if (onOpenLogin) onOpenLogin();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 shadow-md shadow-red-600/20"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log In to View Alerts
            </Button>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            {alerts.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveFilter('all_relevant')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                    activeFilter === 'all_relevant'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Relevant ({alerts.length})
                </button>
                {userProfile?.bloodGroup && (
                  <button
                    onClick={() => setActiveFilter('blood_group')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                      activeFilter === 'blood_group'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Group: {userProfile.bloodGroup}
                  </button>
                )}
                {userProfile?.city && (
                  <button
                    onClick={() => setActiveFilter('city')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                      activeFilter === 'city'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    City: {userProfile.city}
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : displayedAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Relevant Emergency Alerts</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {userProfile?.bloodGroup || userProfile?.city
                    ? `There are currently no active emergency requests matching your blood group (${userProfile?.bloodGroup || 'N/A'}) or city (${userProfile?.city || 'N/A'}).`
                    : 'Please complete your profile details (blood group & city) to receive matching alerts.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
                {displayedAlerts.map((alert) => {
                  const isBgMatch = userProfile?.bloodGroup && alert.bloodGroup === userProfile.bloodGroup;
                  const isCityMatch = userProfile?.city && alert.city?.toLowerCase() === userProfile.city.toLowerCase();

                  return (
                    <div
                      key={alert.id}
                      className="p-4 rounded-2xl border bg-red-50/50 border-red-200/80 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{alert.patientName}</h4>
                            <div className="flex gap-1">
                              {isBgMatch && (
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {userProfile.bloodGroup} Match
                                </span>
                              )}
                              {isCityMatch && (
                                <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {alert.city} Area
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{[alert.hospital, alert.city, alert.country].filter(Boolean).join(', ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {getUrgencyBadge(alert.urgency)}
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                            {alert.bloodGroup}
                          </div>
                        </div>
                      </div>

                      {alert.notes && (
                        <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                          "{alert.notes}"
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Posted {formatRelativeTime(alert.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${alert.contactPhone}`}
                            onClick={() => trackInteraction({ method: 'call_click', toUser: { id: alert.userId || alert.requestedBy?.id || 'unknown', name: alert.patientName || 'Patient' } })}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            Call ({alert.contactPhone})
                          </a>
                          <a
                            href={`https://wa.me/${alert.contactPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackInteraction({ method: 'whatsapp_click', toUser: { id: alert.userId || alert.requestedBy?.id || 'unknown', name: alert.patientName || 'Patient' } })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Button onClick={onClose} variant="outline" size="sm" className="w-full font-semibold">
            Close Alerts
          </Button>
        </div>
      </div>
    </Modal>
  );
};
