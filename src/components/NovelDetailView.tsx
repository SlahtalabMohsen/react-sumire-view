import { motion } from "motion/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ArrowLeft, BookOpen, Star, Edit, Eye, Clock } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  readingTime: number;
  completed: boolean;
}

interface NovelDetailViewProps {
  novel: {
    title: string;
    author: string;
    cover: string;
    synopsis: string;
    rating: number;
    chapters: number;
  };
  darkMode: boolean;
  onBack: () => void;
  onRead: () => void;
  onWrite: () => void;
}

const mockChapters: Chapter[] = [
  { id: '1', title: 'The Beginning', wordCount: 2500, readingTime: 10, completed: true },
  { id: '2', title: 'A New Discovery', wordCount: 3200, readingTime: 13, completed: true },
  { id: '3', title: 'The Hidden Truth', wordCount: 2800, readingTime: 11, completed: false },
  { id: '4', title: 'Revelations', wordCount: 3500, readingTime: 14, completed: false },
  { id: '5', title: 'The Final Chapter', wordCount: 4000, readingTime: 16, completed: false },
];

export function NovelDetailView({ novel, darkMode, onBack, onRead, onWrite }: NovelDetailViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 pb-20"
    >
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05, x: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl backdrop-blur-[20px] border transition-all"
        style={{
          background: darkMode 
            ? 'rgba(30, 30, 30, 0.4)' 
            : 'rgba(255, 255, 255, 0.4)',
          borderColor: darkMode 
            ? 'rgba(162, 214, 162, 0.2)' 
            : 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </motion.button>

      {/* Hero Section */}
      <div className="grid md:grid-cols-[300px,1fr] gap-8 mb-8">
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="aspect-[2/3] rounded-2xl overflow-hidden">
            <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover" />
          </div>
          <div
            className="absolute -inset-4 rounded-2xl -z-10 blur-3xl opacity-30"
            style={{
              background: `url(${novel.cover})`,
              backgroundSize: 'cover',
            }}
          />
        </motion.div>

        {/* Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-[25px] rounded-2xl p-8 border"
          style={{
            background: darkMode 
              ? 'rgba(30, 30, 30, 0.3)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderColor: darkMode 
              ? 'rgba(162, 214, 162, 0.2)' 
              : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <h1 className="mb-2">{novel.title}</h1>
          <p className="opacity-60 mb-4">by {novel.author}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-[#A2D6A2]" style={{ color: '#A2D6A2' }} />
              <span>{novel.rating}</span>
            </div>
            <Badge
              className="backdrop-blur-md"
              style={{
                background: 'rgba(162, 214, 162, 0.2)',
                borderColor: 'rgba(162, 214, 162, 0.4)',
                color: darkMode ? '#C5E8C5' : '#7FB97F',
              }}
            >
              <BookOpen className="w-3 h-3 mr-1" />
              {novel.chapters} Chapters
            </Badge>
          </div>

          {/* Synopsis */}
          <div className="mb-6">
            <h3 className="mb-3">Synopsis</h3>
            <p className="opacity-80 leading-relaxed">{novel.synopsis}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onRead}
              className="flex-1 rounded-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, #A2D6A2, #C5E8C5)',
                color: darkMode ? '#1e1e1e' : '#000',
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Read Now
            </Button>
            <Button
              onClick={onWrite}
              variant="outline"
              className="flex-1 rounded-xl backdrop-blur-md"
              style={{
                borderColor: 'rgba(162, 214, 162, 0.4)',
                background: 'rgba(162, 214, 162, 0.1)',
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Write
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Chapters List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-[25px] rounded-2xl p-6 border"
        style={{
          background: darkMode 
            ? 'rgba(30, 30, 30, 0.3)' 
            : 'rgba(255, 255, 255, 0.3)',
          borderColor: darkMode 
            ? 'rgba(162, 214, 162, 0.2)' 
            : 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <h2 className="mb-4">Chapters</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {mockChapters.map((chapter, i) => (
            <AccordionItem
              key={chapter.id}
              value={chapter.id}
              className="border rounded-xl backdrop-blur-md overflow-hidden"
              style={{
                background: darkMode 
                  ? 'rgba(162, 214, 162, 0.05)' 
                  : 'rgba(162, 214, 162, 0.08)',
                borderColor: darkMode 
                  ? 'rgba(162, 214, 162, 0.15)' 
                  : 'rgba(162, 214, 162, 0.2)',
              }}
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-4 flex-1 text-left">
                  <span className="opacity-50">Chapter {i + 1}</span>
                  <span className="flex-1">{chapter.title}</span>
                  {chapter.completed && (
                    <Badge
                      variant="secondary"
                      style={{
                        background: 'rgba(162, 214, 162, 0.2)',
                        color: '#A2D6A2',
                      }}
                    >
                      Completed
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center gap-6 pt-2 opacity-70">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{chapter.wordCount.toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{chapter.readingTime} min read</span>
                  </div>
                </div>
                <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: darkMode ? 'rgba(162, 214, 162, 0.1)' : 'rgba(162, 214, 162, 0.15)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: chapter.completed ? '100%' : '0%' }}
                    className="h-full"
                    style={{ background: 'linear-gradient(90deg, #A2D6A2, #C5E8C5)' }}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </motion.div>
  );
}
