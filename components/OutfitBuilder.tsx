/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { WardrobeItem, GarmentCategory, TopStylingOption } from '../types';
import { Trash2Icon, WandIcon, ShirtIcon, TuckInIcon } from './icons';
import { AnimatePresence, motion } from 'framer-motion';

type StagedItems = Partial<Record<GarmentCategory, WardrobeItem>>;

interface OutfitBuilderProps {
  stagedItems: StagedItems;
  onRemoveItem: (category: GarmentCategory) => void;
  onRemixItem: (category: GarmentCategory, prompt: string) => void;
  onGenerateOutfit: () => void;
  isLoading: boolean;
  topStyling: TopStylingOption;
  onTopStylingChange: (style: TopStylingOption) => void;
}

const CATEGORY_ORDER: GarmentCategory[] = ['top', 'bottom'];
const CATEGORY_NAMES: Record<GarmentCategory, string> = {
  top: 'Top',
  bottom: 'Bottom',
};

const OutfitBuilder: React.FC<OutfitBuilderProps> = ({ stagedItems, onRemoveItem, onRemixItem, onGenerateOutfit, isLoading, topStyling, onTopStylingChange }) => {
  const [remixPrompt, setRemixPrompt] = useState('');
  const [showRemixInputFor, setShowRemixInputFor] = useState<GarmentCategory | null>(null);

  const handleRemixSubmit = (e: React.FormEvent, category: GarmentCategory) => {
    e.preventDefault();
    if (remixPrompt.trim()) {
      onRemixItem(category, remixPrompt.trim());
      setRemixPrompt('');
      setShowRemixInputFor(null);
    }
  };

  const isOutfitEmpty = Object.keys(stagedItems).length === 0;
  const showStylingOptions = stagedItems.top && stagedItems.bottom;

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-display font-bold mb-4">Outfit Builder</h2>
      
      <div className="space-y-3 mb-6">
        {CATEGORY_ORDER.map((category) => {
          const item = stagedItems[category];
          const isRemixing = showRemixInputFor === category;

          if (!item) {
            return (
              <div key={category} className="h-[74px] flex items-center justify-center text-sm text-dark-text-secondary font-medium border-2 border-dashed border-dark-border rounded-xl bg-dark-bg/20 dark:bg-dark-bg/40">
                Add a {CATEGORY_NAMES[category]}
              </div>
            );
          }

          return (
            <motion.div
              key={category}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div
                className="group flex flex-col items-start bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-sm p-2.5 rounded-xl border border-light-border dark:border-dark-border shadow-sm shadow-black/5"
              >
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center overflow-hidden flex-grow">
                        <img src={item.url} alt={item.name} className="flex-shrink-0 w-12 h-12 object-cover rounded-lg mr-3 border border-light-border dark:border-dark-border" />
                        <div className='flex-grow overflow-hidden'>
                            <p className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary">{CATEGORY_NAMES[category]}</p>
                            <p className="font-semibold truncate" title={item.name}>
                                {item.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowRemixInputFor(isRemixing ? null : category)}
                          className="flex-shrink-0 text-dark-text-secondary hover:text-brand transition-colors p-2 rounded-full hover:bg-brand/10"
                          aria-label={`Remix ${item.name}`}
                          disabled={isLoading}
                        >
                          <WandIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onRemoveItem(category)}
                          className="flex-shrink-0 text-dark-text-secondary hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"
                          aria-label={`Remove ${item.name}`}
                          disabled={isLoading}
                        >
                          <Trash2Icon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {category === 'top' && showStylingOptions && (
                    <div className="w-full pl-[60px] pt-2">
                        <div className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-1">Styling</div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onTopStylingChange('tucked')}
                                disabled={isLoading}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${topStyling === 'tucked' ? 'bg-brand text-white border-brand-dark shadow-brand-glow' : 'bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary border-light-border dark:border-dark-border hover:border-brand'}`}
                            >
                                <TuckInIcon className="w-3.5 h-3.5" /> Tucked In
                            </button>
                            <button 
                                onClick={() => onTopStylingChange('untucked')}
                                disabled={isLoading}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${topStyling === 'untucked' ? 'bg-brand text-white border-brand-dark shadow-brand-glow' : 'bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary border-light-border dark:border-dark-border hover:border-brand'}`}
                            >
                                <ShirtIcon className="w-3.5 h-3.5" /> Untucked
                            </button>
                        </div>
                    </div>
                )}
              </div>
              <AnimatePresence>
                {isRemixing && (
                  <motion.form
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '8px' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    onSubmit={(e) => handleRemixSubmit(e, category)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={remixPrompt}
                      onChange={(e) => setRemixPrompt(e.target.value)}
                      placeholder={`e.g., 'make it blue plaid'`}
                      className="flex-grow w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      disabled={isLoading || !remixPrompt.trim()}
                      className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-md hover:bg-brand-dark transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <button
        onClick={onGenerateOutfit}
        disabled={isLoading || isOutfitEmpty}
        className="w-full relative flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand rounded-lg transition-all duration-300 shadow-brand-glow hover:bg-brand-dark disabled:bg-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <ShirtIcon className="w-5 h-5 mr-3" />
        {isLoading ? 'Generating...' : 'Try It On'}
      </button>

    </div>
  );
};

export default OutfitBuilder;