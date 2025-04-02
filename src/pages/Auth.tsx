
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth-form";

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Se já estiver logado, redirecionar para a homepage
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/");
    }
  }, [navigate]);

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
