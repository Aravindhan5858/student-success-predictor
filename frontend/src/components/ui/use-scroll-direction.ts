"use client";
import React from "react";

export function useScrollDirection() {
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  const onScroll = React.useCallback(() => {
    const currentScrollY = window.scrollY;

    // Show navbar when at top
    if (currentScrollY < 100) {
      setIsVisible(true);
      setLastScrollY(currentScrollY);
      return;
    }

    // Hide when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollY) {
      // Scrolling down
      setIsVisible(false);
    } else {
      // Scrolling up
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  React.useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
        setTimeout(() => {
          ticking = false;
        }, 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onScroll]);

  return isVisible;
}
