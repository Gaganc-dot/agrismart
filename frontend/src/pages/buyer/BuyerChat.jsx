import ChatPage from "../../components/ChatPage";
import BuyerLayout from "./BuyerLayout";

export default function BuyerChat() {
  return (
    <ChatPage
      Layout={BuyerLayout}
      accent="#d97706"
      basePath="/buyer"
    />
  );
}
