import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { IS_LOCAL_DB } from "@/config/env";
import { getUser as getLocalUser, meLocal, AUTH_EVENT } from "@/integrations/localAuth";
import Login from "@/pages/Login";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_LOCAL_DB) {
      // Em modo local, exigimos login via servidor local e reagimos a mudanças de sessão
      const checkLocalSession = async () => {
        const localUser = getLocalUser();
        if (!localUser) {
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }
        const verified = await meLocal();
        if (verified) {
          setUser({} as User);
          setSession({} as Session);
        } else {
          setUser(null);
          setSession(null);
        }
        setLoading(false);
      };

      // Checagem inicial
      checkLocalSession();

      // Ouvir eventos de mudança de auth local (login/logout)
      const handler = () => { checkLocalSession(); };
      window.addEventListener(AUTH_EVENT, handler);
      return () => {
        window.removeEventListener(AUTH_EVENT, handler);
      };
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Em modo local, mostrar Login se não houver sessão local
  if (IS_LOCAL_DB && !user) {
    return <Login />;
  }

  // Em modo Supabase, exigir usuário autenticado
  if (!IS_LOCAL_DB && !user) {
    return <Login />;
  }

  return <>{children}</>;
};

export default AuthWrapper;