import React, { useState, useEffect } from "react";

const images = [
  "https://www.bonboncar.vn/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fbonboncar-cms%2FGroup_63395_237fc886b4%2FGroup_63395_237fc886b4.png&w=1280&q=100",
  "https://www.bonboncar.vn/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fbonboncar-cms%2FGroup_63394_423745dbda%2FGroup_63394_423745dbda.png&w=1280&q=100",
  "https://www.bonboncar.vn/_next/image?url=https%3A%2F%2Fstorage.googleapis.com%2Fbonboncar-cms%2FGroup_63393_c777c8d0b6%2FGroup_63393_c777c8d0b6.png&w=1280&q=100",
];

const ImageSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setIndex((prev) => (prev + 1) % images.length),
      6000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[80vh] overflow-hidden">
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={`slide-${i}`}
          className={`absolute inset-0 w-full h-full object-cover object-[center_70%] transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Lớp overlay mờ để dễ đọc chữ hoặc form */}
      <div className="absolute inset-0 bg-black/20"></div>
    </div>
  );
};

export default ImageSlider;