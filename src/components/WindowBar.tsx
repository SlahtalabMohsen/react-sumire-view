import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

interface WindowBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function WindowBar({ darkMode, onToggleDarkMode }: WindowBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-12 backdrop-blur-[25px] border-b"
      style={{
        background: darkMode 
          ? 'rgba(30, 30, 30, 0.7)' 
          : 'rgba(255, 255, 255, 0.7)',
        borderColor: darkMode 
          ? 'rgba(162, 214, 162, 0.2)' 
          : 'rgba(255, 255, 255, 0.3)',
      }}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Window controls and title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-red-500 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"
            />
          </div>
          <h1 className="tracking-tight">GlassTales</h1>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg transition-all"
            style={{
              background: 'rgba(162, 214, 162, 0.2)',
            }}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all"
            style={{
              background: 'rgba(162, 214, 162, 0.15)',
            }}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=GlassTales" />
              <AvatarFallback>GT</AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
