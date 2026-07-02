import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkSessionValid } from "@/lib/adminAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    
    const verify = async () => {
      const result = await checkSessionValid();
      if (active) {
        setIsValid(result);
      }
    };

    verify();

    return () => {
      active = false;
    };
  }, []);

  // Return empty/loading screen to completely prevent protected UI flashing
  if (isValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;
