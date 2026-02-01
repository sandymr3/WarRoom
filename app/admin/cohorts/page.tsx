'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Users, Calendar } from 'lucide-react'

interface Cohort {
  id: string
  name: string
  description: string
  participants: number
  createdAt: string
  status: 'active' | 'completed' | 'upcoming'
}

export default function CohortsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [cohorts] = useState<Cohort[]>([
    {
      id: '1',
      name: 'Founder Cohort Spring 2024',
      description: 'Early-stage founders in B2B SaaS',
      participants: 12,
      createdAt: '2024-01-10',
      status: 'active'
    },
    {
      id: '2',
      name: 'AI Startup Accelerator',
      description: 'AI/ML focused entrepreneurs',
      participants: 8,
      createdAt: '2024-01-15',
      status: 'active'
    },
    {
      id: '3',
      name: 'Pre-Launch Program',
      description: 'Pre-revenue startups',
      participants: 5,
      createdAt: '2024-02-01',
      status: 'upcoming'
    }
  ])

  const filteredCohorts = cohorts.filter(
    (cohort) =>
      cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cohort.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Cohort Management</h1>
              <p className="text-muted-foreground mt-1">Manage and view assessment cohorts</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Cohort
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search cohorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cohorts Grid */}
        {filteredCohorts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCohorts.map((cohort) => (
              <Card key={cohort.id} className="card-base hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{cohort.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{cohort.description}</p>
                    </div>
                    <Badge className={getStatusColor(cohort.status)}>
                      {cohort.status === 'active' && '🟢 Active'}
                      {cohort.status === 'completed' && '✓ Completed'}
                      {cohort.status === 'upcoming' && '📅 Upcoming'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{cohort.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{cohort.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent">
                      <FileText className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-base text-center py-12">
            <p className="text-muted-foreground mb-4">No cohorts found matching your search.</p>
            <Button>Create First Cohort</Button>
          </Card>
        )}
      </main>
    </div>
  )
}
