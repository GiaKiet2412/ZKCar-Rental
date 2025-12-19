import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

const ImageGallery = ({ images }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-3 md:grid-cols-5 gap-2 items-stretch">
        {/* Main Image */}
        <div
          className="md:col-span-3 col-span-3 aspect-[16/10] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 h-full"
          onClick={() => {
            setCurrentImageIndex(0);
            setIsLightboxOpen(true);
          }}
        >
          <img 
            src={getImageUrl(images[0])}
            alt="Ảnh xe" 
            className="w-full h-full object-cover" 
            onError={(e) => { e.target.src = '/no-image.png'; }}
          />
        </div>

        {/* Thumbnail Grid */}
        <div className="md:col-span-2 col-span-3 grid grid-cols-2 gap-2 h-full">
          {images.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 h-full"
              onClick={() => {
                setCurrentImageIndex(i + 1);
                setIsLightboxOpen(true);
              }}
            >
              <img 
                src={getImageUrl(img)}
                alt={`Ảnh ${i + 1}`} 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = '/no-image.png'; }}
              />
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold">
                  +{images.length - 5}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(images[currentImageIndex])}
              alt={`Ảnh ${currentImageIndex + 1}`}
              className="max-h-[80vh] rounded-lg object-contain"
              onError={(e) => { e.target.src = '/no-image.png'; }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2"
                >
                  <ChevronLeft size={28} color="white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2"
                >
                  <ChevronRight size={28} color="white" />
                </button>
                <div className="absolute bottom-6 flex gap-2">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${i === currentImageIndex ? "bg-white" : "bg-gray-500"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;