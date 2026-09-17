import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useFirebase';
import { MyBloodRequests } from './MyBloodRequests';

export const RequestorDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-600/20">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome, {userProfile?.name || 'User'}</h2>
            <p className="text-slate-500 text-sm">Recipient & Request Management Dashboard</p>
          </div>
        </div>
      </motion.div>

      {/* My Blood Requests History & Editing */}
      <MyBloodRequests />
    </div>
  );
};