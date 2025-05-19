
import { Button } from "@/components/ui/button";
import { useCampaign } from "@/context/CampaignContext";
import ExportOptions from "./ExportOptions";

const Header = () => {
  const { resetData, originalData } = useCampaign();
  
  return (
    <header className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de Campanhas Enviadas Ominichat</h1>
        <p className="text-muted-foreground">
          {originalData.length > 0 
            ? `Analisando ${originalData.length} registros` 
            : "Carregue um arquivo CSV para iniciar a análise"}
        </p>
      </div>
    <small>por Thiago Meneses</small>  
      <div className="flex items-center gap-3">
        <ExportOptions />
        
        {originalData.length > 0 && (
          <Button variant="ghost" onClick={resetData}>
            Limpar dados
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
