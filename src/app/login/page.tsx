import { AuthVisual, LoginForm } from "@/components/auth-panel";

export default function LoginPage() {
  return (
    <div className="mobile-screen grid bg-white lg:min-h-[720px] lg:grid-cols-[1fr_430px]">
      <AuthVisual mode="login" />
      <LoginForm />
    </div>
  );
}
