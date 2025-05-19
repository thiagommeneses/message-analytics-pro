
import { useCampaign } from "@/context/CampaignContext";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import FilterPanel from "@/components/FilterPanel";
import MetricsCards from "@/components/MetricsCards";
import DataTable from "@/components/DataTable";

const MainDashboard = () => {
  const { originalData, metrics } = useCampaign();
  
  return (
    <div className="container py-8">
      <Header />
      
      {originalData.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <FileUpload />
          
          <div className="mt-8 text-center text-muted-foreground">
            <p className="mb-2">
              Carregue um arquivo CSV contendo os dados da sua campanha
            </p>
            <p className="text-sm">
              O arquivo deve conter colunas como número do telefone, 
              nome, status da mensagem, respostas e datas de envio.
            </p>
	      <br/>
		<p className="text-sm">Desenvolvido por Thiago Meneses</p>
	  </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FilterPanel />
          </div>
          
          <div className="lg:col-span-3">
            {metrics && <MetricsCards />}
            <DataTable />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;
