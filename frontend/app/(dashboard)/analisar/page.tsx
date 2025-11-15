"use client"

import type React from "react"
import { useState } from "react"
import { Brain, LinkIcon, Upload, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalysisResponse {
  problem?: string
  methodology?: string
  results?: string
  conclusion?: string
  error?: string
  details?: string 
}

export default function AnalisarPage() {
  const [articleUrl, setArticleUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"


  const handleUrlAnalysis = async () => {
    if (!articleUrl.trim()) return

    setIsAnalyzing(true)
    setAnalysis(null) 

    try {
      const response = await fetch(`${API_BASE_URL}/summarize/json/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_value: articleUrl,
          is_url: true, 
        }),
      })

      const data: AnalysisResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || `Erro ${response.status}: Falha ao analisar a URL.`)
      }

      if (data.problem !== undefined && data.methodology !== undefined && data.results !== undefined && data.conclusion !== undefined) {
        setAnalysis({
            problem: data.problem || "Não foi possível extrair o problema.",
            methodology: data.methodology || "Não foi possível extrair a metodologia.",
            results: data.results || "Não foi possível extrair os resultados.",
            conclusion: data.conclusion || "Não foi possível extrair a conclusão.",
        })
      } else {
         throw new Error("Formato de resposta inesperado da API.")
      }

    } catch (error) {
      console.error("Erro na análise por URL:", error)
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      setAnalysis(null) 
      alert(`Erro ao analisar artigo pela URL: ${errorMessage}`) 
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      setAnalysis(null); 
    } else if (file) {
        alert("Por favor, selecione apenas arquivos PDF.");
        e.target.value = ''; 
        setSelectedFile(null);
    } else {
        setSelectedFile(null);
    }
  }

  const handlePdfAnalysis = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setAnalysis(null) 

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/summarize/file/`, {
        method: "POST",
        body: formData,
      })

      const data: AnalysisResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || `Erro ${response.status}: Falha ao analisar o PDF.`)
      }

        if (data.problem !== undefined && data.methodology !== undefined && data.results !== undefined && data.conclusion !== undefined) {
            setAnalysis({
                problem: data.problem || "Não foi possível extrair o problema.",
                methodology: data.methodology || "Não foi possível extrair a metodologia.",
                results: data.results || "Não foi possível extrair os resultados.",
                conclusion: data.conclusion || "Não foi possível extrair a conclusão.",
            })
        } else {
            throw new Error("Formato de resposta inesperado da API.")
        }

    } catch (error) {
      console.error("Erro na análise de PDF:", error)
       const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
       setAnalysis(null) 
      alert(`Erro ao analisar o arquivo PDF: ${errorMessage}`) 
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Analisar com IA</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gere resumos estruturados de artigos científicos automaticamente
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Artigo para Análise</CardTitle>
          <CardDescription>Cole o link de um artigo científico ou faça upload de um arquivo PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">
                <LinkIcon className="mr-2 h-4 w-4" />
                Link do Artigo
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 pt-4"> {/* Adicionado pt-4 */}
              <div className="space-y-2">
                <Label htmlFor="article-url">URL do Artigo</Label>
                <Input
                  id="article-url"
                  placeholder="https://arxiv.org/abs/..."
                  value={articleUrl}
                  onChange={(e) => {setArticleUrl(e.target.value); setAnalysis(null);}} // Limpa análise ao mudar URL
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleUrlAnalysis} disabled={isAnalyzing || !articleUrl.trim()} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analisar Artigo
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 pt-4"> {/* Adicionado pt-4 */}
              <div className="space-y-2">
                <Label htmlFor="pdf-upload">Arquivo PDF</Label>
                 <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4 sm:space-y-0">
                    <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-primary file:py-2 file:px-4 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {selectedFile && (
                        <div className="flex items-center gap-2 rounded-md border bg-muted p-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={selectedFile.name}>{selectedFile.name}</span>
                        </div>
                    )}
                </div>
              </div>
              <Button onClick={handlePdfAnalysis} disabled={isAnalyzing || !selectedFile} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analisar PDF
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && !analysis.error && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Resumo Estruturado</h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Problema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{analysis.problem}</p> {/* Adicionado whitespace-pre-wrap */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metodologia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{analysis.methodology}</p> {/* Adicionado whitespace-pre-wrap */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{analysis.results}</p> {/* Adicionado whitespace-pre-wrap */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{analysis.conclusion}</p> {/* Adicionado whitespace-pre-wrap */}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
