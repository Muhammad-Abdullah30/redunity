import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Users, Search, Phone, MapPin, Droplet, RefreshCw, AlertCircle, CheckCircle2, UserPlus, User, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useAuth } from '../hooks/useFirebase';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { generateRedUnityId } from '../utils/formatters';
import { useInteractionTracker } from '../hooks/useInteractionTracker';
import { useToast } from './ui/ToastNotification';

interface AffiliatedDonor {
  id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  city: string;
  country?: string;
  willingToDonate?: boolean;
  status?: string;
  createdAt?: any;
}

export const SocietyDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { trackInteraction } = useInteractionTracker();
  const { showToast } = useToast();
  const [society, setSociety] = useState<any | null>(null);
  const [donors, setDonors] = useState<AffiliatedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');

  // Add Donor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDonorData, setNewDonorData] = useState({
    name: '',
    phone: '',
    password: '',
    bloodGroup: 'A+',
    country: 'Pakistan',
    city: 'Lahore'
  });
  const [addingDonor, setAddingDonor] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    fetchSocietyData();
  }, [user]);

  const fetchSocietyData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let societyData: any = null;
      let societyDocId: string | null = null;

      // 1. Try fetching society where adminUid === user.uid
      const q = query(collection(db, 'societies'), where('adminUid', '==', user.uid));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const docSnap = querySnap.docs[0];
        societyDocId = docSnap.id;
        societyData = { id: docSnap.id, ...docSnap.data() };
      } else if (userProfile?.societyId) {
        // Fallback: check userProfile.societyId
        const sDoc = await getDoc(doc(db, 'societies', userProfile.societyId));
        if (sDoc.exists()) {
          societyDocId = sDoc.id;
          societyData = { id: sDoc.id, ...sDoc.data() };
        }
      }

      setSociety(societyData);

      if (societyDocId) {
        // Fetch donors affiliated with this societyId
        const donorsQuery = query(collection(db, 'users'), where('societyId', '==', societyDocId));
        const donorsSnap = await getDocs(donorsQuery);
        const donorList = donorsSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as AffiliatedDonor));
        setDonors(donorList);
      }
    } catch (error) {
      console.error('Error fetching society dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDonorData(prev => ({ ...prev, [name]: value }));
    setAddError('');
  };

  const handleAddDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!society) return;

    if (!newDonorData.name.trim() || !newDonorData.phone.trim() || !newDonorData.city.trim()) {
      setAddError('Please fill in all required fields (Name, Phone, City).');
      return;
    }

    setAddingDonor(true);
    setAddError('');

    try {
      const redunityId = generateRedUnityId(newDonorData.name);
      
      // Store donor directly in Firestore users collection linked to society.id
      const newDocRef = await addDoc(collection(db, 'users'), {
        name: newDonorData.name.trim(),
        phone: newDonorData.phone.trim(),
        password: newDonorData.password || '123456',
        bloodGroup: newDonorData.bloodGroup,
        city: newDonorData.city,
        country: newDonorData.country || 'Pakistan',
        redunityId,
        role: 'donor',
        status: 'active',
        willingToDonate: true,
        societyId: society.id,
        createdAt: serverTimestamp()
      });

      await trackInteraction({
        method: 'society_donor_added',
        additionalData: {
          donorId: newDocRef.id,
          donorName: newDonorData.name.trim(),
          societyId: society.id,
          societyName: society.name
        }
      });

      showToast(
        'Society Member Registered!',
        `${newDonorData.name.trim()} (${newDonorData.bloodGroup}) registered under ${society.name}.`,
        'success'
      );

      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setIsAddModalOpen(false);
        setNewDonorData({
          name: '',
          phone: '',
          password: '',
          bloodGroup: 'A+',
          country: 'Pakistan',
          city: 'Lahore'
        });
        fetchSocietyData();
      }, 1500);
    } catch (err: any) {
      console.error('Error registering donor for society:', err);
      setAddError(err.message || 'Failed to register donor. Please try again.');
    } finally {
      setAddingDonor(false);
    }
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = !search || donor.name.toLowerCase().includes(search.toLowerCase()) || donor.phone.includes(search);
    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter;
    return matchesSearch && matchesBloodGroup;
  });

  const availableCount = donors.filter(d => d.willingToDonate !== false).length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!society) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">No Society Found</h3>
        <p className="text-slate-600 text-sm">
          We could not locate an approved society associated with your account. If you just registered a society, please wait for admin approval.
        </p>
        <Button onClick={fetchSocietyData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Society Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {society.logoUrl ? (
              <img src={society.logoUrl} alt={society.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-red-600/30 border-2 border-red-500/40 text-red-400 flex items-center justify-center font-black text-2xl shadow-md">
                <Building className="w-10 h-10" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{society.name}</h2>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 mt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>{society.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-red-400" />
                  <span>{society.contactPhone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Register Society Donor
            </Button>
            <Button onClick={fetchSocietyData} variant="outline" size="sm" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Affiliated Donors</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{donors.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ready & Available</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{availableCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blood Groups Represented</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {new Set(donors.map(d => d.bloodGroup)).size}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliated Donors Section */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Affiliated Donors Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage and contact blood donors registered under {society.name}</p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> + Register New Donor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Input
              type="text"
              placeholder="Search donor by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
            <Select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              options={[
                { value: '', label: 'All Blood Groups' },
                ...bloodGroups.map(group => ({ value: group, label: group }))
              ]}
            />
          </div>

          {/* Table / Cards */}
          {filteredDonors.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-semibold text-slate-700">No affiliated donors found</p>
                <p className="text-xs text-slate-400 mt-0.5">Click below to register new members for {society.name}.</p>
              </div>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Register First Society Donor
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Donor Name</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDonors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{donor.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-md text-xs">
                          {donor.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{donor.city || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{donor.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          donor.willingToDonate !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {donor.willingToDonate !== false ? 'Available' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`tel:${donor.phone}`}
                            onClick={() => trackInteraction({ method: 'call_click', toUser: { id: donor.id, name: donor.name } })}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${donor.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackInteraction({ method: 'whatsapp_click', toUser: { id: donor.id, name: donor.name } })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Affiliated Society Donor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Register Member for ${society.name}`}
        size="lg"
      >
        {addSuccess ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Member Registered Successfully!</h3>
            <p className="text-slate-600 text-sm">
              The new donor has been registered and affiliated with <strong>{society.name}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAddDonorSubmit} className="space-y-4">
            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {addError}
              </div>
            )}

            <Input
              label="Full Name *"
              name="name"
              value={newDonorData.name}
              onChange={handleAddDonorChange}
              placeholder="Donor's full name"
              required
              icon={<User className="w-4 h-4 text-slate-400" />}
              disabled={addingDonor}
            />

            <Input
              label="Phone Number *"
              name="phone"
              value={newDonorData.phone}
              onChange={handleAddDonorChange}
              placeholder="0300-1234567"
              required
              icon={<Phone className="w-4 h-4 text-slate-400" />}
              disabled={addingDonor}
            />

            <Input
              label="Password (Optional)"
              name="password"
              type="password"
              value={newDonorData.password}
              onChange={handleAddDonorChange}
              placeholder="Default: 123456"
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              disabled={addingDonor}
            />

            <Select
              label="Blood Group *"
              name="bloodGroup"
              value={newDonorData.bloodGroup}
              onChange={handleAddDonorChange}
              options={bloodGroups.map(group => ({ value: group, label: group }))}
              disabled={addingDonor}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Country *"
                name="country"
                value={newDonorData.country}
                onChange={handleAddDonorChange}
                options={getAllCountries().map(country => ({ value: country, label: country }))}
                disabled={addingDonor}
              />

              <Select
                label="City *"
                name="city"
                value={newDonorData.city}
                onChange={handleAddDonorChange}
                options={getCitiesByCountry(newDonorData.country).map(city => ({ value: city, label: city }))}
                disabled={addingDonor}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1"
                disabled={addingDonor}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={addingDonor}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Register Member <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
