import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ADMIN_EMAIL, adminLogin, isAdminLoggedIn } from "@/lib/adminAuth";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAdminLoggedIn()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) return;

    const success = await adminLogin(email, password);
    if (success) {
      toast.success("Welcome, Admin!");
      navigate("/admin/dashboard");
    } else {
      toast.error("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-card border border-border rounded-xl p-6 space-y-4">
        <h1 className="font-display text-lg text-center neon-glow-cyan">Admin Login</h1>
        <p className="text-xs text-center text-muted-foreground">Only {ADMIN_EMAIL} can sign in.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-heading font-bold py-3 rounded-full text-sm hover:scale-105 transition-transform"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
