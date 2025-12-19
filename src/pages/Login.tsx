import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IS_LOCAL_DB } from "@/config/env";
import { loginLocal } from "@/integrations/localAuth";
import { useNavigate } from "react-router-dom";
import { User, Session } from '@supabase/supabase-js';

const Login = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (IS_LOCAL_DB) {
        await loginLocal(email, password);
        toast({ title: "Login realizado com sucesso!", description: "Redirecionando..." });
        navigate('/');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando...",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      if (IS_LOCAL_DB) {
        // No modo local, cadastro via Supabase está desativado.
        toast({
          title: "Cadastro indisponível",
          description: "No modo local, use um dos usuários padrão.",
        });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: 'user'
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu e-mail para confirmar a conta",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin(email, password);
    };

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    );
  };

  const SignUpForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSignUp(email, password, fullName);
    };

    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Nome Completo</Label>
          <Input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">E-mail</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Senha</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
         style={{ background: 'linear-gradient(135deg, hsl(151 40% 92%) 0%, hsl(151 30% 95%) 50%, hsl(151 25% 97%) 100%)' }}>
      
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20" 
             style={{ background: 'radial-gradient(circle, hsl(151 55% 53% / 0.3) 0%, transparent 70%)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, hsl(151 55% 53% / 0.2) 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-primary/40 rounded-full"></div>
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-primary/20 rounded-full"></div>
      </div>

      <Card className="w-full max-w-md shadow-large relative z-10 backdrop-blur-sm bg-card/95 border-border/50">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, hsl(151 55% 53%), hsl(151 55% 48%))' }}>
            <span className="text-2xl font-bold text-primary-foreground">CF</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">Cantina Fácil</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Sistema de gestão escolar
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm />
          <div className="text-center text-sm text-muted-foreground">
            Entre em contato com o administrador para obter acesso
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;