import { useState, useEffect } from "react";
import { ASSETS } from "@/game-core/master";

export function useTileImages() {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: Record<string, HTMLImageElement> = {};

      const tasks = Object.entries(ASSETS).map(([textureKey, src]) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            loadedImages[textureKey] = img;
            resolve(true);
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${textureKey} from ${src}`);
            resolve(false);
          };
        });
      });

      await Promise.all(tasks);
      setImages(loadedImages);
      setIsLoaded(true);
    };

    loadImages();
  }, []);

  return { images, isLoaded };
}
