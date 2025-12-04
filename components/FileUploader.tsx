
import React, { useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, X, FolderUp, FileUp, Trash2 } from 'lucide-react';
import { LoreFile } from '../types';
import { TRANSLATIONS } from '../translations';

interface FileUploaderProps {
  files: LoreFile[];
  onFilesChange: (files: LoreFile[]) => void;
  lang: 'en' | 'ru';
}

const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesChange, lang }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  // Enable folder selection attributes for the folder input
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: LoreFile[] = [];
    const fileReaders: Promise<void>[] = [];

    Array.from(fileList).forEach((file: File) => {
      // Only process MD or text files
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        const promise = new Promise<void>((resolve) => {
          reader.onload = (e) => {
            const content = e.target?.result as string;
            newFiles.push({ name: file.name, content });
            resolve();
          };
          reader.readAsText(file);
        });
        fileReaders.push(promise);
      }
    });

    Promise.all(fileReaders).then(() => {
      onFilesChange([...files, ...newFiles]);
    });
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const clearAllFiles = () => {
    onFilesChange([]);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        {/* Folder Upload */}
        <div 
            onClick={() => folderInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 hover:bg-gray-800/50 transition-colors text-center cursor-pointer group flex flex-col items-center justify-center gap-2"
            title={t.uploadFolder}
        >
            <input
                ref={folderInputRef}
                type="file"
                multiple
                onChange={handleFolderUpload}
                className="hidden"
            />
            <FolderUp className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 group-hover:text-amber-450" />
            <span className="text-[10px] lg:text-xs font-medium text-gray-300">{t.uploadFolder}</span>
        </div>

        {/* File Upload */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-gray-600 rounded-lg p-3 lg:p-4 hover:bg-gray-800/50 transition-colors text-center cursor-pointer group flex flex-col items-center justify-center gap-2"
            title={t.uploadFiles}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".md,.txt"
                onChange={handleFileUpload}
                className="hidden"
            />
            <FileUp className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 group-hover:text-amber-450" />
            <span className="text-[10px] lg:text-xs font-medium text-gray-300">{t.uploadFiles}</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
             <div className="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{files.length} {t.filesLoaded}</span>
                <button 
                  onClick={clearAllFiles} 
                  className="text-[10px] lg:text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                >
                    <Trash2 size={12} /> {t.clearAll}
                </button>
             </div>
             <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto p-2 custom-scrollbar">
                {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700/50 text-xs group hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={14} className="text-blue-400 flex-shrink-0" />
                        <span className="truncate text-gray-300">{file.name}</span>
                    </div>
                    <button
                        onClick={() => removeFile(idx)}
                        className="text-gray-600 hover:text-red-400 flex-shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1"
                    >
                        <X size={14} />
                    </button>
                    </div>
                ))}
             </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
