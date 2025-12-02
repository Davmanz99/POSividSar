import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark')

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
    }

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? (
                <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 transition-all" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem] text-slate-900 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
