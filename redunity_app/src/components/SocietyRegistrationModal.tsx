import React, { useState } from 'react';
import { Building, MapPin, Phone, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useFirebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { useInteractionTracker } from '../hooks/useInteractionTracker';
import { useToast } from './ui/ToastNotification';

interface SocietyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocietyRegistrationModal: React.FC<SocietyRegistrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { trackInteraction } = useInteractionTracker();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contactPhone: '',
    logoUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to register a society.');
      return;
    }

    if (!formData.name || !formData.location || !formData.contactPhone) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const societyDoc = await addDoc(collection(db, 'societies'), {
        name: formData.name.trim(),
        location: formData.location.trim(),
        contactPhone: formData.contactPhone.trim(),
        logoUrl: formData.logoUrl.trim(),
        status: 'pending',
        adminUid: user.uid,
        createdAt: serverTimestamp()
      });

      await trackInteraction({
        method: 'society_registered',
        additionalData: {
          societyId: societyDoc.id,
          societyName: formData.name.trim(),
          location: formData.location.trim()
        }
      });

      showToast(
        'Society Application Submitted!',
        `Your application to register "${formData.name.trim()}" is now pending admin approval.`,
        'info'
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: '', location: '', contactPhone: '', logoUrl: '' });
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error('Error registering society:', err);
      setError(err.message || 'Failed to register society. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Registration Submitted">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">Application Received</h3>
          <p className="text-slate-600 mt-2">
            Your society registration request has been submitted successfully and is pending admin approval.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Your Society">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="Society Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter organization name"
          required
          icon={<Building className="w-4 h-4 text-slate-400" />}
        />

        <Input
          label="Location *"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="City, Area"
          required
          icon={<MapPin className="w-4 h-4 text-slate-400" />}
        />

        <Input
          label="Contact Phone *"
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          placeholder="Primary contact number"
          required
          icon={<Phone className="w-4 h-4 text-slate-400" />}
        />

        <Input
          label="Logo URL (Optional)"
          name="logoUrl"
          value={formData.logoUrl}
          onChange={handleChange}
          placeholder="https://example.com/logo.png"
          icon={<Upload className="w-4 h-4 text-slate-400" />}
        />

        <div className="pt-4">
          <Button type="submit" loading={loading} className="w-full">
            Submit for Approval
          </Button>
        </div>
      </form>
    </Modal>
  );
};
