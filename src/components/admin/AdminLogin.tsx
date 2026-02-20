import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/supabase";

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Introduce tus credenciales", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email, password);
      toast({ title: "Sesión iniciada" });
      onLogin();
    } catch (err: any) {
      toast({ title: "Error de autenticación", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-20 min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <LogIn className="mx-auto text-primary mb-4" size={40} />
          <h1 className="font-heading text-3xl font-bold text-primary uppercase">Panel Admin</h1>
          <p className="text-muted-foreground text-sm mt-2">Acceso restringido para gestores del club</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-primary">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cdnanclares.com"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-primary">Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-navy-light font-heading uppercase tracking-wider"
          >
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
