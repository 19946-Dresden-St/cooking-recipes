import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Toaster
          position="bottom-right"
          toastOptions={{
              duration: 3000,
              style: {
                  borderRadius: "12px",
                  fontWeight: "600",
              },
          }}
      />
    <App />
  </StrictMode>,
)
