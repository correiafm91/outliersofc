
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Menu, X } from "lucide-react";

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Checar se o usuário está logado
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/auth");
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/90 backdrop-blur-md py-2 shadow-md" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="https://i.postimg.cc/yd1dNnBH/High-resolution-stock-photo-A-professional-commercial-image-showcasing-a-grey-letter-O-logo-agains.jpg" 
            alt="Outliers Logo" 
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="text-xl font-bold text-white">Outliers</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-white hover:text-gray-300 transition-colors">Home</Link>
          <Link to="/negocios" className="text-white hover:text-gray-300 transition-colors">Negócios</Link>
          <Link to="/economia" className="text-white hover:text-gray-300 transition-colors">Economia</Link>
          <Link to="/tecnologia" className="text-white hover:text-gray-300 transition-colors">Tecnologia</Link>
          {user ? (
            <Button variant="outline" onClick={handleLogout} className="border-white text-white hover:bg-white hover:text-black transition-colors">
              Sair
            </Button>
          ) : (
            <Button asChild className="bg-white text-black hover:bg-gray-200">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md shadow-lg animate-fade-in">
          <div className="container mx-auto py-4 space-y-4 flex flex-col">
            <Link to="/" className="text-white hover:text-gray-300 transition-colors py-2" onClick={toggleMenu}>Home</Link>
            <Link to="/negocios" className="text-white hover:text-gray-300 transition-colors py-2" onClick={toggleMenu}>Negócios</Link>
            <Link to="/economia" className="text-white hover:text-gray-300 transition-colors py-2" onClick={toggleMenu}>Economia</Link>
            <Link to="/tecnologia" className="text-white hover:text-gray-300 transition-colors py-2" onClick={toggleMenu}>Tecnologia</Link>
            {user ? (
              <Button variant="outline" onClick={() => { handleLogout(); toggleMenu(); }} className="border-white text-white hover:bg-white hover:text-black transition-colors">
                Sair
              </Button>
            ) : (
              <Button asChild className="bg-white text-black hover:bg-gray-200">
                <Link to="/auth" onClick={toggleMenu}>Entrar</Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
