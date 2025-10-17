import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Zap, Shield, ImageIcon, Moon } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">ChatFlow</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Real-time messaging that brings teams together
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
            Connect instantly with colleagues, friends, and communities. Share messages, files, and ideas in real-time
            with a beautiful, modern interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Start Chatting Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Everything you need to communicate</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Real-time messaging with WebSocket technology. Messages appear instantly with zero delay."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Group Chats"
              description="Create group conversations and collaborate with multiple people at once."
            />
            <FeatureCard
              icon={<ImageIcon className="h-8 w-8" />}
              title="File Sharing"
              description="Share images, documents, and files seamlessly within your conversations."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Secure & Private"
              description="Your conversations are protected with industry-standard security practices."
            />
            <FeatureCard
              icon={<Moon className="h-8 w-8" />}
              title="Dark Mode"
              description="Beautiful light and dark themes that adapt to your preferences."
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="Typing Indicators"
              description="See when others are typing to make conversations feel more natural."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-primary text-primary-foreground rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg mb-8 opacity-90">Join thousands of users already chatting on ChatFlow</p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 ChatFlow. Built with Next.js and WebSockets.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
