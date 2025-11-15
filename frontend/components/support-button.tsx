"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full bg-[#2563EB] shadow-lg transition-all hover:scale-110 hover:bg-[#1d4ed8] dark:bg-primary dark:hover:bg-primary/90"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80"
          >
            <Card className="border-none shadow-2xl">
              <CardHeader className="bg-[#2563EB] text-white dark:bg-primary">
                <CardTitle className="text-lg">Suporte Research Flow</CardTitle>
                <CardDescription className="text-blue-100 dark:text-primary-foreground/80">
                  Estamos aqui para ajudar
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4 text-sm text-[#1E293B] dark:text-foreground">
                  Olá! Precisa de ajuda? Nossa equipe de suporte está disponível para tirar suas dúvidas.
                </p>
                <div className="space-y-2">
                  <Button className="w-full" variant="default">
                    Iniciar Chat
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline" onClick={() => setIsOpen(false)}>
                    Ver FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
