import { useEffect, useState, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface VideoSlide {
  id: number;
  src: string;
  title: string;
}

const videoSlides: VideoSlide[] = [
  { id: 1, src: "/hero.mp4", title: "Creator Spotlight 1" },
  { id: 2, src: "/hero.mp4", title: "Creator Spotlight 2" },
  { id: 3, src: "/hero.mp4", title: "Creator Spotlight 3" },
  { id: 4, src: "/hero.mp4", title: "Creator Spotlight 4" },
];

const VideoCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    onSelect();
    api.on("select", onSelect);

    // Auto-slide every 4 seconds
    const autoSlide = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 4000);

    return () => {
      api.off("select", onSelect);
      clearInterval(autoSlide);
    };
  }, [api, onSelect]);

  return (
    <section className="py-12 sm:py-16 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-foreground">
          Featured Content
        </h2>
        <div className="max-w-5xl mx-auto">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {videoSlides.map((slide, index) => (
                <CarouselItem
                  key={slide.id}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-lg group">
                    <video
                      src={slide.src}
                      className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                      muted
                      loop
                      playsInline
                      autoPlay={index === current}
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        if (index !== current) {
                          e.currentTarget.pause();
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-semibold text-lg">
                        {slide.title}
                      </h3>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 bg-background/80 hover:bg-background border-border" />
            <CarouselNext className="hidden sm:flex -right-4 bg-background/80 hover:bg-background border-border" />
          </Carousel>
          
          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {videoSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-6 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoCarousel;
