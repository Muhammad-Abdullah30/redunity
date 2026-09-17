import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Droplet, Users, Clock, Shield, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';

export const HeroSection: React.FC<{
  onOpenLogin: () => void;
  onOpenRegistration: () => void;
}> = ({ onOpenLogin, onOpenRegistration }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-slate-950 text-white py-16 lg:py-24">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent pointer-events-none"></div>

      {/* Floating Ambient Blurs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 mb-6">
              <Heart className="w-4 h-4 text-red-400 fill-current animate-pulse" />
              <span className="text-sm font-semibold text-red-100">Pakistan's Premier Voluntary Blood Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight">
              Save Lives with <br />
              <span className="bg-gradient-to-r from-red-200 via-white to-rose-200 bg-clip-text text-transparent">
                RedUnity
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 mb-8 max-w-lg leading-relaxed">
              Connect with verified, voluntary blood donors across Pakistan instantly. Every donation counts, every second matters. Join our life-saving community today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                onClick={onOpenRegistration}
                size="lg"
                className="bg-white text-red-900 hover:bg-red-50 font-extrabold shadow-xl shadow-black/20 btn-animated"
              >
                <Droplet className="w-5 h-5 text-red-600 fill-current" />
                <span className="text-red-900 font-extrabold">Become a Donor</span>
              </Button>
              <Button
                onClick={onOpenLogin}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 font-semibold backdrop-blur-sm btn-animated"
              >
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 text-red-300" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">500+</div>
                <div className="text-red-200 text-xs sm:text-sm font-medium mt-1">Active Donors</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">50+</div>
                <div className="text-red-200 text-xs sm:text-sm font-medium mt-1">Cities Covered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">1,000+</div>
                <div className="text-red-200 text-xs sm:text-sm font-medium mt-1">Lives Saved</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {[
              {
                icon: <Users className="w-5 h-5 text-red-300" />,
                title: "Instant Donor Search",
                description: "Search active blood donors filtered by exact city, area, and blood group."
              },
              {
                icon: <Droplet className="w-5 h-5 text-red-300" />,
                title: "Post Emergency Requests",
                description: "Create urgent blood requests to reach available donors via WhatsApp or call."
              },
              {
                icon: <Clock className="w-5 h-5 text-red-300" />,
                title: "Real-time Availability",
                description: "Live donor directory status tracking donor availability."
              },
              {
                icon: <Shield className="w-5 h-5 text-red-300" />,
                title: "Direct & Free Access",
                description: "100% free voluntary non-profit initiative with direct contact information."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-white/15 p-3 rounded-xl flex items-center justify-center shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg mb-0.5 text-white">{feature.title}</h3>
                    <p className="text-red-100/90 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};