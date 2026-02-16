import type { ReactNode } from "react";

export default function Footer({
  children,
  hidden,
}: {
  children?: ReactNode;
  hidden?: boolean;
}) {
  return (
    <div
      className={`flex h-16 w-full shrink-0 items-center justify-end gap-4 ${!hidden && "border-t border-[#2a2a2a] bg-[#121418]"} px-6`}
    >
      {children && children}
    </div>
  );
}
