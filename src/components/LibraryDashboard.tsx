import { motion } from "motion/react";
import { NovelCard } from "./NovelCard";
import { Search } from "lucide-react";
import { useState } from "react";

interface Novel {
  id: string;
  title: string;
  author: string;
  cover: string;
  chapters: number;
  progress: number;
  rating: number;
}

interface LibraryDashboardProps {
  darkMode: boolean;
  onNovelClick: (novel: Novel) => void;
  novels: Novel[];
}

export function LibraryDashboard({ darkMode, onNovelClick, novels }: LibraryDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-8">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div
          className="flex items-center gap-3 px-6 py-4 rounded-full backdrop-blur-[20px] border max-w-2xl"
          style={{
            background: darkMode 
              ? 'rgba(30, 30, 30, 0.3)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderColor: darkMode 
              ? 'rgba(162, 214, 162, 0.2)' 
              : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <Search className="w-5 h-5 opacity-50" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none placeholder:opacity-50"
          />
        </div>
      </motion.div>

      {/* Featured Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="mb-4">Featured Novels</h2>
        <div
          className="p-6 rounded-2xl backdrop-blur-[20px] border"
          style={{
            background: darkMode 
              ? 'rgba(30, 30, 30, 0.25)' 
              : 'rgba(255, 255, 255, 0.2)',
            borderColor: darkMode 
              ? 'rgba(162, 214, 162, 0.2)' 
              : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {novels.slice(0, 3).map((novel, i) => (
              <motion.div
                key={novel.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                onClick={() => onNovelClick(novel)}
              >
                <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="truncate">{novel.title}</h4>
                  <p className="opacity-60 truncate">{novel.author}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Novel Grid */}
      <div className="mb-6">
        <h2>My Library</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {novels
          .filter((novel) =>
            novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            novel.author.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((novel, i) => (
            <motion.div
              key={novel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <NovelCard
                {...novel}
                darkMode={darkMode}
                onClick={() => onNovelClick(novel)}
              />
            </motion.div>
          ))}
      </div>
    </div>
  );
}
