"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`)
      setUser(response.data)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password })
    const { access_token, user: userData } = response.data

    setToken(access_token)
    setUser(userData)
    localStorage.setItem("token", access_token)
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
  }

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
