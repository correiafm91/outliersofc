
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

type AuthMode = "signin" | "signup";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulando authenticação - será substituído por Supabase quando integrado
      setTimeout(() => {
        // Fingindo um login bem-sucedido
        localStorage.setItem("user", JSON.stringify({ email }));
        toast({
          title: mode === "signin" ? "Login realizado com sucesso!" : "Conta criada com sucesso!",
          description: "Bem-vindo à Outliers.",
        });
        navigate("/");
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Houve um problema ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-black/70 backdrop-blur-sm animate-fade-in">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}
        </CardTitle>
        <CardDescription className="text-center text-zinc-400">
          {mode === "signin" 
            ? "Entre com seu email e senha para acessar" 
            : "Preencha os campos abaixo para se cadastrar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-zinc-200" 
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : mode === "signin" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-zinc-400 text-center">
          {mode === "signin" ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
          <Button 
            variant="link" 
            onClick={toggleMode} 
            className="pl-1 underline text-white"
          >
            {mode === "signin" ? "Cadastre-se" : "Faça login"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
