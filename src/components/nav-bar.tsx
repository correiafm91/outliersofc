
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationMenu } from "@/components/notification-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Fetch user profile if logged in
  useEffect(() => {
    if (!user) return;
    
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, is_verified')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
      } else {
        setUserProfile(data);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl md:text-2xl font-bold flex items-center">
            Outliers
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-zinc-300 hover:text-white transition">
              Home
            </Link>
            <Link to="/criar-artigo" className="text-zinc-300 hover:text-white transition">
              Novo Artigo
            </Link>
            <Link to="/saved-articles" className="text-zinc-300 hover:text-white transition">
              Salvos
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Auth status */}
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationMenu />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile?.avatar_url} />
                        <AvatarFallback className="bg-zinc-800">
                          {userProfile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {userProfile?.is_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[200px] bg-zinc-900 border-zinc-800">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{userProfile?.username || user.email?.split('@')[0]}</span>
                        <span className="text-xs text-zinc-400 mt-1">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem 
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer hover:bg-zinc-800"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/saved-articles")}
                      className="cursor-pointer hover:bg-zinc-800"
                    >
                      <BookmarkIcon className="mr-2 h-4 w-4" />
                      Artigos Salvos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    >
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => navigate("/auth")}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                Entrar
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && isMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              to="/"
              className="py-2 text-zinc-300 hover:text-white transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/criar-artigo"
              className="py-2 text-zinc-300 hover:text-white transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Novo Artigo
            </Link>
            <Link
              to="/saved-articles"
              className="py-2 text-zinc-300 hover:text-white transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Artigos Salvos
            </Link>
            <Link
              to="/profile"
              className="py-2 text-zinc-300 hover:text-white transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Meu Perfil
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
