import { ImageWithFallback } from "../ImageWithFallback"
import styles from "./PartnerLogo.module.css"

interface PartnerLogoProps {
  name: string
  logo: string
  url: string
}

const PartnerLogo: React.FC<PartnerLogoProps> = ({ name, logo, url }) => {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.partner}>
      <ImageWithFallback
        src={logo}
        alt={name}
        width={200}
        height={100}
        className={styles.logo}
      />
      <span className={styles.name}>{name}</span>
    </a>
  )
}

export default PartnerLogo

