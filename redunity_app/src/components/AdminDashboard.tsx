import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Droplet, Activity, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { DataExplorer } from './DataExplorerModal';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase-config';
import { formatRelativeTime } from '../utils/formatters';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalRequests: 0,
    activeRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const requestsSnapshot = await getDocs(collection(db, 'bloodRequests'));
      const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const interactionsSnapshot = await getDocs(
        query(collection(db, 'interactions'), orderBy('timestamp', 'desc'), limit(5))
      );
      const interactions = interactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setStats({
        totalUsers: users.length,
        totalDonors: users.filter((u: any) => u.role === 'donor').length,
        totalRequests: requests.length,
        activeRequests: requests.filter((r: any) => r.status === 'active').length
      });
      setRecentActivity(interactions);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-red-600' },
    { label: 'Active Donors', value: stats.totalDonors, icon: Droplet, color: 'text-red-600' },
    { label: 'Total Requests', value: stats.totalRequests, icon: Activity, color: 'text-red-600' },
    { label: 'Active Requests', value: stats.activeRequests, icon: AlertTriangle, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-500 text-sm">Platform overview and management</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                  <span className="text-3xl font-bold text-gray-900">{card.value}</span>
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity (last 5) */}
      {recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Latest Activity</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        <span className="text-slate-500">{activity.fromUser?.name || 'Guest'}</span>
                        {' → '}
                        <span className="text-slate-700">{activity.toUser?.name || '—'}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activity.method?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {activity.timestamp ? formatRelativeTime(activity.timestamp.toDate()) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Inline Data Explorer — no modal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Data Management</h3>
            </div>
          </CardHeader>
          <CardContent>
            <DataExplorer />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};