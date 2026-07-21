import { forwardRef, useState } from 'react';
import { useLazyImage } from '../../hooks/useIntersectionObserver';

const LazyImage = forwardRef(function LazyImage({
  src, alt, className = '', width, height,
  placeholder = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="%2311111a" width="1" height="1"/></svg>',
  ...props
}, ref) {
  const [imgRef, inView] = useLazyImage();
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!loaded && (
        <div className="absolute inset-0 bg-white/[0.03] animate-pulse rounded-inherit" />
      )}
      {inView && (
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          {...props}
        />
      )}
      {!inView && (
        <img src={placeholder} alt="" className="w-full h-full object-cover opacity-30" aria-hidden />
      )}
    </div>
  );
});

export default LazyImage;
