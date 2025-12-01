'use client'

interface ProjectSlide {
  id: string
  project_id: string
  index: number
  title: string | null
  content: string | null
  thumbnail_url: string | null
  created_at: string
}

interface SlidesPanelProps {
  slides: ProjectSlide[]
}

export default function SlidesPanel({ slides }: SlidesPanelProps) {
  if (slides.length === 0) {
    return (
      <div className="rounded-xl border bg-white/60 px-4 py-3 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">Slides do Deck</h4>
        <p className="text-xs text-slate-500 mb-3">
          Faça upload de um slide deck (.pdf ou .pptx) para obter coaching de apresentação melhor.
        </p>
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhum slide deck carregado ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white/60 px-4 py-3 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-900 mb-1">Slides do Deck</h4>
      <p className="text-xs text-slate-500 mb-4">
        {slides.length} {slides.length === 1 ? 'slide' : 'slides'} extraídos do seu deck.
      </p>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="border border-gray-200 rounded-lg p-3 bg-white"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xs font-semibold text-purple-700">
                  {slide.index}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {slide.title && (
                  <h5 className="text-sm font-semibold text-gray-900 mb-1">
                    {slide.title}
                  </h5>
                )}
                {slide.content && (
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {slide.content}
                  </p>
                )}
                {!slide.title && !slide.content && (
                  <p className="text-xs text-gray-400 italic">Slide vazio</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

