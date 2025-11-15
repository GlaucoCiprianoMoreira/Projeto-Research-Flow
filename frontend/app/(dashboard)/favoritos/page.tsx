"use client"

import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

export default function FavoritosPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Favoritos</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-400">Seus artigos e pesquisas favoritos salvos</p>
      </div>

      <Card className="flex min-h-[400px] items-center justify-center border border-gray-200 bg-white p-12 dark:border-gray-800 dark:bg-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhum favorito ainda</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Comece a favoritar artigos para vê-los aqui</p>
        </div>
      </Card>
    </div>
  )
}
