"use client"

import { useState } from "react"
import { Facebook, Instagram, Youtube, Linkedin, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

export function NikeFooter() {
  const [showOtherCategories, setShowOtherCategories] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  return (
    <footer className="border-t border-gray-700 bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Links principais */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Links Principais</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Encontre uma loja Research Flow
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Cadastre-se para receber novidades
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Guia da Plataforma
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Suporte Técnico
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  FAQ (Perguntas Frequentes)
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Acompanhe seu Projeto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <button
              onClick={() => setShowOtherCategories(!showOtherCategories)}
              className="mb-4 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider md:cursor-default"
            >
              <span>Outras Categorias</span>
              <span className="md:hidden">
                {showOtherCategories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>
            <ul className={`space-y-3 ${showOtherCategories ? "block" : "hidden md:block"}`}>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Ferramentas de Pesquisa
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Recursos Acadêmicos
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  IA para Escrita
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Comunidade
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="mb-4 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider md:cursor-default"
            >
              <span>Sobre a Research Flow</span>
              <span className="md:hidden">
                {showAbout ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>
            <ul className={`space-y-3 ${showAbout ? "block" : "hidden md:block"}`}>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[#B3B3B3] transition-colors hover:text-[#2563EB] dark:hover:text-primary"
                >
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Redes Sociais</h3>
            <div className="flex gap-4">
              <Link
                href="#"
                className="rounded-full bg-[#1A1A1A] p-2 transition-colors hover:bg-[#2563EB] dark:hover:bg-primary"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="rounded-full bg-[#1A1A1A] p-2 transition-colors hover:bg-[#2563EB] dark:hover:bg-primary"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="rounded-full bg-[#1A1A1A] p-2 transition-colors hover:bg-[#2563EB] dark:hover:bg-primary"
              >
                <Youtube className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="rounded-full bg-[#1A1A1A] p-2 transition-colors hover:bg-[#2563EB] dark:hover:bg-primary"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 text-center">
          <p className="text-sm text-[#B3B3B3]">
            © {new Date().getFullYear()} Research Flow. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
