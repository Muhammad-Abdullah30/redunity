import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Droplet, Settings, Save, CheckCircle2, AlertCircle, Heart, Shield, Lock, Bell, Camera, Key, Building } from 'lucide-react';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { useAuth } from '../hooks/useFirebase';
import { useUser } from '../contexts/UserContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db } from '../firebase-config';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { validateName, validatePhoneNumber, validateCity, validatePassword } from '../utils/validators';
import { MyBloodRequests } from './MyBloodRequests';
import { SocietyRegistrationModal } from './SocietyRegistrationModal';

export const UserProfileSettingsView: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { refreshProfile } = useUser();

  const [activeTab, setActiveTab] = useState<'profile' | 'requests'>('profile');
  const [societyModalOpen, setSocietyModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bloodGroup: '',
    city: '',
    country: 'Pakistan',
    willingToDonate: true,
    photoURL: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        bloodGroup: userProfile.bloodGroup || '',
        city: userProfile.city || '',
        country: (userProfile as any).country || 'Pakistan',
        willingToDonate: userProfile.willingToDonate !== undefined ? userProfile.willingToDonate : true,
        photoURL: userProfile.photoURL || ''
      }));
    }
  }, [userProfile]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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

    if (formData.newPassword) {
      const passVal = validatePassword(formData.newPassword);
      if (!passVal.valid) {
        setError(passVal.error || 'Invalid password');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Update Firebase Auth Password if provided
      if (formData.newPassword && user) {
        await updatePassword(user, formData.newPassword);
      }

      // 2. Update Firestore Profile
      const computedRole = formData.willingToDonate ? 'donor' : (userProfile?.role === 'admin' ? 'admin' : 'recipient');

      const updatePayload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        country: formData.country || 'Pakistan',
        willingToDonate: formData.willingToDonate,
        role: computedRole,
        photoURL: formData.photoURL || '',
        updatedAt: new Date()
      };

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
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      setSuccess('Profile & Settings updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      if (err?.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before updating your password.');
      } else {
        setError(err?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar with Camera Overlay */}
            <div className="relative group">
              {formData.photoURL ? (
                <img
                  src={formData.photoURL}
                  alt={formData.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg shadow-red-600/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 font-black text-2xl border-2 border-white/20">
                  {formData.bloodGroup || <User className="w-10 h-10" />}
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {userProfile?.name || 'User Profile'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  formData.willingToDonate 
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300' 
                    : 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                }`}>
                  {userProfile?.role === 'admin' ? 'Admin' : (formData.willingToDonate ? 'Donor' : 'Recipient')}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 font-mono">
                RedUnity ID: <span className="text-red-400 font-bold">{userProfile?.redunityId || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Willingness status badge in header */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${formData.willingToDonate ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">Donor Availability</p>
              <p className={`text-sm font-extrabold ${formData.willingToDonate ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formData.willingToDonate ? 'Willing to Donate' : 'Not Available'}
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Navigation Tabs */}
        <div className="max-w-3xl mx-auto w-full mt-6 flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-red-600" />
            Profile & Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-4 h-4 text-red-600" />
            My Blood Requests
          </button>
        </div>

        {activeTab === 'requests' ? (
          <div className="max-w-3xl mx-auto w-full mt-6">
            <MyBloodRequests />
          </div>
        ) : (
          /* Form Panel */
          <div className="max-w-3xl mx-auto w-full mt-6">
            <Card className="border-slate-200/80 shadow-sm rounded-3xl">
              <CardHeader className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-600" />
                  Profile & Donor Preferences
                </h2>
              </CardHeader>
              
              <CardContent className="p-6">
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      options={getAllCountries().map(c => ({ value: c, label: c }))}
                    />
                  </div>

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

                  {/* Willingness to Donate Card */}
                  <div className="p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl border border-red-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className={`p-3 rounded-2xl ${formData.willingToDonate ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'bg-slate-200 text-slate-500'}`}>
                          <Heart className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">Willing to Donate Blood</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {formData.willingToDonate
                              ? 'Your profile is publicly listed in donor directory search results.'
                              : 'Your profile is currently hidden from public donor searches.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleWillingness(!formData.willingToDonate)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.willingToDonate ? 'bg-red-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.willingToDonate ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Security & Password Section */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 border-b border-slate-200/60 pb-3">
                      <Lock className="w-4 h-4 text-red-600" />
                      <h4 className="text-sm font-bold">Change Password (Optional)</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="New Password"
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current"
                        icon={<Key className="w-4 h-4 text-slate-400" />}
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter new password"
                        icon={<Key className="w-4 h-4 text-slate-400" />}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    loading={loading}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold px-8 shadow-md shadow-red-600/20 btn-animated"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile Changes
                  </Button>
                </div>
                </form>
              </CardContent>
            </Card>

            {/* Society Registration Card */}
            <div className="mt-6 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl border border-slate-700 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-red-500" />
                    For Organizations
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-md">
                    Register your society or organization to manage your members on RedUnity and track blood donation activities.
                  </p>
                </div>
                <Button 
                  onClick={() => setSocietyModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border-none shrink-0"
                >
                  Register Society
                </Button>
              </div>
            </div>
          </div>
        )}

        <SocietyRegistrationModal 
          isOpen={societyModalOpen} 
          onClose={() => setSocietyModalOpen(false)} 
        />
      </div>
  );
};
