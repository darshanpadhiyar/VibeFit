/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GarmentCategory, TopStylingOption } from "../types";

// Lazy initialization for the Google AI client
let ai: GoogleGenAI | null = null;
const getGoogleAI = () => {
    // FIX: Use process.env.API_KEY as per the coding guidelines.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is not set. Please add it to your environment variables.");
    }
    if (!ai) {
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

const model = 'gemini-2.5-flash-image';

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = `You are an expert fashion photographer AI. Your task is to transform the person in the user-provided image into a high-quality, photorealistic fashion model photo.

**Primary Goal:** Create a clean, professional, full-body e-commerce style model image.

**CRITICAL RULES (FATAL_ERROR_IF_VIOLATED):**
1.  **PRESERVE IDENTITY (HIGHEST PRIORITY):** You MUST preserve the person's exact face, hair, unique features, and body type. DO NOT change their identity. The final image must look exactly like the person provided.
2.  **FULL BODY SHOT (HIGHEST PRIORITY):** The final image MUST be a full-body shot, showing the person from head to toe. Do NOT crop the image or cut off any part of the body, especially feet or head.
3.  **NEUTRAL BACKGROUND:** The background MUST be a clean, neutral studio backdrop (light gray, #f0f0f0). Remove all elements from the original background.
4.  **PROFESSIONAL POSE:** Place the person in a standard, relaxed standing model pose.
5.  **NEUTRAL EXPRESSION:** The person should have a neutral, professional model expression.
6.  **PHOTOREALISTIC OUTPUT:** The final image must be photorealistic.
7.  **OUTPUT FORMAT:** Return ONLY the final image file. No text, no commentary.`;
    const response = await getGoogleAI().models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generateOutfitImage = async (
    modelImageUrl: string, 
    garments: { file: File, category: GarmentCategory, name: string }[],
    topStyling: TopStylingOption
): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImageParts = await Promise.all(garments.map(g => fileToPart(g.file)));

    const garmentDescriptions = garments.map(g => `- A '${g.category}' item named '${g.name}'`).join('\n');

    let stylingInstruction = 'All items should be layered naturally.';
    if (garments.some(g => g.category === 'top') && garments.some(g => g.category === 'bottom')) {
        stylingInstruction = topStyling === 'tucked' 
            ? "The 'top' garment MUST be tucked into the 'bottom' garment. The bottom of the shirt must be hidden inside the pants, blending seamlessly to create a clean waistline."
            : "The 'top' garment MUST be worn untucked, hanging over the 'bottom' garment. The bottom hem of the shirt must be visible and layered realistically on top of the pants.";
    }

    const prompt = `You are an expert virtual try-on AI. Your task is to create a new photorealistic image where the person from the 'model image' is wearing ALL of the clothing from the 'garment images' together as a complete, styled outfit.

**Garments to apply:**
${garmentDescriptions}

**CRITICAL RULES (FATAL_ERROR_IF_VIOLATED):**
1.  **PRESERVE IDENTITY (HIGHEST PRIORITY):** The person's face, hair, and body shape from the 'model image' MUST remain completely unchanged. DO NOT alter their identity.
2.  **PRESERVE POSE (HIGHEST PRIORITY):** The person's pose from the 'model image' MUST be preserved exactly.
3.  **PRESERVE BACKGROUND (HIGHEST PRIORITY):** The entire background from the 'model image' MUST be preserved perfectly.
4.  **PRESERVE FRAMING (HIGHEST PRIORITY):** Do not crop or change the framing of the image. The output dimensions and visible area must be identical to the model image.
5.  **COMPLETE OUTFIT:** You MUST intelligently place all listed garments on the model. If a garment from the 'model image' would be covered by a new garment (e.g., a new shirt covers an old one), you MUST completely REMOVE and REPLACE the original item.
6.  **APPLY STYLING:** ${stylingInstruction}
7.  **REALISTIC FIT:** Fit the new garments onto the person realistically. They should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.
8.  **OUTPUT FORMAT:** Return ONLY the final, edited image. Do not include any text.`;
    
    const response = await getGoogleAI().models.generateContent({
        model,
        contents: { parts: [modelImagePart, ...garmentImageParts, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnFromLook = async (modelImageUrl: string, lookImageFile: File): Promise<string> => {
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const lookImagePart = await fileToPart(lookImageFile);
    const prompt = `You are an expert virtual try-on AI. You will be given a 'model image' and a 'source look image'. Your task is to extract the main outfit (top and bottom garments) from the person in the 'source look image' and realistically place it onto the person in the 'model image'.

**CRITICAL RULES (FATAL_ERROR_IF_VIOLATED):**
1.  **PRESERVE IDENTITY (HIGHEST PRIORITY):** The person's face, hair, body shape from the 'model image' MUST remain completely unchanged.
2.  **PRESERVE POSE & BACKGROUND (HIGHEST PRIORITY):** The pose and entire background from the 'model image' MUST be preserved perfectly.
3.  **GARMENT TRANSFER:** Accurately identify the primary clothing item(s) (e.g., shirt, dress, jacket, pants) in the 'source look image' and transfer them. Ignore accessories.
4.  **REALISTIC FIT:** The transferred garment must be realistically fitted to the person in the 'model image', adapting to their pose with natural folds, shadows, and lighting.
5.  **OUTPUT FORMAT:** Return ONLY the final, edited image. Do not include any text.`;

    const response = await getGoogleAI().models.generateContent({
        model,
        contents: { parts: [modelImagePart, lookImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};


export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `You are an expert AI fashion photographer. Your task is to regenerate the provided image from a different perspective, following the new instruction.

**New Pose Instruction:** "${poseInstruction}"

**CRITICAL RULES (FATAL_ERROR_IF_VIOLATED):**
1.  **ANCHOR THE MODEL (HIGHEST PRIORITY):** The person's face, identity, and unique features MUST remain EXACTLY the same.
2.  **ANCHOR THE OUTFIT (HIGHEST PRIORITY):** The clothing the person is wearing MUST remain EXACTLY the same. Do not change the color, style, or fit of any garment.
3.  **ANCHOR THE BACKGROUND:** The background style MUST remain identical.
4.  **FULL BODY SHOT (HIGHEST PRIORITY):** The final image MUST be a full-body shot, showing the person from head to toe. Do NOT crop the image.
5.  **ONLY CHANGE THE POSE:** The ONLY thing you are allowed to change is the person's body pose to match the new instruction.
6.  **OUTPUT FORMAT:** Return ONLY the final, edited image. Do not include any text.`;
    const response = await getGoogleAI().models.generateContent({
        model,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};

export const remixGarment = async (baseImageUrl: string, remixPrompt: string, garmentName: string): Promise<string> => {
    const baseImagePart = dataUrlToPart(baseImageUrl);
    const prompt = `You are an expert AI fashion editor. Your task is to edit ONLY the '${garmentName}' on the person in the image according to the text prompt.
    
**CRITICAL RULES (FATAL_ERROR_IF_VIOLATED):**
1.  **PRESERVE PERSON & POSE (HIGHEST PRIORITY):** The person's face, hair, body, and pose MUST remain identical.
2.  **PRESERVE BACKGROUND & OTHER CLOTHES (HIGHEST PRIORITY):** The background and all other clothing items NOT mentioned must remain identical.
3.  **APPLY THE EDIT:** Modify ONLY the color, pattern, or style of the '${garmentName}' as described in the text prompt: "${remixPrompt}". Make the edit look photorealistic and seamless.
4.  **OUTPUT FORMAT:** Return ONLY the edited image.`;

    const response = await getGoogleAI().models.generateContent({
        model,
        contents: { parts: [baseImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    return handleApiResponse(response);
};