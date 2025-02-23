"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "./tooltip";

interface SidebarContext {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (value: boolean | ((value: boolean) => boolean)) => void;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContext>({
  state: "expanded",
  open: true,
  setOpen: () => {},
  isMobile: false,
  openMobile: false,
  setOpenMobile: () => {},
  toggleSidebar: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

interface SidebarProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  openProp?: boolean;
  setOpenProp?: (open: boolean) => void;
}

export function Sidebar({
  children,
  defaultOpen = true,
  openProp,
  setOpenProp,
}: SidebarProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [openMobile, setOpenMobile] = React.useState(false);

  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
    },
    [setOpenProp, open]
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile
      ? setOpenMobile((open) => !open)
      : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div className="relative flex h-screen">
          {/* Add an overlay when the mobile menu is open */}
          {isMobile && openMobile && (
            <div
              className="fixed inset-0 z-40 bg-black/80"
              onClick={() => setOpenMobile(false)}
            />
          )}
          {/* The actual sidebar content */}
          <div
            data-state={state}
            className={cn(
              "z-50 flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-width duration-300",
              isMobile
                ? "fixed w-72 shrink-0 data-[state=collapsed]:-translate-x-full"
                : "relative w-72 shrink-0 data-[state=collapsed]:w-[70px]"
            )}
          >
            {children}
          </div>
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
