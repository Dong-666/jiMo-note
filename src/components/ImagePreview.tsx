import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import 'yet-another-react-lightbox/styles.css'

interface Slide {
  src: string
  alt?: string
}

interface Props {
  open: boolean
  index: number
  slides: Slide[]
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function ImagePreview({ open, index, slides, onClose, onIndexChange }: Props) {
  return (
    <Lightbox
      open={open}
      index={index}
      slides={slides}
      close={onClose}
      plugins={[Zoom, Fullscreen]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 1.2,
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
      }}
      on={{
        view: ({ index: i }) => onIndexChange(i),
      }}
    />
  )
}
