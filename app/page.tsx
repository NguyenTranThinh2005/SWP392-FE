'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BookOpen,
  Users,
  CheckCircle,
  BarChart3,
  Layers,
  PencilLine,
  ClipboardList,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'mangaka' | 'assistant' | 'editor' | 'board'>('mangaka')

  const rolesDetails = {
    mangaka: {
      title: 'Mangaka (Author)',
      subtitle: 'Bring your story to life',
      desc: 'Submit new series proposals, upload chapter manuscripts, and collaborate directly with your assigned Tantou Editor.',
      features: [
        'Propose new works with genre, publication type, and synopsis',
        'Submit new manuscript drafts (PDF/ZIP)',
        'Track version history and editorial feedback cycles',
        'Collaborate with assistants on drawing tasks'
      ],
      color: 'from-purple-500 to-indigo-600',
      badge: 'Author Portal'
    },
    assistant: {
      title: 'Assistant (Assistant Artist)',
      subtitle: 'Focus on drawing details',
      desc: 'Receive tasks for lining, inking, or drawing backgrounds for specific pages assigned by the Mangaka. Submit progress in real time.',
      features: [
        'View page-by-page task assignments',
        'Upload completed pages',
        'Track deadlines and task priorities',
        'Receive feedback and revision notes'
      ],
      color: 'from-blue-500 to-cyan-600',
      badge: 'Assistant Hub'
    },
    editor: {
      title: 'Tantou Editor',
      subtitle: 'Guide the work to success',
      desc: 'Manage publishing schedules, review chapter manuscripts, assist in task distribution to assistants, and propose official publication.',
      features: [
        'Distribute page drawing tasks to specific assistants',
        'Approve and request revisions for chapter manuscripts',
        'Propose manuscripts eligible for publication',
        'Maintain series release schedules'
      ],
      color: 'from-amber-500 to-orange-600',
      badge: 'Editorial Desk'
    },
    board: {
      title: 'Editorial Board / Editor-in-Chief',
      subtitle: 'Make executive decisions',
      desc: 'Analyze reader voting ranks, evaluate serialization health, and make final decisions on publication or cancellation.',
      features: [
        'View reader voting statistics and scores',
        'Evaluate at-risk series (bottom 20%)',
        'Approve or reject new series proposals',
        'Make the final official publishing decisions'
      ],
      color: 'from-emerald-500 to-teal-600',
      badge: 'Executive Room'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="MangaFlow Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              MangaFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#roles" className="hover:text-primary transition-colors">Roles & Workflow</a>
            <Link href="/dashboard/forms-demo" className="hover:text-primary transition-colors">
              Demo Validation Form
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-background to-muted/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-border animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Workspace for Manga & Comic Publishing
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Optimize your <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-primary/80 bg-clip-text text-transparent">
                Manga Editorial Workflow
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-normal">
              A collaborative workspace connecting Mangakas, Assistants, and Editors. Manage series proposals, page-by-page task assignments, review chapter manuscripts, and analyze reader voting metrics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="group flex items-center justify-center gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/10 transition-all"
              >
                Start Collaborating
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/forms-demo"
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-card border border-border text-foreground hover:text-primary hover:border-primary/30 font-semibold px-6 py-3.5 rounded-xl hover:bg-accent/30 shadow-sm transition-all"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Built for Professional Publishing
            </h2>
            <p className="text-muted-foreground">
              A cohesive environment tailored for the fast-paced demands of weekly and monthly serialization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PencilLine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Series Proposals</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Authors submit new concepts, choose publication types, upload sample artwork, and track the approval process.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Task Assignment</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Mangakas delegate lining, cleaning, or inking tasks on a page-by-page basis to assistants, tracking deadlines and status.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Manuscript Control</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seamless version control and approval flows. Editors provide constructive feedback and Mangakas resubmit revised drafts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Reader Analytics</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Track reader voting results and satisfaction scores per chapter. Auto-calculate percentile ranking to identify at-risk series.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Roles Showcase */}
      <section id="roles" className="py-24 bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Four Roles, One Cohesive Workflow
            </h2>
            <p className="text-muted-foreground">
              Select a role below to explore their specific features and interface in the MangaFlow ecosystem.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-muted rounded-xl max-w-xl mx-auto mb-12">
            {(['mangaka', 'assistant', 'editor', 'board'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeRole === role
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
              >
                {role === 'mangaka' && 'Mangaka'}
                {role === 'assistant' && 'Assistant'}
                {role === 'editor' && 'Tantou Editor'}
                {role === 'board' && 'Editorial Board'}
              </button>
            ))}
          </div>

          {/* Tab Showcase Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden max-w-4xl mx-auto transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 sm:p-12 space-y-6 flex flex-col justify-center">
                <span className={`inline-flex self-start bg-gradient-to-r ${rolesDetails[activeRole].color} text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider`}>
                  {rolesDetails[activeRole].badge}
                </span>

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {rolesDetails[activeRole].title}
                  </h3>
                  <p className="text-primary font-medium text-sm">
                    {rolesDetails[activeRole].subtitle}
                  </p>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm">
                  {rolesDetails[activeRole].desc}
                </p>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Go to Dashboard <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Showcase list with gradient background */}
              <div className={`bg-gradient-to-br ${rolesDetails[activeRole].color} p-8 sm:p-12 text-white flex flex-col justify-center space-y-6`}>
                <h4 className="font-bold text-lg border-b border-white/20 pb-3">
                  Core Capabilities
                </h4>
                <ul className="space-y-4">
                  {rolesDetails[activeRole].features.map((feat, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full p-1 mt-0.5 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium leading-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-background border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/10 opacity-60" />
        <div className="max-w-4xl mx-auto px-6 text-center relative space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Ready to optimize your publishing workflow?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Log in now to access your workspace, manage proposals, track manuscripts, and coordinate work across teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl shadow-sm shadow-primary/10 transition-all w-full sm:w-auto"
            >
              Login to Workspace
            </Link>
            <Link
              href="/dashboard/forms-demo"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 py-3.5 rounded-xl transition-all w-full sm:w-auto"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-muted text-muted-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="MangaFlow Logo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-bold text-foreground tracking-tight">MangaFlow</span>
          </div>

          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} MangaFlow. All rights reserved. Designed for professional manga publishing teams.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/dashboard/forms-demo" className="hover:text-foreground transition-colors">
              Demo Validation Form
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
