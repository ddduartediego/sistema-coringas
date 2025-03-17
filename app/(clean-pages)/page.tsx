'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaGoogle, FaUsers, FaCalendarAlt, FaFileInvoiceDollar, FaUserCog, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Componente de cartão para funcionalidades
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <motion.div 
    className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all"
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

export default function HomePage() {
  // Lista de funcionalidades
  const features = [
    {
      icon: <FaUsers className="w-6 h-6" />,
      title: "Gestão de Integrantes",
      description: "Cadastro completo dos membros da equipe."
    },
    {
      icon: <FaCalendarAlt className="w-6 h-6" />,
      title: "Eventos",
      description: "Organização e controle de todos os eventos da equipe"
    },
    {
      icon: <FaFileInvoiceDollar className="w-6 h-6" />,
      title: "Cobranças",
      description: "Gerenciamento de mensalidades e outras contribuições financeiras, com histórico e status de pagamento."
    },
    {
      icon: <FaUserCog className="w-6 h-6" />,
      title: "Área Administrativa",
      description: "Painel exclusivo para coordenadores com ferramentas de gestão avançadas e relatórios."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Seção principal hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <motion.div 
          className="md:w-1/2 mb-10 md:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Plataforma de Gestão da <br />
            <span className="text-blue-600">Equipe Coringas</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Sistema desenvolvido para apoiar na gestão da equipe
          </p>
          <div className="flex space-x-4">
            <Link href="/sign-in" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
              Entrar <FaArrowRight className="ml-2" />
            </Link>
            <Link href="/sign-up" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              Cadastre-se <FaArrowRight className="ml-2" />
            </Link>
            <a href="#features" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Saiba mais
            </a>
          </div>
        </motion.div>
        <motion.div 
          className="md:w-1/2 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Imagem ilustrativa do sistema com o logo Coringas DEVS */}
          <div className="w-full max-w-md bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden">
            <div className="relative p-8 py-12">
              {/* Decoração de código no fundo */}
              <div className="absolute inset-0 opacity-15 flex items-center justify-center overflow-hidden">
                <div className="text-white text-sm font-mono transform rotate-6 scale-125">
                  <div>function coringasDevs() {`{`}</div>
                  <div>&nbsp;&nbsp;return SQTF.map(dev {`=>`} {`{`}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;dev.skills.push('excelência');</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;return dev;</div>
                  <div>&nbsp;&nbsp;{`}`});</div>
                  <div>{`}`}</div>
                </div>
              </div>
              
              {/* Conteúdo principal */}
              <div className="relative z-10 text-white text-center">
                {/* Logo do coringa estilizado */}
                <motion.div 
                  className="mx-auto w-48 h-48 mb-6 relative overflow-hidden rounded-full border-4 border-white/30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(255,255,255,0.3)",
                    borderColor: "rgba(255,255,255,0.5)"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-blue-500/30 rounded-full pulse-slow"></div>
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 2, 0, -2, 0],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 5,
                      ease: "easeInOut" 
                    }}
                  >
                    <Image 
                      src="/coringas_logo.jpeg" 
                      alt="Coringas DEVS Logo" 
                      width={200}
                      height={200}
                      className="object-cover h-full w-full rounded-full"
                    />
                  </motion.div>
                </motion.div>

                <style jsx global>{`
                  @keyframes pulse-slow {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.5; }
                  }
                  .pulse-slow {
                    animation: pulse-slow 3s infinite;
                  }
                `}</style>
                
                <h3 className="text-3xl font-bold mb-1 tracking-wide">CORINGAS</h3>
                <div className="flex items-center justify-center mb-3">
                  <div className="h-0.5 w-12 bg-white opacity-50 mr-3"></div>
                  <p className="text-xl font-bold text-yellow-300">DEVS.</p>
                  <div className="h-0.5 w-12 bg-white opacity-50 ml-3"></div>
                </div>
                <p className="text-lg opacity-90 font-medium">#SQTF</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Seção de funcionalidades */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Funcionalidades do Sistema</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conheça os principais módulos e ferramentas disponíveis para gerenciar a equipe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Novas funcionalidades estão sempre sendo desenvolvidas.
              Tem sugestões? Entre em contato com a coordenação da equipe!
            </p>
            <Link href="/sign-up" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              Cadastre-se agora e comece a usar <FaChevronRight className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Seção de processo de registro */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Como Acessar o Sistema</h2>
            <p className="text-gray-600">
              Entenda o processo de registro e acesso à plataforma.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">1</span>
              Registro com Conta Google
            </h3>
            <p className="text-gray-600 mb-4">
              O cadastro é realizado com sua conta Google, garantindo maior segurança e facilidade.
              Apenas forneça o acesso quando solicitado e seus dados básicos serão importados automaticamente.
            </p>
            <div className="flex justify-center mt-6">
              <Link 
                href="/sign-up" 
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <FaGoogle className="mr-2 text-red-500" /> Continuar com Google
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">2</span>
              Aprovação pelo Administrador
            </h3>
            <p className="text-gray-600 mb-4">
              Após o registro, um administrador do sistema precisará aprovar seu acesso.
              Você receberá uma notificação quando seu acesso for liberado.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700">
              <p className="text-sm">
                Esta etapa de aprovação garante a segurança do sistema e confirma que apenas membros autorizados tenham acesso às informações da equipe.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">3</span>
              Acesso ao Sistema
            </h3>
            <p className="text-gray-600 mb-4">
              Após a aprovação, você terá acesso completo ao sistema e suas funcionalidades, 
              de acordo com seu perfil de usuário.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 