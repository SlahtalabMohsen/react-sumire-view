import { motion } from "motion/react";
import { Library, TrendingUp, FileText, Users } from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  darkMode: boolean;
}

const menuItems = [
  { id: 'library', label: 'My Library', icon: Library },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'following', label: 'Following', icon: Users },
];

export function Sidebar({ activeView, onViewChange, darkMode }: SidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="fixed left-0 top-12 bottom-0 w-64 backdrop-blur-[25px] border-r p-6 overflow-y-auto"
      style={{
        background: darkMode 
          ? 'rgba(30, 30, 30, 0.4)' 
          : 'rgba(255, 255, 255, 0.4)',
        borderColor: darkMode 
          ? 'rgba(162, 214, 162, 0.15)' 
          : 'rgba(255, 255, 255, 0.3)',
      }}
    >
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewChange(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: isActive 
                  ? 'rgba(162, 214, 162, 0.25)' 
                  : 'transparent',
                border: isActive 
                  ? '1px solid rgba(162, 214, 162, 0.4)' 
                  : '1px solid transparent',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? '#A2D6A2' : 'currentColor' }} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-8 pt-8 border-t" style={{ borderColor: darkMode ? 'rgba(162, 214, 162, 0.15)' : 'rgba(0, 0, 0, 0.1)' }}>
        <h3 className="px-4 mb-3 opacity-60">Recent Novels</h3>
        <div className="space-y-2">
          {['The Glass Kingdom', 'Digital Dreams', 'Echoes of Time'].map((novel, i) => (
            <motion.div
              key={novel}
              whileHover={{ scale: 1.02, x: 4 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="px-4 py-2 rounded-lg cursor-pointer transition-all"
              style={{
                background: darkMode 
                  ? 'rgba(162, 214, 162, 0.05)' 
                  : 'rgba(162, 214, 162, 0.08)',
              }}
            >
              <p className="truncate opacity-80">{novel}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
