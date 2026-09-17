import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useFirebase } from '../../hooks/useFirebase';
import { validatePassword } from '../../utils/validators';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegistration: () => void;
  onOpenRecovery: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegistration,
  onOpenRecovery
}) => {
  const { login } = useFirebase();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || identifier.trim() === '') {
      setError('Please enter your Phone Number, Email, or RedUnity ID');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Password is required');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIdentifier('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Login to RedUnity" size="md">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-slate-600 text-sm">Enter your Phone Number, RedUnity ID, or Email and Password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Phone Number or RedUnity ID"
            placeholder="0300-1234567 or RedUnity ID"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<User className="w-4 h-4 text-slate-400" />}
            disabled={loading}
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            disabled={loading}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            loading={loading} 
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 shadow-md shadow-red-600/20 btn-animated"
          >
            Sign In <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </form>

        <div className="border-t border-slate-200 pt-4">
          <div className="space-y-2 text-center">
            <button
              onClick={onOpenRegistration}
              className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              Don't have an account? Register as Donor
            </button>
            <br />
            <button
              onClick={onOpenRecovery}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Forgot your RedUnity ID? Recover account
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};