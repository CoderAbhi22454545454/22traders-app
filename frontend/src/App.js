import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Trades from './components/Trades';
import TradeDetail from './components/TradeDetail';
import Login from './components/Login';
import Signup from './components/Signup';
import PWAInstall from './components/PWAInstall';
import PWAUpdate from './components/PWAUpdate';
import PWAStatus from './components/PWAStatus';
import { NotificationProvider } from './components/Notifications';
import { 
  HomeIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import './index.css';

// Navigation Component
const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Trades', href: '/trades', icon: DocumentTextIcon },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">22</span>
              </div>
              <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                22 Traders FX
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
                      <div className="flex items-center space-x-4">
            {/* PWA Status */}
            <PWAStatus userId={user.id} />
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-6 w-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <Cog6ToothIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive(item.href)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
            >
              <div className="flex items-center">
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(true);

  // Check for existing user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleSignup = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setAuthView('login');
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Trade Journal...</p>
        </div>
      </div>
    );
  }

  // Show authentication pages if user is not logged in
  if (!user) {
    if (authView === 'signup') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Signup 
            onSignup={handleSignup}
            onSwitchToLogin={() => setAuthView('login')}
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Login 
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      </div>
    );
  }

  // Main app with navigation
  return (
    <NotificationProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Navigation user={user} onLogout={handleLogout} />
          
          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={<Dashboard userId={user.id} />} 
              />
              <Route 
                path="/analytics" 
                element={<Analytics userId={user.id} />} 
              />
              <Route 
                path="/trades" 
                element={<Trades userId={user.id} />} 
              />
              <Route 
                path="/trade/:id" 
                element={<TradeDetail userId={user.id} />} 
              />
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          
          {/* PWA Components */}
          <PWAInstall />
          <PWAUpdate />
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  © 2024 Trade Journal. Built for professional traders.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App; 