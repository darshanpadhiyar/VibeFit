/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type GarmentCategory = 'top' | 'bottom';
export type TopStylingOption = 'tucked' | 'untucked';
export type Theme = 'light' | 'dark';

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
  category: GarmentCategory;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}