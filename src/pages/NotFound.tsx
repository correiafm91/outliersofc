
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedElement } from "@/components/ui/animated-element";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <AnimatedElement className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="https://i.postimg.cc/yd1dNnBH/High-resolution-stock-photo-A-professional-commercial-image-showcasing-a-grey-letter-O-logo-agains.jpg" 
            alt="Outliers Logo" 
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>
        
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Página não encontrada</h2>
        <p className="text-zinc-400 mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>
        
        <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200">
          <Link to="/">Voltar para Home</Link>
        </Button>
      </AnimatedElement>
    </div>
  );
}
