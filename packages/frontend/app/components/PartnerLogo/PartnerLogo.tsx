import Image from "next/image"
import styles from "./PartnerLogo.module.css"

interface PartnerLogoProps {
  name: string
  logo: string
  url: string
}

const PartnerLogo: React.FC<PartnerLogoProps> = ({ name, logo, url }) => {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.partner}>
      {logo ? (
        <Image src={logo || "/placeholder.svg"} alt={name} width={200} height={100} className={styles.logo} />
      ) : (
        <div className={`${styles.logo} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
          <span className="text-gray-500 dark:text-gray-400">No Logo</span>
        </div>
      )}
      <span className={styles.name}>{name}</span>
    </a>
  )
}

export default PartnerLogo

