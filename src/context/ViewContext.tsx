import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type View = "parent" | "child";
const ViewContext = createContext<{ view: View; setView: (v: View) => void }>({
  view: "parent", setView: () => {},
});

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<View>(() =>
    (localStorage.getItem("kk-view") as View) || "parent"
  );
  const setView = (v: View) => {
    setViewState(v);
    localStorage.setItem("kk-view", v);
  };
  useEffect(() => { document.documentElement.dataset.view = view; }, [view]);
  return <ViewContext.Provider value={{ view, setView }}>{children}</ViewContext.Provider>;
}
export const useView = () => useContext(ViewContext);
