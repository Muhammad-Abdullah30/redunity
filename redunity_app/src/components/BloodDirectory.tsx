import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Phone, MapPin, Droplet, Clock, Building } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';
import { LoadingSpinner } from './LoadingSpinner';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../utils/locationData';
import { formatRelativeTime } from '../utils/formatters';
import { useInteractionTracker } from '../hooks/useInteractionTracker';

interface Donor {
  id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  city: string;
  country?: string;
  societyId?: string;
  lastDonation?: any;
  status: string;
}

interface BloodDirectoryProps {
  compact?: boolean;
  onViewAll?: () => void;
}

export const BloodDirectory: React.FC<BloodDirectoryProps> = ({ compact = false, onViewAll }) => {
  const { trackInteraction } = useInteractionTracker();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [societiesMap, setSocietiesMap] = useState<Record<string, { name: string; logoUrl?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    bloodGroup: '',
    city: '',
    country: 'Pakistan',
    search: ''
  });

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const snap = await getDocs(collection(db, 'societies'));
      const map: Record<string, { name: string; logoUrl?: string }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[d.id] = { name: data.name, logoUrl: data.logoUrl };
      });
      setSocietiesMap(map);
    } catch (err) {
      console.error('Error fetching societies for directory:', err);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [filters.bloodGroup, filters.city, filters.country]);

  const fetchDonors = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const baseQuery = collection(db, 'users');
      const constraints = [];

      if (filters.bloodGroup) {
        constraints.push(where('bloodGroup', '==', filters.bloodGroup));
      }

      if (filters.city) {
        constraints.push(where('city', '==', filters.city));
      }

      let donorsQuery;
      if (constraints.length > 0) {
        donorsQuery = query(baseQuery, ...constraints);
      } else {
        donorsQuery = query(baseQuery, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(donorsQuery);
      let donorsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Donor));

      // Client-side sort by createdAt or fallback
      donorsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      // Apply search, willingness & country filter client-side
      const filteredDonors = donorsData.filter(donor => {
        const isWilling = (donor as any).willingToDonate !== false;
        if (!isWilling) return false;

        // Country filter: donors without a country field are assumed to be Pakistan
        if (filters.country) {
          const donorCountry = (donor as any).country || 'Pakistan';
          if (donorCountry.toLowerCase() !== filters.country.toLowerCase()) return false;
        }

        if (!filters.search) return true;
        return (
          donor.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          donor.phone.includes(filters.search)
        );
      });

      setDonors(filteredDonors);
    } catch (error: any) {
      console.error('Error fetching donors:', error);
      if (error?.code === 'unavailable') {
        setFetchError('Cloud Firestore backend could not be reached. Operating in offline cache mode.');
      } else {
        setFetchError(error?.message || 'Failed to load donors list.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      bloodGroup: '',
      city: '',
      country: 'Pakistan',
      search: ''
    });
  };

  const formatPhoneForDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{4})(\d{7})/, '$1-$2');
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white p-8 rounded-3xl shadow-lg shadow-red-700/15">
        <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Find Voluntary Blood Donors</h2>
        <p className="text-red-100 font-medium">Search verified life-savers across Pakistan filtered by blood group and city</p>
      </div>

      <Card className="border-slate-200/80 shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-900 text-lg">Filter Donors</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Search</label>
              <Input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Blood Group</label>
              <Select
                size="sm"
                value={filters.bloodGroup}
                onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
                options={[
                  { value: '', label: 'All Blood Groups' },
                  ...bloodGroups.map(group => ({ value: group, label: group }))
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Country</label>
              <Select
                size="sm"
                value={filters.country}
                onChange={(e) => {
                  handleFilterChange('country', e.target.value);
                  handleFilterChange('city', ''); // reset city when country changes
                }}
                options={getAllCountries().map(country => ({ value: country, label: country }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">City</label>
              <Select
                size="sm"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                options={[
                  { value: '', label: 'All Cities' },
                  ...getCitiesByCountry(filters.country).map(city => ({ value: city, label: city }))
                ]}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={fetchDonors} size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              Apply Filters
            </Button>
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              size="sm"
              className="border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-medium">
          <span>⚠️ {fetchError}</span>
          <Button onClick={fetchDonors} size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
            Retry Connection
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : donors.length === 0 ? (
        <Card className="border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="text-center py-14">
            <Droplet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Donors Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Try selecting a different city or blood group filter to find available donors.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}>
          {(compact ? donors.slice(0, 4) : donors).map((donor, index) => (
            <motion.div
              key={donor.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="border-slate-200/80 hover:border-red-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white h-full">
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between gap-3.5 h-full">
                  {/* Top Section */}
                  <div className="space-y-3">
                    {/* Header Row: Name & Location + Blood Group Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-base leading-snug truncate" title={donor.name}>
                          {donor.name}
                        </h4>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {[donor.city, donor.country].filter(Boolean).join(', ') || donor.city || 'Location unavailable'}
                          </span>
                        </div>
                        {donor.societyId && societiesMap[donor.societyId] && (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-lg mt-1.5 max-w-full">
                            {societiesMap[donor.societyId].logoUrl ? (
                              <img src={societiesMap[donor.societyId].logoUrl} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
                            ) : (
                              <Building className="w-3 h-3 text-rose-600 shrink-0" />
                            )}
                            <span className="truncate">{societiesMap[donor.societyId].name}</span>
                          </div>
                        )}
                      </div>

                      {/* Blood Group Badge */}
                      <div className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 text-white font-black text-sm shadow-sm shadow-red-600/20 flex items-center justify-center min-w-[46px] text-center select-none">
                        {donor.bloodGroup}
                      </div>
                    </div>

                    {/* Meta Row: Status Badge & Last Donation */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        Available Donor
                      </span>

                      {donor.lastDonation && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatRelativeTime(donor.lastDonation)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${donor.phone}`}
                      onClick={() => trackInteraction({ method: 'call_click', toUser: { id: donor.id, name: donor.name } })}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm py-2.5 px-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 min-w-0 whitespace-nowrap"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${donor.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackInteraction({ method: 'whatsapp_click', toUser: { id: donor.id, name: donor.name } })}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm py-2.5 px-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 min-w-0 whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.525-5.167-1.433l-.371-.218-3.763.896.948-3.671-.242-.383A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
        <div className="text-center sm:text-left text-sm font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{compact ? Math.min(donors.length, 4) : donors.length}</span> of <span className="font-bold text-slate-800">{donors.length}</span> donor{donors.length !== 1 ? 's' : ''}
        </div>
        {compact && onViewAll && (
          <Button
            onClick={onViewAll}
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold shadow-sm"
          >
            View All Donors →
          </Button>
        )}
      </div>
    </div>
  );
};