
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to the homepage
    if (!loading && user) {
      navigate("/");
    }
  }, [navigate, user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
          <p className="mt-4 text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-[url('https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=1887&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat bg-blend-overlay bg-black/60">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-8 flex items-center">
            <img 
              src="https://i.postimg.cc/yd1dNnBH/High-resolution-stock-photo-A-professional-commercial-image-showcasing-a-grey-letter-O-logo-agains.jpg" 
              alt="Outliers Logo" 
              className="h-14 w-14 rounded-full object-cover"
            />
            <h1 className="text-3xl font-bold text-white ml-3">Outliers</h1>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
