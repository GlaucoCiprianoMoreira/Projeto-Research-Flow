"use client"

import { useState, useEffect } from "react"
// MUDANÇA: Imports atualizados
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, Bookmark, Brain } from "lucide-react"
import { useRouter } from "next/navigation" // Para o redirecionamento

export default function ProjetosPage() {
  const [savedArticles, setSavedArticles] = useState([])
  const router = useRouter()

  // --- Carrega os artigos salvos do localStorage ---
  useEffect(() => {
    const savedItems = localStorage.getItem("researchFlowFavorites")
    const favorites = savedItems ? JSON.parse(savedItems) : []
    setSavedArticles(favorites)
  }, [])

  // --- Função para deletar um favorito ---
  const handleDelete = (urlToDelete) => {
    // Filtra o artigo para fora da lista
    const newFavorites = savedArticles.filter((item) => item.url !== urlToDelete)
    // Atualiza o estado
    setSavedArticles(newFavorites)
    // Atualiza o localStorage
    localStorage.setItem("researchFlowFavorites", JSON.stringify(newFavorites))
  }

  // --- Função para analisar (Etapa 3 do seu plano) ---
  const handleAnalyze = (articleUrl) => {
    // Redireciona para /analisar e passa a URL como um parâmetro de busca
    router.push(`/analisar?url=${encodeURIComponent(articleUrl)}`)
  }

  return (
    <div className="space-y-6 p-6"> {/* Adicionado um padding padrão */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Artigos Salvos</h1>
        <p className="text-muted-foreground">
          Gerencie e analise os artigos que você favoritou.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Artigos Salvos ({savedArticles.length})
        </h2>
        
        {savedArticles.length === 0 && (
            <Card className="text-center p-8">
                <Bookmark className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum artigo salvo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Vá para a página "Explorar Artigos" e clique no ícone "Salvar" 
                    para adicionar seus artigos favoritos aqui.
                </p>
            </Card>
        )}

        {/* Mapeia os artigos salvos */}
        {savedArticles.map((article) => (
          <Card key={article.url}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-blue-600 hover:underline dark:text-blue-400">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                    </a>
                  </CardTitle>
                  <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
                    <Badge variant="secondary">
                      Citações: {article.citationCount}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {article.year}
                    </span>
                  </CardDescription>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {article.authors.join(", ")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => handleAnalyze(article.url)} size="sm">
                  <Brain className="mr-2 h-4 w-4" />
                  Perguntar à IA (Analisar)
                </Button>
                <Button
                  onClick={() => handleDelete(article.url)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}