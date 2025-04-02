
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-12 border-t border-zinc-800">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="https://i.postimg.cc/yd1dNnBH/High-resolution-stock-photo-A-professional-commercial-image-showcasing-a-grey-letter-O-logo-agains.jpg" 
                alt="Outliers Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="text-xl font-bold">Outliers</span>
            </div>
            <p className="text-zinc-400 text-sm">
              Transformando perspectivas sobre o mundo dos negócios e da economia.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-lg">Categorias</h3>
            <ul className="space-y-2 text-zinc-400">
              <li><Link to="/negocios" className="hover:text-white transition-colors">Negócios</Link></li>
              <li><Link to="/economia" className="hover:text-white transition-colors">Economia</Link></li>
              <li><Link to="/tecnologia" className="hover:text-white transition-colors">Tecnologia</Link></li>
              <li><Link to="/startups" className="hover:text-white transition-colors">Startups</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-lg">Empresa</h3>
            <ul className="space-y-2 text-zinc-400">
              <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre nós</Link></li>
              <li><Link to="/contato" className="hover:text-white transition-colors">Contato</Link></li>
              <li><Link to="/carreiras" className="hover:text-white transition-colors">Carreiras</Link></li>
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-lg">Newsletter</h3>
            <p className="text-zinc-400 mb-2 text-sm">Receba as melhores notícias no seu email.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="seu@email.com" 
                className="bg-zinc-900 border border-zinc-700 rounded-l-md px-4 py-2 w-full text-sm focus:outline-none focus:border-white"
              />
              <button className="bg-white text-black px-4 rounded-r-md font-medium hover:bg-zinc-200 transition-colors">
                Assinar
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-zinc-400 text-sm">© {currentYear} Outliers. Todos os direitos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
