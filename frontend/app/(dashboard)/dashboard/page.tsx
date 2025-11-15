"use client"

import { motion } from "framer-motion"
import { Search, Brain, PenTool } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InstitutionalFooter } from "@/components/institutional-footer"

const cards = [
  {
    title: "Explorar Artigos",
    description: "Busque artigos científicos em bases de dados acadêmicas",
    icon: Search,
    href: "/explorar",
    color: "bg-blue-500",
  },
  {
    title: "Analisar com IA",
    description: "Gere resumos e insights automáticos de artigos",
    icon: Brain,
    href: "/analisar",
    color: "bg-purple-500",
  },
  {
    title: "Assistente de Escrita",
    description: "Formate citações ABNT e aprimore seu texto acadêmico",
    icon: PenTool,
    href: "/escrever",
    color: "bg-green-500",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 space-y-12 p-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Bem-vindo de volta, João!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Continue sua jornada de pesquisa acadêmica com IA.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={card.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg dark:hover:shadow-blue-500/10">
                  <CardHeader>
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <CardDescription className="text-base">{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
                      Acessar →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <InstitutionalFooter />
    </div>
  )
}
