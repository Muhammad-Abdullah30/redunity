import React, { useState } from 'react';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { UserProvider } from './contexts/UserContext';
import { HeroSection } from './components/HeroSection';
import { BloodDirectory } from './components/BloodDirectory';
import { BloodRequestForm } from './components/BloodRequestForm';
import { TeamSection } from './components/TeamSection';
import { DonorDashboard } from './components/DonorDashboard';
import { RequestorDashboard } from './components/RequestorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SocietyDashboard } from './components/SocietyDashboard';
import { SocietyRegistrationModal } from './components/SocietyRegistrationModal';
import { LoginModal } from './components/auth/LoginModal';
import { RegistrationModal } from './components/auth/RegistrationModal';
import { RecoveryModal } from './components/auth/RecoveryModal';
import { UserProfileSettingsView } from './components/UserProfileSettingsView';
import { EmergencyAlertsModal } from './components/EmergencyAlertsModal';
import { useAuth } from './hooks/useFirebase';
import { Heart, Menu, X, LogOut, User as UserIcon, Settings, Home, Search, Droplet as DropletIcon, Users, LayoutDashboard, Bell, Building } from 'lucide-react';
import { Button } from './components/ui/Button';

function AppContent() {
  const { user, userProfile, signOut, isAdmin, isDonor, isRequestor, isSocietyAdmin } = useAuth();
  
  // Clean HTML5 path routing without # symbol
  const getSectionFromURL = () => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const validSections = ['directory', 'request', 'team', 'dashboard', 'profile'];
    return validSections.includes(path) ? path : 'home';
  };

  const [activeSection, setActiveSectionState] = useState(getSectionFromURL());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const setActiveSection = (sectionId) => {
    setActiveSectionState(sectionId);
    const targetPath = sectionId === 'home' ? '/' : `/${sectionId}`;
    window.history.pushState({}, '', targetPath);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setActiveSectionState(getSectionFromURL());
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Auth Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [emergencyAlertsOpen, setEmergencyAlertsOpen] = useState(false);
  const [societyRegistrationOpen, setSocietyRegistrationOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('society');

  const handleSignOut = async () => {
    try {
      if (typeof signOut === 'function') {
        await signOut();
      }
      setActiveSection('home');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigation = [
    { id: 'home', label: 'Home', icon: Home, roles: ['all'] },
    { id: 'directory', label: 'Find Donors', icon: Search, roles: ['all'] },
    { id: 'request', label: 'Request Blood', icon: DropletIcon, roles: ['all'] },
    { id: 'team', label: 'Our Team', icon: Users, roles: ['all'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['donor', 'requestor', 'admin', 'society_admin'] }
  ];

  const getRoleBasedNavigation = () => {
    if (!user) return navigation.filter(nav => nav.roles.includes('all'));
    if (isAdmin) return navigation;
    if (isSocietyAdmin) return navigation.filter(nav => nav.roles.includes('all') || nav.roles.includes('society_admin'));
    if (isDonor) return navigation.filter(nav => nav.roles.includes('all') || nav.roles.includes('donor'));
    if (isRequestor) return navigation.filter(nav => nav.roles.includes('all') || nav.roles.includes('requestor'));
    return navigation.filter(nav => nav.roles.includes('all'));
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Navigation Header */}
      <nav className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              onClick={() => setActiveSection('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Red<span className="text-red-600">Unity</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {getRoleBasedNavigation().map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeSection === item.id
                      ? 'text-red-600 bg-red-50/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Auth & Notification Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setSocietyRegistrationOpen(true)}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/60 flex items-center gap-1.5 text-xs font-bold"
                title="Register Organization / Society"
              >
                <Building className="w-4 h-4 text-red-600" />
                <span className="hidden lg:inline text-slate-700">Register Society</span>
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => setEmergencyAlertsOpen(true)}
                    className="relative p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/60 flex items-center gap-1.5 text-xs font-bold"
                    title="View Urgent Emergency Alerts"
                  >
                    <Bell className="w-4 h-4 text-red-600 animate-pulse" />
                    <span className="hidden lg:inline text-slate-700">Alerts</span>
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute -top-0.5 -right-0.5"></span>
                  </button>
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 rounded-xl border border-slate-200/60 transition-all text-left"
                    title="Profile & Settings"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-800">
                      {userProfile?.name || 'User'}
                    </span>
                    <Settings className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </button>

                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setLoginModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => setRegistrationModalOpen(true)}
                    size="sm"
                    className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold shadow-md shadow-red-600/20 hover:from-red-700 hover:to-rose-700 btn-animated"
                  >
                    Register
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {getRoleBasedNavigation().map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    activeSection === item.id
                      ? 'text-red-600 bg-red-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => {
                  setSocietyRegistrationOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Building className="w-4 h-4 text-red-600" />
                Register Society
              </button>

              <div className="border-t border-slate-200 pt-4 mt-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl mb-2">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900">
                        {userProfile?.name || 'User'}
                      </span>
                    </div>

                    <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setLoginModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full mb-2 font-semibold"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => {
                        setRegistrationModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {activeSection === 'home' && (
          <>
            <HeroSection
              onOpenLogin={() => setLoginModalOpen(true)}
              onOpenRegistration={() => setRegistrationModalOpen(true)}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BloodDirectory compact onViewAll={() => setActiveSection('directory')} />
                <BloodRequestForm />
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <TeamSection />
            </div>
          </>
        )}

        {activeSection === 'directory' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BloodDirectory />
          </div>
        )}

        {activeSection === 'request' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto">
              <BloodRequestForm />
            </div>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TeamSection />
          </div>
        )}

        {activeSection === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {isAdmin && <AdminDashboard />}
            
            {isSocietyAdmin && !isAdmin && (
              <>
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                  <button
                    onClick={() => setDashboardTab('society')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      dashboardTab === 'society'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4" /> Society Dashboard
                  </button>
                  <button
                    onClick={() => setDashboardTab('donor')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      dashboardTab === 'donor'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" /> Personal Donor View
                  </button>
                </div>

                {dashboardTab === 'society' ? <SocietyDashboard /> : <DonorDashboard />}
              </>
            )}

            {!isSocietyAdmin && !isAdmin && isDonor && <DonorDashboard />}
            {!isSocietyAdmin && !isAdmin && !isDonor && isRequestor && <RequestorDashboard />}
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <UserProfileSettingsView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="font-bold text-lg tracking-tight">RedUnity</span>
            </div>
            <p className="text-slate-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} RedUnity. Pakistan's Premier Voluntary Blood Donation Network.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onOpenRegistration={() => {
          setLoginModalOpen(false);
          setRegistrationModalOpen(true);
        }}
        onOpenRecovery={() => {
          setLoginModalOpen(false);
          setRecoveryModalOpen(true);
        }}
      />

      <RegistrationModal
        isOpen={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        onOpenLogin={() => {
          setRegistrationModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      <RecoveryModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        onOpenLogin={() => {
          setRecoveryModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      <EmergencyAlertsModal
        isOpen={emergencyAlertsOpen}
        onClose={() => setEmergencyAlertsOpen(false)}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      <SocietyRegistrationModal
        isOpen={societyRegistrationOpen}
        onClose={() => setSocietyRegistrationOpen(false)}
      />
    </div>
  );
}

import { ToastProvider } from './components/ui/ToastNotification';

function App() {
  return (
    <FirebaseProvider>
      <UserProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </UserProvider>
    </FirebaseProvider>
  );
}

export default App;