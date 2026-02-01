'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Download, Filter, TrendingUp } from 'lucide-react'

interface Report {
  id: string
  name: string
  cohort: string
  type: 'individual' | 'cohort' | 'comparative'
  generatedAt: string
  participantCount: number
}

export default function ReportsPage() {
  const [reports] = useState<Report[]>([
    {
      id: '1',
      name: 'Founder Cohort Spring - Overall Analysis',
      cohort: 'Founder Cohort Spring 2024',
      type: 'cohort',
      generatedAt: '2024-02-20',
      participantCount: 12
    },
    {
      id: '2',
      name: 'Alex Johnson - Final Assessment Report',
      cohort: 'Founder Cohort Spring 2024',
      type: 'individual',
      generatedAt: '2024-02-15',
      participantCount: 1
    },
    {
      id: '3',
      name: 'Cohort Comparison: Spring vs Fall',
      cohort: 'Multiple',
      type: 'comparative',
      generatedAt: '2024-02-10',
      participantCount: 25
    }
  ])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cohort':
        return 'bg-blue-100 text-blue-800'
      case 'individual':
        return 'bg-purple-100 text-purple-800'
      case 'comparative':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cohort':
        return '👥 Cohort'
      case 'individual':
        return '👤 Individual'
      case 'comparative':
        return '📊 Comparative'
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-muted-foreground mt-1">View and manage assessment reports</p>
            </div>
            <Button className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8 flex gap-3">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            All Types
          </Button>
          <Button variant="outline" size="sm">
            All Cohorts
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
          {[
            { label: 'Total Reports', value: reports.length, icon: BarChart3 },
            { label: 'Participants', value: 38, icon: TrendingUp },
            { label: 'Cohorts', value: 3, icon: BarChart3 }
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="card-base">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                    </div>
                    <Icon className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Reports Table */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Report</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Cohort</th>
                    <th className="text-left py-3 px-4 font-medium">Participants</th>
                    <th className="text-left py-3 px-4 font-medium">Generated</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-foreground">{report.name}</td>
                      <td className="py-4 px-4">
                        <Badge className={getTypeColor(report.type)}>
                          {getTypeLabel(report.type)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{report.cohort}</td>
                      <td className="py-4 px-4 text-muted-foreground">{report.participantCount}</td>
                      <td className="py-4 px-4 text-muted-foreground">{report.generatedAt}</td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
