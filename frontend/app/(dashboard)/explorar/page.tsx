"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Loader2, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


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


function ApiMessage({ response }) {
  const { message, articles } = response

  return (
    
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <Bot className="mr-3 h-8 w-8 shrink-0 rounded-full bg-gray-200 p-1.5 text-gray-700 shadow-md" />
      <div className="w-full max-w-xl space-y-4">
        
        <div className="inline-block rounded-3xl bg-white p-4 shadow-md dark:bg-gray-800">
          <p className="text-base">{message}</p>
        </div>

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
              </li>
            ))}
          </ul>
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


export default function ExplorarPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSearch = async () => {
    const userQuery = searchQuery.trim()
    if (!userQuery) return

    setSearchQuery("")
    setIsLoading(true)

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "user", text: userQuery },
    ])

    try {
      const response = await fetch("http://192.168.0.6:8000/api/search/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Erro desconhecido no servidor")
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "api", response: data },
      ])
    } catch (error) {
      console.error("Falha ao conectar com o backend:", error)
      const errorResponse = {
        success: false,
        message:
          "Puxa, não consegui me conectar ao servidor. O backend está rodando? (Lembre-se do '0.0.0.0:8000' e do CORS!)",
        articles: [],
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "api", response: errorResponse },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      
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
            if (msg.type === "user") {
              return <UserMessage key={index} text={msg.text} />
            }
            if (msg.type === "api") {
              return <ApiMessage key={index} response={msg.response} />
            }
            return null
          })}

          {isLoading && <LoadingMessage />}
          <div ref={chatEndRef} />
        </div>
      </div>

      
      <div className="flex-shrink-0 bg-transparent px-4 pb-6 pt-4">
        <div className="mx-auto w-full max-w-3xl">
          
          <div className="relative flex items-center gap-2 rounded-full bg-white p-2 shadow-xl dark:bg-gray-800">
            
            <Input
              type="text"
              placeholder="Digite sua pesquisa aqui..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSearch()}
              disabled={isLoading}
              className="flex-1 rounded-full border-0 bg-transparent p-5 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white"
            />
            
            <Button
              size="icon"
              onClick={handleSearch}
              disabled={isLoading}
              className="h-14 w-14 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Search className="h-6 w-6 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}