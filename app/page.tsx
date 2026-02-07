import Link from 'next/link'
import { ArrowRight, Zap, Users, Lightbulb, TrendingUp, Target, Crown, Sparkles, MessageSquare, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const panelCategories = [
    { icon: Sparkles, name: 'Mentors', desc: 'Master strategists who challenge your mindset', color: 'bg-purple-500' },
    { icon: TrendingUp, name: 'Investors', desc: 'Sharks who demand numbers and execution', color: 'bg-green-500' },
    { icon: Crown, name: 'Leaders', desc: 'Visionaries who push purpose and ethics', color: 'bg-blue-500' },
  ]

  const featuredPanelists = [
    { name: "Kevin O'Leary", avatar: 'KO', role: 'Financial Enforcer', color: 'bg-green-500' },
    { name: 'Tony Robbins', avatar: 'TR', role: 'Belief Breaker', color: 'bg-purple-500' },
    { name: 'Mark Cuban', avatar: 'MC', role: 'Product Truth-Teller', color: 'bg-green-500' },
    { name: 'Simon Sinek', avatar: 'SS', role: 'Purpose Clarifier', color: 'bg-blue-500' },
    { name: 'Barbara Corcoran', avatar: 'BC', role: 'Intuitive Judge', color: 'bg-green-500' },
    { name: 'Indra Nooyi', avatar: 'IN', role: 'Growth Strategist', color: 'bg-blue-500' },
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm fixed w-full z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center text-white font-bold">KK</div>
              <span className="font-bold text-lg">War Room</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-yellow-500/5 to-transparent px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Shark Tank Meets AI-Powered Training
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Pitch to World-Class
            <span className="block bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Virtual Investors
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Face a simulated panel of legendary investors, mentors, and business leaders. 
            Get grilled on your startup decisions. Build founder resilience.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90">
                Enter the War Room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
              Watch Demo
            </Button>
          </div>

          {/* Featured Panelists Preview */}
          <div className="mt-12 flex justify-center items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground mr-2">Face panelists like:</span>
            {featuredPanelists.map((p, idx) => (
              <div 
                key={idx}
                className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-sm -ml-2 first:ml-0 border-2 border-background shadow-md hover:scale-110 transition-transform cursor-pointer`}
                title={`${p.name} - ${p.role}`}
              >
                {p.avatar}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-2">+ 15 more</span>
          </div>
        </div>
      </section>

      {/* How It Works - Shark Tank Style */}
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold mb-4">Your Shark Tank Experience</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Not just another assessment. This is a pressure-tested simulation that builds real founder skills.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative p-6 rounded-xl border bg-gradient-to-b from-purple-500/10 to-transparent border-purple-500/20">
              <div className="absolute -top-4 left-6 bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <Users className="h-10 w-10 text-purple-500 mb-4 mt-2" />
              <h3 className="font-semibold text-lg mb-2">Assemble Your Panel</h3>
              <p className="text-sm text-muted-foreground">
                Choose 6 panelists: 2 mentors, 2 investors, 2 leaders. Each has a unique lens and challenges you differently.
              </p>
            </div>
            <div className="relative p-6 rounded-xl border bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/20">
              <div className="absolute -top-4 left-6 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <MessageSquare className="h-10 w-10 text-yellow-500 mb-4 mt-2" />
              <h3 className="font-semibold text-lg mb-2">Pitch & Defend</h3>
              <p className="text-sm text-muted-foreground">
                Navigate 6 business stages. Answer hard questions. Your decisions affect your startup's cash, team, and reputation.
              </p>
            </div>
            <div className="relative p-6 rounded-xl border bg-gradient-to-b from-green-500/10 to-transparent border-green-500/20">
              <div className="absolute -top-4 left-6 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <Target className="h-10 w-10 text-green-500 mb-4 mt-2" />
              <h3 className="font-semibold text-lg mb-2">Get Graded</h3>
              <p className="text-sm text-muted-foreground">
                Receive AI-powered feedback from each panelist. Discover blind spots, conflicting advice, and your founder profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Panel Categories */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold mb-4">Meet Your Panel Categories</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Each category brings a different perspective. Their advice will often conflict — you must choose wisely.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {panelCategories.map((cat, idx) => {
              const Icon = cat.icon
              return (
                <div key={idx} className="group p-8 rounded-2xl border hover:shadow-xl transition-all hover:-translate-y-1 bg-card">
                  <div className={`w-14 h-14 rounded-xl ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{cat.name}</h3>
                  <p className="text-muted-foreground">{cat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* The Twist Section */}
      <section className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">The Twist: Conflicting Advice</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Kevin O'Leary wants you to cut costs. Richard Branson says invest in culture. 
            Grant Cardone screams 10X. Codie Sanchez warns about cash flow.
          </p>
          <p className="text-xl font-semibold bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Real entrepreneurs face conflicting advice every day. Learn to navigate it.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-yellow-600 text-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Ready to Face the Panel?</h2>
          <p className="mt-4 text-lg opacity-90">
            Two attempts. Six stages. One shot at proving you've got what it takes.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Enter the War Room
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2026 KK's War Room. All rights reserved.</p>
          <p className="mt-2 text-xs">Inspired by Shark Tank. Powered by AI. Built for founders.</p>
        </div>
      </footer>
    </div>
  )
}
