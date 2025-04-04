
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createRequiredBuckets } from './integrations/supabase/create-buckets'

// Create required storage buckets on app initialization
createRequiredBuckets().then(success => {
  console.log("Storage buckets initialization:", success ? "successful" : "failed");
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
