
import React, { useState } from 'react';
import { X, Copy, MessageCircle, Check } from 'lucide-react';

interface ShareModalProps {
  wheelName: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ wheelName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.href;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Check out this ${wheelName} at the Defect Catalog: ${currentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold">Share Link</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-gray-500 text-sm mb-6">Send the direct link of <span className="text-black font-semibold">{wheelName}</span> to a colleague or client.</p>
          
          <div className="space-y-3">
            <button 
              onClick={copyToClipboard}
              className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
                  <Copy className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Copy Link</span>
              </div>
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5" />}
            </button>

            <button 
              onClick={shareWhatsApp}
              className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 text-green-600">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Send via WhatsApp</span>
              </div>
              <Check className="w-5 h-5 opacity-0" />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex justify-center">
          <button 
            onClick={onClose}
            className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
