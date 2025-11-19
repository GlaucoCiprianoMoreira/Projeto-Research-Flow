"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Loader2, User, Bot, Filter, Star, FilePlus2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch" 
import { useToast } from "@/components/ui/use-toast" 

function UserMessage({ text }) {
  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <div className="max-w-xl rounded-3xl bg-blue-600 p-4 shadow-md text-white dark:bg-blue-500">
        <p className="text-base">{text}</p>
      </div>
      <User className="ml-3 h-8 w-8 shrink-0 rounded-full bg-gray-200 p-1.5 text-gray-700 shadow-md" />
    </div>
  )
}


function ApiMessage({ response, onLoadMore, onSaveArticle, savedUrls }) { 
  const { message, articles } = response
  const hasMore = articles && articles.length === 25
  const [expandedMap, setExpandedMap] = useState(() => ({}))

  const toggleExpanded = (idx) => {
    setExpandedMap((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <Bot className="mr-3 h-8 w-8 shrink-0 rounded-full bg-gray-200 p-1.5 text-gray-700 shadow-md" />
      <div className="w-full max-w-xl space-y-4">
        <div className="inline-block rounded-3xl bg-white p-4 shadow-md dark:bg-gray-800">
          <p className="text-base">{message}</p>
        </div>

        {articles && articles.length > 0 && (
          <ul className="space-y-4">
            {articles.map((article, index) => {
              const isExpanded = !!expandedMap[index]
              const isSaved = savedUrls.has(article.url)

              return (
                <li
                  key={index}
                  className="rounded-3xl bg-white p-5 shadow-lg transition-shadow dark:bg-gray-800"
                >
                  <h4 className="text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h4>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Autores:</span>{" "}
                    {Array.isArray(article.authors) ? article.authors.join(", ") : "Desconhecido"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Ano:</span> {article.year} |{" "}
                    <span className="font-medium">Citações:</span>{" "}
                    {article.citationCount}
                  </p>

                  {/* Abstract com "Mostrar Mais" */}
                  {article.abstract ? (
                    <div className="mt-4 text-base text-gray-700 dark:text-gray-300">
                      {!isExpanded ? (
                        <div
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.abstract}
                        </div>
                      ) : (
                        <div>{article.abstract}</div>
                      )}
                      {String(article.abstract).length > 200 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 p-0"
                          onClick={() => toggleExpanded(index)}
                        >
                          {isExpanded ? "Mostrar menos" : "Mostrar mais"}
                        </Button>
                      )}
                    </div>
                  ) : null}

                  {/* --- MUDANÇA: BOTÃO DE "SALVAR" MELHORADO --- */}
                  <div className="mt-4">
                    <Button
                      variant={isSaved ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => onSaveArticle(article)}
                      className={isSaved ? "text-white" : ""}
                    >
                      <Star className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                      {isSaved ? "Salvo!" : "Salvar em Meus Projetos"}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* --- BOTÃO DE CARREGAR MAIS (PAGINAÇÃO) --- */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={onLoadMore}
              className="rounded-full"
            >
              Carregar Mais Resultados...
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingMessage() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <Bot className="mr-3 h-8 w-8 shrink-0 rounded-full bg-gray-200 p-1.5 text-gray-700 shadow-md" />
      <div className="inline-block rounded-3xl bg-white p-4 shadow-md dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
        </div>
      </div>
    </div>
  )
}


const CHAT_HISTORY_KEY = "researchFlowChatHistory";

export default function ExplorarPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const chatEndRef = useRef(null)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState("default")
  const [yearRange, setYearRange] = useState([1990, new Date().getFullYear()])
  const [isOpenAccess, setIsOpenAccess] = useState(true)

  const [offset, setOffset] = useState(0)
  const [lastQuery, setLastQuery] = useState("") 
  
  const { toast } = useToast() 
  
  const [savedUrls, setSavedUrls] = useState(new Set())

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }


  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (isLoading || (lastMessage && lastMessage.type === 'user')) {
      scrollToBottom()
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    
    const savedChat = localStorage.getItem(CHAT_HISTORY_KEY)
    if (savedChat) {
      setMessages(JSON.parse(savedChat))
    }
    
    
    updateSavedUrls()
  }, [])


  const updateSavedUrls = () => {
     const savedItems = localStorage.getItem("researchFlowFavorites")
     const favorites = savedItems ? JSON.parse(savedItems) : []
     setSavedUrls(new Set(favorites.map(item => item.url)))
  }

  const handleSaveArticle = (articleToSave) => {
    const savedItems = localStorage.getItem("researchFlowFavorites")
    const favorites = savedItems ? JSON.parse(savedItems) : []
    const isAlreadySaved = favorites.some((item) => item.url === articleToSave.url)

    if (isAlreadySaved) {
      toast({
        variant: "default",
        title: "Opa!",
        description: "Este artigo já está salvo nos seus projetos.",
      })
      return
    }

    favorites.push(articleToSave)
    localStorage.setItem("researchFlowFavorites", JSON.stringify(favorites))
    
    window.dispatchEvent(new Event('favoritesChanged'))
    updateSavedUrls() 
    
    toast({
      title: "Artigo Salvo!",
      description: "Ele já está te esperando em 'Meus Projetos'.",
    })
  }

 
  const callApi = async (query, currentOffset) => {
    const requestBody = {
      query: query,
      sort_by: sortBy,
      year_from: yearRange[0],
      year_to: yearRange[1],
      offset: currentOffset,
      is_open_access: isOpenAccess,
    }

    try {
      const response = await fetch("http://10.134.0.71:8000/api/search/", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Erro desconhecido")
      return data 
      
    } catch (error) {
      console.error("Falha ao conectar com o backend:", error)
      return {
        success: false,
        message: "Puxa, não consegui me conectar ao servidor.",
        articles: [],
      }
    }
  }

 

  const handleNewChat = () => {
    setMessages([])
    setLastQuery("")
    setOffset(0)
    localStorage.removeItem(CHAT_HISTORY_KEY)
  }

  const handleSearch = async () => {
    const userQuery = searchQuery.trim()
    if (!userQuery) return
    setIsLoading(true)
    setOffset(0)
    setLastQuery(userQuery)
    setMessages((prev) => [...prev, { type: "user", text: userQuery }])
    const data = await callApi(userQuery, 0)
    setMessages((prev) => [...prev, { type: "api", response: data }])
    setIsLoading(false)
  }
  
  const handleLoadMore = async () => {
    const newOffset = offset + 25
    setIsLoading(true)
    setOffset(newOffset)
    const data = await callApi(lastQuery, newOffset)
    setMessages((prev) => {
      const newMessages = [...prev]
      const lastApiMsgIndex = newMessages.map(m => m.type).lastIndexOf('api');
      if (lastApiMsgIndex !== -1) {
        newMessages[lastApiMsgIndex].response.articles.push(...data.articles);
        newMessages[lastApiMsgIndex].response.message = data.message;
      }
      return newMessages
    })
    setIsLoading(false)
  }

  const applyFilters = async () => {
    setIsFilterOpen(false) 
    if (!lastQuery) return 
    
    setIsLoading(true)
    setOffset(0) 
    const data = await callApi(lastQuery, 0)

    setMessages((prev) => {
      const newMessages = [...prev]
      const lastApiMsgIndex = newMessages.map(m => m.type).lastIndexOf('api');
      if (lastApiMsgIndex !== -1) {
        newMessages[lastApiMsgIndex] = { type: "api", response: data };
      } else {
        newMessages.push({ type: "api", response: data });
      }
      return newMessages
    })
    setIsLoading(false)
  }

 
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* 1. A JANELA DE CHAT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="space-y-8 text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl">
                Que tipo de artigo científico você quer encontrar hoje?
              </h1>
            </div>
          )}
          {messages.map((msg, index) => {
            if (msg.type === "user") return <UserMessage key={index} text={msg.text} />
            if (msg.type === "api") {
                return (
                    <ApiMessage 
                        key={index} 
                        response={msg.response} 
                        onLoadMore={handleLoadMore}
                        onSaveArticle={(article) => handleSaveArticle(article, toast)}
                        savedUrls={savedUrls}
                    />
                )
            }
            return null
          })}
          {isLoading && <LoadingMessage />}
          <div ref={chatEndRef} />
        </div>
      </div>
      
      {/* 2. O INPUT DE CHAT (fixo na base) */}
      <div className="flex-shrink-0 bg-transparent px-4 pb-6 pt-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="relative flex items-center gap-2 rounded-full bg-white p-2 shadow-xl dark:bg-gray-800">
            
            {/* MUDANÇA: Botão de Nova Conversa */}
            <Button
              size="icon"
              variant="ghost"
              className="h-14 w-14 shrink-0 rounded-full"
              onClick={handleNewChat}
              title="Nova Conversa"
            >
              <FilePlus2 className="h-6 w-6" />
            </Button>

            {/* Botão de Filtro */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <Button
                size="icon"
                variant="ghost"
                className="h-14 w-14 shrink-0 rounded-full"
                onClick={() => setIsFilterOpen(true)}
                title="Filtros"
              >
                <Filter className="h-6 w-6" />
              </Button>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filtros de Pesquisa</DialogTitle>
                  <DialogDescription>
                    Refine seus resultados por ordenação, ano ou acesso.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-3">
                    <Label className="text-base">Ordenar por</Label>
                    <RadioGroup value={sortBy} onValueChange={setSortBy}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="r-default" />
                        <Label htmlFor="r-default" className="font-normal">Relevância da IA (Padrão)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="relevance" id="r-relevance" />
                        <Label htmlFor="r-relevance" className="font-normal">Mais Relevantes (Citações)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recency" id="r-recency" />
                        <Label htmlFor="r-recency" className="font-normal">Mais Recentes (Data)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base">
                      Intervalo de Ano:{" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {yearRange[0]} - {yearRange[1]}
                      </span>
                    </Label>
                    <Slider
                      value={yearRange}
                      onValueChange={setYearRange}
                      min={1980}
                      max={new Date().getFullYear()}
                      step={1}
                      minStepsBetweenThumbs={1}
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch 
                        id="open-access-filter" 
                        checked={isOpenAccess}
                        onCheckedChange={setIsOpenAccess}
                    />
                    <Label htmlFor="open-access-filter" className="text-base font-normal">
                      Apenas artigos "Open Access" (PDF Gratuito)
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" onClick={applyFilters}>
                      Aplicar Filtros
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Input de Busca */}
            <Input
              type="text"
              placeholder="Digite sua pesquisa aqui..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSearch()}
              disabled={isLoading}
              className="flex-1 rounded-full border-0 bg-transparent p-5 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
            />
            {/* Botão de Busca */}
            <Button
              size="icon"
              onClick={handleSearch}
              disabled={isLoading}
              className="h-14 w-14 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLoading ? ( <Loader2 className="h-6 w-6 animate-spin text-white" /> ) : ( <Search className="h-6 w-6 text-white" /> )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}