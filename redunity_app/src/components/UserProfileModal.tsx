import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Droplet, Settings, Save, CheckCircle2, AlertCircle, Heart, Shield, Lock, Bell } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useFirebase';
import { useUser } from '../contexts/UserContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { validateName, validatePhoneNumber, validateCity } from '../utils/validators';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, userProfile } = useAuth();
  const { refreshProfile } = useUser();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bloodGroup: '',
    city: '',
    country: 'Pakistan',
    willingToDonate: true
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bloodGroup: userProfile.bloodGroup || '',
        city: userProfile.city || '',
        country: 'Pakistan',
        willingToDonate: userProfile.willingToDonate !== undefined ? userProfile.willingToDonate : true
      });
    }
  }, [userProfile, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
    setSuccess('');
  };

  const handleToggleWillingness = (value: boolean) => {
    setFormData(prev => ({ ...prev, willingToDonate: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    const nameVal = validateName(formData.name);
    if (!nameVal.valid) {
      setError(nameVal.error || 'Invalid name');
      return;
    }

    const phoneVal = validatePhoneNumber(formData.phone);
    if (!phoneVal.valid) {
      setError(phoneVal.error || 'Invalid phone number');
      return;
    }

    if (!formData.bloodGroup) {
      setError('Please select your blood group');
      return;
    }

    if (!formData.city) {
      setError('Please select your city');
      return;
    }

    setLoading(true);

    try {
      const updatePayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        willingToDonate: formData.willingToDonate,
        updatedAt: new Date()
      };

      // Update in `users/{uid}` and `users/{redunityId}`
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), updatePayload).catch(async () => {
          await setDoc(doc(db, 'users', user.uid), updatePayload, { merge: true });
        });
      }

      if (userProfile?.redunityId) {
        await updateDoc(doc(db, 'users', userProfile.redunityId), updatePayload).catch(async () => {
          await setDoc(doc(db, 'users', userProfile.redunityId), updatePayload, { merge: true });
        });
      }

      await refreshProfile();
      setSuccess('Profile & Settings updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 font-bold text-xl">
              {formData.bloodGroup || <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{formData.name || 'User Profile'}</h2>
              <p className="text-xs text-slate-500 font-mono">
                RedUnity ID: <span className="font-bold text-red-600">{userProfile?.redunityId || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 'profile' ? (
            <div className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                icon={<User className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 03001234567"
                required
                icon={<Phone className="w-4 h-4 text-slate-400" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                  options={[
                    { value: '', label: 'Select Blood Group' },
                    ...bloodGroups.map(bg => ({ value: bg, label: bg }))
                  ]}
                />

                <Select
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  options={[
                    { value: '', label: 'Select City' },
                    ...getCitiesByCountry(formData.country).map(c => ({ value: c, label: c }))
                  ]}
                />
              </div>

              {/* Willingness to Donate toggle card */}
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${formData.willingToDonate ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                      <Heart className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Willing to Donate Blood</h4>
                      <p className="text-xs text-slate-500">
                        {formData.willingToDonate
                          ? 'You are currently listed as an active available donor in search results.'
                          : 'You are unlisted from public donor availability searches.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleWillingness(!formData.willingToDonate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.willingToDonate ? 'bg-red-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.willingToDonate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
                  <Shield className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Account Privacy & Preferences</h4>
                    <p className="text-xs text-slate-500">Manage your visibility across RedUnity</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Public Donor Listing</p>
                    <p className="text-xs text-slate-500">Allow emergency blood requestors to contact you directly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleWillingness(!formData.willingToDonate)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      formData.willingToDonate
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {formData.willingToDonate ? 'Listed' : 'Hidden'}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-200/60">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Role Status</p>
                    <p className="text-xs text-slate-500">Your account type registered in the system.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-lg">
                    {userProfile?.role || 'Donor'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Security Credentials</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Your phone number/RedUnity ID is linked securely with Firebase Auth. Contact support or use recovery to change credentials.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
