import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Lock, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { useFirebase } from '../../hooks/useFirebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { validateName, validatePhoneNumber, validateBloodGroup, validateCity, validatePassword } from '../../utils/validators';

import { generateRedUnityId } from '../../utils/formatters';
import { bloodGroups, getCitiesByCountry, getAllCountries } from '../../utils/locationData';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin
}) => {
  const { register } = useFirebase();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodGroup: '',
    city: '',
    country: 'Pakistan',
    societyId: ''
  });
  const [societies, setSocieties] = useState<any[]>([]);
  const [redunityId, setRedunityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate RedUnity ID when name changes
  React.useEffect(() => {
    if (formData.name.length >= 3) {
      setRedunityId(generateRedUnityId(formData.name));
    } else {
      setRedunityId('');
    }
  }, [formData.name]);

  React.useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const q = query(collection(db, 'societies'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const fetchedSocieties = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setSocieties(fetchedSocieties);
      } catch (error) {
        console.error('Error fetching societies:', error);
      }
    };
    if (isOpen) {
      fetchSocieties();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) return nameValidation.error;

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.valid) return phoneValidation.error;

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) return passwordValidation.error;

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    const bloodGroupValidation = validateBloodGroup(formData.bloodGroup);
    if (!bloodGroupValidation.valid) return bloodGroupValidation.error;

    const cityValidation = validateCity(formData.city);
    if (!cityValidation.valid) return cityValidation.error;

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!redunityId) {
      setError('Please enter a valid name to generate your RedUnity ID');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        phone: formData.phone,
        password: formData.password,
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        redunityId,
        societyId: formData.societyId
      });
      setSuccess(true);

      
      // Reset form after successful registration
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          password: '',
          confirmPassword: '',
          bloodGroup: '',
          city: '',
          country: 'Pakistan',
          societyId: ''
        });
        setRedunityId('');

        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      password: '',
      confirmPassword: '',
      bloodGroup: '',
      city: '',
      country: 'Pakistan',
      societyId: ''
    });
    setRedunityId('');

    setError('');
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Registration Successful!" size="md">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
          >
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Welcome to RedUnity!</h3>
            <p className="text-slate-600 mt-2">Your RedUnity ID: <span className="font-mono font-bold text-red-600 text-lg">{redunityId}</span></p>
            <p className="text-xs text-slate-500 mt-1">Save this ID or your Phone Number to sign in to your account</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register as Blood Donor" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          icon={<User className="w-4 h-4 text-slate-400" />}
          disabled={loading}
        />

        {redunityId && (
          <div className="bg-red-50 border border-red-200/80 rounded-xl p-3">
            <p className="text-xs font-medium text-slate-500">Your RedUnity ID:</p>
            <p className="font-mono font-extrabold text-red-600 text-lg">{redunityId}</p>
          </div>
        )}

        <Input
          type="tel"
          label="Phone Number"
          placeholder="0300-1234567"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          icon={<Phone className="w-4 h-4 text-slate-400" />}
          disabled={loading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            name="password"
            value={formData.password}
            onChange={handleChange}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            disabled={loading}
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            disabled={loading}
          />
        </div>

        <Select
          label="Blood Group"
          name="bloodGroup"
          value={formData.bloodGroup}
          onChange={handleChange}
          options={bloodGroups.map(group => ({ value: group, label: group }))}
          disabled={loading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            options={getCitiesByCountry(formData.country).map(city => ({ value: city, label: city }))}
            disabled={loading}
          />
        </div>

        {societies.length > 0 && (
          <Select
            label="Affiliated Society (Optional)"
            name="societyId"
            value={formData.societyId}
            onChange={handleChange}
            options={[
              { value: '', label: 'None / Independent Donor' },
              ...societies.map(s => ({ value: s.id, label: s.name }))
            ]}
            disabled={loading}
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Register <ArrowRight className="ml-2 w-4 h-4" />
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-sm text-brand-red hover:text-red-700 font-medium transition-colors"
          >
            Already have an account? Login
          </button>
        </div>
      </form>
    </Modal>
  );
};