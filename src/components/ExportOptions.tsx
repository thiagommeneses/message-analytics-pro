
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { ExportOptions as ExportOptionsType } from "@/types/campaign";

const ExportOptions = () => {
  const { exportData, filteredData, isLoading } = useCampaign();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({
    onlyPhoneNumber: true,
    includeNames: false,
    customColumns: []
  });
  const [exportType, setExportType] = useState<'simple' | 'custom'>('simple');

  // Obtém todas as colunas disponíveis nos dados
  const availableColumns = filteredData.length > 0 
    ? Object.keys(filteredData[0]) 
    : [];

  const handleExport = () => {
    exportData(exportOptions);
    setIsDialogOpen(false);
  };

  const handleExportTypeChange = (value: string) => {
    const type = value as 'simple' | 'custom';
    setExportType(type);
    
    if (type === 'simple') {
      setExportOptions({
        onlyPhoneNumber: true,
        includeNames: false,
        customColumns: []
      });
    } else {
      setExportOptions({
        onlyPhoneNumber: false,
        includeNames: false,
        customColumns: [...availableColumns]
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
        onlyPhoneNumber: true,
        includeNames: false,
        customColumns: []
      });
    } else {
      setExportOptions({
        onlyPhoneNumber: false,
        includeNames: true,
        customColumns: []
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={filteredData.length === 0 || isLoading}>
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
  );
};

export default ExportOptions;
