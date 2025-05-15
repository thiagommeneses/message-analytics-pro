
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  CampaignData, 
  FilterOptions, 
  CampaignMetrics, 
  ResponseFilter,
  MessageStatus,
  DateRange,
  ExportOptions,
  ZenviaExportOptions,
  ExcelExportOptions
} from '../types/campaign';
import { 
  processCsvFile, 
  filterCampaignData, 
  calculateMetrics, 
  isUnsubscribeMessage,
  isValidBrazilianMobileNumber,
  correctBrazilianMobileNumber
} from '../services/csvService';
import {
  exportCSV,
  exportZenvia,
  exportExcel
} from '../services/exportService';
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
  exportToZenvia: (options: ZenviaExportOptions) => void;
  exportToExcel: (options: ExcelExportOptions) => void;
  resetData: () => void;
}

const defaultFilters: FilterOptions = {
  templates: [],
  statuses: [],
  responseFilter: 'all',
  dateRange: {
    startDate: null,
    endDate: null
  },
  removeDuplicates: false,
  removeInvalidNumbers: false
};

const emptyMetrics: CampaignMetrics = {
  totalContacts: 0,
  filteredContacts: 0,
  notResponded: 0,
  unsubscribed: 0,
  invalidNumbers: 0,
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
      console.log("Iniciando upload e processamento do CSV:", file.name);
      
      // Processa o arquivo CSV
      const data = await processCsvFile(file);
      console.log(`Dados processados com sucesso: ${data.length} registros`);
      
      if (data.length === 0) {
        throw new Error("Nenhum registro válido encontrado no arquivo");
      }
      
      setOriginalData(data);
      
      // Extrai valores únicos para os filtros
      const templates = [...new Set(data.map(item => item.templateTitle))];
      const statuses = [...new Set(data.map(item => item.campaignMessageStatus))];
      
      console.log("Templates disponíveis:", templates);
      console.log("Status disponíveis:", statuses);
      
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
      let errorMessage = "Verifique se o formato do arquivo é válido.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao processar arquivo",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset state em caso de erro
      resetData();
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
      setIsLoading(true);
      
      if (filteredData.length === 0) {
        toast({
          title: "Não há dados para exportar",
          description: "Aplique filtros menos restritivos ou carregue um novo arquivo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      exportCSV(filteredData, options, () => {
        setIsLoading(false);
        toast({
          title: "Exportação concluída",
          description: `${filteredData.length} registros exportados.`,
        });
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      setIsLoading(false);
      
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };
  
  const exportToZenvia = (options: ZenviaExportOptions) => {
    try {
      setIsLoading(true);
      
      if (filteredData.length === 0) {
        toast({
          title: "Não há dados para exportar",
          description: "Aplique filtros menos restritivos ou carregue um novo arquivo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      exportZenvia(filteredData, options, () => {
        setIsLoading(false);
        toast({
          title: "Exportação para Zenvia concluída",
          description: `${filteredData.length} registros exportados.`,
        });
      });
    } catch (error) {
      console.error("Erro na exportação para Zenvia:", error);
      setIsLoading(false);
      
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Zenvia.",
        variant: "destructive",
      });
    }
  };
  
  // Nova função para exportar para Excel
  const exportToExcel = (options: ExcelExportOptions) => {
    try {
      setIsLoading(true);
      
      if (filteredData.length === 0) {
        toast({
          title: "Não há dados para exportar",
          description: "Aplique filtros menos restritivos ou carregue um novo arquivo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      exportExcel(filteredData, options, () => {
        setIsLoading(false);
        toast({
          title: "Exportação para Excel concluída",
          description: `${filteredData.length} registros exportados.`,
        });
      });
    } catch (error) {
      console.error("Erro na exportação para Excel:", error);
      setIsLoading(false);
      
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel.",
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
        exportToZenvia,
        exportToExcel,
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
