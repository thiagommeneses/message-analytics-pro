
import { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, MessageSquare, FileSpreadsheet } from "lucide-react";
import { ExportOptions as ExportOptionsType, ZenviaExportOptions, ExcelExportOptions } from "@/types/campaign";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ExportOptions = () => {
  const { exportData, exportToZenvia, exportToExcel, filteredData, isLoading } = useCampaign();
  const [dialogState, setDialogState] = useState<{
    csvOpen: boolean;
    zenviaOpen: boolean;
    excelOpen: boolean;
  }>({
    csvOpen: false,
    zenviaOpen: false,
    excelOpen: false
  });
  
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({
    onlyPhoneNumber: true,
    includeNames: false,
    customColumns: [],
    splitFiles: false,
    recordsPerFile: 1000
  });
  
  const [zenviaOptions, setZenviaOptions] = useState<ZenviaExportOptions>({
    messageText: "",
    splitFiles: false,
    recordsPerFile: 1000
  });
  
  const [excelOptions, setExcelOptions] = useState<ExcelExportOptions>({
    splitFiles: false,
    recordsPerFile: 1000
  });
  
  const [exportType, setExportType] = useState<'simple' | 'custom'>('simple');

  const availableColumns = filteredData.length > 0 
    ? Object.keys(filteredData[0]) 
    : [];

  const handleExport = () => {
    exportData(exportOptions);
    // Fechamos o diálogo imediatamente para evitar duplos cliques
    setDialogState(prev => ({ ...prev, csvOpen: false }));
  };

  const handleZenviaExport = () => {
    exportToZenvia(zenviaOptions);
    // Fechamos o diálogo imediatamente para evitar duplos cliques
    setDialogState(prev => ({ ...prev, zenviaOpen: false }));
  };
  
  const handleExcelExport = () => {
    exportToExcel(excelOptions);
    // Fechamos o diálogo imediatamente para evitar duplos cliques
    setDialogState(prev => ({ ...prev, excelOpen: false }));
  };

  const handleExportTypeChange = (value: string) => {
    const type = value as 'simple' | 'custom';
    setExportType(type);
    
    if (type === 'simple') {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: true,
        includeNames: false,
        customColumns: [],
      });
    } else {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: false,
        includeNames: false,
        customColumns: [...availableColumns],
      });
    }
  };

  const toggleColumn = (column: string) => {
    const currentColumns = [...exportOptions.customColumns];
    const index = currentColumns.indexOf(column);
    
    if (index === -1) {
      currentColumns.push(column);
    } else {
      currentColumns.splice(index, 1);
    }
    
    setExportOptions({
      ...exportOptions,
      customColumns: currentColumns
    });
  };

  const handleNameOption = (option: 'onlyPhone' | 'withNames') => {
    if (option === 'onlyPhone') {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: true,
        includeNames: false,
        customColumns: [],
      });
    } else {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: false,
        includeNames: true,
        customColumns: [],
      });
    }
  };

  const toggleSplitFiles = (checked: boolean) => {
    setExportOptions({
      ...exportOptions,
      splitFiles: checked
    });
  };

  const toggleZenviaSplitFiles = (checked: boolean) => {
    setZenviaOptions({
      ...zenviaOptions,
      splitFiles: checked
    });
  };
  
  const toggleExcelSplitFiles = (checked: boolean) => {
    setExcelOptions({
      ...excelOptions,
      splitFiles: checked
    });
  };

  const handleRecordsPerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1000;
    setExportOptions({
      ...exportOptions,
      recordsPerFile: Math.max(1, Math.min(value, 10000))
    });
  };

  const handleZenviaRecordsPerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1000;
    setZenviaOptions({
      ...zenviaOptions,
      recordsPerFile: Math.max(1, Math.min(value, 10000))
    });
  };
  
  const handleExcelRecordsPerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1000;
    setExcelOptions({
      ...excelOptions,
      recordsPerFile: Math.max(1, Math.min(value, 5000))
    });
  };

  const handleSmsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setZenviaOptions({
      ...zenviaOptions,
      messageText: e.target.value.slice(0, 130)
    });
  };
  
  const openDialog = (type: 'csv' | 'zenvia' | 'excel') => {
    if (type === 'csv') {
      setDialogState({ csvOpen: true, zenviaOpen: false, excelOpen: false });
    } else if (type === 'zenvia') {
      setDialogState({ csvOpen: false, zenviaOpen: true, excelOpen: false });
    } else {
      setDialogState({ csvOpen: false, zenviaOpen: false, excelOpen: true });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2" disabled={filteredData.length === 0 || isLoading}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => openDialog('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            <span>Exportar CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openDialog('zenvia')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Exportar para zEnvia</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openDialog('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span>Exportar Excel</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para exportação padrão CSV */}
      <Dialog open={dialogState.csvOpen} onOpenChange={(open) => setDialogState(prev => ({ ...prev, csvOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Opções de exportação</DialogTitle>
            <DialogDescription>
              Escolha quais dados você deseja exportar do total de {filteredData.length} registros.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="export-type">Tipo de exportação</Label>
              <Select
                value={exportType}
                onValueChange={handleExportTypeChange}
              >
                <SelectTrigger id="export-type">
                  <SelectValue placeholder="Selecione o tipo de exportação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Exportação simples</SelectItem>
                  <SelectItem value="custom">Exportação personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportType === 'simple' ? (
              <div className="grid gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="phone-only" 
                    checked={exportOptions.onlyPhoneNumber}
                    onCheckedChange={() => handleNameOption('onlyPhone')}
                  />
                  <Label htmlFor="phone-only">Apenas números de telefone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="with-names" 
                    checked={exportOptions.includeNames}
                    onCheckedChange={() => handleNameOption('withNames')}
                  />
                  <Label htmlFor="with-names">Números de telefone e nomes</Label>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Selecione as colunas</Label>
                <div className="border rounded-md h-40 overflow-y-auto p-2">
                  {availableColumns.map(column => (
                    <div key={column} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`col-${column}`} 
                        checked={exportOptions.customColumns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <Label htmlFor={`col-${column}`} className="capitalize">
                        {column === 'fullNumber' ? 'Telefone' :
                         column === 'name' ? 'Nome' :
                         column === 'templateTitle' ? 'Título do template' :
                         column === 'campaignMessageStatus' ? 'Status da mensagem' :
                         column === 'replyMessageText' ? 'Texto de resposta' :
                         column === 'sentDate' ? 'Data de envio' : column}
                      </Label>
                    </div>
                  ))}
                </div>
                {exportOptions.customColumns.length === 0 && (
                  <p className="text-sm text-red-500">
                    Selecione pelo menos uma coluna para exportar
                  </p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="split-files" 
                  checked={exportOptions.splitFiles}
                  onCheckedChange={toggleSplitFiles}
                />
                <Label htmlFor="split-files">Dividir em múltiplos arquivos</Label>
              </div>
              
              {exportOptions.splitFiles && (
                <div className="ml-6">
                  <div className="grid gap-2">
                    <Label htmlFor="records-per-file">Registros por arquivo</Label>
                    <Input 
                      id="records-per-file" 
                      type="number" 
                      value={exportOptions.recordsPerFile} 
                      onChange={handleRecordsPerFileChange}
                      min={1}
                      max={10000}
                    />
                    <p className="text-sm text-muted-foreground">
                      Total de arquivos: {Math.ceil(filteredData.length / exportOptions.recordsPerFile)}
                      {exportOptions.recordsPerFile < 1 && " (valor mínimo: 1)"}
                      {exportOptions.recordsPerFile > 10000 && " (valor máximo: 10000)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState(prev => ({ ...prev, csvOpen: false }))}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              disabled={
                exportType === 'custom' && exportOptions.customColumns.length === 0
              }
            >
              Exportar dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para exportação Zenvia */}
      <Dialog open={dialogState.zenviaOpen} onOpenChange={(open) => setDialogState(prev => ({ ...prev, zenviaOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar para zEnvia</DialogTitle>
            <DialogDescription>
              Exporte os {filteredData.length} registros filtrados para o formato zEnvia.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sms-text">Texto do SMS</Label>
              <Textarea 
                id="sms-text"
                placeholder="Digite a mensagem do SMS"
                value={zenviaOptions.messageText}
                onChange={handleSmsTextChange}
                maxLength={130}
                className="resize-none"
                rows={4}
              />
              <p className="text-sm text-muted-foreground flex justify-end">
                {zenviaOptions.messageText.length}/130 caracteres
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="zenvia-split-files" 
                  checked={zenviaOptions.splitFiles}
                  onCheckedChange={toggleZenviaSplitFiles}
                />
                <Label htmlFor="zenvia-split-files">Dividir em múltiplos arquivos</Label>
              </div>
              
              {zenviaOptions.splitFiles && (
                <div className="ml-6">
                  <div className="grid gap-2">
                    <Label htmlFor="zenvia-records-per-file">Registros por arquivo</Label>
                    <Input 
                      id="zenvia-records-per-file" 
                      type="number" 
                      value={zenviaOptions.recordsPerFile} 
                      onChange={handleZenviaRecordsPerFileChange}
                      min={1}
                      max={10000}
                    />
                    <p className="text-sm text-muted-foreground">
                      Total de arquivos: {Math.ceil(filteredData.length / zenviaOptions.recordsPerFile)}
                      {zenviaOptions.recordsPerFile < 1 && " (valor mínimo: 1)"}
                      {zenviaOptions.recordsPerFile > 10000 && " (valor máximo: 10000)"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Informações sobre o formato:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>O arquivo CSV terá as colunas "celular" e "sms"</li>
                <li>O separador usado será ponto e vírgula (;)</li>
                <li>Todos os números serão incluídos conforme filtro atual</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState(prev => ({ ...prev, zenviaOpen: false }))}>
              Cancelar
            </Button>
            <Button 
              onClick={handleZenviaExport}
              disabled={zenviaOptions.messageText.trim().length === 0}
            >
              Exportar para zEnvia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para exportação Excel */}
      <Dialog open={dialogState.excelOpen} onOpenChange={(open) => setDialogState(prev => ({ ...prev, excelOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar para Excel</DialogTitle>
            <DialogDescription>
              Exporte os {filteredData.length} registros filtrados para o formato Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="excel-split-files" 
                  checked={excelOptions.splitFiles}
                  onCheckedChange={toggleExcelSplitFiles}
                />
                <Label htmlFor="excel-split-files">Dividir em múltiplos arquivos</Label>
              </div>
              
              {excelOptions.splitFiles && (
                <div className="ml-6">
                  <div className="grid gap-2">
                    <Label htmlFor="excel-records-per-file">Registros por arquivo</Label>
                    <Input 
                      id="excel-records-per-file" 
                      type="number" 
                      value={excelOptions.recordsPerFile} 
                      onChange={handleExcelRecordsPerFileChange}
                      min={1}
                      max={5000}
                    />
                    <p className="text-sm text-muted-foreground">
                      Total de arquivos: {Math.ceil(filteredData.length / excelOptions.recordsPerFile)}
                      {excelOptions.recordsPerFile < 1 && " (valor mínimo: 1)"}
                      {excelOptions.recordsPerFile > 5000 && " (valor máximo: 5000)"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Informações sobre o formato Excel:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Os dados serão exportados com o mesmo formato apresentado na tabela</li>
                <li>Cabeçalhos serão traduzidos para português</li>
                <li>Datas serão formatadas no padrão brasileiro</li>
                <li>Status serão traduzidos para português</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState(prev => ({ ...prev, excelOpen: false }))}>
              Cancelar
            </Button>
            <Button onClick={handleExcelExport}>
              Exportar para Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportOptions;
