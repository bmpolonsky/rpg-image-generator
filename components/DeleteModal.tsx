
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { TRANSLATIONS } from '../translations';

interface DeleteModalProps {
  isOpen: boolean;
  isAll: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lang: 'en' | 'ru';
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, isAll, onClose, onConfirm, lang }) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <div className="p-2 bg-red-900/30 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">
              {isAll ? t.deleteAllTitle : t.deleteImageTitle}
          </h3>
        </div>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {isAll ? t.deleteAllConfirm : t.deleteImageConfirm}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t.btnCancel}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 shadow-lg transition-colors"
          >
            <Trash2 size={16} /> {isAll ? t.btnDeleteAll : t.btnDelete}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
