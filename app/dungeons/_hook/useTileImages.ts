import { useState, useEffect } from "react";
import { TILE_CONFIG, ASSETS } from "@/types";

export function useTileImages() {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: Record<string, HTMLImageElement> = {};
      const tasks = Object.keys(TILE_CONFIG).map((tileId) => {
        return new Promise((resolve) => {
          const img = new Image();
          const config = TILE_CONFIG[tileId];
          const textureKey = config.texture as keyof typeof ASSETS;
          img.src = ASSETS[textureKey];
          img.onload = () => {
            loadedImages[tileId] = img;
            resolve(true);
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
