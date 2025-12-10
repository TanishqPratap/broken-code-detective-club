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
  { id: 1, src: "/videos/art1.mp4", title: "Art Spotlight 1" },
  { id: 2, src: "/videos/fash2.mp4", title: "Fashion Spotlight" },
  { id: 3, src: "/videos/art2.mp4", title: "Art Spotlight 2" },
  { id: 4, src: "/videos/sing.mp4", title: "Music Spotlight" },
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
              {videoSlides.map((slide) => (
                <CarouselItem
                  key={slide.id}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-lg">
                    <video
                      src={slide.src}
                      className="w-full aspect-video object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 bg-background/80 hover:bg-background border-border" />
            <CarouselNext className="hidden sm:flex -right-4 bg-background/80 hover:bg-background border-border" />
          </Carousel>
          
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
