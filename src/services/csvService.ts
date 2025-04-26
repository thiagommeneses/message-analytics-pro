import { CampaignData, FilterOptions, CampaignMetrics } from '../types/campaign';

// Palavras que indicam descadastro
const UNSUBSCRIBE_KEYWORDS = ['sair', 'pare', 'não', 'nao', 'descadastrar', 'cancelar', 'remove', 'stop', 'unsubscribe'];

export const processCsvFile = (file: File): Promise<CampaignData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        console.log("CSV carregado, tamanho:", csvData.length);
        console.log("Primeiros 100 caracteres:", csvData.substring(0, 100));
        
        if (!csvData || csvData.trim() === "") {
          throw new Error('O arquivo CSV está vazio');
        }
        
        const parsedData = parseCsv(csvData);
        console.log(`CSV processado com sucesso. ${parsedData.length} registros encontrados.`);
        
        if (parsedData.length === 0) {
          throw new Error('Nenhum registro válido encontrado no arquivo CSV');
        }
        
        resolve(parsedData);
      } catch (error) {
        console.error("Erro ao processar CSV:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Erro na leitura do arquivo:", error);
      reject(new Error('Erro ao ler o arquivo CSV'));
    };
    
    reader.readAsText(file);
  });
};

const parseCsv = (csvContent: string): CampaignData[] => {
  const lines = csvContent.split('\n');
  
  if (lines.length <= 1) {
    console.error("Arquivo CSV inválido: menos de 2 linhas");
    throw new Error('Arquivo CSV inválido ou vazio');
  }
  
  console.log(`Encontradas ${lines.length} linhas no CSV`);
  console.log("Cabeçalho:", lines[0]);
  
  // Normalizar cabeçalhos e remover caracteres especiais
  const headers = lines[0].split(',').map(header => 
    header.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  
  console.log("Cabeçalhos normalizados:", headers);
  
  // Verificar se os cabeçalhos essenciais estão presentes
  const hasPhoneHeader = headers.some(h => ['fullnumber', 'phonenumber', 'telefone'].includes(h));
  const hasTemplateHeader = headers.some(h => ['templatetitle', 'template', 'campanha'].includes(h));
  const hasStatusHeader = headers.some(h => ['campaignmessagestatus', 'status'].includes(h));
  
  if (!hasPhoneHeader || !hasTemplateHeader || !hasStatusHeader) {
    console.error("Cabeçalhos essenciais ausentes:", {hasPhoneHeader, hasTemplateHeader, hasStatusHeader});
    throw new Error('Formato de CSV inválido: cabeçalhos obrigatórios ausentes');
  }
  
  const data: CampaignData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    
    // Verificar se o número de valores corresponde ao número de cabeçalhos
    if (values.length !== headers.length) {
      console.warn(`Linha ${i}: número de valores (${values.length}) não corresponde ao número de cabeçalhos (${headers.length})`);
      console.warn("Linha:", lines[i]);
      console.warn("Valores:", values);
      // Continua para a próxima linha em vez de rejeitar todo o arquivo
      continue;
    }
    
    const entry: Partial<CampaignData> = {};
    
    headers.forEach((header, index) => {
      if (index < values.length) {
        switch(header) {
          case 'fullnumber':
          case 'phonenumber':
          case 'telefone':
            entry.fullNumber = values[index];
            break;
          case 'name':
          case 'nome':
            entry.name = values[index];
            break;
          case 'templatetitle':
          case 'template':
          case 'campanha':
            entry.templateTitle = values[index];
            break;
          case 'campaignmessagestatus':
          case 'status':
            entry.campaignMessageStatus = normalizeStatus(values[index]);
            break;
          case 'replymessagetext':
          case 'resposta':
            entry.replyMessageText = values[index];
            break;
          case 'sentdate':
          case 'dataenvio':
            entry.sentDate = formatDate(values[index]);
            break;
          default:
            (entry as any)[header] = values[index];
        }
      }
    });
    
    // Verificar valores essenciais
    if (!entry.fullNumber) {
      console.warn(`Linha ${i}: número de telefone ausente, pulando registro`);
      continue;
    }
    
    // Se faltam campos essenciais, criar valores padrão
    if (!entry.templateTitle) {
      entry.templateTitle = 'Desconhecido';
    }
    
    if (!entry.campaignMessageStatus) {
      entry.campaignMessageStatus = 'unknown';
    }
    
    if (!entry.sentDate) {
      entry.sentDate = new Date().toISOString();
    }
    
    data.push(entry as CampaignData);
  }
  
  console.log(`Processamento concluído: ${data.length} registros válidos de ${lines.length-1} linhas`);
  return data;
};

// Função para interpretar corretamente as linhas CSV (considerando campos com vírgulas dentro de aspas)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Adiciona o último valor
  result.push(currentValue.trim());
  return result;
};

// Normaliza o status da mensagem para um valor padrão
const normalizeStatus = (status: string): CampaignData['campaignMessageStatus'] => {
  status = status.toLowerCase();
  
  if (status.includes('deliver')) return 'delivered';
  if (status.includes('read')) return 'read';
  if (status.includes('reply') || status.includes('respond')) return 'replied';
  if (status.includes('fail') || status.includes('error')) return 'failed';
  if (status.includes('pend')) return 'pending';
  
  return 'unknown';
};

// Formata a data para um formato consistente
const formatDate = (dateStr: string): string => {
  try {
    // Tentar vários formatos de data
    let date;
    
    // Formato ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      date = new Date(dateStr);
    } 
    // Formato DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/');
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    // Outros formatos
    else {
      date = new Date(dateStr);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn(`Data inválida: ${dateStr}`);
      return new Date().toISOString();
    }
    
    return date.toISOString();
  } catch (e) {
    console.warn(`Erro ao processar data: ${dateStr}`, e);
    return new Date().toISOString(); // Data atual como fallback
  }
};

// Função para filtrar os dados com base nas opções selecionadas
export const filterCampaignData = (
  data: CampaignData[], 
  filters: FilterOptions
): CampaignData[] => {
  return data.filter(item => {
    // Filtro de template
    if (filters.templates.length && !filters.templates.includes(item.templateTitle)) {
      return false;
    }
    
    // Filtro de status
    if (filters.statuses.length && !filters.statuses.includes(item.campaignMessageStatus)) {
      return false;
    }
    
    // Filtro de resposta
    switch(filters.responseFilter) {
      case 'responded':
        if (!item.replyMessageText) return false;
        break;
      case 'not_responded':
        if (item.replyMessageText) return false;
        break;
      case 'unsubscribed':
        if (!item.replyMessageText || !isUnsubscribeMessage(item.replyMessageText)) return false;
        break;
    }
    
    // Filtro de data
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      const messageDate = new Date(item.sentDate);
      if (messageDate < filters.dateRange.startDate || messageDate > filters.dateRange.endDate) {
        return false;
      }
    }
    
    return true;
  });
};

// Verifica se a mensagem é de descadastro
export const isUnsubscribeMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase().trim();
  return UNSUBSCRIBE_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

// Calcula métricas baseadas nos dados
export const calculateMetrics = (
  allData: CampaignData[], 
  filteredData: CampaignData[]
): CampaignMetrics => {
  // Contagem total
  const totalContacts = allData.length;
  const filteredContacts = filteredData.length;
  
  // Contagem de não respondidos
  const notResponded = filteredData.filter(item => !item.replyMessageText).length;
  
  // Contagem de descadastros
  const unsubscribed = filteredData.filter(
    item => item.replyMessageText && isUnsubscribeMessage(item.replyMessageText)
  ).length;
  
  // Distribuição por status
  const statusDistribution: Record<string, number> = {};
  filteredData.forEach(item => {
    statusDistribution[item.campaignMessageStatus] = 
      (statusDistribution[item.campaignMessageStatus] || 0) + 1;
  });
  
  // Distribuição de respostas
  const responded = filteredData.filter(item => item.replyMessageText).length;
  
  return {
    totalContacts,
    filteredContacts,
    notResponded,
    unsubscribed,
    statusDistribution,
    responseDistribution: {
      responded,
      notResponded
    }
  };
};

// Prepara os dados para exportação
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
