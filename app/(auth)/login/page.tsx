import { SignInForm } from '../_components/SignInForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}
