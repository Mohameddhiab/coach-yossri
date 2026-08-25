import { Redirect } from "expo-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Spinner } from "@/components/ui/loader";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }
  if (user) {
    return <Redirect href={user.role === "COACH" ? "/dashboard" : "/(tabs)/plan"} />;
  }
  return <Redirect href="/login" />;
}