import bike1 from "@/assets/bike1.png";
import bike2 from "@/assets/bike2.png";
import bike3 from "@/assets/bike3.png";
import bike4 from "@/assets/bike4.png";
import bike5 from "@/assets/bike5.png";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";

export const DEFAULT_GALLERY_CATEGORIES = [
  "Custom Builds",
  "LED & Neon",
  "Wraps & Paint",
  "Alloy & Tyre",
  "Before & After",
  "Workshop",
];

export const DEFAULT_GALLERY_IMAGES = [
  { src: bike1, cat: "LED & Neon", instagram_post_url: "https://www.instagram.com/reel/C8XyZ1/", label: "Yamaha R15 V3 Neon Custom Wrap", compatible_bikes: ["R15", "Yamaha", "V3"] },
  { src: bike2, cat: "Wraps & Paint", instagram_post_url: "https://www.instagram.com/reel/C8XyZ1/", label: "KTM Duke 200 Custom Painting", compatible_bikes: ["Duke", "KTM", "200"] },
  { src: bike3, cat: "Custom Builds", instagram_post_url: "https://www.instagram.com/reel/C8XyZ1/", label: "Royal Enfield Himalayan Custom Build", compatible_bikes: ["Himalayan", "Royal Enfield", "RE"] },
  { src: bike4, cat: "LED & Neon", label: "Bajaj Pulsar 220 LED Lighting Mod", compatible_bikes: ["Pulsar", "Pulsar 220", "Bajaj"] },
  { src: bike5, cat: "Custom Builds", label: "KTM Duke 390 Stealth Edition Paint", compatible_bikes: ["Duke", "KTM", "390"] },
  { src: helmets, cat: "Workshop", label: "Axxis Premium Custom Helmet Painting", compatible_bikes: [] },
  { src: tyres, cat: "Alloy & Tyre", instagram_post_url: "https://www.instagram.com/reel/C8XyZ1/", label: "KTM Duke Alloy Wheel Neon Painting", compatible_bikes: ["Duke", "KTM", "Alloy"] },
];

export const DEFAULT_SIGNATURE_WORK = [
  { image_url: bike2, label: "Custom Paint & Wrap", order_index: 0 },
  { image_url: bike3, label: "Custom Build", order_index: 1 },
  { image_url: bike1, label: "LED & Neon Lighting", order_index: 2 },
  { image_url: bike5, label: "Touring Setup", order_index: 3 },
  { image_url: bike4, label: "Alloy Customization", order_index: 4 },
];

export const DEFAULT_DELIVERY_CATEGORIES = [
  { id: "fallback-helmets", name: "Helmets", icon_url: helmets, order_index: 0 },
  { id: "fallback-tyres", name: "Tyres & Wheels", icon_url: tyres, order_index: 1 },
  { id: "fallback-custom", name: "Custom Builds", icon_url: bike3, order_index: 2 },
  { id: "fallback-lighting", name: "Lighting & LED", icon_url: bike1, order_index: 3 },
];

export const DEFAULT_DELIVERY_ITEMS: Record<string, { image_url: string; label: string; order_index: number }[]> = {
  "fallback-helmets": [
    { image_url: helmets, label: "Racing Helmet", order_index: 0 },
    { image_url: helmets, label: "Touring Helmet", order_index: 1 },
  ],
  "fallback-tyres": [
    { image_url: tyres, label: "Alloy Wheel Set", order_index: 0 },
    { image_url: tyres, label: "Performance Tyre", order_index: 1 },
  ],
  "fallback-custom": [
    { image_url: bike3, label: "Custom Build Kit", order_index: 0 },
    { image_url: bike5, label: "Touring Upgrade", order_index: 1 },
  ],
  "fallback-lighting": [
    { image_url: bike1, label: "LED Glow Kit", order_index: 0 },
    { image_url: bike4, label: "Neon Accent Pack", order_index: 1 },
  ],
};
