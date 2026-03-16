import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToHash from "@/components/ScrollToHash";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DeliveryPage from "./pages/Delivery";
import ContactPage from "./pages/Contact";
import AboutPage from "./pages/About";
import CustomWorkPage from "./pages/CustomWork";
import BikeAccessoriesCityPage from "./pages/BikeAccessoriesCity";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/custom-work" element={<CustomWorkPage />} />

          <Route
            path="/bike-accessories-kakinada"
            element={
              <BikeAccessoriesCityPage
                cityName="Kakinada"
                title="Bike Accessories in Kakinada | Helmets & Riding Gear | Bikers Choice"
                paragraph="Bikers Choice is a premium bike accessories and motorcycle modification shop in Kakinada offering helmets, riding gear, fog lights, tyres and custom motorcycle upgrades. Riders can visit our store in Kakinada or order accessories online with courier delivery across Andhra Pradesh including Vizag, Rajahmundry and Tuni."
                canonicalPath="/bike-accessories-kakinada"
              />
            }
          />
          <Route
            path="/bike-accessories-vizag"
            element={
              <BikeAccessoriesCityPage
                cityName="Vizag"
                title="Bike Accessories in Vizag | Helmets & Riding Gear | Bikers Choice"
                paragraph="Bikers Choice supplies premium motorcycle helmets, riding gear and bike accessories for riders in Visakhapatnam with courier delivery from our Kakinada store."
                canonicalPath="/bike-accessories-vizag"
              />
            }
          />
          <Route
            path="/bike-accessories-rajahmundry"
            element={
              <BikeAccessoriesCityPage
                cityName="Rajahmundry"
                title="Bike Accessories in Rajahmundry | Helmets & Riding Gear | Bikers Choice"
                paragraph="Bikers Choice supplies premium motorcycle helmets, riding gear and bike accessories for riders in Rajahmundry with courier delivery from our Kakinada store."
                canonicalPath="/bike-accessories-rajahmundry"
              />
            }
          />
          <Route
            path="/bike-accessories-tuni"
            element={
              <BikeAccessoriesCityPage
                cityName="Tuni"
                title="Bike Accessories in Tuni | Helmets & Riding Gear | Bikers Choice"
                paragraph="Bikers Choice supplies premium motorcycle helmets, riding gear and bike accessories for riders in Tuni with courier delivery from our Kakinada store."
                canonicalPath="/bike-accessories-tuni"
              />
            }
          />
          <Route
            path="/bike-accessories-samalkot"
            element={
              <BikeAccessoriesCityPage
                cityName="Samalkot"
                title="Bike Accessories in Samalkot | Helmets & Riding Gear | Bikers Choice"
                paragraph="Bikers Choice supplies premium motorcycle helmets, riding gear and bike accessories for riders in Samalkot with courier delivery from our Kakinada store."
                canonicalPath="/bike-accessories-samalkot"
              />
            }
          />

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
