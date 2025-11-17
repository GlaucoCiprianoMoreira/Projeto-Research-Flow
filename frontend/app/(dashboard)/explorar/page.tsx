"use client"

import { useState, useRef, useEffect } from "react"
// MUDANÇA: Importamos o ícone de 'Salvar'
import { Search, Loader2, User, Bot, Filter, X, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Componentes para o Modal de Filtros
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

// --- FUNÇÃO PARA SALVAR NO LOCALSTORAGE ---
const handleSaveArticle = (articleToSave) => {
  // 1. Pega os favoritos existentes
  const savedItems = localStorage.getItem("researchFlowFavorites")
  const favorites = savedItems ? JSON.parse(savedItems) : []

  // 2. Verifica se o artigo já foi salvo (pela URL)
  const isAlreadySaved = favorites.some((item) => item.url === articleToSave.url)

  if (isAlreadySaved) {
    alert("Este artigo já está salvo nos seus projetos!")
    return
  }

  // 3. Adiciona o novo artigo e salva de volta
  favorites.push(articleToSave)
  localStorage.setItem("researchFlowFavorites", JSON.stringify(favorites))
  alert("Artigo salvo em 'Meus Projetos'!")
}


// --- COMPONENTE DE MENSAGEM DO USUÁRIO ---
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

// --- COMPONENTE DE MENSAGEM DA API (COM OS ARTIGOS) ---
function ApiMessage({ response, onLoadMore }) {
  const { message, articles } = response
  // Se a API retornar menos que o limite (25), sabemos que não há mais o que carregar
  const hasMore = articles && articles.length === 25

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <Bot className="mr-3 h-8 w-8 shrink-0 rounded-full bg-gray-200 p-1.5 text-gray-700 shadow-md" />
      <div className="w-full max-w-xl space-y-4">
        {/* Mensagem Carismática */}
        <div className="inline-block rounded-3xl bg-white p-4 shadow-md dark:bg-gray-800">
          <p className="text-base">{message}</p>
        </div>

        {/* Lista de Artigos */}
        {articles && articles.length > 0 && (
          <ul className="space-y-4">
            {articles.map((article, index) => (
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
                  {article.authors.join(", ")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Ano:</span> {article.year} |{" "}
                  <span className="font-medium">Citações:</span>{" "}
                  {article.citationCount}
                </p>
                <p className="mt-4 text-base text-gray-700 dark:text-gray-300">
                  {article.abstract}
                </p>
                
                {/* --- BOTÃO DE SALVAR ADICIONADO AQUI --- */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleSaveArticle(article)}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Salvar em "Meus Projetos"
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* --- BOTÃO DE CARREGAR MAIS (PAGINAÇÃO) --- */}
        {hasMore && (
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="rounded-full"
          >
            Carregar Mais Resultados...
          </Button>
        )}
      </div>
    </div>
  )
}

// --- COMPONENTE DE ANIMAÇÃO "CARREGANDO" ---
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


// --- A PÁGINA PRINCIPAL ---
export default function ExplorarPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const chatEndRef = useRef(null)
  
  // Estados dos Filtros
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState("default")
  const [yearRange, setYearRange] = useState([1990, new Date().getFullYear()])
  const [isOpenAccess, setIsOpenAccess] = useState(false)
  
  // Estados da Paginação
  const [offset, setOffset] = useState(0)
  const [lastQuery, setLastQuery] = useState("") // Salva a última query para o "Carregar Mais"

  // --- FUNÇÃO DE AUTO-SCROLL ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll inteligente: só rola se for msg do usuário ou loading
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (isLoading || (lastMessage && lastMessage.type === 'user')) {
      scrollToBottom()
    }
  }, [messages, isLoading])

  // --- FUNÇÃO DE BUSCA (handleSearch) ---
  // Inicia uma NOVA busca e limpa resultados antigos
  const handleSearch = async () => {
    const userQuery = searchQuery.trim()
    if (!userQuery) return

    setSearchQuery("")
    setIsLoading(true)
    // CORREÇÃO: Adiciona a nova pergunta ao histórico, NÃO o substitui.
    setMessages((prev) => [...prev, { type: "user", text: userQuery }])
    
    setOffset(0) 
    setLastQuery(userQuery)
    await runSearch(userQuery, 0, true) // Passa 'true' para 'isNewSearch'
  }
  
  // --- FUNÇÃO DE "CARREGAR MAIS" (handleLoadMore) ---
  // Continua a busca anterior, adicionando ao final
  const handleLoadMore = async () => {
    const newOffset = offset + 25
    setIsLoading(true)
    setOffset(newOffset) // Atualiza o offset
    await runSearch(lastQuery, newOffset, false) // Passa 'false' para 'isNewSearch'
  }

  // --- FUNÇÃO PRINCIPAL DE BUSCA (runSearch) ---
  // Função reutilizável que faz a chamada à API
  const runSearch = async (query, currentOffset, isNewSearch) => {
    // Monta o corpo da requisição com todos os filtros
    const requestBody = {
      query: query,
      sort_by: sortBy,
      year_from: yearRange[0],
      year_to: yearRange[1],
      offset: currentOffset,
      is_open_access: isOpenAccess,
    }

    try {
      // LEMBRE-SE de usar o IP correto do seu backend
      // (ex: "http://10.134.0.71:8000/api/search/")
      const response = await fetch("http://10.134.0.71:8000/api/search/", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Erro desconhecido")

      // CORREÇÃO: Lógica de estado limpa
      if (isNewSearch) {
        // Se é uma nova busca, adiciona a resposta da API ao chat
        setMessages((prev) => [
          ...prev, // Mantém a pergunta do usuário que acabamos de adicionar
          { type: "api", response: data }
        ])
      } else {
        // Se é "Carregar Mais", edita a última mensagem da API
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          
          if (lastMsg.type === 'api') {
            // Adiciona os novos artigos à lista existente
            lastMsg.response.articles.push(...data.articles);
            // Atualiza a mensagem
            lastMsg.response.message = data.message;
          }
          return newMessages
        })
      }

    } catch (error) {
      console.error("Falha ao conectar com o backend:", error)
      const errorResponse = {
        success: false,
        message: "Puxa, não consegui me conectar ao servidor.",
        articles: [],
      }
      // Se for uma nova busca, adiciona a msg de erro
      if (isNewSearch) {
        setMessages((prev) => [
          ...prev, 
          { type: "api", response: errorResponse }
        ])
      } else {
        // Se falhar no "Carregar Mais", só adiciona a msg de erro
         setMessages((prev) => [...prev, { type: "api", response: errorResponse }])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // --- O LAYOUT JSX ---
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* 1. A JANELA DE CHAT (cresce e permite scroll) */}
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
                        onLoadMore={handleLoadMore} // Passa a função para o botão
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
            
            {/* Botão de Filtro com o Modal (Controlado Manualmente) */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-14 w-14 shrink-0 rounded-full"
                onClick={() => setIsFilterOpen(true)} // onClick manual
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
                  {/* Filtro de Ordenação */}
                  <div className="space-y-3">
                    <Label className="text-base">Ordenar por</Label>
                    <RadioGroup value={sortBy} onValueChange={setSortBy}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="r-default" />
                        <Label htmlFor="r-default" className="font-normal">
                          Relevância da IA (Padrão)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="relevance" id="r-relevance" />
                        <Label htmlFor="r-relevance" className="font-normal">
                          Mais Relevantes (Citações)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recency" id="r-recency" />
                        <Label htmlFor="r-recency" className="font-normal">
                          Mais Recentes (Data)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {/* Filtro de Ano (Slider) */}
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
                  {/* Filtro Open Access */}
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
                    <Button type="button" onClick={() => setIsFilterOpen(false)}>
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