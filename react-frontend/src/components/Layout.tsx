"use client"

import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "./ui/button"
import { Cloud, Users, Compass, LogOut } from "lucide-react"

export default function Layout() {
  const { logout, user } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold">
              <Cloud className="h-6 w-6 text-primary" />
              Weather Monitor
            </Link>
            <nav className="flex gap-4">
              <Link to="/dashboard">
                <Button variant={isActive("/dashboard") ? "default" : "ghost"}>Dashboard</Button>
              </Link>
              <Link to="/users">
                <Button variant={isActive("/users") ? "default" : "ghost"}>
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant={isActive("/explore") ? "default" : "ghost"}>
                  <Compass className="h-4 w-4 mr-2" />
                  Explore
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
