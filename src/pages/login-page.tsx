import { AuthLayout } from "@/features/auth/auth-layout"
import { LoginForm } from "@/features/auth/login-form"

export function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    )
}
