import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import './admin.css';
import { AuthProvider } from '../lib/auth';
import { AdminApp } from './AdminApp';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminApp />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AuthProvider>
  </StrictMode>
);
