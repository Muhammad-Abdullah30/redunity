import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useFirebase } from '../../hooks/useFirebase';
import { validateName, validatePhoneNumber, validateRedUnityId } from '../../utils/validators';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin
}) => {
  const { requestRecovery, recoverAccount } = useFirebase();
  const [mode, setMode] = useState<'request' | 'recover'>('request');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    redunityId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recoveredData, setRecoveredData] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid name');
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Invalid phone number');
      return;
    }

    setLoading(true);
    try {
      await requestRecovery(formData.name.trim(), formData.phone);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', phone: '', redunityId: '' });
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit recovery request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const idValidation = validateRedUnityId(formData.redunityId);
    if (!idValidation.valid) {
      setError(idValidation.error || 'Invalid RedUnity ID');
      return;
    }

    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Invalid phone number');
      return;
    }

    setLoading(true);
    try {
      const userData = await recoverAccount(formData.redunityId.trim(), formData.phone);
      setRecoveredData(userData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setRecoveredData(null);
        setFormData({ name: '', phone: '', redunityId: '' });
        onClose();
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Account recovery failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', phone: '', redunityId: '' });
    setError('');
    setSuccess(false);
    setRecoveredData(null);
    onClose();
  };

  if (success && mode === 'request') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Request Submitted!" size="md">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recovery Request Sent</h3>
            <p className="text-gray-600 mt-2">Our support team will contact you shortly at your provided phone number.</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (success && mode === 'recover' && recoveredData) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Account Recovered!" size="md">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Account Found</h3>
            <div className="bg-gray-50 rounded-xl p-4 mt-4 text-left">
              <p className="text-sm text-gray-600">Name: <span className="font-semibold">{recoveredData.name}</span></p>
              <p className="text-sm text-gray-600">RedUnity ID: <span className="font-mono font-semibold text-brand-red">{recoveredData.redunityId}</span></p>
              <p className="text-sm text-gray-600">Blood Group: <span className="font-semibold">{recoveredData.bloodGroup}</span></p>
              <p className="text-sm text-gray-600">City: <span className="font-semibold">{recoveredData.city}</span></p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Use your phone number to login to your account.</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Account Recovery" size="md">
      <div className="space-y-4">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('request')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === 'request'
                ? 'text-brand-red border-b-2 border-brand-red'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Request Help
          </button>
          <button
            onClick={() => setMode('recover')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === 'recover'
                ? 'text-brand-red border-b-2 border-brand-red'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recover Account
          </button>
        </div>

        {mode === 'request' ? (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Don't remember your RedUnity ID? Let our support team help you recover your account.</p>
            </div>
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              icon={<User className="w-5 h-5" />}
              disabled={loading}
            />
            <Input
              type="tel"
              label="Phone Number"
              placeholder="0300-1234567"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone className="w-5 h-5" />}
              disabled={loading}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Submit Request <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRecoverSubmit} className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Remember your RedUnity ID? Recover your account instantly.</p>
            </div>
            <Input
              type="text"
              label="RedUnity ID"
              placeholder="Enter your RedUnity ID"
              name="redunityId"
              value={formData.redunityId}
              onChange={handleChange}
              icon={<HelpCircle className="w-5 h-5" />}
              disabled={loading}
            />
            <Input
              type="tel"
              label="Phone Number"
              placeholder="0300-1234567"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              icon={<Phone className="w-5 h-5" />}
              disabled={loading}
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Recover Account <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-gray-200">
          <button
            onClick={onOpenLogin}
            className="text-sm text-brand-red hover:text-red-700 font-medium transition-colors"
          >
            Remember your credentials? Login
          </button>
        </div>
      </div>
    </Modal>
  );
};