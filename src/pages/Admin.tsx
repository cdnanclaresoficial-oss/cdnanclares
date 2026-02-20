import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fichasService, pedidosService, authService } from "@/lib/supabase";
import AdminLogin from "@/components/admin/AdminLogin";
import PlayersTab from "@/components/admin/PlayersTab";
import OrdersTab from "@/components/admin/OrdersTab";
import DashboardTab from "@/components/admin/DashboardTab";
import AnalystChat from "@/components/admin/AnalystChat";
import type { FichaJugador, PedidoRopa } from "@/types";

const Admin = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [jugadores, setJugadores] = useState<FichaJugador[]>([]);
  const [pedidos, setPedidos] = useState<PedidoRopa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.getSession().then((session) => {
      setIsLoggedIn(!!session);
      setCheckingAuth(false);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [j, p] = await Promise.all([fichasService.getAll(), pedidosService.getAll()]);
      setJugadores(j as FichaJugador[]);
      setPedidos(p as PedidoRopa[]);
    } catch (err: any) {
      toast({ title: "Error al cargar datos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  const handleLogout = async () => {
    await authService.signOut();
    setIsLoggedIn(false);
  };

  if (checkingAuth) {
    return (
      <main className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </main>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <main className="pt-20 min-h-screen bg-background">
      <section className="gradient-navy py-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-primary-foreground uppercase tracking-tight">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={fetchData} disabled={loading} className="text-primary-foreground/70 hover:text-primary-foreground">
              <RefreshCw size={18} className={loading ? "animate-spin mr-2" : "mr-2"} /> Actualizar
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground">
              <LogOut size={18} className="mr-2" /> Salir
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="font-heading uppercase tracking-wider">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="jugadores" className="font-heading uppercase tracking-wider">
              Jugadores ({jugadores.length})
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="font-heading uppercase tracking-wider">
              Pedidos ({pedidos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab jugadores={jugadores} />
          </TabsContent>

          <TabsContent value="jugadores">
            <PlayersTab jugadores={jugadores} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="pedidos">
            <OrdersTab pedidos={pedidos} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chatbot */}
      <AnalystChat />
    </main>
  );
};

export default Admin;
