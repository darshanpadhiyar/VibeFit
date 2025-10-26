/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitBuilder from './components/OutfitBuilder';
import { generateOutfitImage, generatePoseVariation, generateVirtualTryOnFromLook, remixGarment } from './services/geminiService';
import { WardrobeItem, GarmentCategory, TopStylingOption, Theme } from './types';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import ThemeToggle from './components/ThemeToggle';

const POSE_INSTRUCTIONS = [
  "Full-body shot: Full frontal view, hands on hips",
  "Full-body shot: Slightly turned, 3/4 view",
  "Full-body shot: Side profile view",
  "Full-body shot: Jumping in the air, mid-action shot",
  "Full-body shot: Walking towards camera",
  "Full-body shot: Leaning against a wall",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

// Helper to convert image URL to a File object
const urlToFile = (url: string, filename: string): Promise<File> => {
  return new Promise((resolve, reject) => {
      const image = new Image();
      image.setAttribute('crossOrigin', 'anonymous');

      image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
              return reject(new Error('Could not get canvas context.'));
          }
          ctx.drawImage(image, 0, 0);

          canvas.toBlob((blob) => {
              if (!blob) {
                  return reject(new Error('Canvas toBlob failed.'));
              }
              const mimeType = blob.type || 'image/png';
              const file = new File([blob], filename, { type: mimeType });
              resolve(file);
          }, 'image/png');
      };
      image.onerror = (error) => reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
      image.src = url;
  });
};


const App: React.FC = () => {
  const [baseModelImageUrl, setBaseModelImageUrl] = useState<string | null>(null);
  const [displayImageUrl, setDisplayImageUrl] = useState<string | null>(null);
  
  const [stagedItems, setStagedItems] = useState<Partial<Record<GarmentCategory, WardrobeItem>>>({});
  const [wornItems, setWornItems] = useState<Partial<Record<GarmentCategory, WardrobeItem>>>({});
  
  const [topStyling, setTopStyling] = useState<TopStylingOption>('tucked');
  
  const [currentOutfitPoses, setCurrentOutfitPoses] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [theme, setTheme] = useState<Theme>('dark');
  const isMobile = useMediaQuery('(max-width: 1279px)');
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  const prevTopStyling = useRef(topStyling);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleGenerateOutfit = useCallback(async () => {
    if (!baseModelImageUrl || isLoading) return;

    const itemsToWear = Object.values(stagedItems) as WardrobeItem[];
    if (itemsToWear.length === 0) {
      setDisplayImageUrl(baseModelImageUrl);
      setCurrentOutfitPoses({ [POSE_INSTRUCTIONS[0]]: baseModelImageUrl });
      setWornItems({});
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Styling your new look...');
    setCurrentPoseIndex(0);

    try {
      const garmentsWithFiles = await Promise.all(
        itemsToWear.map(async (item) => ({
          file: await urlToFile(item.url, item.name),
          category: item.category,
          name: item.name,
        }))
      );
      
      const newImageUrl = await generateOutfitImage(baseModelImageUrl, garmentsWithFiles, topStyling);
      setDisplayImageUrl(newImageUrl);
      setCurrentOutfitPoses({ [POSE_INSTRUCTIONS[0]]: newImageUrl });
      setWornItems(stagedItems);
      if (isMobile) {
        setIsPanelExpanded(false);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply new outfit'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [stagedItems, baseModelImageUrl, isLoading, topStyling, isMobile]);

  useEffect(() => {
    const areItemsSynced = () => {
      const stagedKeys = Object.keys(stagedItems);
      const wornKeys = Object.keys(wornItems);
      if (stagedKeys.length !== wornKeys.length || stagedKeys.length === 0) {
        return false;
      }
      return stagedKeys.every(key => {
        const category = key as GarmentCategory;
        return stagedItems[category]?.id === wornItems[category]?.id;
      });
    };

    if (
      prevTopStyling.current !== topStyling &&
      !isLoading &&
      areItemsSynced() &&
      stagedItems.top &&
      stagedItems.bottom
    ) {
      handleGenerateOutfit();
    }

    prevTopStyling.current = topStyling;
  }, [topStyling, isLoading, stagedItems, wornItems, handleGenerateOutfit]);

  const activeGarmentIds = useMemo(() => 
    Object.values(stagedItems).map(item => item.id),
    [stagedItems]
  );
  
  const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
  const finalDisplayUrl = currentOutfitPoses[currentPoseInstruction] ?? Object.values(currentOutfitPoses)[0] ?? displayImageUrl;

  const handleModelFinalized = (url: string) => {
    setBaseModelImageUrl(url);
    setDisplayImageUrl(url);
    setCurrentOutfitPoses({ [POSE_INSTRUCTIONS[0]]: url });
  };

  const handleStartOver = () => {
    setBaseModelImageUrl(null);
    setDisplayImageUrl(null);
    setStagedItems({});
    setWornItems({});
    setCurrentOutfitPoses({});
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setWardrobe(defaultWardrobe);
    setTopStyling('tucked');
    setIsPanelExpanded(true);
  };

  const handleGarmentSelect = useCallback((garmentInfo: WardrobeItem) => {
    if (isLoading) return;

    setStagedItems(prev => {
        const currentItem = prev[garmentInfo.category];
        if (currentItem?.id === garmentInfo.id) {
            const newItems = { ...prev };
            delete newItems[garmentInfo.category];
            return newItems;
        } else {
            return { ...prev, [garmentInfo.category]: garmentInfo };
        }
    });
  }, [isLoading]);

  const handleGarmentUpload = (garmentFile: File, garmentInfo: WardrobeItem) => {
    setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
    });
    handleGarmentSelect(garmentInfo);
  };
  
  const handleLookSelect = useCallback(async (lookFile: File) => {
    if (!baseModelImageUrl || isLoading) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Getting the look...`);

    try {
        const newImageUrl = await generateVirtualTryOnFromLook(baseModelImageUrl, lookFile);
        
        setStagedItems({}); 
        setWornItems({});
        setDisplayImageUrl(newImageUrl);
        setCurrentOutfitPoses({ [POSE_INSTRUCTIONS[0]]: newImageUrl });
        if (isMobile) {
          setIsPanelExpanded(false);
        }

    } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to get the look'));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [baseModelImageUrl, isLoading, isMobile]);

  const handleGarmentRemix = useCallback(async (category: GarmentCategory, prompt: string) => {
    if (!displayImageUrl || isLoading || !wornItems[category]) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage('Remixing your style...');

    try {
      const garmentToRemix = wornItems[category]!;
      const newImageUrl = await remixGarment(displayImageUrl, prompt, garmentToRemix.name);
      
      const updatedGarment = {
        ...garmentToRemix,
        id: `${garmentToRemix.id}-remix-${Date.now()}`,
        name: `${garmentToRemix.name} (Remixed)`,
        url: newImageUrl,
      };

      setStagedItems(prev => ({ ...prev, [category]: updatedGarment }));
      setWornItems(prev => ({ ...prev, [category]: updatedGarment }));
      setWardrobe(prev => [...prev, updatedGarment]);
      setDisplayImageUrl(newImageUrl);
      setCurrentOutfitPoses({ [POSE_INSTRUCTIONS[0]]: newImageUrl });
      if (isMobile) {
        setIsPanelExpanded(false);
      }

    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to remix garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, wornItems, isMobile]);

  const handleRemoveStagedItem = (category: GarmentCategory) => {
    if (isLoading) return;
    setStagedItems(prev => {
      const newItems = { ...prev };
      delete newItems[category];
      return newItems;
    });
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    if (currentOutfitPoses[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    const baseImageForPoseChange = Object.values(currentOutfitPoses)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange, poseInstruction);
      setCurrentOutfitPoses(prev => ({...prev, [poseInstruction]: newImageUrl}));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, isLoading, currentOutfitPoses]);

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };
  
  const panelItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="font-sans bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary transition-colors duration-300">
      <AnimatePresence mode="wait">
        {!baseModelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col xl:flex-row p-2 sm:p-4 xl:gap-4 pb-24 xl:pb-4">
              <div className="w-full h-full flex-grow flex items-center justify-center relative rounded-lg xl:p-10 2xl:p-20">
                <Canvas 
                  displayImageUrl={finalDisplayUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                />
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>

              <aside 
                className={`fixed xl:relative bottom-0 xl:bottom-auto right-0 xl:right-auto w-full xl:w-[420px] bg-light-panel dark:bg-dark-panel backdrop-blur-xl flex flex-col border-t xl:border-l border-light-border dark:border-dark-border transition-all duration-500 ease-in-out z-20 xl:rounded-xl rounded-t-2xl shadow-2xl xl:shadow-none ${
                  isMobile 
                    ? (isPanelExpanded ? 'max-h-[85vh]' : 'h-[72px]') 
                    : 'h-full'
                }`}
              >
                  <button
                    className="xl:hidden w-full h-8 flex-shrink-0 flex items-center justify-center cursor-pointer touch-none pt-2 group"
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                    aria-label={isPanelExpanded ? "Collapse panel" : "Expand panel"}
                  >
                    <div className="w-10 h-1.5 bg-light-border dark:bg-dark-border rounded-full transition-colors group-hover:bg-brand" />
                  </button>
                  <div className="p-4 sm:p-6 pt-2 pb-24 sm:pb-24 xl:pb-6 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg" role="alert">
                        <p className="font-display font-bold text-base">An error occurred</p>
                        <p className="text-sm mt-1 text-red-300">{error}</p>
                      </div>
                    )}
                    <motion.div custom={0} initial="hidden" animate="visible" variants={panelItemVariants}>
                      <OutfitBuilder
                        stagedItems={stagedItems}
                        onRemoveItem={handleRemoveStagedItem}
                        onRemixItem={handleGarmentRemix}
                        onGenerateOutfit={handleGenerateOutfit}
                        isLoading={isLoading}
                        topStyling={topStyling}
                        onTopStylingChange={setTopStyling}
                      />
                    </motion.div>
                    <motion.div custom={1} initial="hidden" animate="visible" variants={panelItemVariants}>
                      <WardrobePanel
                        onGarmentSelect={handleGarmentSelect}
                        onGarmentUpload={handleGarmentUpload}
                        onLookSelect={handleLookSelect}
                        activeGarmentIds={activeGarmentIds}
                        isLoading={isLoading}
                        wardrobe={wardrobe}
                      />
                    </motion.div>
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-display mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      {!isMobile && <Footer />}
    </div>
  );
};

export default App;