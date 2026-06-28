import ChatPage from "../../components/ChatPage";
import FarmerLayout from "./FarmerLayout";

export default function FarmerChat() {
  return (
    <ChatPage
      Layout={FarmerLayout}
      accent="#16a34a"
      basePath="/farmer"
    />
  );
}
