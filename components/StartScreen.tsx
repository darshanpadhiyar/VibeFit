/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import { SparklesCore } from './ui/sparkles';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to create model'));
            setUserImageUrl(null);
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  const screenVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };

  return (
    <div className="w-full min-h-screen bg-dark-bg text-dark-text-primary relative overflow-hidden">
        <div className="absolute inset-0 z-0">
            <SparklesCore
                id="tsparticlesfullpage"
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={50}
                className="w-full h-full"
                particleColor="#FFFFFF"
            />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <AnimatePresence mode="wait">
            {!userImageUrl ? (
                <motion.div
                key="uploader"
                className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="max-w-lg">
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-dark-text-primary leading-tight tracking-tight">
                        Style Unleashed.
                    </h1>
                    <p className="mt-4 text-lg text-dark-text-secondary">
                        Upload a photo. Become the model. Instantly try on any look with your virtual twin.
                    </p>
                    <hr className="my-8 border-dark-border" />
                    <div className="flex flex-col items-center lg:items-start w-full gap-3">
                        <label htmlFor="image-upload-start" className="w-full relative flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand rounded-lg cursor-pointer transition-all duration-300 shadow-brand-glow hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand">
                        <UploadCloudIcon className="w-5 h-5 mr-3" />
                        Upload Your Photo
                        </label>
                        <input id="image-upload-start" type="file" className="hidden" accept=".png,.jpeg,.jpg,.webp" onChange={handleFileChange} />
                        <p className="text-dark-text-secondary text-sm">Use a clear, full-body photo for the best results.</p>
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>
                    </div>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center mt-8 lg:mt-0">
                    <Compare
                    firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
                    secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
                    slideMode="drag"
                    className="w-full max-w-sm aspect-[2/3] rounded-2xl bg-dark-panel border border-dark-border"
                    />
                </div>
                </motion.div>
            ) : (
                <motion.div
                key="compare"
                className="w-full max-w-6xl mx-auto h-full flex flex-col items-center justify-center text-center"
                variants={screenVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                    <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                        Your Virtual Twin is Ready
                    </h1>
                    <p className="mt-2 text-md text-dark-text-secondary max-w-xl">
                        Drag the slider to see your transformation. If you're happy, proceed to the dressing room.
                    </p>
            
                    <div className="w-full flex items-center justify-center my-8">
                        <div 
                        className={`relative rounded-[1.25rem] transition-all duration-700 ease-in-out border-2 ${isGenerating ? 'border-brand/50 animate-pulse' : 'border-brand'}`}
                        >
                        <Compare
                            firstImage={userImageUrl}
                            secondImage={generatedModelUrl ?? userImageUrl}
                            slideMode="drag"
                            className="w-[280px] h-[420px] sm:w-[320px] sm-h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-dark-panel"
                        />
                        </div>
                    </div>

                    {isGenerating && (
                        <div className="flex items-center gap-3 text-lg font-display mt-6">
                            <Spinner />
                            <span>Generating your model...</span>
                        </div>
                    )}

                    {error && 
                        <div className="text-center text-red-400 max-w-md mt-6">
                            <p className="font-semibold">Generation Failed</p>
                            <p className="text-sm mb-4">{error}</p>
                            <button onClick={reset} className="text-sm font-semibold text-dark-text-primary hover:underline">Try Again</button>
                        </div>
                    }
            
                    <AnimatePresence>
                        {generatedModelUrl && !isGenerating && !error && (
                            <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col sm:flex-row items-center gap-4 mt-8"
                            >
                            <button 
                                onClick={reset}
                                className="w-full sm:w-auto px-6 py-3 text-base font-semibold bg-dark-panel border border-dark-border rounded-lg cursor-pointer hover:bg-dark-panel/50 transition-colors"
                            >
                                Use Different Photo
                            </button>
                            <button 
                                onClick={() => onModelFinalized(generatedModelUrl)}
                                className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-brand rounded-lg shadow-brand-glow cursor-pointer transition-all hover:bg-brand-dark"
                            >
                                Proceed to Styling &rarr;
                            </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default StartScreen;