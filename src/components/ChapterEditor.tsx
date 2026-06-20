import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Bold, Italic, Quote, Image as ImageIcon, Sparkles, MessageCircle, Save } from "lucide-react";
import { useState } from "react";

interface ChapterEditorProps {
  darkMode: boolean;
  onBack: () => void;
}

const collaborators = [
  { name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', typing: true },
  { name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', typing: false },
  { name: 'Carol', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol', typing: false },
];

const comments = [
  { id: '1', user: 'Alice', text: 'Love the pacing here!', time: '2m ago' },
  { id: '2', user: 'Bob', text: 'Maybe add more description?', time: '5m ago' },
];

export function ChapterEditor({ darkMode, onBack }: ChapterEditorProps) {
  const [content, setContent] = useState(
    "The glass kingdom shimmered under the moonlight, its crystalline towers reaching toward the stars. Luna walked through the empty streets, her footsteps echoing against the translucent walls.\n\nShe had always known this day would come—the day when she would have to leave everything behind and venture into the unknown. The prophecy had been clear, even if its meaning remained shrouded in mystery.\n\nAs she approached the city gates, a figure emerged from the shadows..."
  );

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
            <h3>Chapter 3: The Hidden Truth</h3>
            <p className="opacity-60">Last saved 2 minutes ago</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Collaborators */}
          <div className="flex items-center -space-x-2">
            {collaborators.map((collab) => (
              <motion.div
                key={collab.name}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                className="relative"
              >
                <Avatar className="w-8 h-8 border-2" style={{ borderColor: darkMode ? '#1e1e1e' : '#fff' }}>
                  <AvatarImage src={collab.avatar} />
                  <AvatarFallback>{collab.name[0]}</AvatarFallback>
                </Avatar>
                {collab.typing && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
                    style={{ 
                      background: '#A2D6A2',
                      borderColor: darkMode ? '#1e1e1e' : '#fff',
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          <Button
            className="rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #A2D6A2, #C5E8C5)',
              color: darkMode ? '#1e1e1e' : '#000',
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6 p-2 rounded-xl backdrop-blur-[25px] border w-fit"
            style={{
              background: darkMode 
                ? 'rgba(162, 214, 162, 0.1)' 
                : 'rgba(162, 214, 162, 0.15)',
              borderColor: 'rgba(162, 214, 162, 0.3)',
            }}
          >
            {[
              { icon: Bold, label: 'Bold' },
              { icon: Italic, label: 'Italic' },
              { icon: Quote, label: 'Quote' },
              { icon: ImageIcon, label: 'Image' },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    background: 'transparent',
                  }}
                  title={tool.label}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              );
            })}
            <div className="w-px h-6 mx-1" style={{ background: 'rgba(162, 214, 162, 0.3)' }} />
            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: 'rgba(162, 214, 162, 0.2)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              AI Suggest
            </motion.button>
          </motion.div>

          {/* Editor Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 backdrop-blur-[25px] rounded-2xl p-8 border"
            style={{
              background: darkMode 
                ? 'rgba(30, 30, 30, 0.3)' 
                : 'rgba(255, 255, 255, 0.3)',
              borderColor: darkMode 
                ? 'rgba(162, 214, 162, 0.15)' 
                : 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-transparent border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
              placeholder="Start writing your story..."
              style={{ minHeight: '500px' }}
            />
          </motion.div>

          {/* Word Count */}
          <div className="mt-4 flex items-center justify-between opacity-60">
            <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            <span>{content.length} characters</span>
          </div>
        </div>

        {/* Comments Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-80 border-l p-6 overflow-y-auto backdrop-blur-[20px]"
          style={{
            background: darkMode 
              ? 'rgba(30, 30, 30, 0.3)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderColor: darkMode 
              ? 'rgba(162, 214, 162, 0.15)' 
              : 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5" style={{ color: '#A2D6A2' }} />
            <h3>Comments</h3>
          </div>

          <div className="space-y-4">
            {comments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="p-4 rounded-xl backdrop-blur-md"
                style={{
                  background: 'rgba(162, 214, 162, 0.1)',
                  border: '1px solid rgba(162, 214, 162, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user}`} />
                    <AvatarFallback>{comment.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span>{comment.user}</span>
                      <span className="opacity-50">{comment.time}</span>
                    </div>
                    <p className="opacity-80">{comment.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6">
            <Textarea
              placeholder="Add a comment..."
              className="backdrop-blur-md rounded-xl"
              style={{
                background: 'rgba(162, 214, 162, 0.05)',
                border: '1px solid rgba(162, 214, 162, 0.2)',
              }}
            />
            <Button
              className="w-full mt-2 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #A2D6A2, #C5E8C5)',
                color: darkMode ? '#1e1e1e' : '#000',
              }}
            >
              Post Comment
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
