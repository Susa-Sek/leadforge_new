'use client'

// E12 US-12.7: Testimonials Section
// Carousel with customer quotes

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { FadeInUp } from '../animations/motion-components'
import { testimonialsContent } from '@/lib/landing/data/content'

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection
      if (nextIndex < 0) nextIndex = testimonialsContent.testimonials.length - 1
      if (nextIndex >= testimonialsContent.testimonials.length) nextIndex = 0
      return nextIndex
    })
  }

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1)
    }, 5000)
    return () => clearInterval(timer)
  }, [currentIndex])

  const currentTestimonial = testimonialsContent.testimonials[currentIndex]

  return (
    <section className="py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {testimonialsContent.headline}
          </h2>
          <p className="text-lg text-muted-foreground">
            {testimonialsContent.subheadline}
          </p>
        </FadeInUp>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto relative">
          {/* Navigation Buttons */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(-1)}
              className="rounded-full shadow-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => paginate(1)}
              className="rounded-full shadow-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Carousel Content */}
          <div className="relative h-[300px] sm:h-[250px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <Card className="h-full border-border/50 bg-gradient-to-br from-background to-muted/50">
                  <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center h-full justify-center">
                    <Quote className="h-10 w-10 text-primary/30 mb-6" />
                    <blockquote className="text-lg sm:text-xl leading-relaxed text-foreground mb-8 max-w-2xl">
                      "{currentTestimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {currentTestimonial.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold">{currentTestimonial.author}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentTestimonial.role}, {currentTestimonial.company}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonialsContent.testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  setCurrentIndex(index)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Gehe zu Testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
