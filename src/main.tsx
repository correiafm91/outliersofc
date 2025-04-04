
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createRequiredBuckets } from './integrations/supabase/create-buckets'

// Create required storage buckets on app initialization
// But don't block the app from loading if this fails
createRequiredBuckets().then(success => {
  console.log("Storage buckets initialization:", success ? "successful" : "failed");
}).catch(error => {
  console.error("Error initializing storage buckets:", error);
});

// Make sure we're using createRoot from ReactDOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
