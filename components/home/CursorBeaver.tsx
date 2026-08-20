"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// 기능명세서 E-01: 선형 보간 계수. 값이 작을수록 커서를 천천히 뒤따라감
const FOLLOW_SPEED = 0.1;
const BEAVER_SIZE = 48;

// 기능명세서 E-01: 마우스를 따라다니는 비버.
// 터치 기기이거나 "모션 줄이기" 설정을 켠 사용자에게는 아예 렌더링하지 않음.
export function CursorBeaver() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const supportsHoverAndFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!supportsHoverAndFinePointer || prefersReducedMotion) {
      return;
    }

    setIsEnabled(true);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const targetPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const currentPosition = { x: targetPosition.x, y: targetPosition.y };
    let animationFrameId: number;

    function handleMouseMove(event: MouseEvent) {
      targetPosition.x = event.clientX;
      targetPosition.y = event.clientY;
    }

    function animate() {
      currentPosition.x += (targetPosition.x - currentPosition.x) * FOLLOW_SPEED;
      currentPosition.y += (targetPosition.y - currentPosition.y) * FOLLOW_SPEED;

      const wrapperElement = wrapperRef.current;
      if (wrapperElement) {
        const offsetX = currentPosition.x - BEAVER_SIZE / 2;
        const offsetY = currentPosition.y - BEAVER_SIZE / 2;
        wrapperElement.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(animate);

    // 기능명세서 E-01 "정리" 항목: 언마운트 시 이벤트 리스너·애니메이션 프레임 해제
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50"
      style={{ width: BEAVER_SIZE, height: BEAVER_SIZE }}
    >
      <Image
        src="/doodles/sit.png"
        alt=""
        fill
        sizes={`${BEAVER_SIZE}px`}
        className="object-contain"
      />
    </div>
  );
}
