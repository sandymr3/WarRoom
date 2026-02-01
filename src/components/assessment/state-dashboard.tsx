'use client'

import { AssessmentState, Mistake } from '@/src/types/state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, Flame, Clock, Users, UserCheck, AlertTriangle } from 'lucide-react'

interface StateDashboardProps {
  state: AssessmentState
  timeRemaining?: number
  mistakes?: Mistake[]
}

export default function StateDashboard({ state, timeRemaining, mistakes = [] }: StateDashboardProps) {
  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-4">
      {/* Financial Card */}
      <Card className="card-base">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Capital</span>
            <span className="font-semibold">{formatCurrency(state.financial.capital)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Revenue/mo</span>
            <span className="font-semibold text-green-600">{formatCurrency(state.financial.monthlyRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Burn Rate</span>
            <span className="font-semibold text-red-600">{formatCurrency(state.financial.burnRate)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Runway
            </span>
            <span>{state.financial.runwayMonths.toFixed(1)}mo</span>
          </div>
        </CardContent>
      </Card>

      {/* Team Card */}
      <Card className="card-base">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Size</span>
            <span className="font-semibold">{state.team.size} people</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Satisfaction</span>
            <span className="font-semibold">{state.team.satisfaction.toFixed(1)}/10</span>
          </div>
          <div className="flex gap-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < Math.round(state.team.satisfaction / 2) ? 'bg-green-500' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customers Card */}
      <Card className="card-base">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Customers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{state.customers.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Retention</span>
            <span className="font-semibold text-green-600">{state.customers.retention}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Time Remaining */}
      {timeRemaining !== undefined && (
        <Card className="card-base">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Clock className="h-4 w-4" />
                Time Remaining
              </div>
              <span className="text-xl font-bold text-primary">{formatTime(timeRemaining)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Mistakes */}
      {mistakes.length > 0 && (
        <Card className="card-base border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Active Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mistakes.map((mistake) => (
                <Badge key={mistake.code} variant="destructive" className="block w-full justify-start">
                  {mistake.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
