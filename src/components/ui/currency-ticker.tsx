"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface CurrencyTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  notation?: "standard" | "compact";
  currency?: string;
  locale?: string;
}

export function CurrencyTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  notation = "standard",
  currency = "PHP",
  locale = "en-PH",
  ...props
}: CurrencyTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isClient, setIsClient] = useState(false);
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  // Ensure client-side rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isInView && isClient) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [motionValue, isInView, delay, value, direction, startValue, isClient]);

  useEffect(
    () => {
      if (!isClient) return;
      
      return springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            notation,
            maximumFractionDigits: notation === "compact" ? 1 : 2,
          }).format(Number(latest.toFixed(2)));
        }
      });
    },
    [springValue, locale, currency, notation, isClient],
  );

  // Use a simple fallback for SSR, then format on client
  const getDisplayValue = () => {
    if (!isClient) {
      // Simple fallback for SSR to prevent hydration mismatch
      return `₱${startValue.toFixed(notation === "compact" ? 1 : 2)}`;
    }
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation,
      maximumFractionDigits: notation === "compact" ? 1 : 2,
    }).format(startValue);
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tabular-nums tracking-wider",
        className,
      )}
      {...props}
    >
      {getDisplayValue()}
    </span>
  );
}