import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from "./context/ToastContext";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

<AdminAuthProvider>
  <App />
</AdminAuthProvider>
reportWebVitals();
