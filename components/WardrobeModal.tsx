/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { WardrobeItem, GarmentCategory } from '../types';
import { UploadCloudIcon, CheckCircleIcon, SparklesIcon } from './icons';

interface WardrobePanelProps {
  onGarmentSelect: (garmentInfo: WardrobeItem) => void;
  onGarmentUpload: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  onLookSelect: (lookFile: File) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const CATEGORIES: GarmentCategory[] = ['top', 'bottom'];
const CATEGORY_LABELS: Record<GarmentCategory, string> = {
    top: 'Tops',
    bottom: 'Bottoms',
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, onGarmentUpload, onLookSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<GarmentCategory>('top');
    
    const handleGarmentFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: GarmentCategory) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
                category: category,
            };
            onGarmentUpload(file, customGarmentInfo);
            e.target.value = '';
        }
    };
    
    const handleLookFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            onLookSelect(file);
            e.target.value = '';
        }
    };

    const filteredWardrobe = wardrobe.filter(item => item.category === activeTab);

  return (
    <div className="pt-6 border-t border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Wardrobe</h2>
            <label htmlFor="custom-look-upload" className={`flex items-center gap-2 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary transition-colors duration-200 pr-2 rounded-full ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:text-brand cursor-pointer'}`}>
                <SparklesIcon className="w-5 h-5"/>
                <span>Get the Look</span>
                <input id="custom-look-upload" type="file" className="hidden" accept=".png,.jpeg,.jpg,.webp" onChange={handleLookFileUpload} disabled={isLoading}/>
            </label>
        </div>
        
        <div className="mb-4 border-b border-light-border dark:border-dark-border">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                {CATEGORIES.map((category) => (
                <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm focus:outline-none transition-all ${
                    activeTab === category
                        ? 'border-brand text-brand'
                        : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary hover:dark:text-dark-text-primary hover:border-dark-border'
                    }`}
                >
                    {CATEGORY_LABELS[category]}
                </button>
                ))}
            </nav>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {filteredWardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                return (
                    <button
                    key={item.id}
                    onClick={() => onGarmentSelect(item)}
                    disabled={isLoading}
                    className="relative aspect-square bg-light-bg dark:bg-dark-bg/50 rounded-xl overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand group ring-1 ring-light-border dark:ring-dark-border"
                    aria-label={`Select ${item.name}`}
                    >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                        </div>
                        {isActive && (
                            <div className="absolute inset-0 bg-brand/80 flex items-center justify-center ring-2 ring-inset ring-brand-dark">
                                <CheckCircleIcon className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </button>
                );
            })}
            <label htmlFor={`upload-${activeTab}`} className={`relative aspect-square border-2 border-dashed border-dark-border rounded-xl flex flex-col items-center justify-center text-dark-text-secondary transition-colors duration-200 ${isLoading ? 'cursor-not-allowed bg-dark-bg/20' : 'hover:border-brand hover:text-brand cursor-pointer hover:bg-brand/10'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center font-semibold">Upload</span>
                <input id={`upload-${activeTab}`} type="file" className="hidden" accept=".png,.jpeg,.jpg,.webp" onChange={(e) => handleGarmentFileUpload(e, activeTab)} disabled={isLoading}/>
            </label>
        </div>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;