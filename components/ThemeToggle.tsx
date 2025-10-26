/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon } from './icons';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="absolute top-4 right-4 z-30">
      <button
        onClick={toggleTheme}
        className="w-11 h-11 flex items-center justify-center text-center bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-md border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary rounded-full transition-all duration-200 ease-in-out hover:bg-light-panel hover:dark:bg-dark-panel active:scale-95"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MoonIcon className="w-5 h-5 text-dark-text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SunIcon className="w-5 h-5 text-light-text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default ThemeToggle;
