"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Send, Bot, User, Upload, Link as LinkIcon, FileText, Loader2, ArrowLeft, MessageSquareText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// =======================================
// COMPONENTE DE MENSAGEM
// =======================================
function ChatMessage({ role, content }: { role: string, content: string }) {
  const isUser = role === "user"
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6 animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`flex max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"} gap-3 items-start`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${isUser ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-blue-600"}`}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        <div className={`rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${isUser ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"}`}>
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    </div>
  )
}

// =======================================
// COMPONENTE DE "DIGITANDO..." ORIGINAL
// =======================================
function ThinkingMessage() {
  return (
    <div className="flex w-full justify-start mb-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex max-w-[85%] flex-row gap-3 items-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm bg-white border border-gray-200 text-blue-600">
          <Bot className="h-5 w-5" />
        </div>
        <div className="rounded-2xl px-5 py-4 bg-white border border-gray-100 shadow-sm rounded-tl-none flex items-center">
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  // ===========================
  // ESTADOS
  // ===========================
  const [mode, setMode] = useState("setup")
  const [articleContext, setArticleContext] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoLoading, setIsAutoLoading] = useState(false)

  const [urlInput, setUrlInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [articleTitle, setArticleTitle] = useState("")

  const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
  const [inputMessage, setInputMessage] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAutoStarted = useRef(false)

  const handleNewChat = () => {
    // limpa apenas a sessão do chat
    localStorage.removeItem("chat-session");

    // zera estados locais
    setMode("setup");
    setMessages([]);
    setArticleContext("");
    setSelectedFile(null);
    setUrlInput("");
    setArticleTitle("");
    hasAutoStarted.current = false;

    // força reload completo na rota inicial
    window.location.href = "/chat"; 
  };

  const API_BASE = "http://10.134.0.71:8000/api"

  // =======================================
  // --- LOCAL STORAGE ADDED ---
  // =======================================

  // Carregar sessão salva
  useEffect(() => {
    const saved = localStorage.getItem("chat-session")
    if (!saved) return

    try {
      const data = JSON.parse(saved)
      if (data.articleContext) setArticleContext(data.articleContext)
      if (data.messages) setMessages(data.messages)
      if (data.articleTitle) setArticleTitle(data.articleTitle)

      if (data.messages?.length > 0) {
        setMode("chat")
      }
    } catch { }
  }, [])

  // Salvar sessão automaticamente
  useEffect(() => {
    if (mode !== "chat") return

    localStorage.setItem(
      "chat-session",
      JSON.stringify({
        articleContext,
        messages,
        articleTitle
      })
    )
  }, [messages, articleContext, articleTitle, mode])

  // =======================================
  // FUNÇÃO DE RESET + NAVEGAÇÃO
  // =======================================
  const handleResetAndNavigate = () => {

    // --- UPDATED RESET FUNCTION ---
    localStorage.removeItem("chat-session")

    setArticleContext("");
    setSelectedFile(null);
    setUrlInput("");
    setArticleTitle("");
    setMessages([]);
    setIsLoading(false);
    setIsAutoLoading(false);
    hasAutoStarted.current = false;

    router.push("/projetos");
  }


  // =======================================
  // EXTRAÇÃO
  // =======================================
  const handleExtractContext = async (type: 'url' | 'file', initialValue?: string) => {
    setIsLoading(true)
    let endpoint = ""
    let body = null
    let headers = {}

    try {
      if (type === 'url') {
        const urlToSend = initialValue || urlInput
        if (!urlToSend) return
        endpoint = `${API_BASE}/extract/json/`
        headers = { "Content-Type": "application/json" }
        body = JSON.stringify({ input_value: urlToSend, is_url: true })
        setUrlInput(urlToSend)
      } else {
        if (!selectedFile) return
        endpoint = `${API_BASE}/extract/file/`
        const formData = new FormData()
        formData.append("file", selectedFile)
        body = formData
      }

      const response = await fetch(endpoint, { method: "POST", headers, body: body as any })
      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || `Falha ao ler o documento.`)
      }

      // salva contexto
      setArticleContext(data.text)

      if (data.title) {
        setArticleTitle(data.title)
      }

      // inicia chat
      setMode("chat")
      setMessages([
        { role: "assistant", content: "Olá! Li o seu documento com sucesso. Pode me perguntar qualquer coisa!" }
      ])

      setIsAutoLoading(false)

    } catch (error) {
      console.error("Erro na Extração:", error)
      setMode("error")
      setIsAutoLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

  // =======================================
  // AUTO EXTRAÇÃO (Favoritos)
  // =======================================
  useEffect(() => {
    const urlFromParams = searchParams.get("url")
    const titleFromParams = searchParams.get("title")

    if (urlFromParams && mode === 'setup' && !isLoading) {
      const decodedUrl = decodeURIComponent(urlFromParams)
      const decodedTitle = decodeURIComponent(titleFromParams || 'Documento Favorito')

      if (!hasAutoStarted.current) {
        setArticleTitle(decodedTitle)
        hasAutoStarted.current = true
        setIsAutoLoading(true)
        handleExtractContext('url', decodedUrl)
      }
    }
  }, [searchParams, mode, isLoading])

  // =======================================
  // SCROLL AUTOMÁTICO
  // =======================================
  useEffect(() => {
    if (!messagesEndRef.current) return
    messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
  }, [messages])

  // =======================================
  // ENVIO DE MENSAGEM
  // =======================================
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !articleContext) return
    const userMsg = inputMessage

    setInputMessage("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: articleContext, messages: [...messages, { role: "user", content: userMsg }] })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao conectar com a IA." })
    } finally {
      setIsLoading(false)
    }
  }

  // =======================================
  // ARQUIVO UPLOAD
  // =======================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === "application/pdf") {
      setSelectedFile(file)
      setArticleTitle(file.name)
    } else {
      toast({ variant: "destructive", title: "Inválido", description: "Envie apenas PDF." })
    }
  }

  // =======================================
  // RESET PARA SETUP (SEM SAIR)
  // =======================================
  const handleResetToSetup = () => {
    localStorage.removeItem("chat-session")
    setMode("setup")
    setMessages([])
    setArticleContext("")
    setSelectedFile(null)
    setUrlInput("")
    setArticleTitle("")
    setIsAutoLoading(false)
    hasAutoStarted.current = false
  }

  // =======================================
  // TELA DE ERRO
  // =======================================
  if (mode === "error") {
    return (
      <div className="container flex h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <div className="mb-6">
          <FileText className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
            Acesso Negado ao Conteúdo
          </h1>
        </div>
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Lamentamos, mas não conseguimos acessar o conteúdo do artigo:
            </p>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {articleTitle || "Documento não identificado"}
            </h3>

            <Button
              onClick={handleResetAndNavigate}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tentar Outro Link ou Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =======================================
  // TELA DE SETUP
  // =======================================
  if (mode === "setup") {

    if (isAutoLoading) {
      return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4 animate-in fade-in">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Preparando o ambiente...</h2>
          <p className="text-gray-500">Lendo o artigo do seu projeto favorito.</p>
        </div>
      )
    }

    return (
      <div className="container mx-auto max-w-4xl space-y-8 p-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <MessageSquareText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Leitura Interativa
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Carregue um documento para conversar e tirar dúvidas com a IA
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fonte do Documento</CardTitle>
              <CardDescription>Escolha como você quer enviar o artigo para a IA ler</CardDescription>
            </CardHeader>
            <CardContent>

              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="url">Link (URL)</TabsTrigger>
                  <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
                </TabsList>

                {/* URL */}
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url-input">Link do Artigo</Label>
                    <Input
                      id="url-input"
                      placeholder="Cole o link do PDF aqui..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={() => handleExtractContext('url')}
                      disabled={isLoading || !urlInput}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando... </>
                      ) : (
                        <> <Bot className="mr-2 h-4 w-4" /> Iniciar Conversa </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* UPLOAD */}
                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-4">
                    <Label>Arquivo PDF</Label>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("chat-file-upload")?.click()}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar arquivo
                      </Button>
                      <input
                        id="chat-file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {selectedFile && (
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 animate-in fade-in slide-in-from-top-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px] sm:max-w-md">
                          {selectedFile.name}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="ml-auto text-xs hover:text-red-500">Remover</Button>
                      </div>
                    )}

                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={() => handleExtractContext('file')}
                      disabled={isLoading || !selectedFile}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lendo Arquivo... </>
                      ) : (
                        <> <Bot className="mr-2 h-4 w-4" /> Carregar e Conversar </>
                      )}
                    </Button>
                  </div>

                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // =======================================
  // MODO CHAT
  // =======================================
  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col bg-gray-50 dark:bg-gray-900">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {articleTitle || selectedFile?.name || "Documento Online"}
            </h2>
            <p className="text-xs text-gray-500 truncate max-w-[300px]">
              {articleTitle || selectedFile?.name || "Documento Online"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">

          {/* --- NOVO CHAT BUTTON --- */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="rounded-full hover:bg-gray-100"
          >
            Novo Chat
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAndNavigate}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Trocar Artigo
          </Button>
        </div>
      </div>

      {/* MENSAGENS */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900"
        ref={messagesEndRef}
      >
        <div className="mx-auto max-w-3xl space-y-6 pb-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}

          {isLoading && <ThinkingMessage />}
        </div>
      </div>

      {/* INPUT */}
      <div className="p-4 border-t bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-3xl flex gap-2 relative">
          <Input
            placeholder="Faça uma pergunta sobre o conteúdo..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
            disabled={isLoading}
            className="h-14 rounded-full pl-6 pr-14 text-base bg-gray-50 border-gray-200 focus:bg-white transition-all"
          />

          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="absolute right-2 top-2 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 p-0 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Send className="h-5 w-5 text-white ml-0.5" />
            )}
          </Button>
        </div>
      </div>

    </div>
  )
}
