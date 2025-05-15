
import { CampaignData, ExportOptions, ZenviaExportOptions, ExcelExportOptions } from '../types/campaign';
import * as XLSX from 'xlsx';

// Função auxiliar para download seguro de arquivos
export const downloadFile = (url: string, filename: string): void => {
  // Cria um link temporário
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  
  // Dispara o download sem bloquear a UI
  document.body.appendChild(link);
  
  // Usar setTimeout para garantir que o download inicie antes de limpar
  setTimeout(() => {
    link.click();
    
    // Remove o link do DOM após um curto período para garantir que o download iniciou
    setTimeout(() => {
      // Importante: removemos o link do DOM para evitar vazamentos de memória
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      // Liberamos o URL para liberar memória
      URL.revokeObjectURL(url);
    }, 100);
  }, 0);
};

// Prepara os dados para exportação em CSV
export const prepareDataForExport = (
  filteredData: CampaignData[],
  exportOptions: { columns: string[] }
): string => {
  // Cria o cabeçalho
  const header = exportOptions.columns.join(',');
  
  // Cria as linhas de dados
  const rows = filteredData.map(item => {
    return exportOptions.columns.map(col => {
      const value = (item as any)[col] || '';
      // Se o valor contém vírgula, envolve em aspas
      return value.includes(',') ? `"${value}"` : value;
    }).join(',');
  });
  
  // Junta tudo em uma string CSV
  return [header, ...rows].join('\n');
};

// Prepara os dados para exportação para o formato Zenvia
export const prepareZenviaExport = (
  filteredData: CampaignData[],
  messageText: string
): string => {
  // Cabeçalho específico para Zenvia
  const header = 'celular;sms';
  
  // Cria as linhas de dados
  const rows = filteredData.map(item => {
    // Remove o + do número se existir
    const phoneNumber = item.fullNumber.startsWith('+') 
      ? item.fullNumber.substring(1) 
      : item.fullNumber;
    
    // Não colocamos aspas no texto da mensagem para o formato Zenvia
    return `${phoneNumber};${messageText}`;
  });
  
  // Junta tudo em uma string CSV com separador ponto e vírgula
  return [header, ...rows].join('\n');
};

// Função para exportar dados CSV
export const exportCSV = (
  filteredData: CampaignData[],
  options: ExportOptions,
  onComplete: () => void
): void => {
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
    if (!options.splitFiles || options.recordsPerFile <= 0 || options.recordsPerFile >= filteredData.length) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      downloadFile(url, `campanhas_filtradas_${new Date().toISOString().slice(0,10)}.csv`);
      
      // Chama o callback após iniciar o download
      setTimeout(onComplete, 300);
    } else {
      // Divide em múltiplos arquivos
      const csvHeader = columnsToExport.join(',') + '\n';
      const csvRows = csvContent.split('\n').slice(1); // Remove o cabeçalho
      const totalRecords = csvRows.length;
      const recordsPerFile = Math.max(1, options.recordsPerFile);
      const totalFiles = Math.ceil(totalRecords / recordsPerFile);
      
      // Limita o número máximo de arquivos para prevenir problemas
      const maxFilesToCreate = Math.min(totalFiles, 100);
      
      // Cria e baixa cada arquivo com um intervalo para não travar o navegador
      for (let i = 0; i < maxFilesToCreate; i++) {
        const startIdx = i * recordsPerFile;
        const endIdx = Math.min(startIdx + recordsPerFile, totalRecords);
        const fileRows = csvRows.slice(startIdx, endIdx);
        
        // Verifica se existem linhas para exportar
        if (fileRows.length === 0) continue;
        
        const fileContent = csvHeader + fileRows.join('\n');
        
        const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Usa um timeout maior para cada arquivo subsequente para evitar travamentos
        setTimeout(() => {
          downloadFile(url, `campanhas_filtradas_parte${i+1}_de_${maxFilesToCreate}_${new Date().toISOString().slice(0,10)}.csv`);
        }, i * 500);  // 500ms de intervalo entre cada download
      }
      
      // Executa o callback após um tempo suficiente para todos os downloads serem iniciados
      setTimeout(onComplete, maxFilesToCreate * 500 + 1000);
    }
  } catch (error) {
    console.error("Erro na exportação:", error);
    // Ainda executa o callback em caso de erro para evitar UI travada
    setTimeout(onComplete, 100);
  }
};

// Função para exportar dados Zenvia
export const exportZenvia = (
  filteredData: CampaignData[],
  options: ZenviaExportOptions,
  onComplete: () => void
): void => {
  try {
    // Prepara CSV para Zenvia - sem aspas duplas no texto da mensagem
    const csvContent = prepareZenviaExport(filteredData, options.messageText);
    
    // Se não precisar dividir o arquivo, exporta normalmente
    if (!options.splitFiles || options.recordsPerFile <= 0 || options.recordsPerFile >= filteredData.length) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      downloadFile(url, `zenvia_export_${new Date().toISOString().slice(0,10)}.csv`);
      
      // Chama o callback após iniciar o download
      setTimeout(onComplete, 300);
    } else {
      // Divide em múltiplos arquivos
      const csvHeader = "celular;sms\n";
      const csvRows = csvContent.split('\n').slice(1); // Remove o cabeçalho
      const totalRecords = csvRows.length;
      const recordsPerFile = Math.max(1, options.recordsPerFile);
      const totalFiles = Math.ceil(totalRecords / recordsPerFile);
      
      // Limita o número máximo de arquivos para prevenir problemas
      const maxFilesToCreate = Math.min(totalFiles, 100);
      
      // Cria e baixa cada arquivo com um intervalo para não travar o navegador
      for (let i = 0; i < maxFilesToCreate; i++) {
        const startIdx = i * recordsPerFile;
        const endIdx = Math.min(startIdx + recordsPerFile, totalRecords);
        const fileRows = csvRows.slice(startIdx, endIdx);
        
        // Verifica se existem linhas para exportar
        if (fileRows.length === 0) continue;
        
        const fileContent = csvHeader + fileRows.join('\n');
        
        const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Usa um timeout maior para cada arquivo subsequente para evitar travamentos
        setTimeout(() => {
          downloadFile(url, `zenvia_export_parte${i+1}_de_${maxFilesToCreate}_${new Date().toISOString().slice(0,10)}.csv`);
        }, i * 500);  // 500ms de intervalo entre cada download
      }
      
      // Executa o callback após um tempo suficiente para todos os downloads serem iniciados
      setTimeout(onComplete, maxFilesToCreate * 500 + 1000);
    }
  } catch (error) {
    console.error("Erro na exportação para Zenvia:", error);
    // Ainda executa o callback em caso de erro para evitar UI travada
    setTimeout(onComplete, 100);
  }
};

// Nova função para exportação para Excel
export const exportExcel = (
  filteredData: CampaignData[],
  options: ExcelExportOptions,
  onComplete: () => void
): void => {
  try {
    if (!filteredData.length) {
      console.warn("Não há dados para exportar");
      setTimeout(onComplete, 100);
      return;
    }
    
    // Função para traduzir cabeçalhos
    const translateHeader = (header: string): string => {
      switch (header) {
        case 'fullNumber': return 'Telefone';
        case 'name': return 'Nome';
        case 'templateTitle': return 'Campanha';
        case 'campaignMessageStatus': return 'Status';
        case 'replyMessageText': return 'Resposta';
        case 'sentDate': return 'Data de Envio';
        default: return header;
      }
    };
    
    // Traduz os status para português
    const translateStatus = (status: string): string => {
      switch (status) {
        case 'delivered': return 'Entregue';
        case 'read': return 'Lido';
        case 'replied': return 'Respondido';
        case 'failed': return 'Falha';
        case 'pending': return 'Pendente';
        case 'sent': return 'Enviado';
        default: return status;
      }
    };
    
    // Formata data para formato brasileiro
    const formatDate = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    };
    
    // Se não precisar dividir o arquivo, exporta normalmente
    if (!options.splitFiles || options.recordsPerFile <= 0 || options.recordsPerFile >= filteredData.length) {
      // Prepara os dados para o Excel com cabeçalhos traduzidos
      const headers = Object.keys(filteredData[0]).map(translateHeader);
      
      // Formatar os dados para exibição amigável
      const formattedData = filteredData.map(item => {
        const row: Record<string, any> = {};
        Object.entries(item).forEach(([key, value]) => {
          if (key === 'campaignMessageStatus') {
            row[translateHeader(key)] = translateStatus(value);
          } else if (key === 'sentDate') {
            row[translateHeader(key)] = formatDate(value);
          } else {
            row[translateHeader(key)] = value;
          }
        });
        return row;
      });
      
      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      
      // Gerar arquivo Excel
      XLSX.writeFile(wb, `campanhas_filtradas_${new Date().toISOString().slice(0,10)}.xlsx`);
      
      // Chama o callback após um tempo suficiente para o download ser iniciado
      setTimeout(onComplete, 500);
    } else {
      const recordsPerFile = Math.max(1, options.recordsPerFile);
      const totalRecords = filteredData.length;
      const totalFiles = Math.ceil(totalRecords / recordsPerFile);
      
      // Limita o número máximo de arquivos para prevenir problemas
      const maxFilesToCreate = Math.min(totalFiles, 50);
      
      // Cria e baixa cada arquivo com um intervalo para não travar o navegador
      for (let i = 0; i < maxFilesToCreate; i++) {
        const startIdx = i * recordsPerFile;
        const endIdx = Math.min(startIdx + recordsPerFile, totalRecords);
        const fileData = filteredData.slice(startIdx, endIdx);
        
        if (fileData.length === 0) continue;
        
        // Formatar os dados para exibição amigável
        const formattedData = fileData.map(item => {
          const row: Record<string, any> = {};
          Object.entries(item).forEach(([key, value]) => {
            if (key === 'campaignMessageStatus') {
              row[translateHeader(key)] = translateStatus(value);
            } else if (key === 'sentDate') {
              row[translateHeader(key)] = formatDate(value);
            } else {
              row[translateHeader(key)] = value;
            }
          });
          return row;
        });
        
        // Usar timeout para não bloquear a UI
        setTimeout(() => {
          // Criar planilha
          const headers = Object.keys(fileData[0]).map(translateHeader);
          const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Dados");
          
          // Gerar arquivo Excel
          XLSX.writeFile(wb, `campanhas_filtradas_parte${i+1}_de_${maxFilesToCreate}_${new Date().toISOString().slice(0,10)}.xlsx`);
        }, i * 800);  // 800ms de intervalo entre cada download para Excel (arquivos maiores)
      }
      
      // Executa o callback após um tempo suficiente para todos os downloads serem iniciados
      setTimeout(onComplete, maxFilesToCreate * 800 + 1500);
    }
  } catch (error) {
    console.error("Erro na exportação para Excel:", error);
    // Ainda executa o callback em caso de erro para evitar UI travada
    setTimeout(onComplete, 100);
  }
};
