# VibeFit: The AI-Powered Virtual Try-On Experience

✨ **Wear Your Imagination. Instantly try on any look with your virtual twin.** ✨

VibeFit is a cutting-edge web application that uses the power of the Google Gemini API to offer a seamless and photorealistic virtual try-on experience. Users can upload a photo of themselves, transform it into a professional model image, and then experiment with a dynamic wardrobe of clothing to create the perfect outfit.

![VibeFit Demo GIF](https://storage.googleapis.com/gemini-95-icons/vibefit-demo.gif)

## 🚀 Features

-   **Virtual Model Creation:** Transform any user-submitted photo into a high-quality, full-body fashion model while preserving the user's identity.
-   **AI-Powered Virtual Try-On:** Realistically render selected garments onto the virtual model, accounting for fit, folds, and lighting.
-   **Dynamic Wardrobe:**
    -   Choose from pre-defined categories (Tops, Bottoms).
    -   Upload your own garment images to add them to your personal wardrobe.
-   **"Get the Look":** Upload an image of an outfit you like, and the AI will transfer that complete look onto your model.
-   **Creative Remixing:** Modify garments already on your model using simple text prompts (e.g., "make this shirt blue plaid," "add a floral pattern").
-   **Pose Variation:** View your final outfit from multiple angles by selecting different pre-defined model poses.
-   **Advanced Styling Options:** Choose how to wear your clothes, starting with 'tucked' vs. 'untucked' for tops.
-   **Stunning UI:**
    -   A sleek, modern interface with Light & Dark modes.
    -   Fluid animations powered by Framer Motion.
    -   Fully responsive design for a seamless experience on both desktop and mobile.

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript
-   **AI / Image Generation:** Google Gemini API (`gemini-2.5-flash-image`)
-   **Styling:** TailwindCSS
-   **Animation:** Framer Motion
-   **Particle Effects:** tsParticles

## 🧠 How It Works: The Gemini API in Action

The core of VibeFit is its intelligent use of the Gemini API for complex image-to-image and text-to-image tasks. The application makes several distinct types of calls to the API:

1.  **`generateModelImage`**:
    -   **Input:** A user-uploaded image.
    -   **Prompt:** A detailed prompt instructs the AI to act as a fashion photographer, cleaning the background, standardizing the pose, and preserving the user's face, body type, and identity to create a "virtual twin."
    -   **Output:** A clean, e-commerce-style model image.

2.  **`generateOutfitImage`**:
    -   **Input:** The base model image and one or more garment images.
    -   **Prompt:** Instructs the AI to act as a virtual stylist. It's told to preserve the model's identity, pose, and background while realistically fitting the new garments. It also includes specific styling instructions, like tucking a shirt in.
    -   **Output:** The model wearing the new outfit.

3.  **`generateVirtualTryOnFromLook`**:
    -   **Input:** The base model image and a "look" image containing an outfit.
    -   **Prompt:** The AI is tasked with identifying the main garments in the "look" image and transferring them onto the base model, preserving the model's identity and pose.
    -   **Output:** The model wearing the outfit from the look image.

4.  **`remixGarment`**:
    -   **Input:** The current image of the model wearing an outfit, a text prompt from the user (e.g., "make it denim"), and the name of the garment to modify.
    -   **Prompt:** A highly constrained prompt that tells the AI to *only* modify the specified garment according to the text prompt, leaving the person, pose, background, and other clothes completely unchanged.
    -   **Output:** The model wearing the remixed garment.

5.  **`generatePoseVariation`**:
    -   **Input:** The current image of the model in a styled outfit and a text instruction for a new pose.
    -   **Prompt:** Instructs the AI to change *only* the model's pose while keeping the person's identity, the outfit, and the background style exactly the same.
    -   **Output:** The model in the same outfit but in a new pose.

## 📦 Getting Started

To run this project locally, follow these steps:

### Prerequisites

-   Node.js and npm (or yarn) installed on your machine.
-   A valid Google Gemini API key.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/vibefit.git
    cd vibefit
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    The application requires your Google Gemini API key to be available as an environment variable. The code is already configured to read `process.env.API_KEY`. How you set this depends on your operating system and deployment environment. For local development, you can use a tool like `dotenv` or set it in your shell.

4.  **Run the development server:**
    ```bash
    npm run start
    ```
    Open [http://localhost:3000](http://localhost:3000) (or the port specified in your terminal) to view it in your browser.

## 📁 Project Structure

```
/src
|-- /components/       # Reusable React components
|   |-- /ui/           # Generic UI elements (Compare, Sparkles)
|   |-- App.tsx        # Main application component and state management
|   |-- Canvas.tsx     # Component for displaying the main model image
|   |-- OutfitBuilder.tsx # Panel for assembling and styling the outfit
|   |-- StartScreen.tsx   # Initial screen for model creation
|   `-- WardrobeModal.tsx # Panel for selecting/uploading garments
|
|-- /lib/              # Utility functions and libraries
|   `-- utils.ts       # General helper functions (cn, error handling)
|
|-- /services/         # API interaction layer
|   `-- geminiService.ts # Core logic for all Google Gemini API calls
|
|-- /types/            # TypeScript type definitions
|   `-- types.ts
|
|-- /wardrobe/         # Default data
|   `-- wardrobe.ts    # Default wardrobe items
|
`-- index.tsx          # Application entry point
```

## 📄 License

This project is licensed under the Apache-2.0 License. See the `LICENSE` file for details.
