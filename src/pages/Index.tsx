
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { AnimatedElement } from "@/components/ui/animated-element";
import { Button } from "@/components/ui/button";

// Dados simulados - seriam obtidos do Supabase
const mockArticles = [
  {
    id: "1",
    title: "O futuro dos investimentos em startups na América Latina",
    excerpt: "Com um crescimento exponencial nos últimos anos, o ecossistema de startups latino-americano está atraindo olhares globais.",
    category: "Negócios",
    imageUrl: "https://images.unsplash.com/photo-1664575599736-c5197c684171?q=80&w=2070&auto=format&fit=crop",
    date: "12 Mai 2023",
    authorName: "Marcelo Santos",
    authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "2",
    title: "Análise: Como a inteligência artificial está transformando o setor financeiro",
    excerpt: "Bancos e fintechs estão investindo bilhões em IA para automatizar processos e melhorar a experiência do cliente.",
    category: "Tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2032&auto=format&fit=crop",
    date: "10 Mai 2023",
    authorName: "Fernanda Lima",
    authorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "3",
    title: "ESG: O novo parâmetro para investimentos sustentáveis",
    excerpt: "Entenda como critérios ambientais, sociais e de governança estão moldando decisões de investimento ao redor do mundo.",
    category: "Economia",
    imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=2070&auto=format&fit=crop",
    date: "08 Mai 2023",
    authorName: "Roberto Alves",
  },
  {
    id: "4",
    title: "Crise energética global: Impactos e oportunidades para o Brasil",
    excerpt: "Com sua matriz energética diversificada, o Brasil pode se beneficiar do cenário internacional desafiador.",
    category: "Economia",
    imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2070&auto=format&fit=crop",
    date: "05 Mai 2023",
    authorName: "Juliana Costa",
    authorAvatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    id: "5",
    title: "Mercado imobiliário em 2023: O que esperar dos preços nas grandes capitais",
    excerpt: "Após um período de estabilidade, especialistas projetam novos movimentos no setor imobiliário para o segundo semestre.",
    category: "Negócios",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop",
    date: "02 Mai 2023",
    authorName: "Carlos Mendes",
  },
  {
    id: "6",
    title: "O avanço das criptomoedas entre empresas tradicionais",
    excerpt: "Bitcoin e outras moedas digitais começam a ser adotadas por empresas conservadoras como reserva de valor.",
    category: "Tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=2033&auto=format&fit=crop",
    date: "29 Abr 2023",
    authorName: "Amanda Silveira",
  },
];

export default function Index() {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }

    // Simulando carregamento de dados
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Dividir artigos para o layout
  const featuredArticle = mockArticles[0];
  const regularArticles = mockArticles.slice(1);

  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Business skyline" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <AnimatedElement className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Outliers
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 mb-8">
              Perspectivas inovadoras sobre o mundo dos negócios
            </p>
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 rounded-full px-8">
              <a href="#articles">Explorar artigos</a>
            </Button>
          </AnimatedElement>
        </div>
      </section>

      {/* Articles Section */}
      <section id="articles" className="py-20">
        <div className="container mx-auto px-4">
          <AnimatedElement>
            <h2 className="text-3xl font-bold mb-12 border-b border-zinc-800 pb-4">
              Artigos em destaque
            </h2>
          </AnimatedElement>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoaded ? (
              <>
                <ArticleCard {...featuredArticle} featured={true} className="mb-8 col-span-full" />
                
                {regularArticles.map((article) => (
                  <ArticleCard key={article.id} {...article} />
                ))}
              </>
            ) : (
              <div className="col-span-full flex justify-center py-20">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
                  <p className="mt-4 text-zinc-500">Carregando artigos...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Button variant="outline" className="border-zinc-700 hover:bg-zinc-900">
              Carregar mais artigos
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <AnimatedElement className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Fique atualizado</h2>
            <p className="text-zinc-400 mb-8">
              Assine nossa newsletter e receba as melhores análises e notícias sobre o mundo dos negócios.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="seu@email.com" 
                className="flex-1 px-4 py-3 rounded-md bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-white"
              />
              <Button className="bg-white text-black hover:bg-zinc-200 px-6">
                Assinar
              </Button>
            </div>
          </AnimatedElement>
        </div>
      </section>

      <Footer />
    </main>
  );
}
