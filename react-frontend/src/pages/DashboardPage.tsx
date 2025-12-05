"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/use-toast"
import { Download, Thermometer, Droplets, Wind, CloudRain, TrendingUp, TrendingDown } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { format } from "date-fns"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function DashboardPage() {
  const [weatherLogs, setWeatherLogs] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [logsRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/api/weather/logs`),
        axios.get(`${API_URL}/api/weather/insights`),
      ])
      setWeatherLogs(logsRes.data)
      setInsights(insightsRes.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weather data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const response = await axios.get(`${API_URL}/api/weather/export/${format}`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `weather-data.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: "Success",
        description: `Data exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const chartData = weatherLogs
    .slice(0, 24)
    .reverse()
    .map((log) => ({
      time: format(new Date(log.timestamp), "HH:mm"),
      temperature: log.temperature,
      humidity: log.humidity,
    }))

  const currentWeather = weatherLogs[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weather Dashboard</h1>
          <p className="text-muted-foreground">Real-time weather monitoring with AI insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")}>
            <Download className="h-4 w-4 mr-2" />
            Export XLSX
          </Button>
        </div>
      </div>

      {/* Current Weather Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeather?.temperature}°C</div>
            <p className="text-xs text-muted-foreground capitalize">{currentWeather?.condition}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeather?.humidity}%</div>
            <p className="text-xs text-muted-foreground">Relative humidity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wind Speed</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeather?.wind_speed} km/h</div>
            <p className="text-xs text-muted-foreground">Current wind</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comfort Score</CardTitle>
            <CloudRain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.metrics?.comfortScore || 0}/100</div>
            <p className="text-xs text-muted-foreground capitalize">{insights?.metrics?.classification}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>AI Weather Insights</CardTitle>
            <CardDescription>Generated from historical data analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{insights.summary}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                {insights.metrics.trend === "rising" ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : insights.metrics.trend === "falling" ? (
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Trend: {insights.metrics.trend}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Avg Temp:</span> {insights.metrics.avgTemperature}°C
              </div>
              <div className="text-sm">
                <span className="font-medium">Range:</span> {insights.metrics.minTemperature}°C -{" "}
                {insights.metrics.maxTemperature}°C
              </div>
            </div>

            {insights.metrics.alerts && insights.metrics.alerts.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Alerts:</p>
                <ul className="list-disc list-inside space-y-1">
                  {insights.metrics.alerts.map((alert: string, index: number) => (
                    <li key={index} className="text-sm">
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Temperature Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Trend (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="temperature" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Humidity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Humidity Levels (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="humidity" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weather Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Weather Records</CardTitle>
          <CardDescription>Last 10 weather data points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium">Time</th>
                  <th className="text-left p-2 text-sm font-medium">Location</th>
                  <th className="text-left p-2 text-sm font-medium">Condition</th>
                  <th className="text-left p-2 text-sm font-medium">Temperature</th>
                  <th className="text-left p-2 text-sm font-medium">Humidity</th>
                </tr>
              </thead>
              <tbody>
                {weatherLogs.slice(0, 10).map((log, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 text-sm">{format(new Date(log.timestamp), "MMM dd, HH:mm")}</td>
                    <td className="p-2 text-sm">{log.location}</td>
                    <td className="p-2 text-sm capitalize">{log.condition}</td>
                    <td className="p-2 text-sm">{log.temperature}°C</td>
                    <td className="p-2 text-sm">{log.humidity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
