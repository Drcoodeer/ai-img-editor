'use client';
import { motion } from "framer-motion";

const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.2, duration: 0.6 }}
    whileHover={{ scale: 1.05, rotateY: 5 }}
    className="relative group flex flex-col h-full"
  >
    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-400 rounded-xl blur opacity-0 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
    <div className="relative bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-violet-400/50 transition-all duration-300">
      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-lg mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default FeatureCard