

import { useCampaign } from "@/context/CampaignContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { isUnsubscribeMessage } from "@/services/csvService";
import { useState } from "react";

const DataTable = () => {
  const { filteredData, isLoading } = useCampaign();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Se não há dados ou estamos carregando, mostra um estado vazio
  if ((filteredData.length === 0 && !isLoading) || isLoading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6 h-80 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          {isLoading ? (
            <p>Carregando dados...</p>
          ) : (
            <>
              <p className="text-lg">Sem dados para exibir</p>
              <p className="text-sm mt-1">
                Carregue um arquivo CSV ou ajuste os filtros
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // Calcula o número total de páginas
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  
  // Obtém os dados da página atual
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  
  // Função para navegar entre as páginas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Formata a data para exibição
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Telefone</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Resposta</TableHead>
              <TableHead>Tipo de Resposta</TableHead>
              <TableHead>Data de Envio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.fullNumber}</TableCell>
                <TableCell>{item.name || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={item.templateTitle}>
                  {item.templateTitle}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${item.campaignMessageStatus === 'delivered' ? 'bg-blue-100 text-blue-800' : 
                      item.campaignMessageStatus === 'read' ? 'bg-green-100 text-green-800' : 
                      item.campaignMessageStatus === 'replied' ? 'bg-purple-100 text-purple-800' : 
                      item.campaignMessageStatus === 'failed' ? 'bg-red-100 text-red-800' : 
                      item.campaignMessageStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-yellow-50 text-yellow-600'}`}>
                    {item.campaignMessageStatus === 'delivered' ? 'Entregue' : 
                     item.campaignMessageStatus === 'read' ? 'Lido' :
                     item.campaignMessageStatus === 'replied' ? 'Respondido' :
                     item.campaignMessageStatus === 'failed' ? 'Falha' :
                     item.campaignMessageStatus === 'pending' ? 'Pendente' : 
                     'Enviado'}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {item.replyMessageText ? (
                    <div className="truncate" title={item.replyMessageText}>
                      <span className={isUnsubscribeMessage(item.replyMessageText) ? 'text-red-500 font-medium' : ''}>
                        {item.replyMessageText}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem resposta</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.replyMessageType ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {item.replyMessageType}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(item.sentDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="py-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => goToPage(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Primeira página */}
              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                </PaginationItem>
              )}
              
              {/* Elipses */}
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Página anterior */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => goToPage(currentPage - 1)}>
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {/* Página atual */}
              <PaginationItem>
                <PaginationLink isActive>{currentPage}</PaginationLink>
              </PaginationItem>
              
              {/* Próxima página */}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink onClick={() => goToPage(currentPage + 1)}>
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {/* Elipses */}
              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Última página */}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => goToPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => goToPage(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default DataTable;
