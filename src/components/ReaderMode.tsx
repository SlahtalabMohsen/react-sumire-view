import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MessageCircle, Bookmark, Settings } from "lucide-react";
import { useState } from "react";

interface ReaderModeProps {
  darkMode: boolean;
  onBack: () => void;
}

export function ReaderMode({ darkMode, onBack }: ReaderModeProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const content = [
    {
      text: "The glass kingdom shimmered under the moonlight, its crystalline towers reaching toward the stars. Luna walked through the empty streets, her footsteps echoing against the translucent walls.\n\nShe had always known this day would come—the day when she would have to leave everything behind and venture into the unknown. The prophecy had been clear, even if its meaning remained shrouded in mystery.\n\nAs she approached the city gates, a figure emerged from the shadows. Tall and cloaked, with eyes that seemed to pierce through the darkness, the stranger held up a hand in greeting.\n\n\"You're the one they call the Glass Keeper,\" the figure said, voice neither male nor female, but something in between. \"I've been waiting for you.\"\n\nLuna's hand instinctively moved to the pendant around her neck, the one her grandmother had given her before she passed. It pulsed with a soft, warm light, responding to the stranger's presence.",
    },
    {
      text: "\"Who are you?\" Luna asked, her voice steadier than she felt. \"And how do you know about the prophecy?\"\n\nThe stranger lowered their hood, revealing features that seemed to shift and change in the moonlight—sometimes young, sometimes old, sometimes familiar, sometimes completely alien.\n\n\"I am a Keeper of Memories,\" they replied. \"And I have been watching your family for generations, waiting for the one who would finally break the cycle.\"\n\nLuna felt a chill run down her spine. The cycle. She had heard whispers of it in her dreams, fragments of conversations that made no sense in the waking world.\n\n\"What cycle?\" she demanded. \"And what does it have to do with me?\"\n\nThe Memory Keeper smiled, a sad, knowing expression that spoke of centuries of sorrow.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 backdrop-blur-[20px] border-b"
        style={{
          background: darkMode 
            ? 'rgba(30, 30, 30, 0.4)' 
            : 'rgba(255, 255, 255, 0.4)',
          borderColor: darkMode 
            ? 'rgba(162, 214, 162, 0.15)' 
            : 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 rounded-lg transition-all"
            style={{
              background: 'rgba(162, 214, 162, 0.15)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h3>The Glass Kingdom</h3>
            <p className="opacity-60">Chapter 3: The Hidden Truth</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg transition-all"
          style={{
            background: 'rgba(162, 214, 162, 0.15)',
          }}
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Reader Content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl w-full backdrop-blur-[25px] rounded-2xl p-12 border relative"
          style={{
            background: darkMode 
              ? 'rgba(30, 30, 30, 0.3)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderColor: darkMode 
              ? 'rgba(162, 214, 162, 0.15)' 
              : 'rgba(255, 255, 255, 0.3)',
            minHeight: '600px',
          }}
        >
          {/* Page curl effect overlay */}
          <div
            className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(162, 214, 162, 0.1) 50%)',
              borderTopRightRadius: '1rem',
            }}
          />

          <div className="prose prose-lg max-w-none" style={{ color: darkMode ? '#e5e5e5' : '#1e1e1e' }}>
            <p className="leading-relaxed whitespace-pre-line">{content[currentPage - 1].text}</p>
          </div>

          {/* Page Number */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-50">
            Page {currentPage} of {content.length}
          </div>
        </motion.div>
      </div>

      {/* Bottom Dock */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 backdrop-blur-[20px] border-t"
        style={{
          background: darkMode 
            ? 'rgba(30, 30, 30, 0.4)' 
            : 'rgba(255, 255, 255, 0.4)',
          borderColor: darkMode 
            ? 'rgba(162, 214, 162, 0.15)' 
            : 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(162, 214, 162, 0.2)',
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <span className="mx-4 opacity-60">
              {currentPage} / {content.length}
            </span>

            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(Math.min(content.length, currentPage + 1))}
              disabled={currentPage === content.length}
              className="p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(162, 214, 162, 0.2)',
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLiked(!liked)}
              className="p-3 rounded-xl transition-all"
              style={{
                background: liked ? 'rgba(162, 214, 162, 0.3)' : 'rgba(162, 214, 162, 0.1)',
              }}
            >
              <Heart
                className="w-5 h-5"
                style={{
                  fill: liked ? '#A2D6A2' : 'none',
                  color: liked ? '#A2D6A2' : 'currentColor',
                }}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl transition-all"
              style={{
                background: 'rgba(162, 214, 162, 0.1)',
              }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBookmarked(!bookmarked)}
              className="p-3 rounded-xl transition-all"
              style={{
                background: bookmarked ? 'rgba(162, 214, 162, 0.3)' : 'rgba(162, 214, 162, 0.1)',
              }}
            >
              <Bookmark
                className="w-5 h-5"
                style={{
                  fill: bookmarked ? '#A2D6A2' : 'none',
                  color: bookmarked ? '#A2D6A2' : 'currentColor',
                }}
              />
            </motion.button>
          </div>

          {/* Next Chapter */}
          {currentPage === content.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                className="rounded-xl px-6"
                style={{
                  background: 'linear-gradient(135deg, #A2D6A2, #C5E8C5)',
                  color: darkMode ? '#1e1e1e' : '#000',
                }}
              >
                Next Chapter
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
