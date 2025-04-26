
import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCampaign } from "@/context/CampaignContext";
import { Upload } from "lucide-react";

const FileUpload = () => {
  const { uploadCsv, isLoading } = useCampaign();
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCsv(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "text/csv") {
      uploadCsv(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? "bg-primary/10 border-primary" : "bg-muted/50 border-muted-foreground/20"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Carregue seu arquivo CSV</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Arraste e solte seu arquivo aqui, ou clique para selecionar
        </p>

        <div>
          <label htmlFor="file-upload" className="cursor-pointer">
            <Button disabled={isLoading}>
              {isLoading ? "Processando..." : "Selecionar arquivo"}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-center text-muted-foreground">
        Formatos suportados: CSV
      </div>
    </div>
  );
};

export default FileUpload;
