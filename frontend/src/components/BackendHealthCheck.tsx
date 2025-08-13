"use client";

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

const BackendHealthCheck: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await apiService.healthCheck();
        setBackendInfo(response);
        setStatus('connected');
        setError('');
      } catch (err: any) {
        console.error('Backend health check failed:', err);
        setStatus('disconnected');
        setError(err.message || 'Backend connection failed');
      }
    };

    checkBackendHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 text-white shadow-lg border border-white/20 z-50">
      <div className="flex items-center gap-3">
        <span className="text-lg">{getStatusIcon()}</span>
        <div>
          <div className={`font-semibold ${getStatusColor()}`}>
            Backend: {status === 'checking' ? 'Checking...' : status === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
          {backendInfo && (
            <div className="text-xs text-gray-300">
              v{backendInfo.version} • {new Date(backendInfo.timestamp).toLocaleTimeString()}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-300 mt-1">
              {error}
            </div>
          )}
        </div>
      </div>
      {status === 'disconnected' && (
        <div className="text-xs text-gray-400 mt-2">
          Make sure backend is running on {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}
        </div>
      )}
    </div>
  );
};

export default BackendHealthCheck;
