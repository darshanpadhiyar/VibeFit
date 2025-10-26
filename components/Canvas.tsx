/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RotateCcwIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, isLoading, loadingMessage, onSelectPose, poseInstructions, currentPoseIndex }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-0 relative animate-zoom-in group">
      <button 
          onClick={onStartOver}
          className="absolute top-4 left-4 z-30 flex items-center justify-center text-center bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-md border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-light-panel hover:dark:bg-dark-panel active:scale-95 text-sm"
      >
          <RotateCcwIcon className="w-4 h-4 mr-2" />
          Start Over
      </button>

      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-[80%] max-h-[80%] object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-display mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {!isLoading && displayImageUrl === null && (
            <motion.div
                className="absolute inset-0 bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <Spinner />
                <p className="text-lg font-display mt-4 text-center px-4">Preparing model...</p>
            </motion.div>
          )}
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
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
      </div>

      {displayImageUrl && !isLoading && (
        <div 
          className="absolute bottom-6 left-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center"
        >
          <div className="flex items-center justify-center gap-2 bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-lg rounded-full p-1.5 border border-light-border dark:border-dark-border shadow-lg shadow-black/20">
            {poseInstructions.map((pose, index) => (
                <button
                    key={pose}
                    onClick={() => onSelectPose(index)}
                    disabled={isLoading}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                      index === currentPoseIndex 
                        ? 'bg-brand text-white shadow-brand-glow' 
                        : 'text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg hover:dark:bg-dark-bg/50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    title={pose}
                >
                    Pose {index + 1}
                </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;