import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { useStore } from "@/store/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Lock, User, AlertCircle, Zap } from "lucide-react"

const formSchema = z.object({
    username: z.string().min(1, "El usuario es requerido"),
    password: z.string().min(1, "La contraseña es requerida"),
})

export function LoginForm() {
    const navigate = useNavigate()
    const login = useStore((state) => state.login)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError("")
        setIsLoading(true)
        try {
            const { success, message } = await login(values.username, values.password)

            if (success) {
                navigate("/")
            } else {
                setError(message || "Credenciales inválidas")
            }
        } catch (e) {
            setError("Error al iniciar sesión")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black/60 backdrop-blur-2xl">
            <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)] mb-4 group">
                    <Zap className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardTitle className="text-3xl text-white font-display tracking-tight">NEXUS<span className="text-primary">POS</span></CardTitle>
                <CardDescription className="text-base">Sistema de Gestión Inteligente</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <Input
                                placeholder="Usuario"
                                className="pl-10 h-12 text-base"
                                {...form.register("username")}
                                autoCapitalize="none"
                                autoCorrect="off"
                                autoComplete="username"
                            />
                        </div>
                        {form.formState.errors.username && (
                            <p className="text-xs text-destructive ml-1">{form.formState.errors.username.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <Input
                                type="password"
                                placeholder="Contraseña"
                                className="pl-10 h-12 text-base"
                                {...form.register("password")}
                            />
                        </div>
                        {form.formState.errors.password && (
                            <p className="text-xs text-destructive ml-1">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <Button type="submit" variant="neon" size="lg" className="w-full mt-4 text-base font-bold tracking-widest" disabled={isLoading}>
                        {isLoading ? "VERIFICANDO..." : "INICIAR SESIÓN"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center pb-8">
                <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>Acceso Seguro v2.0</p>
                </div>
            </CardFooter>
        </Card >
    )
}
