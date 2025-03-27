export const fadeInUp = {
    from: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { type: "timing", duration: 300 } as const
  };
  
  export const scaleTap = {
    from: { scale: 1 },
    animate: { scale: 0.95 },
    transition: { type: "timing", duration: 100 } as const
  };
  
  export const fadeIn = {
    from: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { type: "timing", duration: 250 } as const
  };
  