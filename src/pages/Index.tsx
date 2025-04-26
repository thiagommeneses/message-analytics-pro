
import { CampaignProvider } from "@/context/CampaignContext";
import MainDashboard from "@/components/MainDashboard";

const Index = () => {
  return (
    <CampaignProvider>
      <MainDashboard />
    </CampaignProvider>
  );
};

export default Index;
