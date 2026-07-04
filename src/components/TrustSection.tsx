import { useEffect, useRef, useState } from "react";
import { Star, Bike, Package, ShieldCheck, Users, LucideIcon } from "lucide-react";
import { useInstagramFollowers } from "@/hooks/useInstagramFollowers";

interface StatItem {
  icon: LucideIcon;
  targetValue: number;
  suffix: string;
  label: string;
  decimals?: number;
  colorClass: string;
}

const statsConfig: StatItem[] = [
  { icon: Star, targetValue: 4.8, suffix: "/5", label: "Google Rating", decimals: 1, colorClass: "text-yellow-400" },
  { icon: Bike, targetValue: 1500, suffix: "+", label: "Bikes Modified", colorClass: "text-primary" },
  { icon: Package, targetValue: 150, suffix: "+", label: "Premium Products", colorClass: "text-primary" },
  { icon: ShieldCheck, targetValue: 4, suffix: "+", label: "Years Experience", colorClass: "text-secondary" },
];

const StatCard = ({ icon: Icon, targetValue, suffix, label, decimals = 0, colorClass, isVisible }: StatItem & { isVisible: boolean }) => {
  const [currentValue, setCurrentValue] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!isVisible || animatedRef.current) return;
    animatedRef.current = true;

    const duration = 2000;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      setCurrentValue(eased * targetValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, targetValue]);

  const displayValue = currentValue.toFixed(decimals);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card/40 border border-border/30 hover:border-primary/20 transition-colors">
      <Icon className={`w-6 h-6 mb-2 ${colorClass}`} />
      <span className="text-xl md:text-2xl font-display font-black tracking-tight text-foreground">
        {displayValue}
        <span className="text-primary font-heading font-semibold text-sm md:text-base ml-0.5">{suffix}</span>
      </span>
      <span className="text-[10px] md:text-xs text-muted-foreground uppercase font-heading tracking-wider mt-1 text-center font-medium">
        {label}
      </span>
    </div>
  );
};

const TrustSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { count: instaCount, loading: instaLoading } = useInstagramFollowers();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-10 px-4 bg-background relative border-y border-border/20"
      id="trust-stats"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/2 to-transparent opacity-30 pointer-events-none" />
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {statsConfig.map((stat, idx) => (
            <StatCard key={idx} {...stat} isVisible={isVisible} />
          ))}
          <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center p-4 rounded-xl bg-card/40 border border-border/30 hover:border-primary/20 transition-colors">
            <Users className="w-6 h-6 mb-2 text-primary" />
            <span className="text-xl md:text-2xl font-display font-black tracking-tight text-foreground">
              {instaLoading ? "7K" : (instaCount || 7300).toLocaleString("en-IN")}
              <span className="text-primary font-heading font-semibold text-sm md:text-base ml-0.5">+</span>
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground uppercase font-heading tracking-wider mt-1 text-center font-medium">
              Instagram Family
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
