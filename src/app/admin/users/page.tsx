'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Search, Users } from 'lucide-react'
import { UserDataTable } from '@/components/admin/user-data-table'
import { UserDetailModal } from '@/components/admin/user-detail-modal'
import {
  useAdminUsers,
  useAdminUser,
  useSuspendUser,
  useUnsuspendUser,
  useChangeUserPlan,
} from '@/hooks/use-admin'
import { toast } from 'sonner'
import type { AdminUser } from '@/lib/admin/types'

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { users, total, page, limit, totalPages, isLoading, mutate: mutateUsers } = useAdminUsers({
    search: searchQuery,
    plan: planFilter,
    status: statusFilter,
    role: roleFilter,
    page: currentPage,
    limit: pageSize,
  })

  const { user: selectedUser, isLoading: isLoadingUser } = useAdminUser(selectedUserId)
  const { trigger: suspendUser } = useSuspendUser()
  const { trigger: unsuspendUser } = useUnsuspendUser()
  const { trigger: changePlan } = useChangeUserPlan()

  const handleSuspend = async (id: string) => {
    try {
      await suspendUser({ id })
      toast.success('Nutzer wurde gesperrt')
      mutateUsers()
    } catch (error) {
      toast.error('Fehler beim Sperren des Nutzers')
    }
  }

  const handleUnsuspend = async (id: string) => {
    try {
      await unsuspendUser(id)
      toast.success('Nutzer wurde entsperrt')
      mutateUsers()
    } catch (error) {
      toast.error('Fehler beim Entsperren des Nutzers')
    }
  }

  const handleViewDetails = (id: string) => {
    setSelectedUserId(id)
    setIsDetailOpen(true)
  }

  const handleChangePlan = async (plan: 'free' | 'pro' | 'enterprise') => {
    if (!selectedUserId) return
    try {
      await changePlan({ id: selectedUserId, plan })
      toast.success('Tarif wurde geändert')
      mutateUsers()
    } catch (error) {
      toast.error('Fehler beim Ändern des Tarifs')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutzerverwaltung</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Nutzerkonten
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Nutzer hinzufügen
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nutzer suchen..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8"
              />
            </div>
            <Select
              value={planFilter}
              onValueChange={(value) => {
                setPlanFilter(value as typeof planFilter)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tarif filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Tarife</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as typeof statusFilter)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="suspended">Gesperrt</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as typeof roleFilter)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rolle filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="user">Nutzer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktiv</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesperrt</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.status === 'suspended').length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nutzerliste</CardTitle>
        </CardHeader>
        <CardContent>
          <UserDataTable
            users={users}
            total={total}
            page={page}
            limit={limit}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            onSuspend={handleSuspend}
            onUnsuspend={handleUnsuspend}
          />
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser ?? null}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedUserId(null)
        }}
        onSuspend={() => selectedUserId && handleSuspend(selectedUserId)}
        onUnsuspend={() => selectedUserId && handleUnsuspend(selectedUserId)}
        onChangePlan={handleChangePlan}
        isLoading={isLoadingUser}
      />
    </div>
  )
}
