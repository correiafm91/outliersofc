
import { Link } from "react-router-dom";
import { Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <Link to="/" className="text-xl font-bold flex items-center">
              Outliers
            </Link>
            <p className="mt-2 text-zinc-400 text-sm">
              Perspectivas inovadoras sobre o mundo dos negócios
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex gap-4">
            <a 
              href="https://www.instagram.com/outliersbrs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </a>
            <a 
              href="https://x.com/Outliersofc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">X (Twitter)</span>
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Outliers. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
