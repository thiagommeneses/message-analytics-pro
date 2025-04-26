
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  CampaignData, 
  FilterOptions, 
  CampaignMetrics, 
  ResponseFilter,
  MessageStatus,
  DateRange,
  ExportOptions
} from '../types/campaign';
import { 
  processCsvFile, 
  filterCampaignData, 
  calculateMetrics, 
  prepareDataForExport 
} from '../services/csvService';
import { useToast } from "@/hooks/use-toast";

interface CampaignContextType {
  isLoading: boolean;
  originalData: CampaignData[];
  filteredData: CampaignData[];
  metrics: CampaignMetrics | null;
  filters: FilterOptions;
  availableTemplates: string[];
  availableStatuses: MessageStatus[];
  
  uploadCsv: (file: File) => Promise<void>;
  updateFilters: (newFilters: Partial<FilterOptions>) => void;
  exportData: (options: ExportOptions) => void;
  resetData: () => void;
}

const defaultFilters: FilterOptions = {
  templates: [],
  statuses: [],
  responseFilter: 'all',
  dateRange: {
    startDate: null,
    endDate: null
  }
};

const emptyMetrics: CampaignMetrics = {
  totalContacts: 0,
  filteredContacts: 0,
  notResponded: 0,
  unsubscribed: 0,
  statusDistribution: {} as Record<MessageStatus, number>,
  responseDistribution: {
    responded: 0,
    notResponded: 0
  }
};

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<CampaignData[]>([]);
  const [filteredData, setFilteredData] = useState<CampaignData[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<MessageStatus[]>([]);
  
  const { toast } = useToast();
  
  const uploadCsv = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Processa o arquivo CSV
      const data = await processCsvFile(file);
      setOriginalData(data);
      
      // Extrai valores únicos para os filtros
      const templates = [...new Set(data.map(item => item.templateTitle))];
      const statuses = [...new Set(data.map(item => item.campaignMessageStatus))];
      
      setAvailableTemplates(templates);
      setAvailableStatuses(statuses as MessageStatus[]);
      
      // Inicializa com todos os dados
      setFilteredData(data);
      
      // Calcula métricas iniciais
      const initialMetrics = calculateMetrics(data, data);
      setMetrics(initialMetrics);
      
      // Reseta filtros
      setFilters(defaultFilters);
      
      toast({
        title: "Arquivo processado com sucesso",
        description: `${data.length} registros foram carregados.`,
      });
      
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique se o formato do arquivo é válido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    // Atualiza os filtros
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Aplica os filtros aos dados
    const newFilteredData = filterCampaignData(originalData, updatedFilters);
    setFilteredData(newFilteredData);
    
    // Recalcula as métricas
    const updatedMetrics = calculateMetrics(originalData, newFilteredData);
    setMetrics(updatedMetrics);
  };
  
  const exportData = (options: ExportOptions) => {
    try {
      // Determina quais colunas exportar
      let columnsToExport: string[] = [];
      
      if (options.onlyPhoneNumber) {
        columnsToExport = ['fullNumber'];
      } else if (options.includeNames) {
        columnsToExport = ['fullNumber', 'name'];
      } else if (options.customColumns.length) {
        columnsToExport = options.customColumns;
      } else {
        // Default: exporta todas as colunas
        columnsToExport = Object.keys(filteredData[0] || {});
      }
      
      // Prepara CSV
      const csvContent = prepareDataForExport(filteredData, { columns: columnsToExport });
      
      // Cria um blob e gera download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `campanhas_filtradas_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `${filteredData.length} registros exportados.`,
      });
      
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };
  
  const resetData = () => {
    setOriginalData([]);
    setFilteredData([]);
    setMetrics(null);
    setFilters(defaultFilters);
    setAvailableTemplates([]);
    setAvailableStatuses([]);
  };
  
  return (
    <CampaignContext.Provider
      value={{
        isLoading,
        originalData,
        filteredData,
        metrics,
        filters,
        availableTemplates,
        availableStatuses,
        uploadCsv,
        updateFilters,
        exportData,
        resetData
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
