/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 p-2 pointer-events-none">
      <motion.div 
        className="mx-auto max-w-sm sm:max-w-md bg-light-panel/80 dark:bg-dark-panel/80 backdrop-blur-lg border border-light-border dark:border-dark-border p-2 rounded-full pointer-events-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 1 }}
      >
        <p className="text-center text-xs text-light-text-secondary dark:text-dark-text-secondary">
          Created by{' '}
          <a 
            href="mailto:darshanpadhiyar38@gmail.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-light-text-primary dark:text-dark-text-primary hover:text-brand transition-colors"
          >
            Darshanpadhiyar38@gmail.com
          </a>
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;