import { LoginForm } from "./login-form";
import { peekAuthDebugCookie } from "@/lib/auth-debug";

export default async function LoginPage() {
  const initialDebug = await peekAuthDebugCookie();
  return <LoginForm initialDebug={initialDebug} />;
}
