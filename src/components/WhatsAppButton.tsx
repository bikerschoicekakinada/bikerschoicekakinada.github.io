import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  imageUrl: string;
  itemLabel?: string;
  className?: string;
}

const WhatsAppButton = ({ imageUrl, itemLabel, className = "" }: WhatsAppButtonProps) => {
  const text = itemLabel
    ? `Hi, I want to enquire about "${itemLabel}" (${imageUrl})`
    : `Hi, I want to enquire about this item: ${imageUrl}`;
  const message = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/918523876978?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-heading font-semibold py-2 px-3 rounded-full text-xs hover:scale-105 transition-transform ${className}`}
    >
      <MessageCircle size={14} /> WhatsApp Enquiry
    </a>
  );
};

export default WhatsAppButton;
