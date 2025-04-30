
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  CampaignData, 
  FilterOptions, 
  CampaignMetrics, 
  ResponseFilter,
  MessageStatus,
  DateRange,
  ExportOptions,
  ZenviaExportOptions
} from '../types/campaign';
import { 
  processCsvFile, 
  filterCampaignData, 
  calculateMetrics, 
  prepareDataForExport,
  prepareZenviaExport,
  isUnsubscribeMessage,
  isValidBrazilianMobileNumber,
  correctBrazilianMobileNumber
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
  exportToZenvia: (options: ZenviaExportOptions) => void;
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
      
      // Se não precisar dividir o arquivo, exporta normalmente
      if (!options.splitFiles || options.recordsPerFile <= 0) {
        // Cria um blob e gera download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Usa um método mais seguro para download
        downloadFile(url, `campanhas_filtradas_${new Date().toISOString().slice(0,10)}.csv`);
        
        toast({
          title: "Exportação concluída",
          description: `${filteredData.length} registros exportados.`,
        });
      } else {
        // Divide em múltiplos arquivos
        const csvHeader = columnsToExport.join(',') + '\n';
        const csvRows = csvContent.split('\n').slice(1); // Remove o cabeçalho
        const totalRecords = csvRows.length;
        const recordsPerFile = options.recordsPerFile;
        const totalFiles = Math.ceil(totalRecords / recordsPerFile);
        
        // Cria e baixa cada arquivo
        for (let i = 0; i < totalFiles; i++) {
          const startIdx = i * recordsPerFile;
          const endIdx = Math.min(startIdx + recordsPerFile, totalRecords);
          const fileRows = csvRows.slice(startIdx, endIdx);
          const fileContent = csvHeader + fileRows.join('\n');
          
          const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          
          // Usa um setTimeout para criar uma pequena pausa entre os downloads
          setTimeout(() => {
            downloadFile(url, `campanhas_filtradas_parte${i+1}_${new Date().toISOString().slice(0,10)}.csv`);
          }, i * 200);  // 200ms de intervalo entre cada download
        }
        
        toast({
          title: "Exportação concluída",
          description: `${filteredData.length} registros exportados em ${totalFiles} arquivos.`,
        });
      }
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };
  
  const exportToZenvia = (options: ZenviaExportOptions) => {
    try {
      // Prepara CSV para Zenvia - sem aspas duplas no texto da mensagem
      const csvContent = prepareZenviaExport(filteredData, options.messageText);
      
      // Se não precisar dividir o arquivo, exporta normalmente
      if (!options.splitFiles || options.recordsPerFile <= 0) {
        // Cria um blob e gera download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Usa um método mais seguro para download
        downloadFile(url, `zenvia_export_${new Date().toISOString().slice(0,10)}.csv`);
        
        toast({
          title: "Exportação para Zenvia concluída",
          description: `${filteredData.length} registros exportados.`,
        });
      } else {
        // Divide em múltiplos arquivos
        const csvHeader = "celular;sms\n";
        const csvRows = csvContent.split('\n').slice(1); // Remove o cabeçalho
        const totalRecords = csvRows.length;
        const recordsPerFile = options.recordsPerFile;
        const totalFiles = Math.ceil(totalRecords / recordsPerFile);
        
        // Cria e baixa cada arquivo
        for (let i = 0; i < totalFiles; i++) {
          const startIdx = i * recordsPerFile;
          const endIdx = Math.min(startIdx + recordsPerFile, totalRecords);
          const fileRows = csvRows.slice(startIdx, endIdx);
          const fileContent = csvHeader + fileRows.join('\n');
          
          const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          
          // Usa um setTimeout para criar uma pequena pausa entre os downloads
          setTimeout(() => {
            downloadFile(url, `zenvia_export_parte${i+1}_${new Date().toISOString().slice(0,10)}.csv`);
          }, i * 200);  // 200ms de intervalo entre cada download
        }
        
        toast({
          title: "Exportação para Zenvia concluída",
          description: `${filteredData.length} registros exportados em ${totalFiles} arquivos.`,
        });
      }
    } catch (error) {
      console.error("Erro na exportação para Zenvia:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Zenvia.",
        variant: "destructive",
      });
    }
  };
  
  // Função auxiliar para download seguro
  const downloadFile = (url: string, filename: string) => {
    // Cria um link temporário
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    
    // Dispara o download sem adicionar o link ao DOM
    document.body.appendChild(link);
    link.click();
    
    // Remove o link e libera o URL imediatamente após o clique
    document.body.removeChild(link);
    
    // Liberamos o URL após um pequeno delay para garantir que o download comece
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
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
