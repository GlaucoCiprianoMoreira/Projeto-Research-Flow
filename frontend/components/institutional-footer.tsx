"use client"

import { motion } from "framer-motion"

export function InstitutionalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-gradient-to-b from-white via-blue-50 to-blue-100 text-gray-900 dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="max-w-2xl text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-300"
            >
              Sobre o Nosso Projeto
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm leading-relaxed text-gray-700 dark:text-slate-200"
            >
              O Research Flow usa IA para otimizar pesquisas acadêmicas: busca artigos, gera resumos inteligentes e
              formata textos em ABNT, APA e Vancouver. Centralize ferramentas e acelere sua produtividade.
            </motion.p>
          </div>

          {/* Instituição */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-xs text-gray-600 dark:text-slate-300">UECE — Universidade Estadual do Ceará</p>
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="border-t border-slate-300 pt-4 text-center dark:border-slate-700/50"
          >
            <p className="text-xs text-gray-500 dark:text-slate-400">© 2025 Research Flow — Desenvolvido na UECE</p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
