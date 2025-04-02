
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { CommentSection } from "@/components/comment-section";
import { LikeButton } from "@/components/like-button";
import { AnimatedElement } from "@/components/ui/animated-element";
import { AnimatedText } from "@/components/ui/animated-text";
import { Separator } from "@/components/ui/separator";

// Dados simulados - seriam obtidos do Supabase
const mockArticles = [
  {
    id: "1",
    title: "O futuro dos investimentos em startups na América Latina",
    content: `
      <p>O ecossistema de startups latino-americano vem apresentando um crescimento exponencial nos últimos anos, atraindo a atenção de investidores globais. Em 2022, apesar do cenário econômico desafiador, o setor recebeu mais de $4 bilhões em investimentos de venture capital.</p>
      
      <p>De acordo com o relatório da Latam Ventures, o Brasil continua liderando a região, representando cerca de 50% de todos os investimentos. No entanto, países como México, Colômbia e Chile estão rapidamente desenvolvendo suas próprias cenas de inovação.</p>
      
      <h2>Setores em destaque</h2>
      
      <p>As fintechs ainda dominam o espaço, representando 30% dos investimentos totais. No entanto, estamos vendo um crescimento significativo em setores como:</p>
      
      <ul>
        <li>Healthtechs (tecnologias para saúde)</li>
        <li>Cleantechs (soluções para sustentabilidade)</li>
        <li>Agtechs (tecnologia para o agronegócio)</li>
      </ul>
      
      <p>O Brasil, com sua forte tradição agrícola, está se tornando um hub para inovações no agronegócio, enquanto o México lidera em soluções de mobilidade urbana e logística.</p>
      
      <h2>Desafios persistentes</h2>
      
      <p>Apesar do crescimento, desafios significativos permanecem:</p>
      
      <p>A instabilidade política e econômica em vários países da região continua criando incertezas para investidores. A infraestrutura digital, embora melhorando, ainda apresenta gargalos em áreas rurais e menores centros urbanos. A escassez de talentos técnicos qualificados está se tornando um problema crescente à medida que mais empresas competem por desenvolvedores e engenheiros.</p>
      
      <h2>O papel dos fundos internacionais</h2>
      
      <p>Fundos de venture capital dos EUA e Europa estão aumentando significativamente sua exposição à região. Empresas como SoftBank, Sequoia Capital e Accel têm feito investimentos consideráveis, muitas vezes liderando rodadas Series B e C.</p>
      
      <p>Interessantemente, estamos também observando um crescente interesse de fundos asiáticos, particularmente da China e Singapura, que enxergam similaridades entre os desafios enfrentados na América Latina e em seus mercados domésticos.</p>
      
      <h2>Perspectivas futuras</h2>
      
      <p>Para 2023-2024, especialistas preveem:</p>
      
      <p>Uma maior consolidação do setor, com empresas mais maduras adquirindo startups menores para expandir ofertas de produtos e alcance geográfico. Um foco crescente em rentabilidade em vez de crescimento a qualquer custo — uma mudança significativa em relação aos anos anteriores. Mais IPOs de empresas latino-americanas, seja em bolsas locais ou nos Estados Unidos.</p>
      
      <p>A América Latina, com uma população de mais de 650 milhões e uma crescente classe média, representa uma enorme oportunidade para startups que podem resolver problemas locais com soluções inovadoras. À medida que o ecossistema amadurece, podemos esperar ver mais unicórnios emergindo da região nos próximos anos.</p>
    `,
    category: "Negócios",
    imageUrl: "https://images.unsplash.com/photo-1664575599736-c5197c684171?q=80&w=2070&auto=format&fit=crop",
    date: "12 Mai 2023",
    readTime: "8 min de leitura",
    authorName: "Marcelo Santos",
    authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    authorBio: "Analista de investimentos com 15 anos de experiência no mercado latino-americano.",
  },
  {
    id: "2",
    title: "Análise: Como a inteligência artificial está transformando o setor financeiro",
    content: `
      <p>O setor financeiro está passando por uma revolução silenciosa, impulsionada pelos avanços em inteligência artificial. Bancos tradicionais e fintechs estão investindo bilhões em tecnologias de IA para automatizar processos, melhorar a experiência do cliente e, crucialmente, detectar fraudes e riscos com maior precisão.</p>
      
      <h2>Automação e eficiência operacional</h2>
      
      <p>A automação de processos robóticos (RPA) combinada com IA está permitindo que instituições financeiras processem volumosas transações com mínima intervenção humana. Tarefas como verificação de documentos, processamento de empréstimos e compliance regulatório estão sendo significativamente agilizadas.</p>
      
      <p>O Banco Itaú, por exemplo, implementou sistemas de IA que reduziram o tempo de processamento de certos empréstimos de dias para minutos, aumentando sua capacidade operacional e reduzindo custos.</p>
      
      <h2>Atendimento ao cliente reimaginado</h2>
      
      <p>Chatbots e assistentes virtuais estão na linha de frente da interação com clientes. Nubank, Mercado Pago e outros players digitais utilizam extensivamente essas tecnologias para oferecer suporte 24/7 e personalizar recomendações financeiras.</p>
      
      <p>Mais impressionante ainda é como a IA está sendo utilizada para antecipar necessidades dos clientes. Algoritmos avançados analisam padrões de gastos para oferecer produtos relevantes no momento certo – como seguro viagem quando detectam a compra de passagens aéreas.</p>
      
      <h2>Detecção de fraudes e gerenciamento de riscos</h2>
      
      <p>Talvez o uso mais impactante da IA no setor financeiro seja na segurança. Sistemas de aprendizado de máquina são capazes de analisar milhões de transações em tempo real, identificando padrões suspeitos que escapariam à análise humana.</p>
      
      <p>O Banco do Brasil reportou uma redução de 60% em fraudes de cartão de crédito após implementar um sistema avançado de IA para detecção de anomalias. Similarmente, fintechs como a Creditas utilizam IA para avaliar o risco de crédito de maneira mais precisa que os modelos tradicionais de scoring.</p>
      
      <h2>Desafios e considerações éticas</h2>
      
      <p>A implementação de IA no setor financeiro não está isenta de desafios. Preocupações com privacidade de dados, potencial viés algorítmico e a necessidade de transparência nas decisões automatizadas são questões que o setor precisa enfrentar.</p>
      
      <p>Reguladores como o Banco Central do Brasil estão desenvolvendo frameworks para supervisionar o uso de IA em serviços financeiros, buscando um equilíbrio entre inovação e proteção ao consumidor.</p>
      
      <h2>O futuro: IA generativa e além</h2>
      
      <p>O surgimento da IA generativa, exemplificada por modelos como GPT e DALL-E, abre novas possibilidades. Bancos estão explorando como esses sistemas podem criar conteúdo personalizado de educação financeira, gerar relatórios de investimentos adaptados ao perfil do cliente, e até desenvolver cenários de planejamento financeiro altamente customizados.</p>
      
      <p>No horizonte mais distante, tecnologias como computação quântica prometem elevar o potencial da IA financeira a patamares inimagináveis, com capacidade de modelar riscos complexos e otimizar portfólios em escala global.</p>
      
      <p>Para consumidores e investidores, essa revolução tecnológica significa serviços financeiros mais acessíveis, personalizados e seguros. Para profissionais do setor, representa uma transformação profunda que exigirá novas habilidades e adaptabilidade. O futuro do setor financeiro está sendo escrito com algoritmos, e quem melhor dominar essa linguagem liderará o mercado nas próximas décadas.</p>
    `,
    category: "Tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2032&auto=format&fit=crop",
    date: "10 Mai 2023",
    readTime: "10 min de leitura",
    authorName: "Fernanda Lima",
    authorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
    authorBio: "Especialista em tecnologia financeira e consultora para fintechs.",
  },
  // Outros artigos simulados aqui
];

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está logado
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }

    // Simular busca de artigo por ID (seria do Supabase)
    const foundArticle = mockArticles.find((a) => a.id === id);
    
    if (foundArticle) {
      // Simular carregamento
      setTimeout(() => {
        setArticle(foundArticle);
        setIsLoading(false);
      }, 800);
    } else {
      navigate("/not-found");
    }
  }, [id, navigate]);

  // Função para revelar elementos conforme o scroll
  useEffect(() => {
    const handleScroll = () => {
      const reveals = document.querySelectorAll('.reveal');
      
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Revelar elementos visíveis no carregamento inicial
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />

      {isLoading ? (
        <div className="container mx-auto px-4 pt-32 pb-20 flex justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-zinc-700 rounded-full"></div>
            <p className="mt-4 text-zinc-500">Carregando artigo...</p>
          </div>
        </div>
      ) : article ? (
        <>
          {/* Hero Section */}
          <section className="pt-24 pb-8">
            <div className="container mx-auto px-4">
              <AnimatedElement>
                <div className="flex items-center space-x-2 text-zinc-400 text-sm mb-4">
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </AnimatedElement>
              
              <AnimatedElement className="animate-delay-100">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-4xl">
                  {article.title}
                </h1>
              </AnimatedElement>
              
              <AnimatedElement className="animate-delay-200">
                <div className="flex items-center space-x-3 mb-8">
                  {article.authorAvatar ? (
                    <img 
                      src={article.authorAvatar} 
                      alt={article.authorName} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-lg font-medium">
                      {article.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{article.authorName}</div>
                    <div className="text-zinc-400 text-sm">{article.authorBio}</div>
                  </div>
                </div>
              </AnimatedElement>
            </div>
          </section>
          
          {/* Featured Image */}
          <section className="mb-12">
            <div className="container mx-auto px-4">
              <AnimatedElement className="animate-delay-300">
                <div className="aspect-video w-full overflow-hidden rounded-xl">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </AnimatedElement>
            </div>
          </section>
          
          {/* Article Content */}
          <section className="pb-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-12 gap-8">
                {/* Social sharing sidebar */}
                <aside className="hidden lg:block col-span-1">
                  <div className="sticky top-32 flex flex-col space-y-4 items-center">
                    <LikeButton articleId={article.id} />
                  </div>
                </aside>
                
                {/* Main content */}
                <article className="col-span-12 lg:col-span-8 space-y-6 text-lg leading-relaxed">
                  <div 
                    className="article-content space-y-6" 
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                  
                  {/* Mobile social bar */}
                  <div className="lg:hidden flex justify-center my-8">
                    <LikeButton articleId={article.id} />
                  </div>
                  
                  <Separator className="my-8 bg-zinc-800" />
                  
                  <AnimatedText 
                    text="Se você gostou deste artigo, deixe um comentário abaixo compartilhando suas ideias."
                    className="text-zinc-400 italic text-center"
                  />
                  
                  {/* Comments Section */}
                  <CommentSection articleId={article.id} />
                </article>
                
                {/* Sidebar/Related Content */}
                <aside className="hidden lg:block col-span-3">
                  <div className="sticky top-32 space-y-8">
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                      <h3 className="text-xl font-bold mb-4">Artigos relacionados</h3>
                      <ul className="space-y-4">
                        {mockArticles
                          .filter((a) => a.id !== article.id)
                          .slice(0, 3)
                          .map((relatedArticle) => (
                            <li key={relatedArticle.id} className="group">
                              <a 
                                href={`/article/${relatedArticle.id}`} 
                                className="flex gap-3 items-start"
                              >
                                <img 
                                  src={relatedArticle.imageUrl} 
                                  alt={relatedArticle.title} 
                                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                />
                                <div>
                                  <h4 className="font-medium group-hover:text-white transition-colors">
                                    {relatedArticle.title}
                                  </h4>
                                  <p className="text-xs text-zinc-400">{relatedArticle.date}</p>
                                </div>
                              </a>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <Footer />
    </main>
  );
}
