import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplet, MapPin, Phone, User, AlertCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useFirebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { validateName, validatePhoneNumber, validateBloodGroup, validateCity } from '../utils/validators';
import { useInteractionTracker } from '../hooks/useInteractionTracker';
import { useToast } from './ui/ToastNotification';

export const BloodRequestForm: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { trackInteraction } = useInteractionTracker();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    patientName: '',
    contactPhone: '',
    bloodGroup: '',
    city: '',
    country: 'Pakistan',
    hospital: '',
    urgency: 'normal',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    const nameValidation = validateName(formData.patientName);
    if (!nameValidation.valid) return nameValidation.error;

    const phoneValidation = validatePhoneNumber(formData.contactPhone);
    if (!phoneValidation.valid) return phoneValidation.error;

    const bloodGroupValidation = validateBloodGroup(formData.bloodGroup);
    if (!bloodGroupValidation.valid) return bloodGroupValidation.error;

    const cityValidation = validateCity(formData.city);
    if (!cityValidation.valid) return cityValidation.error;

    return null;
  };

  const [notifiedInfo, setNotifiedInfo] = useState({ count: 0, bloodGroup: '', city: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // 1. Query matching donors in area / blood group
      let matchingCount = 0;
      let matchingUids: string[] = [];

      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const matchingDonors = usersSnapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          if (data.willingToDonate === false) return false;
          const bgMatch = !formData.bloodGroup || data.bloodGroup === formData.bloodGroup;
          const cityMatch = !formData.city || (data.city && data.city.toLowerCase() === formData.city.toLowerCase());
          return bgMatch || cityMatch;
        });

        matchingCount = matchingDonors.length;
        matchingUids = matchingDonors.map(d => d.id);
      } catch (err) {
        console.warn('Could not query matching donors for notification payload:', err);
      }

      // 2. Create blood request document
      const requestRef = await addDoc(collection(db, 'bloodRequests'), {
        patientName: formData.patientName.trim(),
        contactPhone: formData.contactPhone,
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        country: formData.country,
        hospital: formData.hospital.trim(),
        urgency: formData.urgency,
        notes: formData.notes.trim(),
        requestedBy: user ? {
          uid: user.uid,
          name: userProfile?.name || formData.patientName.trim(),
          phone: userProfile?.phone || formData.contactPhone,
          redunityId: userProfile?.redunityId || 'USER'
        } : {
          uid: 'guest',
          name: formData.patientName.trim(),
          phone: formData.contactPhone,
          redunityId: 'GUEST'
        },
        isGuestRequest: !user,
        status: 'active',
        notifiedDonorUids: matchingUids,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Create broadcast notification entry for donors
      try {
        await addDoc(collection(db, 'notifications'), {
          requestId: requestRef.id,
          patientName: formData.patientName.trim(),
          contactPhone: formData.contactPhone,
          bloodGroup: formData.bloodGroup,
          city: formData.city,
          country: formData.country,
          hospital: formData.hospital.trim(),
          urgency: formData.urgency,
          recipientCount: matchingCount,
          notifiedUids: matchingUids,
          message: `URGENT ALERT: ${formData.bloodGroup} blood required in ${formData.city} (${formData.patientName})`,
          createdAt: serverTimestamp()
        });
      } catch (nErr) {
        console.warn('Notification log error:', nErr);
      }

      setNotifiedInfo({
        count: matchingCount,
        bloodGroup: formData.bloodGroup,
        city: formData.city
      });
      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          patientName: '',
          contactPhone: '',
          bloodGroup: '',
          city: '',
          country: 'Pakistan',
          hospital: '',
          urgency: 'normal',
          notes: ''
        });
        setSuccess(false);
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit blood request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-slate-200/80 shadow-sm rounded-2xl">
        <CardContent className="text-center py-12 px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-md shadow-emerald-500/10"
          >
            <Send className="w-8 h-8 text-emerald-600 animate-bounce" />
          </motion.div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Emergency Alert Broadcasted!</h3>
          <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed mb-4">
            Your emergency request for <span className="font-bold text-red-600">{notifiedInfo.bloodGroup}</span> blood in <span className="font-bold text-slate-900">{notifiedInfo.city}</span> was posted successfully.
          </p>
          <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl p-3.5 max-w-sm mx-auto flex items-center justify-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Alert dispatched to {notifiedInfo.count > 0 ? `${notifiedInfo.count} matching donor(s)` : 'available area donors'}!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 shadow-sm rounded-2xl">
      <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
            <Droplet className="w-5 h-5 text-red-600 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Post Blood Request</h2>
            <p className="text-slate-500 text-xs mt-0.5">Connect with voluntary blood donors across Pakistan</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Patient Name"
              placeholder="Enter patient name"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              icon={<User className="w-4 h-4 text-slate-400" />}
              disabled={loading}
            />

            <Input
              type="tel"
              label="Contact Phone"
              placeholder="0300-1234567"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              icon={<Phone className="w-4 h-4 text-slate-400" />}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Blood Group Required"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select blood group' },
                ...bloodGroups.map(group => ({ value: group, label: group }))
              ]}
              disabled={loading}
            />

            <Select
              label="Urgency Level"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              options={[
                { value: 'normal', label: 'Normal (within 24 hours)' },
                { value: 'urgent', label: 'Urgent (within 12 hours)' },
                { value: 'critical', label: 'Critical (immediate)' }
              ]}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              options={getAllCountries().map(country => ({ value: country, label: country }))}
              disabled={loading}
            />

            <Select
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select city' },
                ...getCitiesByCountry(formData.country).map(city => ({ value: city, label: city }))
              ]}
              disabled={loading || !formData.country}
            />
          </div>

          <Input
            type="text"
            label="Hospital Name (Optional)"
            placeholder="Enter hospital name"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            icon={<MapPin className="w-4 h-4 text-slate-400" />}
            disabled={loading}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none text-sm text-slate-900 bg-white placeholder:text-slate-400"
              placeholder="Any additional instructions or hospital ward details..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2.5 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            loading={loading} 
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 shadow-md shadow-red-600/20 btn-animated"
          >
            <Send className="mr-2 w-4 h-4" />
            Post Emergency Request
          </Button>

          <p className="text-center text-xs text-slate-500 pt-1 flex items-center justify-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            No registration required — anyone can post an urgent blood request.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};