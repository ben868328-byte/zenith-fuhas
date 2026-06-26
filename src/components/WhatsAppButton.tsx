import React from 'react';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const handleClick = () => {
    window.open('https://wa.me/2349160683313', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg hvr-pop z-50 flex items-center justify-center"
      aria-label="Contact support on WhatsApp"
    >
      <MessageCircle size={24} />
    </button>
  );
}
