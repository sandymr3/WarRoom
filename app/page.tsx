import Link from 'next/link'
import { ArrowRight, Zap, BarChart3, Users, Lightbulb, TrendingUp, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const competencies = [
    { icon: Lightbulb, name: 'Problem Sensing', desc: 'Identify market opportunities' },
    { icon: Users, name: 'Team Building', desc: 'Build and scale teams' },
    { icon: TrendingUp, name: 'Growth Mindset', desc: 'Continuous improvement' },
    { icon: BarChart3, name: 'Financial Acumen', desc: 'Manage resources wisely' },
    { icon: Target, name: 'Strategic Vision', desc: 'Plan for the future' },
    { icon: Zap, name: 'Execution Excellence', desc: 'Get things done' }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">KK</div>
              <span className="font-bold text-lg">War Room</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Assess Your Entrepreneurial DNA
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Evaluate your 16 core entrepreneurial competencies across 6 business stages. Get AI-powered insights and personalized development roadmaps to accelerate your success.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-primary">16</div>
              <p className="mt-2 text-sm text-muted-foreground">Core Competencies</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">150+</div>
              <p className="mt-2 text-sm text-muted-foreground">Adaptive Questions</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">2</div>
              <p className="mt-2 text-sm text-muted-foreground">Attempts to Improve</p>
            </div>
          </div>
        </div>
      </section>

      {/* Competencies Grid */}
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold mb-4">Master These 16 Competencies</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our framework evaluates critical entrepreneurial skills across discovery, execution, leadership, and resilience.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {competencies.map((comp, idx) => {
              const Icon = comp.icon
              return (
                <div key={idx} className="card-base p-6 hover:shadow-md transition-shadow">
                  <Icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold">{comp.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{comp.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
              </div>
              <h3 className="font-semibold">Take Assessment</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Answer 150+ adaptive questions across 6 business stages. ~90 minutes per attempt.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
              </div>
              <h3 className="font-semibold">Get AI Insights</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Receive detailed AI-powered analysis with competency scores and mistake triggers.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
              </div>
              <h3 className="font-semibold">Develop Skills</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Follow personalized roadmaps. Take attempt 2 to track improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Ready to Assess Your Entrepreneurial DNA?</h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of entrepreneurs who've used our assessment to accelerate their growth.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2026 KK's War Room. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
