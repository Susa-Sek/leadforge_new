import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Users, FolderOpen, Coins } from 'lucide-react'
import { getDashboardStats } from '@/lib/actions/dashboard'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Credits',
      value: stats.credits.toString(),
      description: 'Verfügbare Credits',
      icon: Coins,
    },
    {
      title: 'Suchen',
      value: stats.searches.toString(),
      description: 'Durchgeführte Suchen',
      icon: Search,
    },
    {
      title: 'Kontakte',
      value: stats.contacts.toString(),
      description: 'Im CRM gespeichert',
      icon: Users,
    },
    {
      title: 'Sammlungen',
      value: stats.collections.toString(),
      description: 'Gespeicherte Sammlungen',
      icon: FolderOpen,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Willkommen zurück</h2>
        <p className="text-muted-foreground">
          Hier ist eine Übersicht deines Kontos.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
