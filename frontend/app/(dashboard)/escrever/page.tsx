"use client"

import type React from "react"

import { useState } from "react"
import { PenTool, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EscreverPage() {
  const [formatType, setFormatType] = useState<string>("")
  const [textInput, setTextInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFormatting, setIsFormatting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (validTypes.includes(file.type)) {
        setSelectedFile(file)
      } else {
        alert("Por favor, selecione apenas arquivos PDF ou DOC/DOCX")
      }
    }
  }

  const handleFormat = async () => {
    if (!formatType) {
      alert("Por favor, escolha um tipo de formatação")
      return
    }
    if (!textInput.trim() && !selectedFile) {
      alert("Por favor, insira um texto ou faça upload de um arquivo")
      return
    }

    setIsFormatting(true)
    // Simular formatação
    setTimeout(() => {
      alert(`Texto formatado com sucesso no padrão ${formatType}!`)
      setIsFormatting(false)
    }, 1500)
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <PenTool className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Assistente de Escrita
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Formate seu texto acadêmico de acordo com as normas escolhidas
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Three Sections */}
      <div className="space-y-6">
        {/* Section 1: Format Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Escolha do tipo de formatação</CardTitle>
            <CardDescription>Selecione o padrão de formatação desejado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="format-type">Tipo de Formatação</Label>
              <Select value={formatType} onValueChange={setFormatType}>
                <SelectTrigger id="format-type" className="w-full">
                  <SelectValue placeholder="Selecione uma opção..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abnt">Formatação ABNT</SelectItem>
                  <SelectItem value="apa">Formatação APA</SelectItem>
                  <SelectItem value="mla">Formatação MLA</SelectItem>
                  <SelectItem value="chicago">Formatação Chicago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Direct Text Input */}
        <Card>
          <CardHeader>
            <CardTitle>Texto direto</CardTitle>
            <CardDescription>Digite ou cole seu texto aqui para formatação</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Digite ou cole seu texto aqui..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[300px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Section 3: File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de arquivo PDF ou DOC</CardTitle>
            <CardDescription>Envie um arquivo para formatação automática</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar arquivo
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="ml-auto text-xs">
                    Remover
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Format Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleFormat}
            disabled={isFormatting || (!textInput.trim() && !selectedFile) || !formatType}
            size="lg"
            className="w-full max-w-md"
          >
            {isFormatting ? "Formatando..." : "Formatar Texto"}
          </Button>
        </div>
      </div>
    </div>
  )
}
