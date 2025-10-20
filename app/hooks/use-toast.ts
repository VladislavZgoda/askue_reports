import { useState } from "react";

export function useToast() {
  const [isShowingToast, setIsShowingToast] = useState(false);

  const showToast = () => {
    setIsShowingToast(true);
    setTimeout(() => {
      setIsShowingToast(false);
    }, 4000);
  };

  return { isShowingToast, showToast };
}
