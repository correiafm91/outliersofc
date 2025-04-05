
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createRequiredBuckets } from './integrations/supabase/create-buckets'

// Create required storage buckets immediately on app initialization
// This runs before any components are mounted
console.log("Initializing storage buckets...");
createRequiredBuckets()
  .then(success => {
    console.log("Storage buckets initialization:", success ? "successful" : "failed");
  })
  .catch(error => {
    console.error("Error initializing storage buckets:", error);
  });

// Make sure we're using createRoot from ReactDOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
