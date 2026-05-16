
import * as React from "react"
import { cn } from "@/lib/utils"

const AvatarContext = React.createContext({
  status: "loading",
  setStatus: () => {},
})

const Avatar = React.forwardRef(({ className, ...props }, ref) => {
  const [status, setStatus] = React.useState("loading")

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef(({ className, src, ...props }, ref) => {
  const { setStatus, status } = React.useContext(AvatarContext)

  React.useEffect(() => {
    if (!src) {
      setStatus("error")
      return
    }

    setStatus("loading")
    const img = new Image()
    img.src = src
    
    img.onload = () => {
      setStatus("loaded")
    }
    
    img.onerror = () => {
      setStatus("error")
    }
  }, [src, setStatus])

  if (status !== "loaded") return null

  return (
    <img
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => {
  const { status } = React.useContext(AvatarContext)

  if (status === "loaded") return null

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
