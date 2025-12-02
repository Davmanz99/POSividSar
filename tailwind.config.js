/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "var(--bg-primary)",
                foreground: "var(--text-primary)",
                primary: {
                    DEFAULT: "var(--accent-primary)",
                    foreground: "#000000",
                },
                secondary: {
                    DEFAULT: "var(--accent-secondary)",
                    foreground: "#ffffff",
                },
                destructive: {
                    DEFAULT: "var(--accent-danger)",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "var(--bg-secondary)",
                    foreground: "var(--text-muted)",
                },
                accent: {
                    DEFAULT: "var(--accent-primary)",
                    foreground: "#000000",
                },
                card: {
                    DEFAULT: "var(--bg-card)",
                    foreground: "var(--text-primary)",
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
