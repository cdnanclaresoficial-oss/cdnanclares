import PublicChat from "@/components/PublicChat";

const StoreChat = () => (
  <PublicChat
    autoOpen
    personalityKey="asistente_tienda"
    mode="tienda"
    assistantName="Tienda C.D. Nanclares"
    assistantSubtitle="Asistente de compra"
    welcomeMessage="¡Hola! Soy el asistente de tienda. Te ayudo con tallas, productos y pedidos."
    includeShopCatalog
  />
);

export default StoreChat;
