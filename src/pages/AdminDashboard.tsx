import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Image, Truck, Settings, LayoutGrid } from "lucide-react";
import AdminSignatureWork from "@/components/admin/AdminSignatureWork";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminDelivery from "@/components/admin/AdminDelivery";
import AdminSettings from "@/components/admin/AdminSettings";
import { isAdminLoggedIn, adminLogout } from "@/lib/adminAuth";

const tabs = [
  { id: "signature", label: "Signature Work", icon: Image },
  { id: "gallery", label: "Gallery", icon: LayoutGrid },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("signature");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    await adminLogout();
    toast.success("Logged out");
    navigate("/admin/login");
  };

  if (!isAdminLoggedIn()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-display text-sm neon-glow-cyan">Admin Panel</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-hide border-b border-border">
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === "signature" && <AdminSignatureWork />}
        {activeTab === "gallery" && <AdminGallery />}
        {activeTab === "delivery" && <AdminDelivery />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
};

export default AdminDashboard;
