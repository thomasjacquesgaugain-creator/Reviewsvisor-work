import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  created_at: string;
  subscription?: {
    plan_code: string;
    status: string;
  };
  _count?: {
    establishments: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Récupérer les utilisateurs depuis auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Pour chaque utilisateur, récupérer son abonnement et le nombre d'établissements
      const enrichedUsers = await Promise.all(
        (authUsers?.users || []).map(async (user) => {
          // Récupérer l'abonnement
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_code, status')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Compter les établissements
          const { count } = await supabase
            .from('establishments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            id: user.id,
            email: user.email || 'N/A',
            created_at: user.created_at,
            subscription: subscription || undefined,
            _count: {
              establishments: count || 0
            }
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          Administrez les comptes utilisateurs de la plateforme
        </p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés actifs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.subscription?.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En essai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.subscription?.status === 'trialing').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Établissements</th>
                  <th className="p-4 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.subscription ? (
                        <Badge variant="outline">
                          {user.subscription.plan_code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.subscription && (
                        <Badge variant={
                          user.subscription.status === 'active' ? 'default' :
                          user.subscription.status === 'trialing' ? 'secondary' :
                          'destructive'
                        }>
                          {user.subscription.status}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{user._count?.establishments || 0}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "d MMM yyyy", { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}