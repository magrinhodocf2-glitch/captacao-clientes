"use client"

import { useState, useEffect } from 'react'
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  Eye,
  Trash2,
  Download,
  Filter,
  Search,
  RefreshCw,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: number
  nome: string
  email: string
  telefone: string
  mensagem: string
  status?: 'novo' | 'contatado' | 'convertido' | 'perdido'
  prioridade?: 'baixa' | 'media' | 'alta'
  created_at: string
  updated_at?: string
}

interface Depoimento {
  id: number
  nome: string
  cargo: string
  empresa: string
  depoimento: string
  rating: number
  ativo: boolean
  created_at: string
}

interface Stats {
  totalLeads: number
  leadsHoje: number
  leadsSemana: number
  leadsConvertidos: number
  taxaConversao: number
  totalDepoimentos: number
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'leads' | 'depoimentos' | 'analytics'>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([])
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    leadsHoje: 0,
    leadsSemana: 0,
    leadsConvertidos: 0,
    taxaConversao: 0,
    totalDepoimentos: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchLeads(),
        fetchDepoimentos()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        const leadsData = data.data || []
        setLeads(leadsData)
        calculateStats(leadsData)
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
      setLeads([])
    }
  }

  const fetchDepoimentos = async () => {
    try {
      const response = await fetch('/api/depoimentos')
      if (response.ok) {
        const data = await response.json()
        setDepoimentos(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar depoimentos:', error)
      setDepoimentos([])
    }
  }

  const calculateStats = (leadsData: Lead[]) => {
    const hoje = new Date()
    const semanaAtras = new Date()
    semanaAtras.setDate(hoje.getDate() - 7)

    const leadsHoje = leadsData.filter(lead => 
      new Date(lead.created_at).toDateString() === hoje.toDateString()
    ).length

    const leadsSemana = leadsData.filter(lead => 
      new Date(lead.created_at) >= semanaAtras
    ).length

    const leadsConvertidos = leadsData.filter(lead => 
      lead.status === 'convertido'
    ).length

    const taxaConversao = leadsData.length > 0 
      ? Math.round((leadsConvertidos / leadsData.length) * 100) 
      : 0

    setStats({
      totalLeads: leadsData.length,
      leadsHoje,
      leadsSemana,
      leadsConvertidos,
      taxaConversao,
      totalDepoimentos: depoimentos.length
    })
  }

  const updateLeadStatus = async (leadId: number, status: Lead['status']) => {
    try {
      const response = await fetch(`/api/leads`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: leadId, status }),
      })

      if (response.ok) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, status } : lead
        ))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const deleteLead = async (leadId: number) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return

    try {
      const response = await fetch(`/api/leads`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: leadId }),
      })

      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId))
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
    }
  }

  const toggleDepoimentoStatus = async (depoimentoId: number) => {
    try {
      const depoimento = depoimentos.find(d => d.id === depoimentoId)
      if (!depoimento) return

      const response = await fetch(`/api/admin/depoimentos`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: depoimentoId, 
          ativo: !depoimento.ativo 
        }),
      })

      if (response.ok) {
        setDepoimentos(prev => prev.map(dep => 
          dep.id === depoimentoId ? { ...dep, ativo: !dep.ativo } : dep
        ))
      }
    } catch (error) {
      console.error('Erro ao atualizar depoimento:', error)
    }
  }

  const exportLeads = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Mensagem', 'Status', 'Data'],
      ...leads.map(lead => [
        lead.nome,
        lead.email,
        lead.telefone,
        lead.mensagem.replace(/,/g, ';'),
        lead.status || 'novo',
        new Date(lead.created_at).toLocaleString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-100 text-blue-800'
      case 'contatado': return 'bg-yellow-100 text-yellow-800'
      case 'convertido': return 'bg-green-100 text-green-800'
      case 'perdido': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (prioridade?: string) => {
    switch (prioridade) {
      case 'alta': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'media': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'baixa': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600 mt-2">Gerencie leads, depoimentos e analise métricas</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </button>
              <Link 
                href="/"
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Site</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.leadsHoje}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa Conversão</p>
                <p className="text-2xl font-bold text-gray-900">{stats.taxaConversao}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Depoimentos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDepoimentos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('leads')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leads'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Leads ({stats.totalLeads})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('depoimentos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'depoimentos'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Depoimentos ({stats.totalDepoimentos})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="p-6">
              {/* Filters and Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar leads..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="novo">Novo</option>
                    <option value="contatado">Contatado</option>
                    <option value="convertido">Convertido</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
                <button
                  onClick={exportLeads}
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar CSV</span>
                </button>
              </div>

              {/* Leads Table */}
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum lead encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mensagem
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getPriorityIcon(lead.prioridade)}
                              <div className="ml-2">
                                <div className="text-sm font-medium text-gray-900">{lead.nome}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{lead.email}</div>
                            <div className="text-sm text-gray-500">{lead.telefone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              {lead.mensagem.length > 100 
                                ? `${lead.mensagem.substring(0, 100)}...` 
                                : lead.mensagem
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={lead.status || 'novo'}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}
                            >
                              <option value="novo">Novo</option>
                              <option value="contatado">Contatado</option>
                              <option value="convertido">Convertido</option>
                              <option value="perdido">Perdido</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="text-red-600 hover:text-red-900 ml-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Depoimentos Tab */}
          {activeTab === 'depoimentos' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Gerenciar Depoimentos</h3>
              </div>

              {depoimentos.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum depoimento encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {depoimentos.map((depoimento) => (
                    <div key={depoimento.id} className={`bg-white border rounded-lg p-6 ${depoimento.ativo ? 'border-green-200' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{depoimento.nome}</h4>
                          <p className="text-sm text-gray-600">{depoimento.cargo}</p>
                          <p className="text-sm text-gray-500">{depoimento.empresa}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < depoimento.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-4">{depoimento.depoimento}</p>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          depoimento.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {depoimento.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => toggleDepoimentoStatus(depoimento.id)}
                          className={`px-3 py-1 text-xs font-medium rounded ${
                            depoimento.ativo 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {depoimento.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Análise de Performance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Resumo de Conversões</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leads Novos:</span>
                      <span className="font-semibold">{leads.filter(l => l.status === 'novo' || !l.status).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contatados:</span>
                      <span className="font-semibold">{leads.filter(l => l.status === 'contatado').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Convertidos:</span>
                      <span className="font-semibold text-green-600">{stats.leadsConvertidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Perdidos:</span>
                      <span className="font-semibold text-red-600">{leads.filter(l => l.status === 'perdido').length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Métricas Temporais</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Leads Hoje:</span>
                      <span className="font-semibold">{stats.leadsHoje}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Esta Semana:</span>
                      <span className="font-semibold">{stats.leadsSemana}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de Conversão:</span>
                      <span className="font-semibold text-emerald-600">{stats.taxaConversao}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Depoimentos Ativos:</span>
                      <span className="font-semibold">{depoimentos.filter(d => d.ativo).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}