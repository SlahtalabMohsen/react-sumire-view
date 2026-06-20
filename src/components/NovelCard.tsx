import { motion } from "motion/react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { BookOpen, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface NovelCardProps {
  title: string;
  author: string;
  cover: string;
  chapters: number;
  progress: number;
  rating: number;
  darkMode: boolean;
  onClick?: () => void;
}

export function NovelCard({
  title,
  author,
  cover,
  chapters,
  progress,
  rating,
  darkMode,
  onClick,
}: NovelCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative rounded-2xl p-4 cursor-pointer backdrop-blur-[20px] border transition-all duration-300 group overflow-hidden fantasy-card fantasy-border-animated"
      style={{
        background: darkMode
          ? "rgba(30, 30, 30, 0.3)"
          : "rgba(255, 255, 255, 0.2)",
        borderColor: darkMode
          ? "rgba(162, 214, 162, 0.2)"
          : "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at center, rgba(162, 214, 162, 0.15), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Cover Image */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-4">
        <ImageWithFallback
          src={cover}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rating Badge */}
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <Star
            className="w-3 h-3 fill-[#A2D6A2]"
            style={{ color: "#A2D6A2" }}
          />
          <span className="text-white">{rating}</span>
        </div>
      </div>

      {/* Title & Author */}
      <div className="space-y-1 mb-3">
        <h3 className="line-clamp-1">{title}</h3>
        <p className="opacity-60">{author}</p>
      </div>

      {/* Chapters Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="secondary"
          className="backdrop-blur-md border"
          style={{
            background: "rgba(162, 214, 162, 0.2)",
            borderColor: "rgba(162, 214, 162, 0.4)",
            color: darkMode ? "#C5E8C5" : "#7FB97F",
          }}
        >
          <BookOpen className="w-3 h-3 mr-1" />
          {chapters} Chapters
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="opacity-60">Progress</span>
          <span className="opacity-80">{progress}%</span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{
            background: darkMode
              ? "rgba(162, 214, 162, 0.1)"
              : "rgba(162, 214, 162, 0.15)",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #A2D6A2, #C5E8C5)",
            }}
          />
        </div>
      </div>

      {/* Hover Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ scale: 1.05 }}
        className="absolute bottom-4 left-4 right-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, #A2D6A2, #C5E8C5)",
          color: darkMode ? "#1e1e1e" : "#000",
        }}
      >
        Continue Reading
      </motion.button>
    </motion.div>
  );
}
