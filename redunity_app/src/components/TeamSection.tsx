import React from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Mail } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface TeamMember {
  name: string;
  role: string;
  contribution: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Muhammad Abdullah',
    role: 'Co-Founder & Technology Lead',
    contribution: 'Platform architecture & full-stack development',
    image: '/team_abdullah.webp'
  },
  {
    name: 'Ameer Hamza',
    role: 'Co-Founder & Community Manager',
    contribution: 'Community outreach & donor engagement',
    image: '/team_hamza.webp'
  },
  {
    name: 'Ahmed',
    role: 'Lawyer',
    contribution: 'Legal compliance & privacy policy',
    image: '/team_ahmed.webp'
  }
];

export const TeamSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-red-100/80 text-red-600 rounded-2xl mb-3 shadow-sm">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meet Our Team</h2>
        <p className="text-slate-500 text-sm mt-1">Dedicated volunteers building Pakistan's premier life-saving blood donation platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {teamMembers.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="border-slate-200/80 shadow-sm rounded-3xl overflow-hidden group hover:border-red-200/80 transition-all">
              <CardContent className="p-6 text-center">
                <div className="relative w-28 h-28 mx-auto mb-5">
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-rose-500 rounded-2xl rotate-6 scale-95 opacity-20 group-hover:rotate-12 transition-transform duration-300"></div>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="relative w-28 h-28 rounded-2xl object-cover border-2 border-white shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${member.name}&background=DC2626&color=fff&size=112`;
                    }}
                  />
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg">{member.name}</h3>
                <p className="text-red-600 font-bold text-xs uppercase tracking-wide mt-0.5">{member.role}</p>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">{member.contribution}</p>

                <div className="flex justify-center gap-2 mt-5">
                  <a
                    href={`mailto:contact@redunity.org`}
                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-2">
        <p className="text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-red-600 fill-current" />
          Join our mission to save lives across Pakistan
        </p>
      </div>
    </div>
  );
};