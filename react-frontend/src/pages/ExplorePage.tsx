"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { useToast } from "../components/ui/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function ExplorePage() {
  const [pokemon, setPokemon] = useState<any[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPokemon()
  }, [page])

  const fetchPokemon = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/pokemon?page=${page}&limit=20`)
      setPokemon(response.data.results)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch Pokemon data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPokemonDetails = async (name: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/pokemon/${name}`)
      setSelectedPokemon(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch Pokemon details",
        variant: "destructive",
      })
    }
  }

  if (isLoading && pokemon.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Explore Pokemon</h1>
        <p className="text-muted-foreground">Browse Pokemon from the PokéAPI</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pokemon List</CardTitle>
              <CardDescription>Click on a Pokemon to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pokemon.map((p, index) => (
                  <button
                    key={index}
                    onClick={() => fetchPokemonDetails(p.name)}
                    className="p-3 text-left border rounded-lg hover:bg-accent transition-colors capitalize"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pokemon Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPokemon ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={selectedPokemon.sprites?.front_default || "/placeholder.svg"}
                      alt={selectedPokemon.name}
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold capitalize">{selectedPokemon.name}</h3>
                    <p className="text-sm text-muted-foreground">#{selectedPokemon.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Types:</p>
                    <div className="flex gap-2">
                      {selectedPokemon.types?.map((t: any) => (
                        <span
                          key={t.type.name}
                          className="px-2 py-1 bg-primary/10 text-primary rounded text-xs capitalize"
                        >
                          {t.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Stats:</p>
                    <div className="space-y-2">
                      {selectedPokemon.stats?.map((s: any) => (
                        <div key={s.stat.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize">{s.stat.name}</span>
                            <span>{s.base_stat}</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(s.base_stat / 255) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Height: {selectedPokemon.height / 10}m</p>
                    <p className="text-sm font-medium">Weight: {selectedPokemon.weight / 10}kg</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Select a Pokemon to view details</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
