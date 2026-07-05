import { useInstagramFollowers } from "@/hooks/useInstagramFollowers";

const InstagramCounter = () => {
  const { count, loading, ref } = useInstagramFollowers();

  // Show a static fallback count immediately to prevent visual layout shift or blank hole
  const formatted = (loading ? 7375 : count).toLocaleString("en-IN");

  return (
    <span ref={ref} className="tabular-nums">{formatted}+</span>
  );
};

export default InstagramCounter;
