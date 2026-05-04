import { motion } from "framer-motion";
import { useView } from "@/context/ViewContext";

export function ViewToggle() {
  const { view, setView } = useView();
  return (
    <div className="fixed top-4 right-4 z-50 bg-card/90 backdrop-blur-md border border-border shadow-card rounded-full p-1 flex items-center text-xs font-semibold">
      <button
        onClick={() => setView("parent")}
        className={`relative px-4 py-2 rounded-full transition-colors z-10 ${view === "parent" ? "text-white" : "text-muted-foreground"}`}
      >
        👨‍👩‍👧 Parent
      </button>
      <button
        onClick={() => setView("child")}
        className={`relative px-4 py-2 rounded-full transition-colors z-10 ${view === "child" ? "text-white" : "text-muted-foreground"}`}
      >
        👧 Child
      </button>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="absolute inset-y-1 gradient-brand rounded-full shadow-soft"
        style={{
          left: view === "parent" ? 4 : "50%",
          right: view === "parent" ? "50%" : 4,
        }}
      />
    </div>
  );
}
