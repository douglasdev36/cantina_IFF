import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IS_LOCAL_DB } from '@/config/env';
import { getUser as getLocalUser } from '@/integrations/localAuth';

export type UserRole = 'user' | 'admin_normal' | 'super_admin';

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        if (IS_LOCAL_DB) {
          const localUser = getLocalUser();
          if (localUser?.role) {
            setRole(localUser.role);
          } else {
            setRole('user');
          }
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Buscar role da nova tabela user_roles (mais seguro)
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .order('role', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (error) {
            console.error('Erro ao buscar role do usuário:', error);
          } else {
            setRole(data?.role as UserRole || 'user');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();

    // Listen for auth changes
    if (!IS_LOCAL_DB) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          getUserRole();
        } else if (event === 'SIGNED_OUT') {
          setRole(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const isAdmin = role === 'admin_normal' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  return {
    role,
    loading,
    isAdmin,
    isSuperAdmin
  };
}