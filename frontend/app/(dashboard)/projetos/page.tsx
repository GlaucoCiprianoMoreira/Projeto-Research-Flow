"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Pencil, Download, Trash2, Calendar } from "lucide-react"

const mockProjects = [
  {
    id: 1,
    name: "Inteligência Artificial na Educação",
    type: "Análise",
    date: "2024-01-15",
    status: "Concluído",
  },
  {
    id: 2,
    name: "Machine Learning em Saúde",
    type: "Exploração",
    date: "2024-01-14",
    status: "Em andamento",
  },
  {
    id: 3,
    name: "Redes Neurais Convolucionais",
    type: "Escrita",
    date: "2024-01-13",
    status: "Concluído",
  },
  {
    id: 4,
    name: "Processamento de Linguagem Natural",
    type: "Análise",
    date: "2024-01-12",
    status: "Concluído",
  },
]

export default function ProjetosPage() {
  const [projects, setProjects] = useState(mockProjects)
  const [filterType, setFilterType] = useState("all")

  const filteredProjects = filterType === "all" ? projects : projects.filter((p) => p.type.toLowerCase() === filterType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seus Projetos</h1>
        <p className="text-muted-foreground">Gerencie todos os seus projetos de pesquisa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre seus projetos por tipo e data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Operação</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="exploração">Exploração</SelectItem>
                  <SelectItem value="análise">Análise</SelectItem>
                  <SelectItem value="escrita">Escrita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Intervalo de Datas</Label>
              <Input id="date" type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Projetos ({filteredProjects.length})</h2>
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-4">
                    <Badge variant="secondary">{project.type}</Badge>
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.date).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge variant={project.status === "Concluído" ? "default" : "outline"}>{project.status}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Renomear
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
